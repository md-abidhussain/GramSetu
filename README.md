# GramSetu AI

GramSetu AI is an infrastructure-auditing platform for public works. It gives authorities a place to assess tenders and construction progress, and gives citizens a way to submit geo-tagged evidence of damage.

AI is the core of the platform. Each citizen report must pass both visual verification and semantic defect segmentation before it is saved.

## What it does

- **Tender intelligence:** extracts text from uploaded tender PDFs and uses Gemini to identify budget, schedule, and risk concerns.
- **Project monitoring:** compares official before/after construction photos with Gemini Vision to produce a completion score and project-health assessment.
- **Citizen verification:** compares a current citizen photo with the official project photo, identifies visible discrepancies, and alerts authorities when needed.
- **Defect quantification:** runs a trained YOLOv8-Seg model to outline each defect at pixel level and calculate calibrated size measurements for potholes and cracks.

## How the AI pipeline works

### Citizen damage report flow

```text
Citizen photo + GPS + description + reference scale
                    |
                    v
        Node/Express API receives the report
                    |
        +-----------+-----------+
        |                       |
        v                       v
Gemini Vision comparison    YOLOv8-Seg service
against official photo      produces a mask per defect
        |                       |
        +-----------+-----------+
                    |
                    v
MongoDB report: issues, match score, mask area, dimensions, confidence
                    |
                    v
Flagged project + authority notification when a discrepancy is detected
```

The Gemini comparison answers “does this photo match the project’s recorded state?” The segmentation model answers “where exactly is the defect and how large is it?” They are complementary and both are required for a citizen report.

### How measurements are calculated

YOLOv8-Seg returns a pixel mask—not merely a damage label. The service calculates its pixel area and bounding rectangle, then converts those values using the calibrated scale entered by the reporter:

```text
area (cm²) = mask area (pixels) × (cm per pixel)²
width (cm) = mask width (pixels) × cm per pixel
height (cm) = mask height (pixels) × cm per pixel
```

Place a known-size marker (for example, a 30 cm ruler) on the same flat plane as the defect. Measure the marker’s length in the image and calculate:

```text
cm per pixel = real marker length (cm) / marker length in photo (pixels)
```

For example, if a 30 cm ruler spans 120 pixels, enter `0.25` cm/pixel. Measurements are only as reliable as the scale and perspective in the photo. A single ordinary RGB photo cannot reliably measure **depth**, so the system deliberately does not claim a pothole depth.

## Architecture

```text
client/                 React + Vite + Tailwind interface
server/                 Express API, MongoDB models, Gemini integration
segmentation-service/   FastAPI + Ultralytics YOLOv8-Seg inference service
```

## Prerequisites

- Node.js 18 or newer
- Python 3.10–3.12 recommended for the segmentation service
- MongoDB (local installation or Atlas cluster)
- Google Gemini API key
- Cloudinary account and upload credentials
- A **road-defect YOLOv8 segmentation checkpoint** (`.pt`) trained for classes such as `pothole` and `crack`

> Generic COCO YOLO weights are not sufficient: they do not contain pothole/crack defect classes. Use a custom-trained or road-defect-specific **segmentation** model, not a detection-only model.

## Fine-tune YOLOv8-Seg for potholes and cracks

The repository includes a reproducible two-class fine-tuning workflow in `segmentation-service/`. It starts from `yolov8n-seg.pt` and fine-tunes semantic masks for exactly these class IDs:

| Class ID | Class name |
| --- | --- |
| `0` | `pothole` |
| `1` | `crack` |

### 1. Prepare labelled segmentation data

Create this local directory structure. The data and model weights are ignored by Git because they can be large and may have licensing restrictions.

```text
segmentation-service/
  datasets/road-defects/
    images/
      train/
      val/
      test/        # optional
    labels/
      train/
      val/
      test/        # optional
```

Each image has a same-named `.txt` label in the matching `labels` folder. Labels use the Ultralytics YOLO **segmentation** format:

```text
<class-id> <x1> <y1> <x2> <y2> <x3> <y3> ...
```

Coordinates are normalized from `0` to `1`; each annotation must contain at least three polygon points. For example:

```text
0 0.12 0.43 0.18 0.40 0.25 0.45 0.21 0.52 0.14 0.51
1 0.63 0.20 0.66 0.22 0.72 0.39 0.69 0.42
```

Do not train on box-only labels for this workflow: the production service needs masks to calculate area. Split images by physical location or road segment, not by random adjacent frames, so nearly identical photos do not leak into validation.

### 2. Train the model

Install the segmentation dependencies, add the labelled data above, then run:

```powershell
cd segmentation-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python train.py --epochs 150 --imgsz 640 --device 0
```

Use `--device cpu` if there is no CUDA GPU; it will be much slower. `--batch -1` is the default and lets Ultralytics select a batch size for available GPU memory. The initial `yolov8n-seg.pt` checkpoint may download on the first run. Training output is written to:

