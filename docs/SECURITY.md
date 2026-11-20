# Security

What this app protects, how, and where. Each claim names the file that
enforces it and the test that checks it, so a reviewer can verify rather than trust.

## Assets, in order of harm

1. **Citizens' reports**: photo, description, GPS position, name and contact details.
2. **Official accounts**: they assign inspectors, resolve complaints and move contractor scores.
3. **Paid operations**: uploads and AI calls cost money.

## Authentication

| Property | Implementation | Test |
| --- | --- | --- |
| Session token only in an `HttpOnly` cookie (`SameSite=None; Secure; Partitioned` in production cross-site environments, `SameSite=Lax` in local development); never in a response body | `controllers/authController.js` (`setSessionCookie`) | `tests/http/auth.test.js` |
| No `Authorization` header fallback: JavaScript never holds a token | `middleware/authMiddleware.js` (`readSessionToken`) | auth: "a Bearer header is not accepted" |
| JWT pinned to HS256, 24 h expiry, carries `kind` (citizen/authority) so a citizen id can never be looked up as an official | `signSession`, `resolveSession` | auth: "kind is checked" |
| Logout revokes **all** sessions for the account (`tokenVersion` bump), so a copied token stops working | `logout` | auth: "logout revokes the token everywhere" |
| Server refuses to start with a missing, short (<32) or published JWT secret | `config/env.js` | `tests/unit/configAndPrivacy.test.js` |
| Passwords: bcrypt cost 12; 8–200 characters | `utils/credentials.js` | `tests/unit/credentials.test.js` |
| Same response and similar timing for "no such account" and "wrong password" (dummy bcrypt compare) | `loginCitizen`, `loginAuthority` | auth: "same answer" |
| Registration duplicates get one generic 409 that does not name the field | `registerCitizen` | auth |
| Sign-in/registration rate limited (20 per 15 min per IP); `/me` is not counted | `middleware/rateLimits.js`, `routes/authRoutes.js` | `tests/http/rateLimit.test.js`, platform test |
| Official accounts are created only by an Admin; the Admin keeps their own session | `routes/authRoutes.js` | auth: "official accounts" |
| No public Admin credentials. An Admin is seeded only from `ADMIN_PASSWORD` | `data/seedDatabase.js` | e2e: "old public Admin password no longer works" |

## CSRF

Two layers. (1) In cross-site deployments (frontend on Vercel, backend on Render), the session cookie is configured with `SameSite=None; Secure; Partitioned`, while in same-origin/local environments it uses `SameSite=Lax`. (2) Every request carrying an `Origin` header not in `CLIENT_ORIGINS` (or allowed domains) is refused with 403 before any route runs (`app.js`).
State never changes on GET. Test: platform "a write from a website that is not ours is refused".

## Authorization

The server is the authority; the client's route guards only keep screens
consistent. Roles and permissions live in one table: `server/utils/roles.js` (`PERMISSIONS`).

| Rule | Where | Test |
| --- | --- | --- |
| Citizens see only their own complaints (list, by id, PDF). Others' ids return 404, so ids cannot be probed | `utils/access.js` `canViewReport`, `citizenController` | complaints: "who can see a complaint" |
| Only the **assigned** inspector (or an Admin) can schedule or upload evidence | `canInspect` | complaints workflow |
| Only Admin / District Authority / Government Officer decide complaints and final project stages | `PERMISSIONS` | complaints + projects tests |
| Complaint workflow is a state machine; accepting needs inspection evidence | `utils/complaintWorkflow.js` | "cannot be accepted before an inspection" |
| Accepting is idempotent: conditional update + transaction + unique index on `Reward.complaint` | `resolveComplaint`, `models/Reward.js` | "pays the citizen once, even if sent twice at the same moment" |
| Unreviewed complaints cannot change contractor or project scores | `createCitizenReport` | "an unreviewed complaint does not change the project or the contractor" |
| "AI Verified" is a system-only stage | `utils/projectLifecycle.js` | "nobody can mark a project AI Verified by hand" |
| Public project data excludes tender text/PDF/budget and contractor contacts | `projectController` `PUBLIC_FIELDS` | projects: "public project data" |
| Tenders and PDFs of project audits: officials only | routes | projects/tenders tests |
| Notifications: ownership is part of the query | `markNotificationRead` | platform test |

## Input and uploads

- Request bodies capped at 100 kB; JSON parse errors → 400.
- Ids validated before queries; identifiers coerced to strings (blocks `$ne` operator injection); `strictQuery` on.
- Text fields trimmed and length-limited; coordinates range-checked; numbers clamped.
- Uploads: authentication runs **before** multer reads the file. One file only; 5 MB images and 10 MB PDFs. Type decided by the file's **bytes** (signature), not its name or claimed MIME type.
- PDFs: parsed with a 60-page cap; unreadable files → 400 before anything is stored.
- EXIF/GPS metadata is stripped from JPEG and PNG before storage (`utils/stripImageMetadata.js`). WebP/GIF are stored as uploaded.
- Failed requests delete the file they already uploaded.

## Errors and logging

- Unexpected errors return one generic sentence plus a `requestId`; details go only to the server log.
- Logs are JSON lines. Keys matching password/token/secret/cookie/authorization/uri are redacted. Request bodies are never logged.

## Headers and transport

`helmet` defaults (no `X-Powered-By`, `X-Content-Type-Options`, HSTS, etc.).
CORS allowlist with credentials. `TRUST_PROXY` set to the number of proxies so
rate limits apply per real client IP.

## Known risks and decisions

| Risk | Status |
| --- | --- |
| **Uploaded photos are at public, unguessable Cloudinary URLs.** Anyone holding a URL can view the photo. | Accepted for the demo. Fix: Cloudinary `authenticated` delivery with short-lived signed URLs. |
| Demo citizen/official passwords are public by design | They hold sample data. Real people's data on the same deployment is visible to anyone using the demo official accounts. **For a real deployment, remove the demo accounts.** |
| No MFA, no account lockout (rate limit only) | Open. |
| Rate-limit counters are per process (in memory) | Fine for one instance. With several, use a shared store (e.g. Redis). |
| Logout revokes all of a user's sessions, not just one device | Simplicity over per-device sessions. |
| Prompt injection via tender PDFs | Mitigated (delimited data), not eliminated; output is advisory. |
| The detection service has no auth unless `SEGMENTATION_SERVICE_TOKEN` is set | Set it in production, or keep the service on a private network. |
| A JWT secret published in earlier commits of this repo | Never use it. `config/env.js` refuses it. Rotate the production secret if it was ever set to it. |

## Reporting

This is a student project with no security contact. Please open a GitHub issue,
without exploit details, and the maintainer will reach out.
