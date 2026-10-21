# Testing

Four layers. None of them call paid services or need production credentials.

| Layer | Tool | Count (last run) | Command |
| --- | --- | --- | --- |
| Server unit | `node:test` | 129 | `cd server && npm run test:unit` |
| Server HTTP (real API + real MongoDB replica set in memory) | `node:test`, supertest, mongodb-memory-server | 70 | `cd server && npm run test:http` |
| Client components | Vitest, Testing Library, jsdom | 38 | `cd client && npm test` |
| Detection service | pytest, FastAPI TestClient | 25 (3 use the real ONNX model) | `cd segmentation-service && pytest` |
| End-to-end | Playwright + axe-core | 10 (desktop + one phone-sized run) | `cd client && npm run test:e2e` |

"Last run" means run on 2026-10-21 for this branch. CI runs all of them on
every push; check the Actions tab for the current result rather than trusting
this table.

## What is faked, and why

| Dependency | In server tests | In e2e |
| --- | --- | --- |
| MongoDB | Real `mongod` (replica set, so transactions work), wiped between tests | Real MongoDB (disposable database) |
| Gemini | `__setGeminiTransportForTests`: scripted replies, failures, timeouts | Not configured, so the UI must show "AI not set up" |
| Cloudinary | In-memory store that records uploads and deletions | Local disk (`STORAGE_DRIVER=local`) |
| Detector | `fetch` stub returning real/simulated/503 replies | **Real service with the real model** (optional; set `E2E_SEGMENTATION_URL`) |

## What the tests prove (selected)

- **Authorization.** Citizen A cannot read B's complaint (by list, id or PDF). Inspectors act only on their own assignments. Inspectors cannot decide. Citizens cannot reach official routes. Unauthenticated users cannot upload. Notifications are owner-only.
- **Sessions.** No token in bodies. Cookie flags. Secure in production. Forged secret, swapped `kind`, expired token, Bearer header and post-logout copies are all refused.
- **Workflow integrity.** Accept before inspection → 409. Double accept → exactly one 200 and one 409, with points paid once. Rejected cannot be reopened. Manual "AI Verified" → 409. Completion before construction → 409 with **no upload and no AI call**.
- **AI honesty.** AI down / malformed / out of range → no score stored and severity `Unassessed`. Bad key → not retried. Simulated detection → labelled, confidence removed, ignored by severity. Missing weights → 503. Wrong-class weights → unavailable. Demo mode refused in production.
- **Input/uploads.** Renamed executable → 400 before storage/AI. Oversize → 413. Malformed JSON → 400. Damaged PDF → 400. Bad coordinates/ids → 400.
- **Data exposure.** Anonymous `/api/projects` has no tender text, PDF, budget or contractor contacts.
- **Browser journeys.** Sign up, file a complaint with a photo (through the real detector), official assigns, inspector uploads, official accepts, citizen sees it resolved. Sign-out ends the session. Axe finds no serious/critical WCAG A/AA issue on the login, citizen and dashboard pages. No sideways scrolling on a phone.

## Running locally

```bash
# Server: needs nothing else. mongodb-memory-server downloads mongod once (~100 MB).
cd server && npm ci && npm test

# Client
cd client && npm ci && npm run lint && npm test && npm run build

# Detection service: tests without the model need only requirements-dev.txt
cd segmentation-service
pip install -r requirements-dev.txt && pytest
# To include the real-model tests:
pip install --extra-index-url https://download.pytorch.org/whl/cpu torch torchvision
pip install -r requirements.txt && pytest

# End-to-end: needs a DISPOSABLE MongoDB (it is wiped and reseeded)
cd client && npx playwright install chromium
E2E_MONGODB_URI=mongodb://127.0.0.1:27017/gramsetu_e2e npm run test:e2e
# with the detector running on :8011
E2E_MONGODB_URI=... E2E_SEGMENTATION_URL=http://127.0.0.1:8011 npm run test:e2e
```

On Windows, if `mongodb-memory-server` cannot download a binary, install MongoDB
Community and set `MONGOMS_SYSTEM_BINARY` to the path of `mongod.exe`.

## Checking a deployment

```bash
cd server
node scripts/smoke.js https://<your-frontend>.vercel.app
```

This checks that the API answers, public data hides tender documents, tenders
need sign-in, operator injection is refused, cookies are HttpOnly and Secure,
logout revokes the token, and the old Admin password is rejected.

## Performance (local, indicative only)

`npm run loadtest -- http://localhost:5000` (autocannon, 20 connections, 10 s).
On a 2-core cloud VM with local MongoDB and 6 sample projects:

| Endpoint | Before `lean()` | After |
| --- | --- | --- |
| `GET /api/projects` | 210 req/s, p50 90 ms | 306 req/s, p50 62 ms |
| `GET /health/ready` | n/a | ~3,960 req/s, p50 3 ms |

These numbers describe that machine only. They say nothing about Render's free
tier, which also sleeps when idle (the first request can take ~1 minute).

## Known gaps

- No accuracy evaluation of the detector on labelled target data (see `AI_LIMITATIONS.md`).
- Sample photos in `test-assets/` are not road photos. Add a real pothole photo as `test-assets/pothole-*.jpg` for a positive detection check.
- No cross-browser e2e (Chromium only), and no screen-reader testing by a person.
- Coverage percentage is not measured. The suites target behaviour and risk rather than line counts.