```text
segmentation-service/runs/pothole-crack-seg/weights/best.pt
```

The training script rejects incomplete datasets, invalid classes, box-like labels, and polygon coordinates outside `0..1` before GPU training begins.

### 3. Evaluate and promote the model

Evaluate on the held-out validation split:

```powershell
python evaluate.py --weights runs\pothole-crack-seg\weights\best.pt --device 0
```

Review the segmentation mAP50-95 result, per-class precision/recall, and visual predictions before deployment. Do not promote a model based only on training accuracy. When it is acceptable, copy `best.pt` to a stable local location, for example:

```powershell
New-Item -ItemType Directory -Force models
Copy-Item runs\pothole-crack-seg\weights\best.pt models\road-defects-yolov8-seg.pt
```

Set `YOLO_SEG_WEIGHTS` to that file when starting the API service. You can continue a stopped run with the saved `last.pt` checkpoint through Ultralytics resume mode. The scripts use the documented Ultralytics training and validation interfaces. [Ultralytics training documentation](https://docs.ultralytics.com/modes/train/), [Ultralytics segmentation dataset format](https://docs.ultralytics.com/datasets/segment/).

## Setup and run locally

Run these commands from the repository root (`GramSetu-main`).

### 1. Configure the Node application

Create the backend environment file:

```powershell
Copy-Item .env.example server\.env
```

Open `server/.env` and add your real secrets:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/gramsetu
JWT_SECRET=use-a-long-random-secret
GEMINI_API_KEY=your-gemini-api-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
SEGMENTATION_SERVICE_URL=http://localhost:8001
SEGMENTATION_MIN_CONFIDENCE=0.35
```

Never commit `server/.env` or share its values.

### 2. Start the required segmentation service

Open a terminal:

```powershell
cd segmentation-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:YOLO_SEG_WEIGHTS = "C:\absolute\path\to\road-defects-yolov8-seg.pt"
uvicorn app:app --host 0.0.0.0 --port 8001
```

Check that it is running by opening http://localhost:8001/health. The model is loaded on the first segmentation request. Keep this terminal running.

### 3. Install and start the web application

Open a second terminal at the repository root:

```powershell
npm run install:all
npm run dev
```

This starts:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

The first startup creates the demonstration authority account if the database has no users:

```text
Email: authority@gramsetu.gov
Password: authority123
```

Change that account’s password before any real deployment.

## Using defect quantification

1. Start all three services: segmentation, backend, and frontend.
2. Ensure the selected project has an official before/after image.
3. Photograph the defect with a known-size marker next to it on the same surface.
4. In **Citizen Verification**, add the photo, location, description, and calculated `cm/pixel` scale.
5. Submit the report. The platform runs Gemini comparison and YOLO segmentation in parallel.
6. Review the result for mask area, width, height, equivalent diameter, confidence, and the AI narrative.

The request is rejected if the segmentation service is unavailable, the model weights are missing, or a valid scale is not supplied. This prevents unquantified damage reports from bypassing the core AI workflow.

## API services

The segmentation service provides:

- `GET /health` — confirms the FastAPI service is reachable.
- `POST /segment` — receives an image plus `scale_cm_per_pixel`, then returns the model masks and calibrated defect dimensions.

The Express API calls `/segment` automatically when it receives `POST /api/citizen-reports`; the browser does not call the Python service directly.

## Deployment notes

Deploy three connected components:

1. **Frontend:** Vercel or another static host; build from `client` with `npm run build`.
2. **Backend:** a Node.js host such as Render; set the `server/.env` variables as host environment variables.
3. **Segmentation service:** a Python/container host with enough memory/CPU or GPU for the YOLO model. Set `YOLO_SEG_WEIGHTS` to the deployed checkpoint and set the backend’s `SEGMENTATION_SERVICE_URL` to its reachable URL.

Production requirements:

- The backend must be able to reach the segmentation service over the network.
- Keep the model file and API keys private.
- Use HTTPS and authenticated administrative routes.
- Calibrate and validate your model using representative local road imagery before relying on its measurements for official decisions.

## Troubleshooting

| Problem | Likely cause | Fix |
| --- | --- | --- |
| `vite is not recognized` | Client dependencies are not installed | Run `npm run install:all` from the project root. |
| `AI defect segmentation is not configured` | `SEGMENTATION_SERVICE_URL` is absent from `server/.env` | Add it and restart the backend. |
| Segmentation returns 503 | `YOLO_SEG_WEIGHTS` does not point to a valid model file | Set an absolute path to a road-defect YOLOv8-Seg `.pt` checkpoint and restart FastAPI. |
| No masks are returned | Wrong model, unsuitable classes, or low-quality photo | Use a road-defect segmentation model; capture a clearer, closer image. |
| Measured size is inaccurate | Incorrect scale or strong camera perspective | Put the marker on the defect plane, recalculate cm/pixel, and take the photo more perpendicular to the surface. |
