## คำถาม:

ช่วยอ่านเอกสาร [@SRS_AI-Ads-Review-Copilot-Hackathon.md](file:///Users/teerapatnayapan/Jenosize/hackathon/ai-ads-review-copilot-prototype/docs/SRS_AI-Ads-Review-Copilot-Hackathon.md) [@SDD_AI-Ads-Review-Copilot-Hackathon.md](file:///Users/teerapatnayapan/Jenosize/hackathon/ai-ads-review-copilot-prototype/docs/SDD_AI-Ads-Review-Copilot-Hackathon.md) [@Checklist_AI-Ads-Review-Copilot.md](file:///Users/teerapatnayapan/Jenosize/hackathon/ai-ads-review-copilot-prototype/docs/Checklist_AI-Ads-Review-Copilot.md) และ codebase หน่อยครับว่าเป็นอย่างไรบ้าง มีความสามารถอะไรบ้าง ใช้งานอะไรได้บ้าง ตรงกับเป้าหมายมั้ย

รวมถึงในส่วนนี้ผมมี feddback เพิ่มเติมที่ตั้งคำถามและอยากให้คุณคิดว่า ในฐานะ Media ที่ต้องทำงานจัดการ Ads จะมีความคิดอย่างไร โดย feedback มีดังนี้

- ปัจจุบันจากที่ผมได้ลองเล่น App จะมีทั้งหมด 3 หน้าคือ Dashbaord, Campaign, AdGroup Detail ซึ่งทั้ง 3 หน้าจะมี AI ทำการวิเคราะห์ ซึ่งโดยปกติแล้วแต่ละหน้าควรจะมีหน้าที่อะไร แล้วในแต่ละหน้า Topic ที่ AI จะนำมาวิเคราะห์ควรตอบสนองในเรื่องอะไรของหน้านั้นๆ ที่จะสามารถตอบโจทย์ และช่วยสร้าง impact ได้
- ในหน้า Dashbaord ที่เป็นตาราง "รายการที่ต้องทำก่อน" จริงๆแล้วรายการควรถูกแสดงขึ้นมาจากอะไร แล้วจริงๆ ต้องทำการวิเคราห์ข้อมูลโดยรวมก่อนไหมก่อนที่จะทำการเลือกรายการมา โดยที่ไม่จำเป็นต้องมาวิเคราะห์อีกทีแต่ละรายการเมื่อเลือกมาแล้วอีกที รวมทั้งข้อมูลที่แสดงในตารางเพียงพอแล้วจริงๆ ใช่ไหมสำหรับการตัดสินใจเบื้องต้น
- หน้า Campaign ที่เป็นรายการ Ad sets ต่างๆ AI ที่จะต้องวิเคราะห์ในระดับหน้านี้ควรวิเคราะห์อะไรบ้างในแต่ละรายการ และเชิงกลยุทธ์ของ Campaign ควรมีวิเคราะห์อะไรไหม
- หน้า Detail ไม่มีอะไรมาก อยากถามว่า ใช้ยากไหมสำหรับคุณ ขาดตกบกพร่องอะไรไหม

ต่อไปผมจะ feedback ในเชิง System Design/Optimization โดยคุณจะต้องตอบคำถามในฐานะ AI Engineer และ Software Engineer โดยมี feedback ดังนี้

- ตอนนี้เราแบ่ง AI เป็น 2 ตัว 2 หน้าที่ ทีนี้เราจะสามารถ Optimize prompt อะไรเพิ่มเติมได้ไหมเพื่อให้ทั้ง 2 ทำหน้าที่ของตัวเองได้ และไม่ใช้ token หรือจะทำให้เสีย cost มากเกินไปกับวิเคราะห์ช้าเกินไปไหม
- ตอนนี้ถ้าแบ่ง layer ระบบจะประมาณนี้เนอะ App -> Analyze layer (AI Recommend -> AI Core Analyze) -> Deterministic layer -> Canonical Model -> Platform Adapter (meta ads, etc.) ทีนี้ในอนาคตอยากเพิ่ม Business Context layer เช่น Brand Context, Personality, Campaign/Product Objective, Review Period, Constraints/Policy cและอื่นๆ เป็นต้น สามารถทำได้ใช่ไหมครับ
- ถ้าในอนาคตจะทำ report ที่จะวัดว่าตลอดทั้งเดือนของ campaign นั้นเป็นยังไงบ้างอะไรแบบนี้ก็สามารถทำได้ใช่ไหม ที่ให้ AI มา Analyze ข้อมูลให้
- ถ้าต้องทำ product จริงๆ layer ของ platform จะต้องมีการเก็บข้อมูลลง DB ไว้ใช่ไหมครับ รวมถึงข้อมูลพวก Business Context layer ด้วย
- และถ้าในอนาคตอยากให้มีการ analyze ระดับ account ทำได้ไหม เช่น Acount (7-11) Meta กับ Google อะไรแบบนี้ มี 2 ที่ ซึ่งถึงแม้จะ 2 platform แต่ตามที่ design กันไว้มันก็น่าจะถือว่าอยู่ในระดับ account ใช่ไหมครับ

ทั้งหมดนี้ช่วยอยู่ในขอบเขตของ hackathon นะครับ ยังไม่ต้อง production rate เพื่อที่จะดูแนวทางเพิ่มเติม และใช้ตอบคำถามกรรมการได้

## คำตอบ:

ภาพรวม Codebase (เทียบกับ SRS/SDD)\*\*

- Stack: Next.js + TS + Tailwind, data เป็น mock/in-memory ผ่าน interface `ReviewDataSource` (`src/lib/data/reviewSource.ts:1`, `src/lib/data/sources/mock.ts:1`)
- แกนหลักเป็น deterministic ก่อน AI: KPI/delta/evidence/score/diagnosis (`src/lib/analysis/metrics.ts:1`, `src/lib/analysis/evidence.ts:1`, `src/lib/analysis/scoring.ts:1`, `src/lib/analysis/period.ts:1`)
- AI 2-stage + strict JSON + validate ด้วย Zod + มี cache/fallback (`src/lib/ai/contracts.ts:1`, `src/lib/ai/summary.ts:1`, `src/lib/ai/client.ts:1`)
- API หลักครบตาม flow เดโม: `/api/review`, `/api/campaign/[id]/breakdown`, `/api/detail/adgroup`, `/api/ai/summary` (`src/app/api/*/route.ts`)

**ความสามารถที่ใช้ได้ตอนนี้ (3 หน้า)**

- Dashboard `/`: เลือก account/period (3/7/14) + search, summary cards, priority list (Top 5) จัดลำดับจาก score/diagnosis + มี AI snippet ต่อรายการ (`src/app/page.tsx:327`, `src/app/page.tsx:403`)
- Campaign `/campaign/[id]`: ตารางเทียบ AdGroups ในแคมเปญ (Spend/Results/CPR/ROAS/CTR) + diagnosis label (rule-based) + AI snippet ต่อแถว + “คำแนะนำแคมเปญ” (ดึงจาก AI recommendation ของ 1 adgroup) (`src/app/campaign/[id]/page.tsx:299`, `src/components/campaign/CampaignAiRecommendation.tsx:1`)
- AdGroup Detail `/adgroup/[id]`: score/label + evidence E1–E3 + AI Copilot panel + daily trend + Ads list + modal วิเคราะห์ระดับ Ad แบบ deterministic (fix level + suggestions) (`src/app/adgroup/[id]/page.tsx:96`, `src/components/detail/AdDetailModal.tsx:149`)

**ตรงกับเป้าหมายไหม (สรุปแบบกรรมการถาม)**

- ตรงแกน “โปร่งใส/ตัวเลขถูกต้อง/AI ไม่คิดเลข”: deterministic ทำ KPI+evidence แล้วค่อยให้ AI “เรียบเรียง+แนะนำ” และ stage Recommend ไม่เห็น raw metrics (`src/lib/ai/summary.ts:86`, `src/lib/ai/summary.ts:184`)
- ตรง “action-first + drill-down”: Dashboard → Campaign → AdGroup → Ad modal มีเหตุผล+หลักฐานกดดูได้
- จุดที่ยังเสี่ยงต่อ impact จริงของทีม Media:
    - **Priority อาจยังไม่สะท้อน “ผลกระทบ”** เพราะ score เน้น ratio (CPR/CTR/Freq/ROAS) มากกว่า “น้ำหนักตาม Spend/Results share” → อาจดันงานเล็กขึ้นมาบนสุด
    - **เรียก AI เยอะเกินจำเป็น**: `AiInsightSnippet` (ใช้ใน Dashboard/Campaign) เรียก `/api/ai/summary` ซึ่งปัจจุบันทำ 2-stage ทุกครั้ง แม้หน้า list ต้องการแค่อินไซต์สั้น ๆ (`src/components/ai/AiInsightSnippet.tsx:106`, `src/lib/ai/summary.ts:57`)
    - **Fallback ของ AI มีตัวเลข hardcode** เสี่ยงทำให้ “เชื่อผิด” ตอน AI ล่ม (`src/components/detail/AiCopilotPanel.tsx:94`)
    - SDD/Checklist พูดถึง Postgres แต่โค้ดรันด้วย mock เป็นหลัก (โอเคใน hackathon แต่ควร “เล่าให้ตรง” ตอนตอบกรรมการ)

**Feedback มุม Media: หน้าที่แต่ละหน้า + Topic ของ AI**

- Dashboard = “Triage/จัดลำดับงานวันนี้”
    - AI ควรตอบ: “ช่วงนี้เกิดอะไรขึ้น (vs prev) + 3 เรื่องที่ควรทำก่อน + ทำไม (อ้าง evidence/diagnosis)” มากกว่า generate insight ทุกแถว
- Campaign = “Portfolio view ภายในแคมเปญ”
    - AI ควรตอบ 2 ชั้น: (1) campaign-level: budget/learning/fatigue กระจายยังไง, winner/loser, โยกงบ/รวมชุดดีไหม (2) row-level: micro-insight สั้น ๆ ว่าควรแก้ที่ creative หรือ audience
- AdGroup Detail = “ตัดสินใจลงมือทำ”
    - AI ควรตอบ: root cause จาก E1–E3 + action plan 2–3 ข้อ + experiment ที่ทำได้ทันที + what-to-monitor + limits

**Feedback มุม Media: Dashboard ‘รายการที่ต้องทำก่อน’**

- รายการควรถูกเลือกจาก “Severity × Impact”
    - Severity: score/label + diagnosis (fatigue/cost creeping/learning/top)
    - Impact: spend, spend share, results share, absolute delta (เช่น CPR แย่ขึ้นแต่ spend สูง = ต้องขึ้นก่อน)
- ควรวิเคราะห์ “ภาพรวม” ก่อนเลือก list: ทำได้ด้วย deterministic (driver analysis) แล้วให้ AI สรุปเป็น 3 theme ก็พอ ไม่ต้อง AI ต่อแถว
- ตารางตอนนี้ “ใกล้พอ” สำหรับ triage แต่ถ้าจะให้ตัดสินใจมั่นขึ้น แนะนำเพิ่มอย่างน้อย: Spend/Spend share และ Objective/Target KPI ต่อแถว (ตอนนี้เห็น Results/CTR/Freq/ROAS/CPR แล้ว แต่ยังขาด “ขนาดของปัญหา”)

**Feedback มุม Media: หน้า Campaign**

- รายการ AdSet/AdGroup ระดับนี้ AI ต่อแถวควรเน้น “เหตุผลเชิงเปรียบเทียบ” (outlier) ไม่ใช่สรุปทั่วไป
- Campaign-level strategy ควรมี: สัดส่วนงบไปที่ไหน, มี ad set แข่งกันเองไหม (overlap signal), learning limited กี่ชุด, fatigue กี่ชุด, ข้อเสนอ “โยกงบ/รวมชุด/รีเฟรช creative” แบบสั้น ๆ

**หน้า Detail ใช้ยากไหม / ขาดอะไร**

- ใช้ไม่ยากและ flow ดี (Evidence → AI → Trend → Ads) แต่มี 2 จุดที่ทำให้ “เชื่อ/ตัดสินใจ” สะดุด:
    - tone ของ score badge/ข้อความยัง fixed โทนลบ (`src/app/adgroup/[id]/page.tsx:96`)
    - ตอน AI ล่ม UI บอกว่า deterministic-only แต่เนื้อหา fallback มีตัวเลขสมมติ (`src/components/detail/AiCopilotPanel.tsx:94`)

**Feedback มุม AI/Software Engineer (Prompt/Cost/Layer)**

- Optimize prompt/cost/latency (ทำได้ใน hackathon):
    - แยก endpoint หรือเพิ่ม flag “insightOnly” เพื่อให้หน้า list เรียกแค่ stage Analyze (ไม่ต้อง stage Recommend ทุกครั้ง) (`src/components/ai/AiInsightSnippet.tsx:106`, `src/lib/ai/summary.ts:57`)
    - เปิด `AI_USE_RESPONSE_FORMAT=true` เพื่อลด invalid_json และตัด schema ที่ยาวใน prompt ได้ (`src/lib/config/ai.ts:1`, `src/lib/ai/summary.ts:61`)
    - จำกัด output ให้ “คงที่”: 1–2 insights, 2 recos (ลด token + ทำ UI นิ่ง)
    - ลด call volume: ให้ AI ทำงาน “เฉพาะเมื่อคลิก/เฉพาะ Top N” หรือ batch หลายรายการใน call เดียว
    - cache ตอนนี้เป็น in-memory; บน serverless อาจไม่คงที่ → ถ้าจะเดโมนิ่งจริงให้ใช้ table/KV cache (optional)
- เพิ่ม Business Context layer: ทำได้แน่นอน
    - เพิ่ม `businessContext` (brand/persona/objective/constraints/policy/target KPI) เข้า payload builder ใน stage A และ/หรือแนบใน stage B โดยยังคุม rule “no raw metrics” ได้
- ทำ monthly report / campaign health report: ทำได้
    - อย่าส่ง daily ทั้งเดือนให้ AI ตรง ๆ; ให้ deterministic สรุปเป็น “report artifacts + evidence” แล้วให้ AI เขียน narrative/insights จาก artifact
- ทำ product จริง: ใช่ ต้องมี ingestion เก็บลง DB (daily_metrics + mapping ids) และเก็บ business context ในตาราง/JSONB แยก
- วิเคราะห์ระดับ account ข้าม platform (Meta+Google): ทำได้ แต่แนะนำเพิ่ม concept “BrandAccount” (รวมหลาย platform account) แล้วให้ adapter map เข้ากลางก่อนค่อยคำนวณ/สรุป

**UI/A11y Quick Wins (format: file:line)**

- `src/components/navbar/DashboardNavbar.tsx:18` icon-only button ไม่มี `aria-label`/`type="button"`
- `src/components/dashboard/DashboardFiltersClient.tsx:62` `<select>` ไม่มี label/`aria-label`
- `src/components/dashboard/DashboardFiltersClient.tsx:94` `<input>` ไม่มี label (placeholder ไม่ถือเป็น label)
- `src/app/campaign/[id]/page.tsx:427` `<select>` “จัดเรียง” ไม่มี label/`aria-label`
- `src/components/detail/AdDetailModal.tsx:225` dialog ไม่มี `aria-labelledby` ผูกกับหัวข้อ
- `src/components/detail/AiCopilotPanel.tsx:94` fallback ใส่ตัวเลขสมมติ (ขัดกับ “ไม่แต่งตัวเลข/ deterministic-only”)
