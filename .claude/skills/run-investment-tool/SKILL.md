---
name: run-investment-tool
description: Build, run, and drive investment-tool (a Next.js rental-apartment portfolio tracker). Use when asked to start the dev server, seed the database, run the app, take a screenshot of its UI (dashboard, apartment detail, tenancies, transactions, reports), or verify a change actually rendered.
---

This is a Next.js 16 / Prisma 7 / Postgres app with a Credentials-based
login (single shared family account). It's driven by
`.claude/skills/run-investment-tool/driver.mjs`, a Playwright script that
logs in and screenshots the app's main pages — there's no `chromium-cli`
on this machine (Windows, not the usual Linux agent container), so the
driver talks to a locally-installed `playwright` package directly instead.

All paths below are relative to the repo root.

## Prerequisites

- Docker Desktop running (for the local Postgres container).
- Node.js + the project's `npm install` already run (this includes
  `playwright` as a devDependency — added specifically for this skill).
- Chromium downloaded for Playwright (one-time, ~115MB):
  ```bash
  npx playwright install chromium
  ```
- A `.env` file at repo root (not `.env.local`) with at least
  `DATABASE_URL`, `AUTH_SECRET`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`
  — see `.env.example`. The driver reads `SEED_ADMIN_EMAIL`/`PASSWORD`
  from `.env` automatically (via the `dotenv` devDependency already in
  the project) to log in.

## Setup

```bash
docker compose up -d      # starts Postgres, exposes 5432
npm run db:seed           # creates/updates the login from .env
```

## Build

No separate build step for local dev — `next dev` (below) compiles on
demand via Turbopack.

## Run (agent path)

Start the dev server in the background and wait for it to actually
serve before driving it:

```bash
npm run dev &
timeout 30 bash -c 'until curl -sf http://localhost:3000/login >/dev/null; do sleep 1; done'
```

Then run the driver:

```bash
node .claude/skills/run-investment-tool/driver.mjs <output-dir> [extra-route]
```

- `<output-dir>` (optional, default `./screenshots`) — where PNGs land.
- `[extra-route]` (optional) — an additional path to screenshot after
  login, e.g. `/apartments/<id>/tenancies` — useful for verifying a
  change to one specific page without editing the script.

It always produces, in order:
1. `login.png` — the sign-in page.
2. `dashboard.png` — post-login portfolio dashboard.
3. `apartment-detail.png` / `reports.png` — the first apartment's detail
   page and its tax report (skipped with a console note if the DB has no
   apartments yet — seed one via the UI or Prisma Studio first).
4. `<extra-route>.png` — only if you passed a third argument.

Example:
```bash
node .claude/skills/run-investment-tool/driver.mjs /tmp/shots /apartments/cmrqfx3hh0001uwhf4ax4hby6/tenancies
```

Stop the dev server when done: on Windows, find the PID bound to the
port (`next dev`'s own error message shows it if a second instance
conflicts) and `taskkill //PID <pid> //F`; on Linux/macOS,
`lsof -ti:3000 | xargs -r kill`.

## Run (human path)

```bash
npm run dev   # http://localhost:3000, Ctrl-C to stop
```
Log in with the `.env` credentials, click around normally.

## Test

```bash
npm run lint          # ESLint
npx tsc --noEmit       # type check, no dedicated test suite in this repo
```

---

## Gotchas

- **No `chromium-cli` here.** This machine is Windows, not the usual
  headless Linux agent container the generic web-app pattern assumes.
  `playwright` (added as a devDependency for this skill) + its own
  Chromium download is the substitute — same idea, different tool.
- **A previous long-running dev server can go bad silently.** One left
  running for 13+ days in this repo started throwing
  `Error: write EPIPE` and eventually
  `Error: Jest worker encountered 2 child process exceptions, exceeding
  retry limit` on every page load, surfaced as a Next.js error overlay
  in screenshots that had nothing to do with the actual app code. If a
  screenshot shows an unrelated runtime-error overlay, kill the stale
  `next dev` process and restart it before assuming the app itself is
  broken.
- **Port 3000 already in use.** `next dev` will pick 3001 automatically,
  but if another instance already holds 3000, npm's second invocation
  can exit outright with "Another next dev server is already running."
  instead of falling back — check for and reuse (or kill) the existing
  one rather than assuming the new one started.
- **The "+ Add apartment" link also matches `/apartments/`.** When
  locating a real apartment card by `href^="/apartments/"`, exclude
  `href="/apartments/new"` explicitly (the driver already does this) or
  you'll navigate to the create form instead of an apartment.
- **No current tenant ⇒ no rent to click through.** Some pages (e.g. the
  apartment detail page's rental-yield figure) render `—` instead of a
  value when the apartment has no active tenancy — not a bug if you see
  it on a vacant test apartment.

## Troubleshooting

- **`SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set`**: `.env` is
  missing or empty — copy `.env.example` and fill it in, then
  `npm run db:seed`.
- **`Could not reach http://localhost:3000/login`**: the dev server
  isn't up (or Postgres isn't, causing it to fail on first request) —
  run `docker compose up -d && npm run dev` and wait for `✓ Ready`.
- **`Cannot find module 'playwright'`**: `npm install` hasn't been run
  since `playwright` was added as a devDependency — run it, then
  `npx playwright install chromium` if the browser binary is also
  missing.
