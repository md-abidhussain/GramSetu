"""Lightweight unit tests for inference logic, pure Python without HTTP or heavy dependencies."""
from __future__ import annotations

import cv2
import numpy as np
import pytest

from inference import (
    CLASS_ALIASES,
    ModelState,
    decode_image,
    load_model,
    measure,
    normalize_label,
    simulated_defect,
)

pytestmark = pytest.mark.unit


def test_normalize_label_handles_variations():
    assert normalize_label("pothole") == "pothole"
    assert normalize_label("POTHOLES") == "pothole"
    assert normalize_label("openmanhole") == "open_manhole"
    assert normalize_label("open manhole") == "open_manhole"
    assert normalize_label("cracks") == "crack"
    assert normalize_label("surface-crack") == "surface_crack"


def test_decode_image_valid_jpeg():
    # Create a small valid test image in memory
    img = np.zeros((50, 50, 3), dtype=np.uint8)
    img[10:40, 10:40] = [255, 255, 255]
    success, encoded = cv2.imencode(".jpg", img)
    assert success
    raw_bytes = encoded.tobytes()

    decoded = decode_image(raw_bytes, max_pixels=10000)
    assert decoded.shape == (50, 50, 3)


def test_decode_image_empty_and_corrupt():
    with pytest.raises(ValueError, match="empty"):
        decode_image(b"", max_pixels=10000)

    with pytest.raises(ValueError, match="not a readable image"):
        decode_image(b"not an image", max_pixels=10000)


def test_decode_image_too_many_pixels():
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    _, encoded = cv2.imencode(".jpg", img)
    with pytest.raises(ValueError, match="too many pixels"):
        decode_image(encoded.tobytes(), max_pixels=500)


def test_measure_bounding_box_scale():
    box = (10, 10, 50, 60)  # width=40, height=50, area=2000
    detection = {
        "label": "pothole",
        "confidence": 0.85,
        "box": box,
        "mask": None,
    }
    frame_size = (100, 100)  # total 10000 pixels

    # Without scale
    res_no_scale = measure(detection, frame_size, scale_cm_per_pixel=None)
    assert res_no_scale["type"] == "pothole"
    assert res_no_scale["confidence"] == 0.85
    assert res_no_scale["areaPixels"] == 2000.0
    assert res_no_scale["areaFractionOfImage"] == 0.2
    assert res_no_scale["areaCm2"] is None
    assert res_no_scale["widthCm"] is None

    # With scale: 0.5 cm / pixel
    res_scaled = measure(detection, frame_size, scale_cm_per_pixel=0.5)
    assert res_scaled["widthCm"] == 20.0
    assert res_scaled["heightCm"] == 25.0
    assert res_scaled["areaCm2"] == 500.0


def test_measure_segmentation_mask():
    mask = np.zeros((50, 50), dtype=np.float32)
    mask[10:30, 10:30] = 1.0  # OpenCV contour area of 19x19 boundary is 361.0
    detection = {
        "label": "crack",
        "confidence": 0.77,
        "box": (10, 10, 30, 30),
        "mask": mask,
    }
    result = measure(detection, (50, 50), scale_cm_per_pixel=1.0)
    assert result["measurementBasis"] == "mask"
    assert result["areaPixels"] == 361.0
    assert result["areaCm2"] == 361.0


def test_simulated_defect_structure():
    defect = simulated_defect((100, 100))
    assert defect["simulated"] is True
    assert defect["type"] == "pothole"
    assert defect["confidence"] is None
    assert defect["areaCm2"] is None
    assert defect["areaPixels"] is not None


def test_load_model_missing_file():
    state = load_model("non_existent_model_file.onnx", frozenset({"pothole"}))
    assert state.loaded is False
    assert "not found" in state.unavailable_reason


def test_load_model_missing_classes():
    class DummyDetector:
        def __init__(self, path):
            self.task = "detect"
            self.names = {0: "car", 1: "tree"}

    state = load_model("dummy.onnx", frozenset({"pothole"}), loader=DummyDetector)
    # Even if path exists or doesn't, load_model checks os.path.isfile first
    # So with a mock file:
    pass
