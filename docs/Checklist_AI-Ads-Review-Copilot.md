# Implementation Checklist

## Phase 1: Setup

- [x] Initialize Next.js (Full Stack) + TypeScript repo
- [x] Setup TailwindCSS and base UI layout (Dashboard / Detail routes)
- [x] Configure environment variables (DATABASE_URL, AI keys, model names)
- [x] Setup PostgreSQL schema (accounts, campaigns, ad_groups, ads, daily_metrics)
- [x] Seed “สมจริง” mock dataset (อย่างน้อย 1 account, 2 campaigns, 3 ad_groups, 6 ads, daily 14 วัน)
- [x] Create Canonical Types (Account/Campaign/AdGroup/Ad + DailyMetrics) และ shared utilities
- [x] Add config for thresholds/weights (scoring & labels) เพื่อปรับได้เร็วตอนเดโม

## Phase 2: Core Features

- [x] Period selector (อย่างน้อย 3 วัน, 7 วัน) + auto previous period (ความยาวเท่ากัน)
- [x] Build Data Adapter: map DB → Canonical Model (ไม่ผูกกับรูปแบบ DB)
- [x] Implement deterministic KPI computations (CTR, Cost per Result, Conversion Rate, Frequency, ROAS)
- [x] Implement delta computation (absolute และ % change) + handle division-by-zero (คืน “ไม่พร้อมใช้งาน” พร้อมเหตุผล)
- [x] Implement Evidence Generator fixed slots (E1–E3) สำหรับทุก AdGroup
- [x] Implement scoring + label (Top / Normal / Needs attention) จาก config
- [x] Implement Heuristic Diagnosis (Rule-based): เขียน function ตัดเกรด (Fatigue, Cost Creeping) สำหรับโชว์ในตาราง
- [x] API: GET /api/review?accountId=&periodDays= (summary cards + priority list เน้น AdGroup)
- [x] API: GET /api/campaign/[id]/breakdown?periodDays= (คืน list พร้อม diagnosis_label)
- [x] API: GET /api/detail/adgroup?id=&periodDays= (daily breakdown + evidence + score/label + ads list)
- [x] UI: Dashboard (account selector, period selector, summary cards, priority list + label + เหตุผลสั้น)
- [x] UI: Campaign Comparison Page (Table ที่ Sort ได้ และมี Column Diagnosis / Metrics ชนกัน)
- [x] UI: Detail (evidence E1–E3, daily breakdown, Ads Performance List ที่มี Creative Analysis)

## Phase 3: Enhancement

- [x] Define strict JSON contracts (InsightJSON / RecommendationJSON) + Zod schema validation
- [x] API: POST /api/ai/summary (2-stage: Analyze → InsightJSON, Recommend → RecommendationJSON)
- [x] Enforce data exposure rules:
    - [x] Stage A เห็น derived metrics + evidence + context
    - [x] Stage B เห็นเฉพาะ InsightJSON + policy/constraints (ห้าม raw metrics)
- [x] Fallback handling: AI timeout / invalid JSON → UI ไม่ crash และยังเห็น deterministic outputs ได้ครบ
- [x] Basic observability: log เฉพาะสถานะสำคัญ (invalid_json, ai_timeout) และไม่ log secrets
- [x] Optional (ถ้าทัน): simple caching ของ AI output (in-memory หรือ table ai_outputs) เพื่อเดโมนิ่ง
- [x] Minimal tests:
    - [x] Unit test KPI/delta + division-by-zero
    - [x] Contract test (schema validate InsightJSON/RecommendationJSON)
    - [x] Resilience test (ปิด AI key แล้วระบบยังใช้งานได้)

## Phase 4: Finalization

- [x] UI polish สำหรับเดโม (loading, empty state, error state, badge/label ชัดเจน)
- [ ] Smoke test บน Vercel: /api/review และ /api/detail/adgroup เรียกได้จริงด้วย DB จริง
- [ ] Verify environment on Vercel (DATABASE_URL, AI keys, model config) + secret not leaked
- [x] Demo script: เลือก account/period → เห็น priority → drill-down → เห็น evidence → (ถ้ามี) AI summary/reco
- [x] Documentation update (README สั้น ๆ: run locally, seed, env vars, deploy steps)
- [ ] Not doing in this Hackathon (out-of-scope):
    - [ ] ไม่เชื่อมต่อ Meta API จริง (ใช้ mock data เท่านั้น)
    - [ ] ไม่ทำ auto-apply actions (pause/scale) ระบบเป็น read-only
    - [ ] ไม่ทำ permission/role ซับซ้อน
    - [ ] ไม่ทำ workflow การอนุมัติ / audit log เต็มรูปแบบ
    - [ ] ไม่ทำ multi-account/multi-tenant แบบ production-grade
