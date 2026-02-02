# System Design Document (SDD)

## AI Ads Review Copilot — Hackathon Prototype (Implementation Ready)

Version: 1.0  
Date: 2026-02-03  
Owner: Team Hackathon

---

## 1) บทสรุประบบ

ระบบนี้ช่วยทีม Media “รีวิว performance โฆษณาให้เร็วขึ้น” โดยจัดลำดับสิ่งที่ควรดู/ควรแก้ก่อน (action-first) และให้ drill-down ที่โปร่งใสจนถึงระดับ AdGroup/Ad และมี AI ช่วยสรุป/แนะนำแบบตรวจสอบได้ด้วย evidence

โจทย์หลักคือ ลดเวลาจากการไล่ดูข้อมูลจำนวนมากในโครงสร้าง Account → Campaign → AdGroup/AdSet → Ad ไปสู่การตัดสินใจปรับกลยุทธ์ได้ไวขึ้น โดยยังคงความถูกต้องของตัวเลขและความโปร่งใสเป็นแกนกลาง

---

## 2) เป้าหมาย, ขอบเขต และข้อไม่ทำในรอบ Hackathon

### 2.1 เป้าหมาย

- จัดลำดับ “ควรดู/ควรแก้ก่อน” โดยโฟกัสที่ชั้น AdGroup/AdSet และ Ad เป็นหลัก
- แสดง evidence ที่กดดูตัวเลขและ daily breakdown ได้
- AI ช่วยสรุปและให้คำแนะนำแบบมีข้อจำกัดชัดเจน (ไม่แต่งตัวเลข, ไม่พยายามคิดเลขแทนระบบ)

### 2.2 In-scope

- Data source เป็น mock data ที่สมจริง (โครงสร้างและ metrics แบบ Meta)
- ผู้ใช้เลือก period ได้อย่างน้อย 3 วัน และ 7 วัน
- ระบบทำ current vs previous period ให้อัตโนมัติ (ความยาวเท่ากัน)
- วิเคราะห์แบบ deterministic (คำนวณ KPI/delta/score/evidence ด้วยโค้ด)
- AI แบบ 2-stage: Analyze → InsightJSON และ Recommend → RecommendationJSON โดย Recommend ห้ามเห็น raw metrics

### 2.3 Out-of-scope

- ไม่ทำ auto-apply เช่น pause/scale (ระบบเป็น read-only)
- ไม่เชื่อมต่อ Meta API จริงในรอบนี้
- ไม่ทำ permission/role ซับซ้อน

---

## 3) Tech Stack และหลักการออกแบบ

### 3.1 Tech Stack

- Next.js (Full Stack) + TypeScript
- PostgreSQL
- TailwindCSS
- AI Integration ผ่าน aishop24h (HTTP API)

### 3.2 หลักการสำคัญ

- ตัวเลขต้องถูกต้อง: คำนวณ KPI และ comparison ด้วย deterministic logic เท่านั้น
- AI ใช้เพื่อ “เรียบเรียงและช่วยคิดเชิงกลยุทธ์” ไม่ใช่เพื่อคำนวณ
- โปร่งใส: ทุกคำแนะนำต้องโยงกลับไปที่ evidence ที่ตรวจได้
- เดโมต้องนิ่ง: ต่อให้ AI ล้มเหลว UI ต้องยังใช้งานได้

---

## 4) ภาพรวมสถาปัตยกรรม

### 4.1 High-level Architecture

- Next.js UI (Dashboard + Detail) เรียก Next.js Route Handlers (API)
- Route Handlers ดึงข้อมูลจาก PostgreSQL (mock dataset)
- Deterministic Analysis สร้าง KPI/delta/score/evidence
- AI Layer เรียก aishop24h แบบ 2-stage เพื่อให้ InsightJSON และ RecommendationJSON
- ส่งผลกลับ UI โดยแยก “ตัวเลขจริง” กับ “ข้อความจาก AI” ชัดเจน

