# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A rental-apartment investment portfolio tracker: per-apartment info (purchase price, tenant, rental fee, housing company maintenance fee), tenancy history, income/expense transactions with optional receipt uploads, computed profit, and per-apartment annual tax reports (PDF/CSV export). Single shared login for a family — no per-owner data isolation.

## Commands

- `npm run dev` — start the dev server (Turbopack) at localhost:3000
- `npm run build` / `npm run start` — production build / run
- `npm run lint` — ESLint
- `docker compose up -d` — start local Postgres (required before any Prisma command)
- `npm run prisma:migrate` — `prisma migrate dev`, applies `prisma/schema.prisma` changes
- `npm run db:seed` — `prisma db seed`, creates the initial family user from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` in `.env`
- `npm run prisma:studio` — Prisma Studio GUI for inspecting data

All app config lives in a single `.env` file (not `.env.local`) — Prisma's CLI (`prisma.config.ts`) only auto-loads `.env`, so this repo standardizes on that one file for both Next.js and Prisma tooling. See `.env.example` for required vars.

## Version-specific gotchas (do not assume standard Next.js 14/15 or Prisma 5/6 behavior)

This project pins **Next.js 16** and **Prisma 7**, both of which changed core conventions recently:

- **`middleware.ts` is renamed to `proxy.ts`** (file at `src/proxy.ts`, exported function name `proxy`, not `middleware`). The auth gate lives there, wrapping `auth()` from `next-auth`. Per Next.js's own guidance, a Proxy matcher covers pages but not necessarily every Server Function call route — each Server Action in `src/lib/actions/*.ts` also re-checks `auth()` itself rather than relying on the proxy alone.
- **Prisma's client generator is `prisma-client`** (not `prisma-client-js`), configured with `output = "../src/generated/prisma"` in `schema.prisma`. Import the client from `@/generated/prisma/client`, not `@prisma/client`. This output directory is generated (gitignored) — run `npx prisma generate` after pulling if it's missing.
- **Prisma 7 requires a driver adapter** — the datasource block in `schema.prisma` has no `url`; the connection string is wired up at runtime via `@prisma/adapter-pg`'s `PrismaPg` in `src/lib/db.ts` (and separately in `prisma/seed.ts`, which runs standalone via `tsx`).
- **`prisma.config.ts`** (project root) — not `package.json`'s `"prisma"` key — configures the schema path, migrations path, and seed command (`tsx prisma/seed.ts`).
- Route Handler dynamic segments use the typed `RouteContext<"/path/[param]">` global helper with `params` as a `Promise` (e.g. `src/app/api/receipts/[transactionId]/route.ts`).

## Architecture

**Data model** (`prisma/schema.prisma`): `User` (shared login), `Apartment`, `Tenancy` (history; "current" tenant = the row with `leaseEnd IS NULL`, derived in `src/lib/reports.ts#getCurrentTenancy`, not stored), `Transaction` (`type` INCOME/EXPENSE is derived from `category` via `categoryToType()` in `src/lib/validation.ts` — never set independently).

**Mutations are Server Actions**, not REST handlers — see `src/lib/actions/{apartments,tenancies,transactions}.ts`. Each validates with a `zod` schema from `src/lib/validation.ts`, checks `auth()`, writes via the Prisma singleton in `src/lib/db.ts`, then `revalidatePath` + `redirect`. Route Handlers under `src/app/api/` exist only where a raw HTTP response is required: the NextAuth callback, receipt file streaming (`api/receipts/[transactionId]`), and PDF/CSV report export (`api/apartments/[id]/reports/[year]/{pdf,csv}`).

**Reports are computed, not stored.** `src/lib/reports.ts` is the single source of truth for all financial aggregation (`getApartmentSummary`, `getPortfolioSummary`, `getApartmentYearReport`) — the apartment detail page, dashboard, on-screen tax report, and the PDF/CSV exporters (`src/lib/pdf.tsx`, `src/lib/csv.ts`) all read through it, so the numbers can't drift between views.

**Receipts** go through the storage abstraction in `src/lib/storage.ts` (`StorageAdapter` interface, selected via `STORAGE_DRIVER` env var). Two adapters exist: `LocalDiskStorageAdapter` (`local`, writes under `STORAGE_LOCAL_PATH` — used for local dev) and `VercelBlobStorageAdapter` (`vercel-blob`, uses `@vercel/blob` with `access: "private"` — used in production, since Vercel's serverless functions have no persistent disk). Not every transaction has a receipt (e.g. rental income). Neither adapter's `storagePath` is ever exposed to the client — receipts are always served through the auth-checked `api/receipts/[transactionId]` route, never a direct blob/file URL, so "private" access on Blob and auth-gating stay consistent regardless of which adapter is active.

**Auth**: Auth.js (`next-auth@beta`, v5) with a Credentials provider (`src/lib/auth.ts`), `bcryptjs` for password hashing (not native `bcrypt` — avoids native build tooling on Windows), JWT sessions. All family members share equal access once logged in.

**Routes**: `/login`, `/dashboard` (portfolio overview + totals), `/apartments/new`, `/apartments/[id]` (detail + financial summary), `/apartments/[id]/edit`, `/apartments/[id]/tenancies` (+ `new`, `[tenancyId]/edit`), `/apartments/[id]/transactions` (+ `new`, `[transactionId]/edit`), `/apartments/[id]/reports` (year selector + category breakdown + export links).

**Shared UI**: `src/components/{apartment,tenancy,transaction}-form.tsx` (plain server-renderable forms bound to Server Actions), `src/components/confirm-delete-button.tsx` (generic two-step delete confirm, reused across apartments/tenancies/transactions — avoids native `confirm()` dialogs), `src/components/nav.tsx` (top nav + sign-out, rendered in the root layout only when a session exists, so it's absent on `/login` without needing a separate route group).

Styling: Tailwind CSS v4, no component library. Currency/date formatting uses `Intl.NumberFormat`/`Intl.DateTimeFormat` with the `fi-FI` locale throughout (not a library) — grep for `eur`/`dateFmt` if adding a new page that displays money or dates, and match the existing pattern rather than introducing a new formatting approach.

## Deployment (Vercel + Neon)

- **Storage**: production env vars must set `STORAGE_DRIVER=vercel-blob`. Connecting a Vercel Blob store to the project auto-injects `BLOB_READ_WRITE_TOKEN` — no manual token wiring needed.
- **Database**: use Neon's *pooled* connection string (hostname contains `-pooler`) as `DATABASE_URL`, so serverless function cold starts don't exhaust Postgres connections directly — `pg`/`@prisma/adapter-pg` connects over normal TCP through Neon's pooler; no different driver adapter is needed on Vercel's Node.js runtime (this would matter on Edge runtime, but these routes aren't Edge).
- **Migrations**: `npm run prisma:deploy` (`prisma migrate deploy`) runs migrations non-interactively against whatever `DATABASE_URL` is set — run it against the production database once per schema change (from a local shell with prod env vars, or wired into the Vercel build command). `prisma migrate dev` is dev-only.
- **Client generation**: `postinstall: prisma generate` in `package.json` ensures Vercel's build (which runs `npm install` before `next build`) regenerates `src/generated/prisma` — it's gitignored, so it must be generated fresh on every deploy.
- **Auth**: `next-auth` auto-detects Vercel as a trusted host, so `NEXTAUTH_URL`/`trustHost` don't need to be set there. `AUTH_SECRET` is still required in production (no dev fallback).
- **Seeding**: run `npm run db:seed` once against the production `DATABASE_URL` to create the first login (or subsequent ones — the seed script `upsert`s on email, so it's safe to re-run with different `SEED_ADMIN_*` values for each additional family member until a proper user-management UI exists).
