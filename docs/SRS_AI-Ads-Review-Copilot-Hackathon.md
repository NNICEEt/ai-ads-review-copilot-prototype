# System Requirements Specification (SRS)

## AI Ads Review Copilot — Hackathon FINAL

Version: 1.0 (Hackathon)  
Date: 2026-02-02

เอกสารนี้กำหนด requirement สำหรับ prototype ที่ “เล่นได้จริง” ใน hackathon โดยโฟกัส Meta Ads (mock data) แต่สถาปัตยกรรมต้องต่อยอดเป็น product ได้ผ่าน canonical model และ adapter

---

## 1) เป้าหมายของระบบ

### 1.1 ปัญหาที่ต้องแก้ (จากงานจริงของทีม Media)

ทีม Media ต้องรีวิว performance ใน Meta Ads Manager เป็นรอบ ๆ (รายวัน / 3 วัน / 7 วัน หรืออื่น ๆ ตามมาตรฐานทีม) โดยต้องไล่ดูข้อมูลจำนวนมากในโครงสร้าง Account → Campaign → Ad Set → Ad เพื่อหาว่าควรปรับตรงไหนก่อน ทำให้ใช้เวลาเยอะและทำซ้ำตลอด

### 1.2 คุณค่าที่ prototype ต้องโชว์ให้เห็น

- ลดเวลาจาก “ไล่สกรีนข้อมูล” ไปสู่ “ตัดสินใจปรับกลยุทธ์” ได้เร็วขึ้น
- แนะนำแบบโปร่งใส: มีหลักฐานตัวเลข (evidence) และกด drill-down ดูรายละเอียดได้
- ชี้ชัดระดับที่ทีมไปปรับจริงบ่อยที่สุด: **AdGroup/AdSet** และ **Ad**
    - AdGroup/AdSet = ปรับ audience/placement/budget
    - Ad = ปรับครีเอทีฟ (รูป/วิดีโอ/ข้อความ)

---

## 2) ขอบเขต (Scope)

### 2.1 In-scope (Hackathon)

- Data source: Meta Ads **mock data** (สมจริง)
- Canonical hierarchy: AdvertiserAccount → Campaign → AdGroup/AdSet → Ad
- Period: ผู้ใช้เลือกได้ (อย่างน้อย 3 วัน และ 7 วัน) และระบบทำ current vs previous period ให้เอง
- Dashboard แบบ action-first + Drill-down แบบโปร่งใส
- AI แบบ 2-stage:
    1. Core Analyze → InsightJSON
    2. Recommend → RecommendationJSON
       และ **AI Recommend ต้องไม่เห็น raw metrics**

### 2.2 Out-of-scope (Hackathon)

- ไม่ทำ auto-apply / pause / scale ในระบบ (read-only)
- ไม่เชื่อม Meta API จริงในรอบ hackathon
- ไม่ทำ permission/role ซับซ้อน
- ไม่ทำ data ingestion จาก brand guideline/pitch deck แบบอัตโนมัติ (ทำเป็นช่องกรอก context ก่อน)

---

## 3) ผู้ใช้งานและ Use Case

### 3.1 ผู้ใช้งาน

- ทีม Media (กลุ่มเดียว)

### 3.2 Use Case หลัก (Happy path)

1. เลือก Account และ Period
2. ดู Dashboard ที่จัดลำดับ “ควรดู/ควรแก้ก่อน”
3. คลิกเข้า Campaign/AdGroup/Ad เพื่อดูรายละเอียด
4. อ่าน AI summary + recommendations ที่มี evidence รองรับ
5. นำไปปรับใน Meta Ads Manager

---

## 4) คำจำกัดความและ Metrics ที่ใช้ (Meta)

### 4.1 Metrics สำคัญ (ต้องรองรับใน data และ UI)

- Impressions: จำนวนครั้งที่โฆษณาปรากฏ
- Reach: จำนวนคน/บัญชีที่เห็นโฆษณา
- Frequency: ความถี่เฉลี่ยที่คน 1 คนเห็นโฆษณา
- Clicks (All): คลิกทุกอย่างบนโฆษณา
- CTR: อัตราส่วนคลิกต่อการมองเห็น
- CPC: ต้นทุนต่อคลิก (นิยามทีม)
- Results: ผลลัพธ์ตาม objective
- Cost per Result: ต้นทุนต่อผลลัพธ์
- ROAS: ยอดขาย ÷ ค่าโฆษณา (ถ้ามี revenue)
- Conversion Rate: results ÷ clicks (นิยาม canonical สำหรับ POC)