### 4.2 Layered Architecture (บังคับแยกชัด)

1. Data Layer: PostgreSQL mock dataset
2. Adapter Layer: แปลงรูปแบบข้อมูลให้เป็น Canonical Model
3. Deterministic Analysis Layer: KPI/delta/score/evidence
4. AI Layer (2-stage): InsightJSON → RecommendationJSON
5. UI Layer: Dashboard + Drill-down

---

## 5) Domain Model และ Canonical Model

### 5.1 Canonical Hierarchy

- AdvertiserAccount
- Campaign
- AdGroup (Meta เรียก Ad Set)
- Ad

### 5.2 Metrics ที่ต้องรองรับ (ขั้นต่ำ)

- spend, impressions, clicks, results, date
- reach (ถ้ามี)
- revenue (ถ้ามี)

Derived metrics (คำนวณโดยโค้ด)

- CTR = clicks / impressions
- Cost per Result = spend / results
- Conversion Rate = results / clicks
- Frequency = impressions / reach (ถ้ามี reach)
- ROAS = revenue / spend (ถ้ามี revenue)

นโยบาย: ต้อง handle หารด้วยศูนย์ และคืนค่าเป็น “ไม่พร้อมใช้งาน” พร้อมเหตุผลสั้น ๆ

---

## 6) Data Design (PostgreSQL)

### 6.1 เป้าหมายการเก็บข้อมูล

- รองรับการทำ period comparison และ daily breakdown
- รองรับ drill-down และการจัดลำดับ item ที่ควรดู/ควรแก้ก่อน

### 6.2 ตารางขั้นต่ำ (แนะนำ)

- accounts(id, name)
- campaigns(id, account_id, name, objective)
- ad_groups(id, campaign_id, name)
- ads(id, ad_group_id, name, creative_key)
- daily_metrics(entity_type, entity_id, date, spend, impressions, clicks, results, reach, revenue)

หมายเหตุ: entity_type ใช้แยก campaign / ad_group / ad เพื่อให้ query ง่ายและขยายในอนาคตได้

### 6.3 ตัวอย่าง Query Pattern ที่ต้องรองรับ

- ดึงรายการ entity ตาม account + period
- ดึง daily_metrics สำหรับ current และ previous period
- รวมยอด (sum) และคำนวณ derived metrics ในชั้น analysis

---

## 7) Period & Comparison Model

### 7.1 Period

ผู้ใช้เลือก periodDays อย่างน้อย 3 และ 7 วัน และระบบต้องแสดงให้ชัดว่าตัวเลขอิงจาก period ที่เลือก

### 7.2 Comparison

เปรียบเทียบ currentPeriod กับ previousPeriod ที่ยาวเท่ากัน เช่น

- periodDays = 7 → “7 วันล่าสุด” vs “7 วันก่อนหน้า”

---

## 8) Deterministic Analysis (Implementation Spec)

### 8.1 Output ของชั้น Analysis (สำหรับ UI และ AI)

สำหรับแต่ละ entity (เช่น AdGroup)

- totals: spend, impressions, clicks, results, reach, revenue
- derived: CTR, Cost per Result, Conversion Rate, Frequency, ROAS
- delta: current vs previous (absolute และ % change)
- score และ label (Top / Normal / Needs attention)
- evidence slots (E1–E3)
- daily breakdown (รายการรายวันสำหรับกราฟ/ตาราง)

### 8.2 Evidence Generator (E1–E3)

ระบบต้องสร้าง evidence แบบ fixed slots เพื่อให้ UI และ AI ยึดรูปแบบเดียวกัน

- E1: KPI หลัก (Cost per Result หรือ ROAS) current vs previous + % change
- E2: Quality signal (CTR หรือ Conversion Rate) current vs previous + % change
- E3: Saturation/creative fatigue (Frequency หรือ CTR trend) current vs previous + % change

### 8.3 Scoring & Label

