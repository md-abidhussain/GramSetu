"""Runs the committed model on real photos. Skipped when ultralytics is not installed.

This checks that the model loads and produces well-formed output. It says
nothing about accuracy: that needs a labelled test set (see evaluate.py and
docs/AI_LIMITATIONS.md).
"""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

pytest.importorskip("ultralytics")
pytestmark = pytest.mark.integration

from conftest import ASSETS  # noqa: E402

from app import create_app  # noqa: E402
from settings import Settings  # noqa: E402

MODEL = Path(__file__).resolve().parents[1] / "models" / "model.onnx"


@pytest.fixture(scope="module")
def client():
    if not MODEL.is_file():
        pytest.skip("model.onnx not present")
    with TestClient(create_app(Settings(model_path=str(MODEL)))) as test_client:
        yield test_client


def test_model_loads_as_a_real_detector(client):
    body = client.get("/health/ready").json()
    assert body["modelLoaded"] is True
    assert body["inferenceMode"] == "real_inference"
    assert "pothole" in body["classes"]


@pytest.mark.parametrize("name", ["road-before.jpg", "road-after.jpg"])
def test_inference_output_is_well_formed(client, name):
    response = client.post("/segment", files={"image": (name, (ASSETS / name).read_bytes(), "image/jpeg")})
    assert response.status_code == 200
    body = response.json()
    assert body["inferenceMode"] == "real_inference"
    for defect in body["defects"]:
        assert 0 <= defect["confidence"] <= 1
        assert 0 <= defect["areaFractionOfImage"] <= 1
        assert defect["depth"] is None
        assert defect["areaCm2"] is None


POTHOLE_PHOTOS = sorted(ASSETS.glob("pothole*.jpg"))


@pytest.mark.skipif(not POTHOLE_PHOTOS, reason="add a real pothole photo as test-assets/pothole-*.jpg to enable")
@pytest.mark.parametrize("photo", POTHOLE_PHOTOS, ids=lambda path: path.name)
def test_a_real_pothole_photo_produces_a_pothole_detection(client, photo):
    body = client.post("/segment", files={"image": (photo.name, photo.read_bytes(), "image/jpeg")}).json()
    assert any(defect["type"] == "pothole" for defect in body["defects"]), body