### 4.2 Heuristics ที่ทีม Media ใช้ตัดสินใจ (ใช้เป็นฐานของ scoring/evidence)

- Cost per Result สูงขึ้นต่อเนื่อง หรือเกินเพดาน KPI
- ROAS ต่ำลง
- Conversion Rate ลดลง
- Frequency สูงเกินไป (โดยทั่วไปเริ่มมีผลเมื่อ ~3.0–4.0 แล้วแต่ทีม/แบรนด์)
- CTR ต่ำลง (creative fatigue)

### 4.3 แนวทาง Optimize ที่ระบบควรแนะนำ (POC)

- Audience Expansion
- Budget Re-allocation
- Creative Testing

---

## 5) Period & Comparison Requirement

### 5.1 Period ต้องเป็น media-defined

- ผู้ใช้ต้องเลือก period ได้อย่างน้อย 3 วัน และ 7 วัน (เพิ่มได้ในอนาคต)
- ระบบต้องแสดงว่า “ตัวเลขในรายงานนี้อิงจาก period ที่เลือก”

### 5.2 Comparison model

- เปรียบเทียบ currentPeriod กับ previousPeriod ที่มีความยาวเท่ากัน
- ถ้า periodDays = 7: compare “7 วันล่าสุด” vs “7 วันก่อนหน้า”

---

## 6) Canonical Model และ Mapping

### 6.1 Canonical hierarchy (กลาง)

- AdvertiserAccount
- Campaign
- AdGroup (Meta = Ad Set)
- Ad

### 6.2 Mapping เพื่อรองรับหลายแพลตฟอร์มในอนาคต (vision)

- Meta: Account → Campaign → Ad Set → Ad
- Google: Account/Customer → Campaign → Ad Group → Ad
- TikTok: Account → Campaign → Ad Group → Ad
- Snapchat: Ad Account → Campaign → Ad Squad → Ad

---

## 7) สถาปัตยกรรมระบบ (System Architecture)

### 7.1 Layered architecture (ต้องแยกชัด)

1. Data Layer: MetaMock (วันนี้) / Meta API (อนาคต)
2. Adapter Layer: Meta format → Canonical
3. Deterministic Analysis Layer: คำนวณ KPI/delta/score/evidence (ไม่ใช้ AI คิดเลข)
4. AI Layer (2-stage):
    - AI Core Analyze: ใช้ evidence + derived metrics → สร้าง InsightJSON
    - AI Recommend: ใช้ InsightJSON + policy/constraints → สร้าง RecommendationJSON
    - กฎสำคัญ: AI Recommend **ห้าม** เห็น raw metrics หรือ canonical performance โดยตรง
5. UI Layer: Dashboard + Drill-down

### 7.2 เหตุผลที่ต้อง deterministic ก่อน AI

- คุมความถูกต้องของตัวเลข 100%
- ทำให้ evidence ตรวจสอบได้
- ทำให้เดโมไม่พัง แม้ AI ล่ม (ยังมี score/evidence/daily ให้ดู)

---

## 8) Data Requirements (Hackathon)

### 8.1 Dataset ขั้นต่ำ

- มีอย่างน้อย 1 account
- มีหลาย campaign และหลาย ad group เพื่อให้เห็น pain จริง (เช่น 8–10 campaign)
- ในเดโมควรมีรายการให้จัดลำดับอย่างน้อย 12 ad groups และมี ads ใต้แต่ละกลุ่ม

### 8.2 Daily metrics

- ต้องมี daily breakdown ครอบคลุมช่วง current และ previous period
- ฟิลด์ขั้นต่ำต่อวัน:
    - date, spend, impressions, clicks, results
    - reach (ถ้ามี), revenue (ถ้ามี)

---

## 9) Deterministic Analysis Requirements

### 9.1 KPI computation (ทำโดยโค้ด)

