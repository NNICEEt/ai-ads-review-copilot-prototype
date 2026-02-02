## AI Ads Review Copilot (Hackathon Prototype)

Action-first dashboard for Media Buyers with deterministic KPIs and optional AI insights.

## Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment

Copy `.env.example` → `.env` and fill values:

- `DATABASE_URL`
- `AISHOP24H_API_KEY` or `AISHOP24H_API_KEY_INSIGHT` / `AISHOP24H_API_KEY_RECO`
- `AISHOP24H_MODEL_INSIGHT` / `AISHOP24H_MODEL_RECO`

3. Database + seed

```bash
npm run prisma:migrate
npm run prisma:seed
```

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
