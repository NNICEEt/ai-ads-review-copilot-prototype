# Demo Script (3 นาที) — AI Ads Review Copilot

เป้าหมาย: “ว้าวใน 10 วินาที” + เชื่อได้จาก evidence + AI ล่มก็ไม่หลอกผู้ใช้

---

## 0) ก่อนเริ่มเดโม (10 วินาที)

- เปิดหน้า `Dashboard` (ลิงก์เริ่มต้น) และเตรียม `periodDays=7`
- (ถ้าจะโชว์ความ “ปรับให้เข้าบริบทแบรนด์”) กดไอคอน `Business Context` แล้วใส่ objective/ข้อจำกัดสั้น ๆ
- (ถ้าจะโชว์ fallback) เตรียมปิด AI key หรือทำให้ `/api/ai/summary` timeout ได้

---

## 1) Dashboard — “ต้องทำอะไรก่อน” (0:00–1:00)

**สิ่งที่พูด**

- “หน้านี้ตอบคำถามว่า _ต้องทำอะไรก่อน_ โดยจัดลำดับแบบ Severity × Impact (คะแนน × ขนาดงบ)”
- “ตัวเลข/การจัดอันดับมาจาก deterministic ทั้งหมด — AI เป็นตัวช่วยสรุปเท่านั้น”

**สิ่งที่กด**

1. ชี้ตาราง “รายการสิ่งที่ต้องทำก่อน”
2. ชี้คอลัมน์ “ยอดใช้จ่าย” เพื่ออธิบาย Impact
3. กด “สรุปด้วย AI” เฉพาะรายการบน ๆ (AI on-demand / Top N เท่านั้น)
4. ลองกด Preset: `Needs attention` → `Fatigue` → `Learning` → `Top`

**one-liner ปิดท้าย**

- “เลือก 1 รายการแล้วไปดูระดับ Campaign/AdGroup เพื่อดู evidence และตัดสินใจ”

---

## 2) Campaign — “ภาพรวมเชิงกลยุทธ์” (1:00–2:00)

**สิ่งที่พูด**

- “หน้านี้ช่วยเห็นภาพรวมของแคมเปญใน 10 วินาที: winners/losers + จำนวน fatigue/learning/cost creeping + สิ่งที่ควรทำก่อนแบบ rule-based”
- “AI ต่อแถวเป็น insight สั้น ๆ และเรียกเฉพาะเมื่อคลิก (ลด latency + demo นิ่ง)”

**สิ่งที่กด**

1. คลิกเข้า Campaign จากแถวใน Dashboard
2. ชี้กล่อง Summary (deterministic) และ bullet actions
3. ลอง “จัดเรียง” (CPR / ROAS / ยอดใช้จ่าย) ให้เห็นว่า sorting ทำงานจริง
4. กด “AI วิเคราะห์ (Insight)” ของ 1–2 แถว เพื่อย้ำว่าเป็น on-demand

---

## 3) AdGroup Detail — “Evidence → AI → Trend → Ads” (2:00–3:00)

**สิ่งที่พูด**

- “หน้านี้ลงลึกระดับ AdGroup: มี Evidence E1–E3 + daily trend + ดูได้ว่าควรแก้ที่ AdGroup หรือ Creative”
- “AI ทำ 2 อย่าง: (1) สรุป insight จาก evidence (2) แนะนำ 2–3 ข้อที่ตรวจสอบได้ พร้อม disclaimer”
- “สำคัญ: Stage Recommend ไม่เห็น raw metrics — จะเห็นเฉพาะ Insight ที่ผ่านการสรุปจาก deterministic แล้ว”

**สิ่งที่กด**

1. กดดูรายละเอียดจาก Campaign → เข้า AdGroup
2. ชี้ Evidence (E1–E3) และ daily trend
3. ชี้ AI Summary/Recommendation + disclaimer

---

## 4) แผนสำรองเมื่อ AI ล่ม (30 วินาที / แทรกตอนไหนก็ได้)

**สิ่งที่พูด**

- “ปิด AI แล้วระบบยังใช้งานได้ครบ เพราะ deterministic เป็นแกนหลัก”
- “Fallback จะไม่โชว์ตัวเลขสมมติ — จะบอกสถานะ + สรุปจาก evidence จริงเท่านั้น”

**สิ่งที่กด**

1. ปิด AI key แล้ว refresh หน้า Detail
2. ชี้ข้อความ fallback ว่าไม่มีเลขแต่ง และยังอ่าน evidence/trend ได้

---

## Q&A สั้น ๆ (กันกรรมการถาม)

- **ทำไมเชื่อได้?** เพราะทุกข้ออ้างอิง evidence E1–E3 + daily trend และคะแนน/ลำดับมาจาก deterministic
- **AI ทำหน้าที่อะไร?** ช่วย “สรุป/จัดธีม” และให้ recommendation ที่ตรวจสอบได้ ไม่คิดเลข ไม่แต่งตัวเลข
- **ถ้า AI ช้า/ล่ม?** UI ยังทำงานครบ + AI ถูกเรียกแบบ Top N / on-demand + มี fallback deterministic-only
- **ต่อยอดได้ไหม?** เพิ่ม Business Context (brand/persona/objective/constraints) ได้ และทำ monthly report ได้โดยให้ deterministic สรุป artifact ก่อนค่อยให้ AI เขียน narrative
