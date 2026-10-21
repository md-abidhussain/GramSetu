# Interview preparation: GramSetu

How to explain this system, defend its decisions and change it on the spot.
Every claim points to a file you can open during the interview. Items marked
**(recommendation)** are not built: say so if asked.

---

## 1. The 30-second version

> "GramSetu lets citizens report problems with public works, like a pothole on a
> newly built road, with a photo and a GPS location. Officials assign an
> inspector, the inspector uploads evidence, and an official makes the decision.
> It's a React app on Vercel talking to an Express API on Render with MongoDB.
> AI helps with triage: Gemini reviews photos and tender PDFs, and a separate
> Python service runs a YOLO model to detect potholes. The part I'm proudest of
> is that AI never invents a result: if the model didn't run, the record says
> so and nothing downstream treats it as evidence."

## 2. Architecture (draw this)

```
Browser (React) ──/api──> Vercel rewrite ──> Express API ──> MongoDB
                                               ├─> Cloudinary (files)
                                               ├─> Gemini (JSON prompts)
                                               └─> FastAPI + YOLO ONNX (optional)
```

- **Why the Vercel rewrite?** It makes the API same-origin from the browser's point of view. The session cookie is then first-party, so `SameSite=Lax` works and there's no third-party cookie problem.
- **Why a separate Python service?** Different runtime (PyTorch/ONNX), CPU-heavy, optional. Everything else stays one Express app: there is no need for more services.
- **Where the rules live:** `server/utils/` holds pure functions (access, workflows, severity). They are unit tested without a database. HTTP tests prove the routes use them.

## 3. Request lifecycle (filing a complaint)

Walk through `docs/ARCHITECTURE.md` → "Request lifecycle". The key points to say out loud:

1. The browser sends `FormData`; the cookie is attached by the browser, never by JS (`client/src/services/api.js`).
2. `app.js`: helmet → Origin/CORS check → rate limits.
3. `protectCitizen` verifies the JWT: algorithm pinned, `kind` = citizen, `tokenVersion` matches (`middleware/authMiddleware.js`).
4. multer reads one file of at most 5 MB; then `verifyImageContents` checks the **magic bytes**, because the filename and MIME type are attacker-controlled.
5. The controller validates input, measures the distance to the project (haversine, `utils/geo.js`) and checks for duplicates. It runs Gemini and YOLO **in parallel** (`Promise.all`), computes severity from real evidence, strips EXIF, stores the photo, then saves.
6. If saving fails after upload, the uploaded file is deleted (`removeStoredFile`): no orphans.

## 4. Authentication and RBAC

- **Session:** JWT in an HttpOnly, SameSite=Lax, Secure cookie, 24 h. Claims: `id`, `kind`, `tv` (token version).
- **Why `kind`?** Citizens and officials are in different collections. Without `kind`, a citizen's id could be looked up as an official.
- **Logout** increments `tokenVersion`, so every token issued before is dead: real revocation without a blocklist. Trade-off: it logs out all devices.
- **RBAC:** one table, `server/utils/roles.js` → `PERMISSIONS`; routes call `restrictTo(...PERMISSIONS.x)`.
- **Ownership (object-level authorization):** `canViewReport` (citizens see only their own) and `canInspect` (only the assigned inspector). Another user's complaint returns **404, not 403**, so ids can't be probed.
- **CSRF:** SameSite=Lax plus an Origin allowlist that rejects foreign sites before any route runs.

Likely follow-up: *"Why not localStorage + Authorization header?"* Any XSS
could read localStorage and steal the token. An HttpOnly cookie can't be read
by JavaScript at all.

## 5. One security issue and how it was fixed

**Double payment on complaint acceptance (race condition + missing state check).**

- *Before:* `resolveComplaint` loaded the complaint, set `status = decision`, added 150 points and saved. Two clicks → 300 points. It also allowed accepting a complaint that had never been inspected.
- *Fix* (`controllers/citizenController.js`, `utils/complaintWorkflow.js`):
  1. A state machine says which steps are allowed from which states.
  2. The status change is **one atomic conditional update**: `findOneAndUpdate({ _id, status: { $in: allowedFrom } }, …)`. Only one concurrent request can match.
  3. Reward, citizen points and project/contractor effects run in a **MongoDB transaction**.
  4. A **unique index** on `Reward.complaint` is the last line of defence.