- CTR = clicks / impressions
- Cost per Result = spend / results
- Conversion Rate = results / clicks
- Frequency = impressions / reach (ถ้ามี reach)
- ROAS = revenue / spend (ถ้ามี revenue)

ระบบต้อง handle กรณีหารด้วยศูนย์ และแสดง “ไม่พร้อมใช้งาน” ตาม policy

### 9.2 Evidence Generator (E1–E3)

ระบบต้องสร้าง evidence แบบ fixed slots เพื่อส่งให้ AI และแสดงใน UI

- E1: KPI หลัก (Cost per Result หรือ ROAS) current vs previous + % change
- E2: Quality signal (CTR หรือ Conversion Rate) current vs previous + % change
- E3: Saturation/creative fatigue (Frequency หรือ CTR trend) current vs previous + % change

### 9.3 Scoring & Label

- มีคะแนน score เพื่อจัดลำดับ
- มี label อย่างน้อย 3 กลุ่ม: Top / Normal / Needs attention
- weights และ thresholds ต้องอยู่ใน config (แก้เร็วได้)

---

## 10) AI Requirements (2-stage, strict JSON)

### 10.1 Data exposure rule (สำคัญ)

- Core Analyze เห็น derived metrics + evidence + context
- Recommend เห็นเฉพาะ InsightJSON + policy/constraints
- Recommend ห้ามเห็น raw metrics โดยตรง

### 10.2 AI Core Analyze — Output Contract (InsightJSON)

ข้อกำหนด

- Output ต้องเป็น JSON เท่านั้น
- ห้ามแต่งตัวเลขใหม่
- ทุก insight ต้องอ้างอิง evidenceRef อย่างน้อย 1 รายการ (E1–E3)

Schema (ขั้นต่ำ)

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

### 10.3 AI Recommend — Output Contract (RecommendationJSON)

ข้อกำหนด

- Output ต้องเป็น JSON เท่านั้น
- ทุก recommendation ต้องผูกกับ insight/evidence
- จำนวน recommendation ควรคุมให้นิ่งเพื่อเดโม (เช่น 2–3 ข้อ)

Schema (ขั้นต่ำ)

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

### 10.4 AI failure handling (ต้องมี)

- ถ้า AI timeout หรือ parse JSON ไม่ได้:
    - UI ต้องไม่ crash
    - แสดง score/evidence/daily ได้ตามปกติ
    - แสดงข้อความ fallback ว่า “ไม่สามารถสร้างสรุป AI ได้ในขณะนี้”

### 10.5 Multi-language readiness

- ต้องส่ง `language` หรือ `locale` เข้า AI เพื่อให้สรุป/คำแนะนำตรงภาษา
- UI ต้องแยกข้อความเป็น key/value เพื่อรองรับ i18n ในอนาคต

---

## 11) Functional Requirements (FR)

### 11.1 Account & Period

- FR-01 เลือก AdvertiserAccount ได้
- FR-02 เลือก periodDays ได้อย่างน้อย 3 และ 7 วัน
- FR-03 ระบบสร้าง previous period อัตโนมัติให้เท่ากัน

### 11.2 Dashboard

- FR-10 แสดง summary cards อย่างน้อย: Spend, Results, Cost per Result, ROAS (ถ้ามี)
- FR-11 แสดง priority list และ label: Top/Normal/Needs attention
- FR-12 ผู้ใช้เปิด drill-down ไป Campaign/AdGroup/Ad ได้
- FR-13 มี filter/search ขั้นต่ำ (เช่นค้นชื่อ campaign/ad group) ถ้าทำได้ในเวลา

### 11.3 Campaign Comparison View (Table View)

- FR-14 ผู้ใช้สามารถคลิกจาก Dashboard เพื่อดูภาพรวมของ Campaign แบบตารางเปรียบเทียบได้
- FR-15 แสดงรายการ Ad Groups ทั้งหมดใน Campaign นั้น เพื่อเปรียบเทียบ (Apple-to-Apple Comparison)
- FR-16 แสดง Metrics สำคัญวางชนกันเพื่อเทียบประสิทธิภาพ (Spend, CPR, ROAS, CTR)
- FR-17 แสดง "Diagnosis Label" หรือ "Micro-Insight" รายบรรทัดที่เกิดจาก Rule-based (เช่น Fatigue, Learning Limited) โดยไม่ต้องกดเข้าไปดูทีละตัว

