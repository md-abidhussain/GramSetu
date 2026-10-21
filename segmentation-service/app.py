"""GramSetu road-defect detection service (FastAPI).

Every /segment response states how it was produced:
  real_inference     a trained model ran on the photo
  demo_simulation    opt-in placeholder (never allowed when SEGMENTATION_ENV=production)
  model_unavailable  HTTP 503: no usable model, so no detection was made

See docs/AI_LIMITATIONS.md for what the measurements can and cannot mean.
"""
from __future__ import annotations

import hmac
import logging
import threading
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from inference import ModelState, decode_image, load_model, measure, simulated_defect
from settings import Settings

logger = logging.getLogger("gramsetu.segmentation")
DEPTH_NOTE = "Depth is not measured: a single ordinary photo does not contain depth information."


def create_app(settings: Settings | None = None, loader=None) -> FastAPI:
    settings = settings or Settings()
    state = ModelState()
    inference_lock = threading.Lock()  # one inference at a time: model objects are not guaranteed thread-safe

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        nonlocal state
        loaded = load_model(settings.model_path, settings.required_classes, **({"loader": loader} if loader else {}))
        state.detector, state.unavailable_reason, state.classes = loaded.detector, loaded.unavailable_reason, loaded.classes
        if state.loaded:
            logger.warning("model loaded: task=%s classes=%s", state.detector.task, state.classes)
        else:
            logger.warning("no usable model: %s (demo mode %s)", state.unavailable_reason, "ON" if settings.demo_mode else "off")
        if settings.demo_mode_requested and settings.is_production:
            logger.error("SEGMENTATION_DEMO_MODE is ignored because SEGMENTATION_ENV=production")
        yield

    app = FastAPI(title="GramSetu defect detection", lifespan=lifespan)

    def check_token(x_service_token: str | None = Header(default=None)) -> None:
        if settings.service_token and not hmac.compare_digest(x_service_token or "", settings.service_token):
            raise HTTPException(status_code=401, detail="Missing or wrong service token.")

    def mode() -> str:
        if state.loaded:
            return "real_inference"
        return "demo_simulation" if settings.demo_mode else "model_unavailable"

    def describe() -> dict:
        return {
            "inferenceMode": mode(),
            "modelLoaded": state.loaded,
            "modelTask": state.detector.task if state.loaded else None,
            "classes": state.classes,
            "reason": None if state.loaded else state.unavailable_reason,
        }

    @app.get("/health/live")
    def live():
        return {"status": "ok"}

    @app.get("/health/ready")
    def ready():
        body = describe()
        return JSONResponse(body, status_code=503 if body["inferenceMode"] == "model_unavailable" else 200)

    # Kept for older callers; same as readiness.
    @app.get("/health")
    def health():
        return ready()

    # A plain `def` endpoint: FastAPI runs it in a worker thread, so CPU-bound
    # inference does not block the event loop.
    @app.post("/segment", dependencies=[Depends(check_token)])
    def segment(
        image: UploadFile = File(...),
        scale_cm_per_pixel: float | None = Form(default=None, gt=0, le=10),
        confidence: float = Form(default=0.35, ge=0.05, le=0.95),
    ):
        raw = image.file.read(settings.max_upload_bytes + 1)
        if len(raw) > settings.max_upload_bytes:
            raise HTTPException(status_code=413, detail="The image is too large.")
        try:
            frame = decode_image(raw, settings.max_image_pixels)
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from None
        height, width = frame.shape[:2]

        current = mode()
        if current == "model_unavailable":
            return JSONResponse(
                {"inferenceMode": "model_unavailable", "detail": "No usable detection model is loaded, so no detection was made."},
                status_code=503,
            )

        base = {"imageWidth": width, "imageHeight": height, "scaleCmPerPixel": scale_cm_per_pixel, "depthNote": DEPTH_NOTE}

        if current == "demo_simulation":
            return {
                **base,
                "inferenceMode": "demo_simulation",
                "modelTask": None,
                "defects": [simulated_defect((height, width))],
                "message": "DEMO SIMULATION: placeholder output, not a detection.",
            }

        with inference_lock:
            raw_detections = state.detector.predict(frame, confidence)
        defects = [measure(detection, (height, width), scale_cm_per_pixel) for detection in raw_detections]
        defects = [defect for defect in defects if defect["type"] in set(state.classes)]

        return {
            **base,
            "inferenceMode": "real_inference",
            "modelTask": state.detector.task,
            "confidenceThreshold": confidence,
            "defects": defects,
            "message": None if defects else "No defects found above the confidence threshold.",
        }

    return app


app = create_app()
