# Engineering audit and remediation status

- **Audit:** 2026-10-21, against commit `9ff40ed`.
- **Remediation:** branch `hardening`.
- **Method:** every source file read; test suites and builds run; ONNX metadata inspected; dependency audits run.

Status key: **Fixed** (code changed and a test proves it), **Mitigated**
(reduced, residual risk stated), **Open** (not done; reason given).

## Critical

| ID | Finding | Status | Evidence |
| --- | --- | --- | --- |
| C1 | Gemini failures saved as real scores ("60%, Healthy", default confidence 90) | **Fixed** | `services/ai/geminiClient.js`; `tests/unit/aiClient.test.js`; complaints/projects HTTP tests ("NO invented scores") |
| C2 | Detector returned a fixed fake pothole, confidence 0.88, status "completed", when weights were missing | **Fixed** | `segmentation-service/app.py`, `inference.py`; `tests/test_app.py`; Node mapping in `services/segmentationService.js` |
| C3 | "AI Verified" from a score derived from the length of the project title; manual "AI Verified" | **Fixed** | mock deleted; `utils/projectLifecycle.js`; projects test "nobody can mark… by hand" |
| C4 | Local `JWT_SECRET` equal to the published example | **Fixed in code**; production check is **yours** | `config/env.js` refuses it; unit test. Rotate on Render (DEPLOYMENT.md §0) |

## High

| ID | Finding | Status | Evidence |
| --- | --- | --- | --- |
| H1 | Tender text, PDF URLs and contractor contacts public via `/api/projects` | **Fixed** | `PUBLIC_FIELDS`; projects test "public project data"; e2e |
| H2 | Public Admin login on a site where real people can register | **Fixed** (Admin only from `ADMIN_PASSWORD`); **Mitigated** for the other demo officials | seed; e2e "old public Admin password no longer works"; SECURITY.md risk table |
| H3 | Repeated "Accept" paid points again; inspection could be skipped | **Fixed** | `utils/complaintWorkflow.js`, conditional update + transaction + unique `Reward.complaint`; concurrent-accept test |
| H4 | Unreviewed complaints cut contractor trust and failed projects | **Fixed** | effects moved to acceptance, only when geo-verified; HTTP test |
| H5 | CI server job failed without `.env` | **Fixed** | tests set their own env; CI rewritten |
| H6 | README described a segmentation model, reference markers and parallel calls that did not exist | **Fixed** | docs rewritten; `data/road_defects.yaml` and `train.py` match the 3-class detector; AI calls now actually run in parallel |
| H7 | Seeded records showed hand-written "AI" results as real | **Fixed** | `dataSource: 'sample'`, `aiAssessment.status: 'sample_data'`, UI badge; real company names replaced by fictional ones |

## Medium

| ID | Finding | Status |
| --- | --- | --- |
| M1 | Any inspector could act on any complaint | **Fixed** (`canInspect`; HTTP test) |
| M2 | Status jumped through "Gemini Analysis" without any AI call | **Fixed** (one honest status + a real repair assessment) |
| M3 | Unexpected AI labels or ranges made Mongoose reject the complaint after paying for AI | **Fixed** (normalise and validate; test) |
| M4 | Completing a project usually returned 500 after upload and AI spend | **Fixed** (409 checked first; test asserts no upload or AI call) |
| M5 | Admin creating an official was switched into that account | **Fixed** (test) |
| M6 | Token in JSON; 7-day tokens; logout did not revoke; Secure flag unchecked | **Fixed** (cookie-only, 24 h, tokenVersion, Secure in production; tests) |
| M7 | Photos at public URLs with EXIF GPS | **Mitigated** (EXIF/GPS stripped from JPEG/PNG; failed uploads cleaned up). Signed URLs remain **Open** |
| M8 | multer 1.x and other advisories | **Fixed** (multer 2; `npm audit --omit=dev`: 0 in server and client) |
| M9 | Unbounded lists, no indexes | **Fixed** (pagination headers, limits, indexes matched to queries, `lean()`) |
| M10 | Unsafe AI retries, untimed calls, uncapped image downloads | **Fixed** (bounded retries only for transient errors; timeouts; 10 MB cap) |
| M11 | Bad PDFs → 500 | **Fixed** (400; 60-page cap; test) |
| M12 | Detector: no limits, no readiness, event loop blocked, no auth | **Fixed** (limits, `/health/ready`, worker threads + lock, optional token) |
| M13 | Citizens had to type cm/pixel; it could inflate severity | **Fixed** (removed; severity from real evidence; physical size only from a measured scale) |
| M14 | Three contractor score formulas | **Fixed** (one pure function, unit tested) |

## Low

| ID | Finding | Status |
| --- | --- | --- |
| L1 | Account enumeration / timing | **Fixed** (generic 409, dummy bcrypt compare) |
| L2 | README inaccuracies | **Fixed** |
| L3 | `npm run lint` broken | **Fixed** (ESLint 9 with React, hooks and jsx-a11y; zero warnings) |
| L4 | `Notification` referenced a missing model; duplicated fan-out | **Fixed** (`refPath`; one service; role-targeted) |
| L5 | DNS override for the whole process | **Fixed** (opt-in `MONGODB_DNS_SERVERS`) |
| L6 | No graceful shutdown; unstructured logs | **Fixed** (SIGTERM handling; JSON logs with redaction and request ids) |
| L7 | Unvalidated text lengths | **Fixed** |
| L8 | Python dependencies unpinned; AGPL not noted | **Fixed** (bounded ranges; README note) |
| L9 | A failed seed left a half-seeded server running | **Fixed** (seed failure stops start-up) |

## Also found and fixed during the work

- Clickable list rows were not keyboard accessible. They now have button semantics and Enter/Space.
- Axe found missing labels on filters and the notification bell, and low-contrast sidebar text. Fixed, and now guarded by e2e tests.
- Coordinate inputs had no labels.
- `/me` did not return the citizen's points, so the profile always showed 0.
- The PDF report said "AI Confidence 90%" by default and claimed the document was "certified". Both were removed.

## Verification performed (2026-10-21, this branch)

| Check | Result |
| --- | --- |
| Server lint | pass |
| Server tests (129 unit + 70 HTTP against a MongoDB 8.0 replica set) | 199 / 199 pass |
| `npm audit --omit=dev` server / client | 0 / 0 |
| Client lint (`--max-warnings 0`) / tests / build | pass / 38 of 38 / pass |
| Detector ruff / pytest (incl. real ONNX model) | pass / 25 pass, 1 skipped (needs a real pothole photo) |
| Playwright e2e (real API, MongoDB, detector with real model, Chromium; desktop + phone) | 10 / 10 pass |
| Server boot refuses the published JWT secret | confirmed |
| Local load test, public project list | 210 → 306 req/s after `lean()` (2-core VM; indicative only) |

**Not verified:** the live deployment (no access was used; run `scripts/smoke.js`
after deploying); GitHub Actions on GitHub itself (run once the branch is
pushed); detector accuracy (no labelled target data); browsers other than Chromium.

## Assessment

What this project now demonstrates: server-side authorization with tests at
the HTTP level; idempotent, concurrency-safe workflows; honest handling of
AI/ML failure modes; a tested ML inference service; CI across three languages
of tooling; and documentation that matches the code.

What it does not demonstrate, and should not be claimed: production traffic,
measured model accuracy, multi-instance scaling, or a security review by a
third party. "Industry-ready" is fair for code quality and engineering practice
at the scale of a portfolio project. It is not a claim that the system has been
proven in production.
