# GramSetu — working notes

Citizen-facing infrastructure transparency platform. Citizens report problems with
public works; officials review, assign inspectors, and resolve. React + Vite client,
Express + MongoDB server, Gemini for image and tender analysis.

Built with two teammates during a hackathon (bibhuti-parida, Ramu1029). Their
commits stay in the history. Say so plainly if asked who built it.

## Run it

```
npm run install:all     # root, installs server and client
npm run dev             # both together
cd server && npm test   # Node's built-in runner, no extra dependency
cd client && npm test   # vitest
```

Server needs `server/.env`; copy `.env.example` and fill it in. The server exits
on start if `JWT_SECRET` or `MONGODB_URI` is missing — that is deliberate, see below.

## Live

- Frontend: https://gramsetu-india.vercel.app (Vercel project `gramsetu`)
- Backend: https://gramsetu-31ax.onrender.com (Render service `GramSetu`)
- Both deploy from `main` in this repo automatically.

Render's free tier sleeps when idle, so the first request can take close to a
minute. The client shows a loading screen that explains this after four seconds.

## Demo accounts

Citizen `citizen@gmail.com` / `citizen123`. Officials `authority@gramsetu.gov`,
`inspector@gramsetu.gov`, `engineer@gramsetu.gov`, `officer@gramsetu.gov`,
`admin@gramsetu.gov` — inspector uses `inspector123`, the rest `authority123`.
These are public sample accounts on purpose; the login page links to two of them.

## Decisions worth not reversing

**Seeding is opt-in.** `seedDatabase()` once ran on every boot and deleted all
eight collections first, so every Render restart destroyed real data. Now
`SEED_DB=true` seeds only an empty database and `SEED_DB=force` wipes and reseeds.
Unset means never. Do not call it unconditionally again.

**The server refuses to start without its secrets.** `config/env.js` loads `.env`
and exits if `JWT_SECRET` or `MONGODB_URI` is missing. It replaced a fallback that
signed tokens with a hardcoded string committed to this public repo, so anyone
could forge a token for any account. Never reintroduce a default secret.

**Officials cannot open the citizen portal.** They review complaints on their own
dashboard (`ComplaintsList`), which assigns inspectors, schedules inspections and
resolves. Letting officials into `/verify` lets them file complaints as members of
the public. An earlier commit allowed it for auditing; the dashboard already serves
that.

**Green means verified, not brand.** The brand is navy with a saffron accent.
Green, amber and red are reserved for status and are always paired with a word, so
colour is never the only signal. Chart series use navy and saffron for the same
reason — a status colour doing double duty as a series colour makes green ambiguous.

**Coordinates are validated, not tested for truthiness.** `Number('')` and
`Number(null)` are both `0`, which is a valid latitude, so an empty coordinate used
to pass as a point in the Atlantic. Equally, `if (!lat)` rejects the equator. Use
`toLatitude` / `toLongitude` in `server/utils/validators.js`.

**A render crash shows a message, not a blank page.** React unmounts the whole
tree when a render throws. `components/ui/ErrorBoundary.jsx` wraps the router in
`App.jsx` and catches it, offering a reload and a link out, and logs the error
because nothing else records it yet. The stack trace is shown only in
development. Its tests are the one place a crash path can actually be exercised,
so keep them.

**Rate limits protect money.** Submitting a complaint or tender stores a file and
calls Gemini. Writes to those routes allow 30 per hour; reads are skipped because
listing projects is public and cheap.

## Known gaps — real, not hidden

- The YOLOv8 segmentation service is **not deployed**. `SEGMENTATION_SERVICE_URL`
  defaults to localhost, so that feature throws in production. The model is trained
  and runs locally. Do not describe it as live.
- Seed project photos point at Unsplash, which deletes images over time. A missing
  photo degrades gracefully now, but the fix is to host them somewhere owned.
- No integration tests against a real database. Component tests cover the error
  boundary only; the rest of the suite is validation and scoring logic.
- The error boundary is a single one at the top of the tree, so a crash replaces
  the whole screen rather than just the panel that failed.
- `server.js` is 513 lines, most of it inline seed data.

## Dependency advisories

`npm audit` in `client/` reports 15 advisories. All 15 are in build tooling —
Vite, Vitest, Tailwind and the packages underneath them. Those run on a developer
machine and in CI; none of their code is in the bundle a browser downloads. The
check that matters is `npm audit --omit=dev`, which is what actually ships:

    cd client && npm audit --omit=dev    # expect: found 0 vulnerabilities

Two advisories did affect shipped code. React Router 6 had an open redirect in
`<Link>` and `useNavigate`, and a constructor-injection flaw in SSR hydration.
Neither was reachable here — every route target in this app is a hardcoded string
and there is no server-side rendering — but the fix was a clean version bump, so
`react-router-dom` is on 7.x. No router API in use changed between 6 and 7.

Tailwind and Vite were deliberately left where they are. Clearing their advisories
means Tailwind 4, which replaces the config format the whole palette is written in,
for a vulnerability that cannot reach a user. That trade is not worth it. Revisit
when there is a reason to upgrade other than the audit number.

## Conventions

Plain language in the interface — "New complaint", not "Submit Damage Evidence".
Comments explain why, not what. Commit messages describe the problem and the
consequence, not just the change.
