# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A rental-apartment investment portfolio tracker: per-apartment info (purchase price, tenant, rental fee, housing company maintenance fee), tenancy history, income/expense transactions with optional receipt uploads, computed profit, and per-apartment annual tax reports (PDF/CSV export). One login = one portfolio: each `User` owns an isolated set of apartments (and everything under them), enforced in every Server Action, API route, and page — no sharing between logins. New logins are provisioned by whoever has server/DB access (no in-app account-creation UI yet, see Commands) and start with an empty portfolio.

## Commands

- `npm run dev` — dev server (Turbopack) at localhost:3000
- `npm run build` / `npm run start` — production build / run
- `npm run lint` — ESLint
- `docker compose up -d` — start local Postgres (needed before any Prisma command)
- `npm run prisma:migrate` — `prisma migrate dev`, applies schema changes locally
- `npm run prisma:deploy` — `prisma migrate deploy`, applies migrations to production (Neon)
- `npm run db:seed` — `prisma db seed`, creates/updates a login from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` (upserts on email, so it's also how additional logins get created — each starts with its own empty portfolio; no in-app account-creation UI exists yet, though an existing user can change their own password at `/account`)
- `npm run prisma:studio` — Prisma Studio GUI

Config lives in one `.env` file (not `.env.local`) — `prisma.config.ts` only auto-loads `.env`. See `.env.example` for required vars.

## Version-specific gotchas (Next.js 16 / Prisma 7 — do not assume 14/15 or 5/6 behavior)

- **`middleware.ts` → `proxy.ts`** (`src/proxy.ts`, exported fn `proxy`). Holds the auth gate via `auth()`. A Proxy matcher doesn't reliably cover Server Function calls, so every Server Action in `src/lib/actions/*.ts` also re-checks `auth()` itself.
- **Prisma client generator is `prisma-client`**, output to `../src/generated/prisma` (gitignored). Import from `@/generated/prisma/client`, not `@prisma/client`. Run `npx prisma generate` if it's missing.
- **Prisma 7 requires a driver adapter** — `schema.prisma`'s datasource has no `url`; the connection is wired via `@prisma/adapter-pg`'s `PrismaPg` in `src/lib/db.ts` and `prisma/seed.ts`.
- **`prisma.config.ts`** (not `package.json`'s `"prisma"` key) sets the schema path, migrations path, and seed command.
- Route Handlers use the typed `RouteContext<"/path/[param]">` global helper, `params` is a `Promise` (e.g. `src/app/api/receipts/[transactionId]/route.ts`).

## Architecture

**Data model** (`prisma/schema.prisma`): `User`, `Apartment` (`ownerId → User`, `onDelete: Cascade` — every `Tenancy`/`Transaction`/`TenancyDocument` inherits this scoping transitively through `apartmentId`), `Tenancy` (current tenant = row with `leaseEnd IS NULL`, derived in `src/lib/reports.ts#getCurrentTenancy`, not stored), `Transaction` (`type` INCOME/EXPENSE derived from `category` via `categoryToType()` in `src/lib/validation.ts` — never set independently).

**Mutations are Server Actions** (`src/lib/actions/{apartments,tenancies,transactions,tenancy-documents,users}.ts`): validate with `zod` (`src/lib/validation.ts`), check `auth()`, scope every read/write to `session.user.id` (via `findFirst`/`updateMany`/`deleteMany` with a nested `ownerId` filter — Prisma's `findUnique`/`update`/`delete` can't mix in relation filters, see `src/lib/ownership.ts#getOwnedApartment` for the shared apartment-lookup case), write via the Prisma singleton (`src/lib/db.ts`), then `revalidatePath` + `redirect`. Route Handlers under `src/app/api/` exist only where a raw HTTP response is required: NextAuth callback, receipt streaming (`api/receipts/[transactionId]`), PDF/CSV export (`api/apartments/[id]/reports/[year]/{pdf,csv}`) — these apply the same ownership scoping and return 404 (not 403) on a found-but-unowned record, so an unauthorized caller can't distinguish "doesn't exist" from "isn't yours."

**Reports are computed, not stored.** `src/lib/reports.ts` (`getApartmentSummary`, `getPortfolioSummary`, `getApartmentYearReport`) is the single source of truth for all financial aggregation — dashboard, apartment detail, on-screen report, and the PDF/CSV exporters (`src/lib/pdf.tsx`, `src/lib/csv.ts`) all read through it so numbers can't drift between views.

**Receipts** go through `src/lib/storage.ts`'s `StorageAdapter` interface, picked via `STORAGE_DRIVER`: `local` (`LocalDiskStorageAdapter`, dev) or `vercel-blob` (`VercelBlobStorageAdapter`, `access: "private"`, production). `storagePath` is never exposed to the client — receipts are always served through the auth-checked `api/receipts/[transactionId]` route.

**Auth**: Auth.js (`next-auth@beta` v5), Credentials provider (`src/lib/auth.ts`), `bcryptjs` (not native `bcrypt`), JWT sessions. Each login only ever sees its own portfolio (see Data model above) — a logged-in user can change their own password (current password required) at `/account`, via `src/lib/actions/users.ts#changePassword`.

**Routes**: `/login`, `/account` (self-service password change), `/dashboard`, `/apartments/new`, `/apartments/[id]` (+ `edit`, `tenancies[/new|/[tenancyId]/edit]`, `transactions[/new|/[transactionId]/edit]`, `reports`).

**Shared UI**: `src/components/{apartment,tenancy,transaction,change-password}-form.tsx` (server-renderable, bound to Server Actions), `confirm-delete-button.tsx` (two-step delete confirm, no native `confirm()`), `nav.tsx` (shown only when a session exists — absent on `/login`).

Styling: Tailwind CSS v4, no component library. Currency/dates use `Intl.NumberFormat`/`Intl.DateTimeFormat` with `fi-FI` locale (grep `eur`/`dateFmt` for the pattern).

## Deployment (Vercel + Neon) — live at investment-tool-mocha.vercel.app

- **Storage**: prod env sets `STORAGE_DRIVER=vercel-blob`. A Blob store connected to the Vercel project auto-injects `BLOB_READ_WRITE_TOKEN`.
- **Database**: Neon's *pooled* connection string (hostname has `-pooler`) as `DATABASE_URL` — standard `pg`/`@prisma/adapter-pg` over TCP works fine through it on Vercel's Node.js runtime.
- **Migrations**: `npm run prisma:deploy` against prod `DATABASE_URL`, run manually after schema changes (not wired into the Vercel build).
- **Client generation**: `postinstall: prisma generate` regenerates the gitignored `src/generated/prisma` on every Vercel build.
- **Auth**: `next-auth` auto-trusts Vercel as a host, so `NEXTAUTH_URL` isn't needed there. `AUTH_SECRET` is still required (no dev fallback).