- score ใช้จัดลำดับ priority
- label อย่างน้อย 3 กลุ่ม: Top / Normal / Needs attention
- weights และ thresholds ต้องอยู่ใน config เพื่อแก้เร็วตอน demo

### 8.4 Row-Level Diagnosis (Heuristic-based)

เพื่อประสิทธิภาพ (Performance) ในหน้า Campaign Comparison View เราจะไม่เรียก AI (LLM) สำหรับทุกแถว แต่จะใช้ Rule-based Logic ตัดเกรดเบื้องต้นเพื่อแสดงในตาราง เช่น:

- Fatigue Detected: IF (CPR > Target) AND (Freq > 4) AND (CTR < Threshold)
- Cost Creeping: IF (CPR Trend > +10%)
- Learning Limited: IF (Spend > 0) AND (Results < 50)
- Top Performer: IF (ROAS > Target) OR (CPR < Target - 20%)
  หมายเหตุ: Logic นี้ทำงานในระดับ Code (Deterministic) เพื่อความรวดเร็ว

---

## 9) AI Integration (aishop24h) — 2-stage ที่คุมขอบเขต

### 9.1 ทำไมต้อง 2-stage

- คุมความถูกต้อง: AI ไม่ได้เห็น raw metrics ในขั้น Recommend
- คุมความโปร่งใส: ทุกข้อสรุปโยง evidence ได้
- ลดความเสี่ยง hallucination เรื่องตัวเลข

### 9.2 Data Exposure Rules (สำคัญ)

- Stage A (Core Analyze) เห็น derived metrics + evidence + context
- Stage B (Recommend) เห็นเฉพาะ InsightJSON + policy/constraints เท่านั้น
- Stage B ห้ามเห็น raw metrics และห้ามสร้างตัวเลขใหม่

### 9.3 Output Contracts (Strict JSON)

InsightJSON (ขั้นต่ำ)

```json
{
	"insightSummary": "string",
	"evidenceBullets": [{ "text": "string", "evidenceRef": ["E1"] }],
	"insights": [
		{
			"type": "efficiency|traffic_quality|creative_fatigue|volume|learning",
			"title": "string",
			"detail": "string",
			"severity": "low|med|high",
			"evidenceRef": ["E2"]
		}
	],
	"limits": ["string"]
}
```

RecommendationJSON (ขั้นต่ำ)

```json
{
	"summary": "string",
	"recommendations": [
		{
			"action": "string",
			"reason": "string",
			"confidence": "low|med|high",
			"basedOn": ["insight:creative_fatigue", "evidence:E3"]
		}
	],
	"notes": "string"
}
```

### 9.4 Model Mapping (แนะนำสำหรับ Hackathon)

- Insight: model ที่เหมาะกับการสรุปเชิงตรรกะและเร็ว
- Recommendation: model ที่เหมาะกับการเขียนคำแนะนำให้อ่านง่าย

การเลือก model ต้องเป็น config เพื่อสลับได้เร็วโดยไม่แก้โค้ดหลัก

### 9.5 Failure Handling

ถ้า AI timeout หรือ parse JSON ไม่ได้

- UI ต้องไม่ crash
- แสดง score/evidence/daily ได้ตามปกติ
- แสดงข้อความ fallback ว่า “ไม่สามารถสร้างสรุป AI ได้ในขณะนี้”

---

## 10) API Design (Next.js Route Handlers)

### 10.1 Endpoints แนะนำ

- GET /api/review?accountId=&periodDays=
    - คืน summary cards + priority list (ส่วนใหญ่เน้น AdGroup)
- GET /api/detail/adgroup?id=&periodDays=
    - คืน detail: daily + evidence + score/label + ads list
- GET /api/campaign/[id]/breakdown?periodDays=
    - คืนรายการ Ad Groups ทั้งหมดใน Campaign นั้น
    - แต่ละรายการต้องมี Metrics สำคัญ และ field diagnosis_label ที่คำนวณจากข้อ 8.4
