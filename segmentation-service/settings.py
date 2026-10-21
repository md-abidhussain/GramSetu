"""Configuration for the defect-detection service, read from the environment."""
from __future__ import annotations

import os
from dataclasses import dataclass, field


def _bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    # "production" refuses demo mode outright. Use "development" locally.
    environment: str = field(default_factory=lambda: os.getenv("SEGMENTATION_ENV", "production").lower())
    model_path: str = field(default_factory=lambda: os.getenv("MODEL_PATH", "models/model.onnx"))
    # Opt-in placeholder output for UI demos with no model. Every response says so.
    demo_mode_requested: bool = field(default_factory=lambda: _bool("SEGMENTATION_DEMO_MODE"))
    # When set, callers must send the same value in the X-Service-Token header.
    service_token: str | None = field(default_factory=lambda: os.getenv("SEGMENTATION_SERVICE_TOKEN") or None)
    max_upload_bytes: int = field(default_factory=lambda: int(float(os.getenv("MAX_UPLOAD_MB", "8")) * 1024 * 1024))
    max_image_pixels: int = field(default_factory=lambda: int(os.getenv("MAX_IMAGE_PIXELS", str(40_000_000))))
    required_classes: frozenset[str] = frozenset({"pothole"})

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def demo_mode(self) -> bool:
        return self.demo_mode_requested and not self.is_production
