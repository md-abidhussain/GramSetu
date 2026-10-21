# Deployment

Current hosting: client on **Vercel**, API on **Render** (free web service),
database on **MongoDB Atlas**, files on **Cloudinary**. The detection service is
optional and is **not** deployed on the current live site.

## 0. Before the first deploy of this branch

1. **Rotate `JWT_SECRET`** on Render. If it was ever set to a value from this repository's examples, anyone can forge sessions. Generate a new one:
   `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
   Rotating signs everyone out. The new server refuses to start with a short or published secret.
2. Run the CI checks on the branch (GitHub Actions) and fix anything red before merging.
3. Existing data keeps working. New fields have defaults, and older complaints with legacy statuses still display. Old records have no `aiAssessment`, so the UI shows "Not assessed" for their scores, which is the honest state.

## 1. API on Render

| Setting | Value |
| --- | --- |
| Root directory | `server` |
| Build command | `npm ci --omit=dev` |
| Start command | `npm start` |
| Health check path | `/health/ready` |
| Node version | 22 (`engines` in `package.json`) |

Environment variables (see `server/.env.example` for all of them):

| Variable | Required | Value |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` (turns on `Secure` cookies and production-only checks) |
| `MONGODB_URI` | yes | Atlas connection string, with a database user limited to this database |
| `JWT_SECRET` | yes | 48+ random bytes (see above) |
| `CLIENT_ORIGINS` | yes | `https://gramsetu-india.vercel.app` (comma-separate others) |
| `TRUST_PROXY` | yes on Render | `1`, so rate limits apply per user, not per proxy |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | yes for uploads | From the Cloudinary dashboard |
| `GEMINI_API_KEY` | optional | Without it, AI is recorded as "not configured" (nothing invented) |
| `GEMINI_MODEL` | optional | Override if the default model name is not available to your key |
| `SEGMENTATION_SERVICE_URL`, `SEGMENTATION_SERVICE_TOKEN` | optional | Only if the detector is deployed |
| `SEED_DB` | once | `true` on an empty database only, then remove it. `force` is refused in production. |
| `ADMIN_PASSWORD` | when seeding | 12+ characters. Only then is an Admin account seeded. |

## 2. Client on Vercel

| Setting | Value |
| --- | --- |
| Root directory | `client` |
| Build command | `npm run build` |
| Output directory | `dist` |
| `VITE_API_BASE_URL` | **leave unset** |

`client/vercel.json` rewrites `/api/*` to the Render URL. This keeps the
session cookie first-party, which `SameSite=Lax` needs. If the Render URL
changes, update `vercel.json`.

## 3. Detection service (optional)

The service needs ~1.5 GB of RAM with PyTorch, more than Render's free tier
provides. Options: a paid Render instance, Fly.io, Google Cloud Run, or a VM. It
ships with a Dockerfile:

```bash
cd segmentation-service
docker build -t gramsetu-detector .
docker run -p 8001:8001 -e SEGMENTATION_SERVICE_TOKEN=<random> gramsetu-detector
curl http://localhost:8001/health/ready     # must say "real_inference"
```

Then set `SEGMENTATION_SERVICE_URL` and the same `SEGMENTATION_SERVICE_TOKEN` on
the API. In production the service refuses demo mode. Without a model it
answers 503, and the API records "model unavailable".

## 4. After deploying

```bash
cd server && node scripts/smoke.js https://gramsetu-india.vercel.app
```

All checks should say PASS. A FAIL on "cookie not Secure" means `NODE_ENV` is not `production`.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Server exits at start with "configuration problem" | Read the logged problem; usually `JWT_SECRET` or `CLIENT_ORIGINS`. |
| Everyone gets "Too many sign-in attempts" at once | `TRUST_PROXY` is not set, so all users share the proxy's IP. |
| Signed in, but every call is 401 | The client is calling the API cross-site. Leave `VITE_API_BASE_URL` empty and use the Vercel rewrite. |
| "This website is not allowed to call the GramSetu API" | Add the front-end URL to `CLIENT_ORIGINS` exactly (scheme, no trailing slash). |
| Uploads fail with 503 | Cloudinary variables are missing. |
| AI always "not configured" / "did not run" | Check `GEMINI_API_KEY`; log lines `AI call failed` give the reason (`not_authorized`, `model_not_found`, `rate_limited`). |
| First request takes ~1 minute | Render free tier sleeps when idle. The client shows a notice; a paid instance removes this. |
| `querySrv ENOTFOUND` connecting to Atlas | Your network's DNS cannot resolve SRV records. Set `MONGODB_DNS_SERVERS=8.8.8.8,8.8.4.4`. |

## What works on the hosted demo

| Feature | Hosted demo | Notes |
| --- | --- | --- |
| Sign-in, registration, roles | Yes | |
| Citizen complaints with photo | Yes | Needs Cloudinary |
| Gemini review of photos and tenders | If `GEMINI_API_KEY` is set | Otherwise shown as "not set up" |
| Defect detection (YOLO) | **No** (service not deployed) | Shown as "not running on this deployment" |
| PDF reports | Yes | |
| Sample data | Yes, badged "Sample data" | |

## Limitations

- One API instance: rate-limit counters are in memory.
- Render's free tier sleeps; the first request after idle is slow.
- AI calls run inside the HTTP request (up to ~75 s worst case with retries).
- Uploaded photos are at unguessable but public URLs (see SECURITY.md).
