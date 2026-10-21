# AI: what it does, what it does not, and how to tell the difference

GramSetu uses two kinds of automated analysis. Both are **advisory**: they help
an official triage. They never replace an inspection, and nothing in the system
lets an AI result close a complaint or approve a project on its own.

| Component | What it is | Where |
| --- | --- | --- |
| AI image/text review | Google Gemini (model set by `GEMINI_MODEL`) answering structured prompts | `server/services/ai/` |
| Defect detection | A YOLOv8 **detection** model exported to ONNX, served by FastAPI | `segmentation-service/` |

## 1. Every AI value carries its provenance

Each AI-derived field is stored with an `aiAssessment` record:

| `status` | Meaning | Scores stored? |
| --- | --- | --- |
| `completed` | The model answered and the answer passed validation | Yes |
| `not_configured` | No `GEMINI_API_KEY` on this server | **No** |
| `unavailable` | Timeout, rate limit, outage, bad key, or a stored photo could not be loaded | **No** |
| `invalid_response` | The model answered, but the JSON was malformed or out of range (e.g. a score of 140) | **No** |
| `sample_data` | Seeded demo record written by hand | Shown with a "Sample data" badge |

The previous version filled failures with defaults such as "completion 60%,
Healthy, confidence 50" and saved them as if a model had produced them. That
code was removed (`git log -- server/services/geminiClient.js`), and tests in
`server/tests/unit/aiClient.test.js` and `server/tests/http/*` assert that a
failure stores no score.

**Retries** happen only for transient failures (timeouts, HTTP 429 and 5xx,
network errors): at most 2 retries with exponential backoff and jitter. A
rejected key or bad request is not retried.

**Validation** (`server/services/ai/responseSchema.js`) checks types, ranges
(0–100) and enums. Defect labels are normalised (`"Potholes"` → `pothole`) and
unknown labels are dropped rather than failing the citizen's complaint.

**Prompt injection.** Tender text is placed inside `<document>` tags with an
instruction to treat it as data. This reduces the risk but does not remove it:
a crafted PDF can still influence the summary. Tender analysis is advisory for
that reason too.

## 2. Defect detection: real, simulated, or unavailable

Every `/segment` response states how it was produced:

| `inferenceMode` | When | What the API server stores |
| --- | --- | --- |
| `real_inference` | Weights loaded and contain a `pothole` class | `segmentation.status = completed`, with model confidences |
| `demo_simulation` | Only if `SEGMENTATION_DEMO_MODE=true` **and** `SEGMENTATION_ENV` is not `production` | `simulated`; confidence removed; excluded from severity; UI shows "DEMO SIMULATION" |
| `model_unavailable` | Weights missing, failed to load, or lack the required class. HTTP 503 | `model_unavailable`; no defects |

If the response does not state its mode, the API server does not trust it and
records `unavailable`. `/health/ready` reports `modelLoaded`, `modelTask` and
`classes`, and returns 503 when no usable model is loaded.

### The shipped model

`segmentation-service/models/model.onnx` metadata (read from the file):

- task: **detect** (bounding boxes, not masks)
- classes: `pothole`, `crack`, `openmanhole`
- exported with Ultralytics 8.4.115; trained on the Kaggle dataset `sabidrahman/pothole-cracks-and-openmanhole`

Earlier documentation called it a custom "YOLOv8-Seg" segmentation model with
polygon labels and reference-marker detection. The code never did segmentation
or marker detection with this model, and the docs now say what it is.

### Accuracy

**No accuracy figure is claimed.** No labelled test set from this project's
target conditions (Indian rural roads, phone photos) has been evaluated. The
automated tests prove that the model loads and that its output is well-formed.
They do not prove that its detections are right. The two sample photos in
`test-assets/` are a bus and a building, so "no defects" is the correct answer
for both.

To measure accuracy:

1. Collect at least 200 photos from real use, not from the training dataset.
2. Label them in YOLO format: `class cx cy w h` for boxes, or polygons for segmentation.
3. Put them under `datasets/road-defects/images/test` and `labels/test`.
4. Run `python evaluate.py --weights models/model.onnx --split test`.
5. Record precision, recall and mAP50 per class here, with the dataset size and date.

## 3. Measurements: why there is no "cm" by default

A photo is measured in pixels. Turning pixels into centimetres needs to know
how many centimetres one pixel covers **at the defect's distance**. That depends
on camera distance, angle and lens. An ordinary person cannot know it, so the
citizen form no longer asks for a "cm per pixel" number. The old required field
also let anyone inflate severity by typing a large value.

What is reported instead:

- **`areaFractionOfImage`**: how much of the photo the defect covers. Honest, but
  it depends on framing: a close-up makes the same pothole look bigger.
- **`measurementBasis`**: `bounding_box` for the shipped model. A box around a
  round pothole overestimates its area by about 27% (1 − π/4); thin diagonal
  cracks are overestimated far more.
- **Physical size** (`areaCm2`, `widthCm`, `heightCm`) is computed only when a
  measured scale is supplied to the service (up to 10 cm/pixel). That assumes the
  photo was taken straight down at the defect, with the scale measured from a
  known-size object at the same distance.
- **Depth is never estimated.** One RGB photo does not contain depth. Depth
  needs a stereo/depth camera or a tape measure on site. Every defect carries
  `depth: null`.

## 4. Severity is a triage hint

`server/utils/severity.js` combines only real evidence: a completed AI review
and/or real detections. Open manholes are always High. With no real evidence
the severity is **`Unassessed`**, not "Low".

## 5. What an interviewer may ask, and the true answer

- *"How accurate is your pothole detection?"* Not measured on target data yet;
  here is the evaluation procedure and why I did not invent a number.
- *"Can it measure pothole depth?"* No. A single photo has no depth information.
- *"What happens when Gemini is down?"* The complaint is saved, and
  `aiAssessment.status` says `unavailable`. No score is shown. Severity becomes
  `Unassessed` unless detection ran. Officials see why.
