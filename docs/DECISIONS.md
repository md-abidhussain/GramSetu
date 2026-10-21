# Engineering decisions

Why parts of GramSetu are built the way they are. Most of these replaced
something that was wrong, and the reasoning is written down so the fix is not
quietly undone later.

Started with two teammates during a hackathon (bibhuti-parida, Ramu1029); their
commits are in the history. The October 2026 hardening pass is described in
docs/ENGINEERING_AUDIT.md.

## Run it

```
npm run install:all     # root, installs server and client
npm run dev             # both together
cd server && npm test   # unit + HTTP tests against an in-memory MongoDB
cd client && npm test   # component tests (vitest + jsdom)
cd client && npm run test:e2e   # browser tests, see docs/TESTING.md
```

Server needs `server/.env`; copy `server/.env.example` and fill it in. The server
exits on start if `JWT_SECRET` or `MONGODB_URI` is missing, or the secret is short or
a published example. That is deliberate, see below.

## Live

- Frontend: https://gramsetu-india.vercel.app (Vercel project `gramsetu`)
- Backend: https://gramsetu-31ax.onrender.com (Render service `GramSetu`)
- Both deploy from `main` in this repo automatically.

Render's free tier sleeps when idle, so the first request can take close to a
minute. The client shows a loading screen that explains this after four seconds.

## Demo accounts

Citizen `citizen@gmail.com` / `citizen123`. Officials `authority@gramsetu.gov`,
`inspector@gramsetu.gov`, `engineer@gramsetu.gov`, `officer@gramsetu.gov`:
inspector uses `inspector123`, the rest `authority123`. These are public sample
accounts on purpose. **There is no public Admin**: an Admin can create officials,
so it is seeded only from `ADMIN_PASSWORD`. Do not reintroduce a published Admin login.

## Do not reverse these

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

**A missing measurement is recorded as missing.** When the segmentation service
is not running, `quantifyDefects` returns `status: 'unavailable'` and no defects.
It used to return an empty result marked `completed` with the message "AI defect
segmentation was simulated", which told an official a measurement had been taken
when none had, and fed a severity score computed from nothing. Severity now falls
back to the issues Gemini found in the photo, and the report says sizes are
missing. Never fill this in with placeholder numbers.

**Who may read a complaint, and what an official may decide, live in
`utils/access.js`.** Both were inline in the controller, where they could not be
tested without a database. They are the two checks in this app that are expensive
to get wrong, so they are plain functions with tests.

**Official accounts are issued, not self-served.** `POST /auth/authority/register`
is behind `protectAuthority` and `restrictTo('Admin')`. It used to be open and
took `role` from the body, Admin included, so anyone could make themselves an
administrator. The public login page has no official sign-up because of this.

**An upload is what its bytes say it is.** multer can only read the content type
the caller claims. `verifyImageContents` and `verifyPdfContents` run after it and
read the file's own signature, then correct `req.file.mimetype` to match. Do not
add an upload route without one of them.

**An unexpected error tells the caller nothing.** `errorMiddleware` explains the
failures a caller caused and answers everything else with one sentence, because
the message on an unexpected error names connection strings and queries. Give an
error a `status` below 500 to have its message shown.

**Plain language is a rule, not a preference.** The interface said "Flagged
Anomalies" and "Sync Ledger" while this file said to write plainly. If a label
would not be said out loud by a district officer or a member of the public, it is
wrong. The same goes for type: nothing below 12px, and no `slate-400` on white,
which fails contrast at any size.

**The banner says this is not a government service.** Every page carries it, top
and bottom. The design borrows the conventions of a public service portal, which
is exactly why it has to be unmistakable that it is not one.

**Rate limits protect money.** Submitting a complaint or tender stores a file and
calls Gemini. Writes to those routes allow 30 per hour; reads are skipped because
listing projects is public and cheap.

**AI output says where it came from.** Every AI-derived value is stored with
`aiAssessment.status`. When the AI did not run or answered badly, no score is
stored. The old fallback that saved "60%, Healthy" on failure must never come
back. See docs/AI_LIMITATIONS.md.

**"AI Verified" is a system step.** Only a real comparison can move a project
there. The title-length "mock AI" that used to do it was deleted.

**A complaint counts against a contractor only after an official accepts it.**
An unreviewed complaint is an allegation.

## Known gaps

See the "Known risks" table in docs/SECURITY.md and the gaps in docs/TESTING.md.
The largest: no accuracy evaluation of the detector on labelled target data;
uploaded photos are at unguessable but public URLs; the detector is not deployed
on the hosted demo.

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

## Security

[SECURITY.md](./SECURITY.md) lists what is protected, what enforces it, and the decisions
taken knowingly. Keep it true when you change an auth path.

## Conventions

Plain language in the interface — "New complaint", not "Submit Damage Evidence".
Comments explain why, not what. Commit messages describe the problem and the
consequence, not just the change.
