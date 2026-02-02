# Implementation Checklist

## Phase 1: Setup

- [ ] Initialize Next.js (Full Stack) + TypeScript repo
- [ ] Setup TailwindCSS and base UI layout (Dashboard / Detail routes)
- [ ] Configure environment variables (DATABASE_URL, AI keys, model names)
- [ ] Setup PostgreSQL schema (accounts, campaigns, ad_groups, ads, daily_metrics)
- [ ] Seed “สมจริง” mock dataset (อย่างน้อย 1 account, 2 campaigns, 3 ad_groups, 6 ads, daily 14 วัน)
- [ ] Create Canonical Types (Account/Campaign/AdGroup/Ad + DailyMetrics) และ shared utilities
- [ ] Add config for thresholds/weights (scoring & labels) เพื่อปรับได้เร็วตอนเดโม

## Phase 2: Core Features

- [ ] Period selector (อย่างน้อย 3 วัน, 7 วัน) + auto previous period (ความยาวเท่ากัน)
- [ ] Build Data Adapter: map DB → Canonical Model (ไม่ผูกกับรูปแบบ DB)
- [ ] Implement deterministic KPI computations (CTR, Cost per Result, Conversion Rate, Frequency, ROAS)
- [ ] Implement delta computation (absolute และ % change) + handle division-by-zero (คืน “ไม่พร้อมใช้งาน” พร้อมเหตุผล)
- [ ] Implement Evidence Generator fixed slots (E1–E3) สำหรับทุก AdGroup
- [ ] Implement scoring + label (Top / Normal / Needs attention) จาก config
- [ ] Implement Heuristic Diagnosis (Rule-based): เขียน function ตัดเกรด (Fatigue, Cost Creeping) สำหรับโชว์ในตาราง
- [ ] API: GET /api/review?accountId=&periodDays= (summary cards + priority list เน้น AdGroup)
- [ ] API: GET /api/campaign/[id]/breakdown?periodDays= (คืน list พร้อม diagnosis_label)
- [ ] API: GET /api/detail/adgroup?id=&periodDays= (daily breakdown + evidence + score/label + ads list)
- [ ] UI: Dashboard (account selector, period selector, summary cards, priority list + label + เหตุผลสั้น)
- [ ] UI: Campaign Comparison Page (Table ที่ Sort ได้ และมี Column Diagnosis / Metrics ชนกัน)
- [ ] UI: Detail (evidence E1–E3, daily breakdown, Ads Performance List ที่มี Creative Analysis)

## Phase 3: Enhancement

- [ ] Define strict JSON contracts (InsightJSON / RecommendationJSON) + Zod schema validation
- [ ] API: POST /api/ai/summary (2-stage: Analyze → InsightJSON, Recommend → RecommendationJSON)
- [ ] Enforce data exposure rules:
    - [ ] Stage A เห็น derived metrics + evidence + context
    - [ ] Stage B เห็นเฉพาะ InsightJSON + policy/constraints (ห้าม raw metrics)
- [ ] Fallback handling: AI timeout / invalid JSON → UI ไม่ crash และยังเห็น deterministic outputs ได้ครบ
- [ ] Basic observability: log เฉพาะสถานะสำคัญ (invalid_json, ai_timeout) และไม่ log secrets
- [ ] Optional (ถ้าทัน): simple caching ของ AI output (in-memory หรือ table ai_outputs) เพื่อเดโมนิ่ง
- [ ] Minimal tests:
    - [ ] Unit test KPI/delta + division-by-zero
    - [ ] Contract test (schema validate InsightJSON/RecommendationJSON)
    - [ ] Resilience test (ปิด AI key แล้วระบบยังใช้งานได้)

## Phase 4: Finalization

- [ ] UI polish สำหรับเดโม (loading, empty state, error state, badge/label ชัดเจน)
- [ ] Smoke test บน Vercel: /api/review และ /api/detail/adgroup เรียกได้จริงด้วย DB จริง
- [ ] Verify environment on Vercel (DATABASE_URL, AI keys, model config) + secret not leaked
- [ ] Demo script: เลือก account/period → เห็น priority → drill-down → เห็น evidence → (ถ้ามี) AI summary/reco
- [ ] Documentation update (README สั้น ๆ: run locally, seed, env vars, deploy steps)
- [ ] Not doing in this Hackathon (out-of-scope):
    - [ ] ไม่เชื่อมต่อ Meta API จริง (ใช้ mock data เท่านั้น)
    - [ ] ไม่ทำ auto-apply actions (pause/scale) ระบบเป็น read-only
    - [ ] ไม่ทำ permission/role ซับซ้อน
    - [ ] ไม่ทำ workflow การอนุมัติ / audit log เต็มรูปแบบ
    - [ ] ไม่ทำ multi-account/multi-tenant แบบ production-grade
