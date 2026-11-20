"""Service behaviour with a fake model, so these run without ultralytics or weights."""
from __future__ import annotations

import numpy as np
import pytest
from conftest import ASSETS
from fastapi.testclient import TestClient

from app import create_app
from inference import measure, normalize_label
from settings import Settings

pytestmark = pytest.mark.unit

PHOTO = (ASSETS / "road-after.jpg").read_bytes()


class FakeDetector:
    def __init__(self, path, detections=None, names=None, task="detect"):
        self.task = task
        self.names = names or {0: "pothole", 1: "crack", 2: "openmanhole"}
        self.detections = detections if detections is not None else [
            {"label": "pothole", "confidence": 0.8123, "box": (10, 20, 110, 70), "mask": None}
        ]
        self.calls = []

    def predict(self, frame, conf):
        self.calls.append(conf)
        return self.detections


def make_client(tmp_path, *, weights=True, loader=None, **settings):
    model_path = tmp_path / "model.onnx"
    if weights:
        model_path.write_bytes(b"weights")
    config = Settings(model_path=str(model_path), **settings)
    app = create_app(config, loader=loader or FakeDetector)
    return TestClient(app)


def post(client, data=b"", photo=PHOTO, headers=None, **fields):
    return client.post("/segment", files={"image": ("p.jpg", photo, "image/jpeg")}, data=fields, headers=headers or {})


def test_real_inference_is_labelled_and_has_model_confidence(tmp_path):
    with make_client(tmp_path) as client:
        response = post(client)
    body = response.json()
    assert response.status_code == 200
    assert body["inferenceMode"] == "real_inference"
    assert body["modelTask"] == "detect"
    defect = body["defects"][0]
    assert defect["confidence"] == 0.812
    assert defect["measurementBasis"] == "bounding_box"
    assert defect["areaPixels"] == 5000.0
    assert defect["areaCm2"] is None, "no scale given, so no physical size"
    assert defect["depth"] is None


def test_physical_size_only_with_a_measured_scale(tmp_path):
    with make_client(tmp_path) as client:
        body = post(client, scale_cm_per_pixel="0.5").json()
    defect = body["defects"][0]
    assert defect["widthCm"] == 50.0
    assert defect["heightCm"] == 25.0
    assert defect["areaCm2"] == 1250.0


def test_no_detections_is_an_empty_list_not_an_error(tmp_path):
    def loader(path):
        return FakeDetector(path, detections=[])
    with make_client(tmp_path, loader=loader) as client:
        body = post(client).json()
    assert body["inferenceMode"] == "real_inference"
    assert body["defects"] == []
    assert "No defects" in body["message"]


def test_missing_weights_is_503_model_unavailable_never_a_fake_pothole(tmp_path):
    with make_client(tmp_path, weights=False) as client:
        response = post(client)
        ready = client.get("/health/ready")
    assert response.status_code == 503
    assert response.json()["inferenceMode"] == "model_unavailable"
    assert "defects" not in response.json()
    assert ready.status_code == 503
    assert ready.json()["modelLoaded"] is False


def test_weights_that_fail_to_load_are_unavailable(tmp_path):
    def broken(path):
        raise RuntimeError("incompatible opset")

    with make_client(tmp_path, loader=broken) as client:
        response = post(client)
        reason = client.get("/health/ready").json()["reason"]
    assert response.status_code == 503
    assert "could not be loaded" in reason


def test_weights_without_a_pothole_class_are_unavailable(tmp_path):
    def loader(path):
        return FakeDetector(path, names={0: "person", 1: "car"})
    with make_client(tmp_path, loader=loader) as client:
        assert post(client).status_code == 503
        assert "lack required classes" in client.get("/health/ready").json()["reason"]


def test_demo_mode_is_opt_in_and_unmistakably_labelled(tmp_path):
    with make_client(tmp_path, weights=False, environment="development", demo_mode_requested=True) as client:
        body = post(client).json()
        ready = client.get("/health/ready")
    assert body["inferenceMode"] == "demo_simulation"
    assert body["defects"][0]["simulated"] is True
    assert body["defects"][0]["confidence"] is None
    assert body["defects"][0]["areaCm2"] is None
    assert "DEMO SIMULATION" in body["message"]
    assert ready.json()["inferenceMode"] == "demo_simulation"


def test_demo_mode_is_refused_in_production(tmp_path):
    with make_client(tmp_path, weights=False, environment="production", demo_mode_requested=True) as client:
        assert post(client).status_code == 503


def test_a_real_model_always_wins_over_demo_mode(tmp_path):
    with make_client(tmp_path, environment="development", demo_mode_requested=True) as client:
        assert post(client).json()["inferenceMode"] == "real_inference"


@pytest.mark.parametrize("photo", [b"", b"not an image at all", b"\x89PNG\r\n\x1a\nbroken"])
def test_invalid_images_are_400(tmp_path, photo):
    with make_client(tmp_path) as client:
        assert post(client, photo=photo).status_code == 400


def test_oversized_upload_is_413(tmp_path):
    with make_client(tmp_path, max_upload_bytes=1000) as client:
        assert post(client).status_code == 413


@pytest.mark.parametrize("field,value", [("scale_cm_per_pixel", "0"), ("scale_cm_per_pixel", "-1"), ("scale_cm_per_pixel", "50"), ("confidence", "1.5"), ("confidence", "0")])
def test_out_of_range_parameters_are_422(tmp_path, field, value):
    with make_client(tmp_path) as client:
        assert post(client, **{field: value}).status_code == 422


def test_confidence_threshold_is_passed_to_the_model(tmp_path):
    detector = FakeDetector("x")
    with make_client(tmp_path, loader=lambda path: detector) as client:
        post(client, confidence="0.6")
    assert detector.calls == [0.6]


def test_service_token_is_enforced_when_configured(tmp_path):
    with make_client(tmp_path, service_token="s3cret") as client:
        assert post(client).status_code == 401
        assert post(client, headers={"X-Service-Token": "wrong"}).status_code == 401
        assert post(client, headers={"X-Service-Token": "s3cret"}).status_code == 200


def test_labels_are_normalised():
    assert normalize_label("openmanhole") == "open_manhole"
    assert normalize_label("Pot Hole") == "pot_hole"


def test_mask_measurement_uses_the_mask_area():
    mask = np.zeros((10, 10), dtype=np.float32)
    mask[2:6, 2:6] = 1.0
    defect = measure({"label": "pothole", "confidence": 0.9, "box": (0, 0, 10, 10), "mask": mask}, (10, 10), 1.0)
    assert defect["measurementBasis"] == "mask"
    assert defect["areaPixels"] < 100
