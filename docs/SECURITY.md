# Security notes

What this app protects, what it does about it, and where that is enforced. It
is written so that a reviewer can check each claim against a file rather than
take it on trust.

## What is worth attacking

GramSetu holds three things worth protecting, in order:

1. **Citizens' reports.** Each one carries a photograph, a description and a
   GPS location, which together say where a named person was and what they saw.
   One citizen reading another's report is the worst outcome in the app.
2. **Official accounts.** An official can assign inspectors, resolve complaints
   and affect a contractor's trust score. An attacker holding one can clear
   complaints about work that was never done.
3. **Paid-for work.** Submitting a report or a tender stores a file and calls a
   paid AI service, so an open endpoint is a bill as well as a mess.

## What is enforced, and where

| Risk | What stops it | File |
| --- | --- | --- |
| Reading someone else's report | Citizens are scoped to their own; officials may read any | `server/utils/access.js` |
| Skipping inspection to close a complaint | Only three decisions are accepted | `server/utils/access.js` |
| Anyone becoming an administrator | Official accounts are created by an Admin | `server/routes/authRoutes.js` |
| Forged session tokens | The server refuses to start without `JWT_SECRET` | `server/config/env.js` |
| Query operators in a login body | Identifiers are forced to strings | `server/utils/credentials.js` |
| A program uploaded as a photo | The file's own first bytes are read | `server/utils/fileType.js` |
| Guessing an official's user id | `crypto.randomInt` over a billion values | `server/controllers/authController.js` |
| Weak passwords | Minimum eight characters | `server/utils/credentials.js` |
| Running up an AI bill | 30 writes an hour per address; reads are free | `server/server.js` |
| A bad link reading as a server fault | Ids are checked before any query | `server/middleware/validateIdParam.js` |
| Internal details in an error reply | Only deliberate errors keep their message | `server/middleware/errorMiddleware.js` |
| A browser on another site calling the API | Origin allowlist | `server/server.js` |

Every row above has tests. `cd server && npm test`.

## Decisions taken knowingly

**The demo accounts are public.** Their credentials are printed on the login
page. They hold seeded data and no real person's information. This is a
demonstration, and a reviewer who cannot get in sees nothing.

**The token is returned in the response body as well as in an HttpOnly
cookie.** The cookie is the right mechanism; the body is left over from the
earlier client and means a cross-site scripting bug could read a token that the
cookie alone would have protected. Removing it means reworking how the client
holds its session, which has not been done.

**There is no account lockout or second factor.** Login is rate limited, which
slows guessing but does not stop a determined attempt against a known address.

**Authorisation is checked in controllers, not in the database.** A query
written without the ownership check would return another citizen's report.
`canViewReport` exists so there is one place to get it right, but nothing
forces a future route to call it.

## Reporting a problem

This is a student project with no security contact. If you are reviewing it and
find something, open an issue on the repository.
