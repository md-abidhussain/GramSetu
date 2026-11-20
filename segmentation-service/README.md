# GramSetu Defect Detection & Segmentation Service

FastAPI-based microservice providing road infrastructure defect detection and honest measurement using an ONNX-exported YOLO model.

## Core Capabilities
- **Object Detection & Segmentation**: Identifies potholes, cracks, and open manholes.
- **Honest AI Output**:
  - `real_inference`: When a trained model executes on genuine input.
  - `demo_simulation`: Opt-in placeholder for development/demo only; strictly refused when `SEGMENTATION_ENV=production`.
  - `model_unavailable` (HTTP 503): Returned when weights are missing, corrupt, or missing required classes. No fabricated detections or fake confidence scores.
- **Measurement Integrity**: Physical metrics (cm, cm²) require a calibrated `scale_cm_per_pixel`. Depth is explicitly reported as `None` because 2D single-view RGB imagery cannot measure optical depth.

## Test Architecture & Markers

Tests are separated into lightweight unit suites and heavyweight integration suites:

### 1. Pure Unit Tests (`tests/test_inference_unit.py`)
- Tests core image decoding, bounding box math, OpenCV contour mask area calculations, scale conversions, label normalizations, and simulated defect structure.
- Runs without any web server, sockets, or model weights in under 0.5s.
- Command:
  ```bash
  pytest tests/test_inference_unit.py -v
  ```

### 2. HTTP & Mocked Detector Unit Tests (`tests/test_app.py`)
- Tests FastAPI routes (`/health/live`, `/health/ready`, `/segment`), authentication tokens, parameter validation, HTTP status codes, and error responses using `FakeDetector`.
- Marked with `@pytest.mark.unit`.
- Command:
  ```bash
  pytest -m unit -v
  ```

### 3. Model Integration Tests (`tests/test_real_model.py`)
- Heavyweight integration test loading `models/model.onnx` (12.2 MB weights) and validating real inference output against sample road photos (`test-assets/road-before.jpg`, `test-assets/road-after.jpg`).
- Marked with `@pytest.mark.integration`.
- Requires local model file: `models/model.onnx`.
- Command:
  ```bash
  pytest -m integration -v
  ```

### Running All Tests
```bash
pytest -v
```