- *Test:* `tests/http/complaints.test.js`, "accepting pays the citizen once, even if the request is sent twice at the same moment". It fires two requests with `Promise.all` and asserts one 200, one 409, and exactly 150 points.

Alternative story: tender documents leaked through the public projects endpoint
(BOLA). Fixed with explicit field projection per audience
(`PUBLIC_FIELDS` in `projectController.js`).

## 6. One AI failure and how the system handles it

**Gemini is down (or returns garbage).**

- `generateJson` (`services/ai/geminiClient.js`) retries **only** transient errors (timeout, 429, 5xx, network): at most 2 retries, exponential backoff with jitter. A bad API key (401/403) is not retried.
- Replies are parsed and **validated** (`responseSchema.js`): a score of 140 or a risk of "moderate-ish" counts as `invalid_response`.
- The result is an **envelope**: `{ status, reason, model, assessedAt, ...fields only if completed }`. The complaint is still saved, with `aiAssessment.status = 'unavailable'`, no scores, and severity `Unassessed`. The UI shows "AI did not run" instead of a number.
- *Why this matters:* the old code returned "60% complete, Healthy" on failure. That is a fabricated verdict on public money.

The detector has the same discipline: `real_inference` / `demo_simulation` (opt-in, refused in production) / `model_unavailable` (503).

## 7. Database schema and indexes

Each index matches a real query (see the table in `docs/ARCHITECTURE.md`):

- `{ citizen: 1, createdAt: -1 }` serves "my reports, newest first": equality then sort, in that order.
- `{ assignedOfficer: 1, status: 1 }` serves the inspector's queue.
- `Reward.complaint` is **unique and partial**: it enforces at-most-one reward and only applies to rewards tied to a complaint.
- Large `Tender.extractedText` has `select: false`, so lists never ship it.

Why MongoDB fits: documents with nested AI results and history arrays. Where
it's weaker: multi-document consistency, so transactions are used exactly
where it matters.

## 8. Testing strategy

| Layer | What it proves |
| --- | --- |
| Unit (`server/tests/unit`) | Pure rules: access, workflows, severity, scoring, config, EXIF stripping, AI client retries/validation |
| HTTP (`server/tests/http`) | Real Express app + real MongoDB replica set: authorization, workflow, concurrency, uploads, AI failure handling |
| Component (`client/src/__tests__`) | AI states display honestly; form validation; double-submit; session expiry; route guards |
| Detector (`segmentation-service/tests`) | Real/simulated/unavailable modes, limits, token; real model loads and returns well-formed output |
| E2E (`client/e2e`) | Full journey in Chromium with the real API, DB and model; axe accessibility; phone width |

What's faked: Gemini (scripted transport), Cloudinary (in-memory store),
detector (fetch stub) in unit/HTTP tests. That keeps tests free, deterministic
and secret-free.

Example to quote: `tests/http/projects-tenders.test.js`, "completion photos
before construction has started are refused before any cost". It asserts 409
**and** that no upload and no AI call happened.

## 9. Performance and trade-offs

- **Measured:** the public project list went from 210 to 306 req/s locally after switching to `lean()` (plain objects instead of Mongoose documents). Say "on my 2-core VM, indicative".
- **Bottleneck:** AI calls inside the HTTP request (up to ~75 s worst case). **(recommendation)** Move them to a job queue and have the client poll status.
- **Pagination** keeps response bodies as arrays and puts totals in headers. Trade-off: the client didn't need rewriting.
- **Rate limit store is in memory.** Fine for one instance. **(recommendation)** Redis store for multiple instances.

## 10. Deployment and limitations

