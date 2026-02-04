# Hackathon “Last Dance” Implementation Plan (Demo-ready)

Version: 0.1  
Date: 2026-02-04  
Owner: Team Hackathon

เอกสารนี้เป็นแผน “งานเพิ่มรอบสุดท้าย” เพื่อทำให้ AI Ads Review Copilot prototype **สมบูรณ์พอสำหรับเดโมกรรมการ**: ว้าวใน 10 วินาที, เชื่อได้จาก evidence, และ AI ล่มแล้ว “ไม่หลอกผู้ใช้”

อ้างอิง:

- `docs/SRS_AI-Ads-Review-Copilot-Hackathon.md`
- `docs/SDD_AI-Ads-Review-Copilot-Hackathon.md`
- `ai-feedback.md` (สรุป feedback + quick wins)

---

## 1) Demo Success Criteria (Definition of Done)

**กรรมการต้องเห็นภายใน 3 นาที**

1. Dashboard: เห็น “ต้องทำอะไรก่อน” + ทำไม (severity × impact)
2. คลิกเข้า AdGroup: เห็น Evidence E1–E3 + Daily trend + ระดับที่ควรแก้ (AdGroup vs Ad/Creative)
3. AI: สรุป + แนะนำ 2–3 ข้อ “ตรวจสอบได้” (อ้าง evidence) และมี disclaimer ชัดเจน
4. AI ล่ม/ปิด key: UI ยังใช้งานได้ครบ และ fallback **ไม่แสดงตัวเลขสมมติ**

**ไม่หลุด requirement หลัก**

- ตัวเลขทั้งหมดมาจาก deterministic เท่านั้น (AI ไม่คิดเลข, ไม่แต่งตัวเลข)
- Stage Recommend ไม่เห็น raw metrics

---

## 2) Priorities (P0/P1/P2)

### P0 — MUST (ทำก่อนเดโม)

#### P0.1 ลดการเรียก AI + ลด token/latency (ทำให้เดโมนิ่ง)

- [x] เพิ่มโหมด AI สำหรับ “list/snippet” ให้เรียก **Insight stage เท่านั้น** (ไม่ต้อง Recommend)
    - แนวทางเร็วสุด: เพิ่ม `mode: "insight" | "full"` ใน `/api/ai/summary`
    - `mode="insight"`: return `insight` + `recommendation=null` + `status="partial"`
    - `mode="full"`: ทำ 2-stage ตามเดิม (หน้า detail)
- [x] หน้า Dashboard/Campaign: default เป็น deterministic micro-insight, AI เป็น “เสริม” (Top N / on-demand)
- [x] เปิด `AI_USE_RESPONSE_FORMAT=true` บน env สำหรับเดโม (ลด invalid_json)
- [x] จำกัดจำนวน output ให้คงที่: 1–2 insights, 2–3 recommendations

**ไฟล์เกี่ยวข้อง (คาดว่าจะเปลี่ยน)**

- `src/app/api/ai/summary/route.ts`
- `src/lib/ai/summary.ts`
- `src/components/ai/AiInsightSnippet.tsx`
- `src/components/campaign/CampaignAiRecommendation.tsx`

**Acceptance**

- Dashboard/Campaign โหลดเร็วขึ้น + ลดจำนวน AI calls อย่างเห็นได้ชัด
- หน้า detail ยังได้ full AI (insight + reco)

---

#### P0.2 แก้ AI fallback ให้ “ไม่หลอก” (สำคัญต่อความน่าเชื่อถือ)

- [x] เอา fallback ที่มีตัวเลข hardcode ออกจาก UI
    - หลักการ: fallback = “ข้อความเชิงสถานะ” หรือ “สรุปจาก deterministic” เท่านั้น
- [x] ทำ fallback จาก evidence จริง (เช่น diagnosis + E1–E3) โดยไม่แต่งตัวเลขเพิ่ม

**ไฟล์เกี่ยวข้อง**

- `src/components/detail/AiCopilotPanel.tsx`
- (ถ้ามี) component ที่ hardcode numbers อื่น ๆ

**Acceptance**

- ปิด AI key แล้วข้อความ fallback ไม่มีตัวเลขสมมติ และไม่ขัดกับข้อความ “deterministic only”

---

#### P0.3 ปรับ Priority ให้สะท้อน “Severity × Impact” (ให้เป็น action-first จริง)

- [x] เพิ่ม “impact factor” เข้าอันดับรายการ (เช่น spend share / results share / absolute impact proxy)
    - ตัวอย่าง: `priorityScore = severityPenalty(score/label) × impactWeight(spend/results)`
    - เป้าหมาย: งานที่ “เสียเงินเยอะ/กระทบเยอะ” โผล่บนสุด แม้ score ใกล้กัน
- [x] เพิ่ม 1 ช่องในตาราง priority เพื่อสื่อ “ขนาดงาน” (เช่น Spend หรือ Share)

**ไฟล์เกี่ยวข้อง**

