## AI Ads Review Copilot (Hackathon Prototype)

Action-first dashboard for Media Buyers with deterministic KPIs and optional AI insights.

## Setup (Fresh Prisma + Supabase)

1. Install dependencies

```bash
npm install
```

2. Create a Supabase project and copy connection strings

- Use **Transaction Pooler** for `DATABASE_URL` (serverless-friendly) and append `pgbouncer=true`.
- Use **Direct connection** for `DIRECT_URL` (used by Prisma Migrate/Seed).

3. Configure environment (Supabase + Prisma)

Copy `.env.example` → `.env` and fill values:

- `DATABASE_URL` → Supabase **Transaction Pooler** URL + `pgbouncer=true`
- `DIRECT_URL` → Supabase **Direct** URL
- `DATABASE_SSL_REJECT_UNAUTHORIZED` → `true` (Supabase uses valid TLS)
- `AISHOP24H_API_KEY` or `AISHOP24H_API_KEY_INSIGHT` / `AISHOP24H_API_KEY_RECO`
- `AISHOP24H_MODEL_INSIGHT` / `AISHOP24H_MODEL_RECO`

4. Database + seed

```bash
npm run prisma:migrate
npm run prisma:seed
```

Example Supabase URLs:

```
DATABASE_URL="postgresql://prisma.<project_ref>:<PASSWORD>@aws-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=verify-full"
DIRECT_URL="postgresql://prisma:<PASSWORD>@db.<project_ref>.supabase.co:5432/postgres?sslmode=verify-full"
```

## Deploy to Vercel

1. Add env vars in Vercel (Production + Preview):

- `DATABASE_URL`, `DIRECT_URL`, `DATABASE_SSL_REJECT_UNAUTHORIZED`
- AI keys / model settings if you use AI

2. Build & migrate on deploy

Set Vercel **Build Command** to:

```
npm run vercel-build
```

This runs `prisma generate`, `prisma migrate deploy`, and `next build`.
Alternatively, keep the default `next build` and run `prisma migrate deploy` in CI.

## Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Tests

```bash
npm test
```

## Demo Script (Phase 4)

1. Select account + period (3/7/14 days)
2. Review Priority List → click AdGroup
3. Inspect Evidence (E1–E3) + AI Copilot panel (fallback if AI disabled)
4. Drill back to Campaign comparison and compare Ad Groups

## Notes

- AI is optional. If keys are missing, UI falls back to deterministic outputs.
- `/api/ai/summary` logs AI status (start/success/error/cache) in server logs.