Vercel (static client + rewrite), Render (API, free tier sleeps), Atlas,
Cloudinary. The detector has a Dockerfile but is not deployed (it needs more
RAM than the free tier). Health checks: `/health/live` and `/health/ready`
(ready = DB connected; the detector's ready = model really loaded). Config is
validated at start; the server refuses a weak secret.

Honest limits: no measured model accuracy; public (unguessable) photo URLs; no MFA; single instance.

---

## Five change requests an interviewer might give you

### A. "Let citizens delete their own complaint while it's still unreviewed."
- **Files:** `utils/complaintWorkflow.js` (add `withdraw: [SUBMITTED, DUPLICATE]`), `controllers/citizenController.js` (new `withdrawComplaint`), `routes/citizenRoutes.js` (`DELETE /:id`, `protectCitizen`), `models/CitizenReport.js` (add 'Withdrawn' to the enum).
- **Plan:** `findOneAndUpdate({ _id, citizen: req.user._id, status: { $in: STEP_FROM.withdraw } }, { status: 'Withdrawn' })`. Ownership and state go **in the query**; return 404 if nothing matched. Prefer a soft delete for audit; optionally delete the photo.
- **Tests:** owner can withdraw; another citizen gets 404; withdrawing after assignment gets 409.

### B. "Add a 'Zonal Officer' role who can decide complaints only in their district."
- **Files:** `utils/roles.js`, `models/Authority.js` (add `district`), `models/Project.js` (`district`), `utils/access.js` (new `canDecide(req, report)`), `resolveComplaint`.
- **Plan:** the role check stays in `PERMISSIONS`; the district check is object-level, like `canInspect`. Index `{ district: 1, status: 1 }` if there's a district queue.
- **Tests:** a zonal officer from another district gets 403/404; the same district succeeds.

### C. "Gemini is slow. Make complaint submission return immediately."
- **Plan (recommendation):** save the complaint with `aiAssessment.status = 'pending'`, return 201, and process AI in a worker (BullMQ + Redis, or a simple polling worker over pending records). The client polls `GET /citizen-reports/:id` or uses Server-Sent Events.
- **Watch out for:** idempotent workers (conditional update on `pending`), retries with backoff, a dead-letter state, and UI wording for "analysis in progress".
- **Tests:** submission returns 201 without AI; the worker fills the result; a failure sets `unavailable`.

### D. "Show complaints on the map near me, within 2 km."
- **Files:** `models/CitizenReport.js` (add `location: { type: 'Point', coordinates: [lng, lat] }` with a `2dsphere` index, backfilled from `gps`), new route `GET /citizen-reports/nearby?lat=&lng=&radius=`.
- **Plan:** a `$nearSphere` query with `$maxDistance`. Public output only (no names or photos). Clamp the radius and limit.
- **Tests:** returns only points within the radius; rejects a bad lat/lng; contains no personal data.

### E. "Retrain the detector and prove it's better."
- **Files:** `segmentation-service/train.py`, `evaluate.py`, `data/road_defects.yaml`, `docs/AI_LIMITATIONS.md`.
- **Plan:** a fixed held-out **test** split from target conditions. Evaluate the current model first (baseline), then train, then compare per-class precision/recall/mAP50 on the same split. Export to ONNX and check `/health/ready` classes. Only then swap `models/model.onnx`.
- **Tests:** existing real-model tests; add the labelled positive photo `test-assets/pothole-*.jpg`.

---

## Resume bullets (each one is verifiable in the repo)

- Built GramSetu, a civic-infrastructure reporting platform (React, Node/Express, MongoDB, FastAPI, YOLOv8/ONNX, Gemini); national offline finalist, NxtWave Idea2Impact.
- Hardened authorization end to end: HttpOnly cookie sessions with server-side revocation, role and object-level access checks, and a state-machine workflow with atomic conditional updates and transactions that prevents double-payment races; 199 server tests including HTTP tests against a real MongoDB replica set.
- Made AI output auditable: every Gemini/YOLO result carries its provenance (completed / unavailable / invalid / simulated). Removed fabricated fallback scores, added schema validation and bounded retries for transient failures only.
- Shipped a tested FastAPI inference service (readiness reports real model state, upload/size limits, optional service token, Docker) and CI across Node and Python with Playwright end-to-end and axe accessibility checks.

Avoid claiming accuracy numbers, production users, or "scalable to N users". None have been measured.

## Things to rehearse

1. Draw the architecture from memory in under a minute.
2. Open `resolveComplaint` and explain each line of the conditional update.
3. Explain why another user's complaint returns 404 instead of 403.
4. Explain `tokenVersion` revocation, and its trade-off.
5. Explain why the detector doesn't report cm or depth by default.
6. Run `npm test` in `server/` live and read one failing test you break on purpose.