- `src/lib/data/review.ts` (คำนวณ/ส่ง field เพิ่ม)
- `src/app/page.tsx` (จัดอันดับ + render)
- `src/components/dashboard/PriorityList.tsx` / `src/components/dashboard/PriorityRow.tsx`

**Acceptance**

- รายการ Top 5 “สมเหตุสมผลแบบ media” มากขึ้น (ปัญหาใหญ่ขึ้นก่อน)

---

#### P0.4 Campaign page: เพิ่ม “Campaign-level summary” แบบ deterministic (1 กล่อง)

- [x] สรุปภาพรวมแคมเปญ (ไม่ต้อง AI ก็ได้)
    - winners/losers (best/worst CPR หรือ ROAS)
    - count ของ fatigue / learning limited / cost creeping
    - ข้อเสนอ “โยกงบ/รวมชุด/รีเฟรช creative” แบบ 2–3 bullets จาก rule-based

**ไฟล์เกี่ยวข้อง**

- `src/lib/data/review.ts` (เพิ่ม aggregator สำหรับ campaign)
- `src/app/campaign/[id]/page.tsx`

**Acceptance**

- เปิดหน้า Campaign แล้ว “เข้าใจภาพรวม” ใน 10 วินาที โดยไม่ต้องอ่านทุกแถว

---

#### P0.5 A11y/UX Quick Wins (กันโดนถามเรื่อง usability)

- [x] ใส่ `aria-label` + `type="button"` ให้ icon-only buttons
- [x] ใส่ label/`aria-label` ให้ `<select>` และ search `<input>`
- [x] modal ใส่ `aria-labelledby` ผูกกับหัวข้อ

**ไฟล์เกี่ยวข้อง (จาก `ai-feedback.md`)**

- `src/components/navbar/DashboardNavbar.tsx`
- `src/components/dashboard/DashboardFiltersClient.tsx`
- `src/app/campaign/[id]/page.tsx`
- `src/components/detail/AdDetailModal.tsx`

**Acceptance**

- keyboard ใช้งานได้พื้นฐาน + audit แบบเร็วไม่เจอ “ช่องโหว่ obvious”

---

#### P0.6 Smoke test บน Vercel + Demo Script (กันพังหน้างาน)

- [x] ตรวจ env vars (AI keys/models, locale) + ไม่มี secret leak ใน log
- [x] Smoke endpoints:
    - [x] `GET /api/review?accountId=&periodDays=`
    - [x] `GET /api/campaign/[id]/breakdown?periodDays=`
    - [x] `GET /api/detail/adgroup?id=&periodDays=`
    - [x] `POST /api/ai/summary` (mode insight/full)
- [x] Run-through เดโม 2 รอบ:
    - [x] AI เปิด
    - [x] AI ปิด/timeout (fallback)
    - [x] มี guide สำหรับ smoke/run-through (`docs/DEMO_Smoke.md`)
    - [x] มี demo script/talk track (`docs/DEMO_Script.md`)

---

### P1 — SHOULD (ทำถ้าทัน จะเพิ่ม impact)

- [x] ทำ sorting ในหน้า Campaign ให้ใช้งานจริง (ตอนนี้เป็น UI-only)
- [x] เพิ่ม filter preset Dashboard (Needs attention / Fatigue / Learning / Top)
- [x] เพิ่ม Target KPI แบบ config ต่อ objective/account (ทำให้ scoring/priority “media-like”)

---

### P2 — NICE (ถ้าทันจริง ๆ)

- [ ] persistent AI cache (KV/table) เพื่อให้ serverless นิ่ง
- [ ] batch AI: วิเคราะห์ Top N ใน call เดียว (ลด network roundtrips)
- [ ] business context form แบบเบา ๆ (เก็บ local/config) แล้วแนบไป stage A/B

---

## 3) Task Breakdown (แนะนำการแบ่งงาน)

**AI/Backend**

- P0.1 (mode insight/full) + P0.2 (fallback policy) + log/status ให้ชัด

**Frontend**

- P0.3 (priority UX/column) + P0.4 (campaign summary card) + P0.5 (a11y)

**Owner (คนเดโม)**

- P0.6 (Vercel smoke + demo script + Q&A)

---

## 4) Testing Checklist (Local)

- [x] `npm test`
- [x] `npm run lint`
- [x] เปิด 3 หน้า: Dashboard → Campaign → AdGroup Detail
- [x] ปิด AI keys แล้ว refresh: ทุกหน้าไม่ crash + ไม่มีตัวเลขสมมติจาก AI fallback

---

## 5) Risks & Mitigation (สำหรับตอบกรรมการ/กันหลุด)

- **AI ช้า/ล่ม** → ใช้ mode insight สำหรับ list + fallback deterministic-only + cache
- **Priority ไม่ตรง intuition ของ media** → เพิ่ม impact factor + แสดง spend/share ในตาราง
- **กรรมการถาม “ทำไมเชื่อได้”** → ชี้ Evidence E1–E3 + daily trend + rule-based diagnosis (ไม่ใช่ AI มโน)
