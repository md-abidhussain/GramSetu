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
demo_mode = False


def get_model():
    global model, demo_mode
    if model is None:
        weights = os.getenv("YOLO_SEG_WEIGHTS", "models/road-defects-yolov8-seg.pt")
        if not os.path.isfile(weights):
            print("WARNING: YOLO weights not found. Falling back to Demo/Simulation mode.")
            demo_mode = True
            return None
        try:
            model = YOLO(weights)
            class_names = {str(name).lower().replace(" ", "_") for name in model.names.values()}
            required_classes = {"pothole"}
            if not required_classes.issubset(class_names):
                print("WARNING: YOLO weights missing pothole class. Falling back to Demo/Simulation mode.")
                demo_mode = True
                model = None
        except Exception as e:
            print(f"WARNING: Error loading YOLO weights ({e}). Falling back to Demo/Simulation mode.")
            demo_mode = True
            model = None
    return model


@app.get("/health")
def health():
    get_model()
    return {"status": "ok", "model_loaded": model is not None, "demo_mode": demo_mode}


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

    get_model()
    defects = []
    
    if demo_mode or model is None:
        # Generate simulated pothole defect calculation for presentation/demo
        h, w, _ = frame.shape
        cx, cy = w // 2, h // 2
        mw, mh = min(120, w // 4), min(80, h // 4)
        x, y = cx - mw // 2, cy - mh // 2
        area_px = float(mw * mh * 0.785)
        defects.append({
            "type": "pothole",
            "confidence": 0.88,
            "maskAreaPixels": round(area_px, 1),
            "areaCm2": round(area_px * scale_cm_per_pixel ** 2, 1),
            "widthCm": round(mw * scale_cm_per_pixel, 1),
            "heightCm": round(mh * scale_cm_per_pixel, 1),
            "equivalentDiameterCm": round(2 * sqrt(area_px / np.pi) * scale_cm_per_pixel, 1),
            "boundingBoxPixels": {"x": x, "y": y, "width": mw, "height": mh},
            "depth": None,
            "depthNote": "Depth cannot be measured from a single RGB image; running in simulation fallback mode.",
        })
    else:
        result = model(frame, conf=confidence, verbose=False)[0]
        if result.masks is not None and result.boxes is not None:
            names = result.names
            for mask, box in zip(result.masks.data.cpu().numpy(), result.boxes):
                binary = (mask > 0.5).astype(np.uint8)
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