- POST /api/ai/summary
    - รับ analysis output + context แล้วคืน InsightJSON และ RecommendationJSON (หรือคืน fallback)

### 10.2 Validation

- ตรวจ periodDays (allowlist)
- ตรวจ schema ของ output จาก AI
- ป้องกัน payload ใหญ่เกินจำเป็น (ส่งเฉพาะ fields ที่ต้องใช้)

---

## 11) UI/UX Design (TailwindCSS)

### 11.1 Dashboard

ต้องทำให้ “เห็นสิ่งที่ควรจัดการก่อน” ภายในหน้าเดียว

- account selector + period selector
- summary cards (Spend, Results, Cost per Result, ROAS ถ้ามี)
- priority list พร้อม label และเหตุผลสั้น ๆ

### 11.2 Detail (AdGroup/Ad)

เน้นการอธิบายให้เชื่อได้

- score/label + เหตุผล
- evidence E1–E3 (ตัวเลข current/previous และ % change)
- AI summary + recommendations (มี disclaimer ว่าเป็นคำแนะนำ)
- daily breakdown
- ads list (ถ้าเป็นระดับ AdGroup)

---

## 12) Security และ Observability (พอเหมาะกับ Hackathon)

### 12.1 Security

- เก็บ API keys ใน environment variables เท่านั้น และห้าม log secrets
- เรียก aishop24h ผ่าน server route เท่านั้น ไม่เรียกจาก client

### 12.2 Observability

- log เฉพาะ error code และสถานะสำคัญ เช่น invalid_json, ai_timeout
- ถ้าจำเป็นต้อง log output ให้ตัดข้อมูลอ่อนไหวและจำกัดความยาว

---

## 13) Deployment Plan (Vercel)

### 13.1 Strategy

- Deploy Next.js เป็น Full Stack บน Vercel
- ตั้งค่า env บน Vercel (AI keys, model, database url)
- PostgreSQL ใช้บริการที่เข้ากับ Vercel ได้ (เช่น managed Postgres)

### 13.2 Environment Variables (ตัวอย่าง)

- DATABASE_URL
- AISHOP24H_API_KEY_INSIGHT
- AISHOP24H_API_KEY_RECO
- AISHOP24H_MODEL_INSIGHT
- AISHOP24H_MODEL_RECO
- APP_LOCALE (เช่น th-TH)

---

## 14) Testing Plan (สำหรับเดโมให้มั่นใจ)

- Unit test: KPI computation และ delta (% change) รวมถึงหารด้วยศูนย์
- Contract test: JSON schema ของ InsightJSON/RecommendationJSON
- Smoke test: /api/review และ /api/detail/adgroup เรียกได้จริงบน Vercel
- Resilience test: ปิด AI key แล้ว UI ยังใช้งานได้ครบ (fallback)

---

## 15) Implementation Checklist (วันทำงานจริง)

### 15.1 Day 0 — Setup

- สร้าง Next.js project + TailwindCSS
- เชื่อม PostgreSQL + seed mock data
- ทำ canonical types และ analysis utilities

### 15.2 Day 1 — Dashboard + Detail

- /api/review + UI dashboard
- /api/detail/adgroup + UI detail พร้อม evidence/daily

### 15.3 Day 2 — AI 2-stage + Demo hardening

- /api/ai/summary ทำ 2-stage และ validate JSON
- เพิ่ม fallback และ logging
- ทำ cache แบบง่าย (in-memory หรือ table ai_outputs) ถ้าทัน เพื่อให้เดโมนิ่ง

---

## 16) References (External)

- Vercel: Supported Node.js versions  
  https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- Vercel: Postgres documentation  
  https://vercel.com/docs/postgres
- Vercel Changelog: Node.js 24 LTS generally available (บริบทเรื่อง runtime)  
  https://vercel.com/changelog/node-js-24-lts-is-now-generally-available-for-builds-and-functions
