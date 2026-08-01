"""Local YOLOv8-Seg road-defect inference service.

Set YOLO_SEG_WEIGHTS to a road-defect *segmentation* checkpoint trained with
classes such as pothole and crack. The stock COCO weights do not detect these
defects and should not be used for this endpoint.
"""
import os
from math import sqrt

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from ultralytics import YOLO

app = FastAPI(title="GramSetu defect segmentation")
model = None


def get_model():
    global model
    if model is None:
        weights = os.getenv("YOLO_SEG_WEIGHTS", "models/road-defects-yolov8-seg.pt")
        if not os.path.isfile(weights):
            raise HTTPException(503, "YOLO segmentation weights are missing. Set YOLO_SEG_WEIGHTS to a trained road-defect .pt file.")
        model = YOLO(weights)
    return model


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/segment")
async def segment(
    image: UploadFile = File(...),
    scale_cm_per_pixel: float = Form(..., gt=0),
    confidence: float = Form(0.35, ge=0, le=1),
):
    raw = await image.read()
    frame = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(400, "The uploaded file is not a readable image.")

    result = get_model()(frame, conf=confidence, verbose=False)[0]
    defects = []
    if result.masks is not None and result.boxes is not None:
        names = result.names
        for mask, box in zip(result.masks.data.cpu().numpy(), result.boxes):
            binary = (mask > 0.5).astype(np.uint8)
            # Ultralytics masks may be inference-sized; restore to source image.
            binary = cv2.resize(binary, (frame.shape[1], frame.shape[0]), interpolation=cv2.INTER_NEAREST)
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if not contours:
                continue
            contour = max(contours, key=cv2.contourArea)
            area_px = float(cv2.contourArea(contour))
            x, y, width, height = cv2.boundingRect(contour)
            label = names[int(box.cls.item())]
            defects.append({
                "type": str(label).lower().replace(" ", "_"),
                "confidence": round(float(box.conf.item()), 3),
                "maskAreaPixels": round(area_px, 1),
                "areaCm2": round(area_px * scale_cm_per_pixel ** 2, 1),
                "widthCm": round(width * scale_cm_per_pixel, 1),
                "heightCm": round(height * scale_cm_per_pixel, 1),
                "equivalentDiameterCm": round(2 * sqrt(area_px / np.pi) * scale_cm_per_pixel, 1),
                "boundingBoxPixels": {"x": x, "y": y, "width": width, "height": height},
                "depth": None,
                "depthNote": "Depth cannot be measured from a single RGB image; use stereo/depth sensing or a manual field measurement.",
            })

    return {
        "status": "completed",
        "scaleCmPerPixel": scale_cm_per_pixel,
        "defects": defects,
        "message": "No segmented defects found." if not defects else None,
    }
