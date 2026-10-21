"""Model loading, inference and measurement, kept free of web concerns so it can be tested directly.

Honesty rules this module enforces:
  * Output from a real model is labelled ``real_inference``; placeholder output is ``demo_simulation``.
  * Confidence values come only from the model. Simulated output has none.
  * Physical sizes (cm) are produced only when a measured scale is supplied.
  * Depth is never estimated: one ordinary RGB photo does not contain it.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from math import sqrt
from typing import Any, Protocol

import cv2
import numpy as np

CLASS_ALIASES = {"openmanhole": "open_manhole", "open manhole": "open_manhole", "potholes": "pothole", "cracks": "crack"}


def normalize_label(label: str) -> str:
    key = str(label).strip().lower()
    return CLASS_ALIASES.get(key, key.replace(" ", "_").replace("-", "_"))


class Detector(Protocol):
    """Anything with ``task``, ``names`` and ``predict(frame, conf)`` (a real YOLO model or a test double)."""

    task: str
    names: dict[int, str]

    def predict(self, frame: np.ndarray, conf: float) -> list[dict[str, Any]]: ...


@dataclass
class ModelState:
    detector: Detector | None = None
    unavailable_reason: str | None = None
    classes: list[str] = field(default_factory=list)

    @property
    def loaded(self) -> bool:
        return self.detector is not None


class UltralyticsDetector:
    """Adapter around ``ultralytics.YOLO`` returning plain dictionaries."""

    def __init__(self, path: str) -> None:
        from ultralytics import YOLO  # imported lazily: tests run without it

        self._model = YOLO(path, task=None)
        self.task = getattr(self._model, "task", "detect") or "detect"
        self.names = {int(k): str(v) for k, v in self._model.names.items()}

    def predict(self, frame: np.ndarray, conf: float) -> list[dict[str, Any]]:
        result = self._model(frame, conf=conf, verbose=False)[0]
        detections: list[dict[str, Any]] = []
        if result.boxes is None:
            return detections
        masks = result.masks.data.cpu().numpy() if getattr(result, "masks", None) is not None else None
        for index, box in enumerate(result.boxes):
            x1, y1, x2, y2 = (float(v) for v in box.xyxy[0].cpu().numpy())
            detections.append({
                "label": self.names[int(box.cls.item())],
                "confidence": float(box.conf.item()),
                "box": (x1, y1, x2, y2),
                "mask": masks[index] if masks is not None else None,
            })
        return detections


def load_model(path: str, required_classes: frozenset[str], loader=UltralyticsDetector) -> ModelState:
    """Loads weights and checks they can detect what this service is for."""
    import os

    if not os.path.isfile(path):
        return ModelState(unavailable_reason=f"weights not found at {path}")
    try:
        detector = loader(path)
    except Exception as error:  # noqa: BLE001 - any load failure means "no model"
        return ModelState(unavailable_reason=f"weights could not be loaded ({type(error).__name__})")

    classes = sorted({normalize_label(name) for name in detector.names.values()})
    missing = required_classes - set(classes)
    if missing:
        return ModelState(unavailable_reason=f"weights lack required classes: {sorted(missing)}", classes=classes)
    return ModelState(detector=detector, classes=classes)


def decode_image(raw: bytes, max_pixels: int) -> np.ndarray:
    """Returns a BGR image or raises ValueError with a message safe to show."""
    if not raw:
        raise ValueError("The uploaded file is empty.")
    frame = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("The uploaded file is not a readable image.")
    height, width = frame.shape[:2]
    if height * width > max_pixels:
        raise ValueError("The image has too many pixels.")
    return frame


def measure(detection: dict[str, Any], frame_shape: tuple[int, int], scale_cm_per_pixel: float | None) -> dict[str, Any]:
    """Turns one raw detection into the response shape, with honest measurement labels."""
    height, width = frame_shape
    x1, y1, x2, y2 = detection["box"]
    box_w, box_h = max(0.0, x2 - x1), max(0.0, y2 - y1)
    basis = "bounding_box"
    area_px = box_w * box_h

    mask = detection.get("mask")
    if mask is not None:
        binary = (np.asarray(mask) > 0.5).astype(np.uint8)
        binary = cv2.resize(binary, (width, height), interpolation=cv2.INTER_NEAREST)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if contours:
            contour = max(contours, key=cv2.contourArea)
            area_px = float(cv2.contourArea(contour))
            x, y, w, h = cv2.boundingRect(contour)
            x1, y1, box_w, box_h = float(x), float(y), float(w), float(h)
            basis = "mask"

    result: dict[str, Any] = {
        "type": normalize_label(detection["label"]),
        "confidence": round(float(detection["confidence"]), 3),
        "measurementBasis": basis,
        "areaPixels": round(area_px, 1),
        "areaFractionOfImage": round(area_px / float(width * height), 5),
        "boundingBoxPixels": {"x": round(x1, 1), "y": round(y1, 1), "width": round(box_w, 1), "height": round(box_h, 1)},
        "areaCm2": None,
        "widthCm": None,
        "heightCm": None,
        "equivalentDiameterCm": None,
        "depth": None,
    }
    if scale_cm_per_pixel:
        result.update({
            "areaCm2": round(area_px * scale_cm_per_pixel**2, 1),
            "widthCm": round(box_w * scale_cm_per_pixel, 1),
            "heightCm": round(box_h * scale_cm_per_pixel, 1),
            "equivalentDiameterCm": round(2 * sqrt(area_px / np.pi) * scale_cm_per_pixel, 1),
        })
    return result


def simulated_defect(frame_shape: tuple[int, int]) -> dict[str, Any]:
    """Placeholder for demo mode. Clearly marked; carries no confidence and no physical size."""
    height, width = frame_shape
    w, h = max(1, width // 4), max(1, height // 6)
    return {
        "type": "pothole",
        "confidence": None,
        "simulated": True,
        "measurementBasis": "bounding_box",
        "areaPixels": float(w * h),
        "areaFractionOfImage": round((w * h) / float(width * height), 5),
        "boundingBoxPixels": {"x": (width - w) / 2, "y": (height - h) / 2, "width": float(w), "height": float(h)},
        "areaCm2": None,
        "widthCm": None,
        "heightCm": None,
        "equivalentDiameterCm": None,
        "depth": None,
    }