### 11.4 Drill-down: Campaign → AdGroup → Ad

- FR-20 แสดง daily breakdown ในช่วงเวลาที่เลือก
- FR-21 แสดง evidence E1–E3 พร้อมตัวเลขจริงและ % change
- FR-22 แสดง score/label และเหตุผลที่ตรวจสอบได้
- FR-23 แสดงรายการ Ads ภายใต้ AdGroup (Ads Performance List) และมี insight ระดับ Ad (Creative Analysis)
- FR-24 แยกให้เห็นว่า “ควรแก้ที่กลุ่ม” หรือ “ควรแก้ที่ครีเอทีฟ” ผ่าน 2-level analysis

### 11.5 AI

- FR-30 เรียก AI Core Analyze เพื่อสร้าง InsightJSON
- FR-31 ส่ง InsightJSON ไป AI Recommend เพื่อสร้าง RecommendationJSON
- FR-32 แสดง disclaimer ว่าเป็นคำแนะนำ ไม่ใช่คำสั่ง
- FR-33 มี fallback เมื่อ AI ล้มเหลว

### 11.6 Config

- FR-40 ปรับ weights/thresholds ได้จากไฟล์ config
- FR-41 รองรับ per-account config ในอนาคต

---

## 12) UI/UX Requirements (ใช้งานจริงของ Media)

### 12.1 หลักการ

- ดูเร็ว (เห็นสิ่งที่ต้องจัดการก่อน)
- คลิกน้อย (ไม่หลง flow)
- โปร่งใส (กดดูตัวเลขและ breakdown ได้)

### 12.2 หน้าจอขั้นต่ำสำหรับเดโม

- Dashboard
    - account selector, period selector
    - summary cards
    - priority list/table (Campaign/AdGroup)
- Detail
    - breadcrumb/back
    - summary + status
    - AI output (ถ้ามี) + evidence
    - daily breakdown
    - ads list และ insight ระดับ Ad

---

## 13) Non-Functional Requirements (NFR)

- NFR-01 Performance: Dashboard โหลดภายใน 3 วินาทีบน mock data POC
- NFR-02 Reliability: AI error ต้องไม่ทำให้หน้า crash
- NFR-03 Accuracy: ตัวเลขต้องตรงกับ data source 100% และ format สม่ำเสมอ
- NFR-04 Security: เก็บ AI key ใน env และไม่ log secrets
- NFR-05 Observability: มี logging สำหรับ error และ AI response แบบตัดข้อมูลอ่อนไหว
- NFR-06 Maintainability: แยก adapter/analysis/ai/ui ให้เปลี่ยน data source ได้โดยไม่ rewrite

---

## 14) API Requirements (POC)

ตัวอย่าง endpoint (ปรับตาม implementation ได้)

- GET /api/review?accountId=&periodDays=
- GET /api/campaign/<built-in function id>?periodDays=
- GET /api/adgroup/<built-in function id>?periodDays=
- GET /api/ad/<built-in function id>?periodDays=
- POST /api/ai/core-analyze
- POST /api/ai/recommend

AI endpoints ต้อง validate JSON schema และมี fallback เมื่อ invalid

---

## 15) Acceptance Criteria (Demo-ready)

ระบบถือว่าพร้อมเดโมเมื่อ:

- เลือก account + period ได้
- Dashboard แสดง summary + priority list ชัดเจน
- Drill-down ถึง AdGroup แล้วเห็น evidence E1–E3 + daily breakdown
- Drill-down ถึง Ad ได้ และมี insight ระดับ Ad
- AI 2-stage ทำงานได้จริง หรือ fallback ได้โดยเดโมไม่พัง
- ผู้ใช้สามารถอธิบายได้ว่า “ทำไมระบบถึงแนะนำแบบนี้” จาก evidence

---

## 16) Roadmap (สำหรับตอบกรรมการ)

- เชื่อม Meta API จริง: เปลี่ยนแค่ data layer/adapter
- เพิ่ม Campaign level summary + drill-down ครบวงจร
- เพิ่ม adapters สำหรับ Google/TikTok/Snapchat
- เพิ่ม ingestion ของ brief/brand guideline และ AI สรุป context อัตโนมัติ
