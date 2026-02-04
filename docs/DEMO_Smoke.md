# Smoke Test & Demo Run-through (Last Dance)

เอกสารนี้ช่วยกัน “พังหน้างาน” โดยเช็ค flow หลัก + เช็คเคส AI ล่ม/ปิด key แล้ว UI ยังไม่หลอกผู้ใช้

## 1) Environment checklist

- ตั้ง `AI_USE_RESPONSE_FORMAT="true"` (ลดโอกาส invalid JSON)
- ตั้ง key/model ให้ครบ:
  - `AISHOP24H_API_KEY_INSIGHT`
  - `AISHOP24H_API_KEY_RECO`
  - `AISHOP24H_MODEL_INSIGHT`
  - `AISHOP24H_MODEL_RECO`
  - `AISHOP24H_API_URL`
- Locale:
  - `APP_LOCALE="th-TH"`

## 2) Local smoke (ต้องรัน `npm run dev` ก่อน)

สมมติ base URL คือ `http://localhost:3000`

### Review + breakdown APIs

```bash
curl -sS "http://localhost:3000/api/review?accountId=&periodDays=7" | head
curl -sS "http://localhost:3000/api/campaign/<campaignId>/breakdown?periodDays=7" | head
curl -sS "http://localhost:3000/api/detail/adgroup?id=<adGroupId>&periodDays=7" | head
```

### AI summary (insight/full)

```bash
curl -sS -X POST "http://localhost:3000/api/ai/summary" \
  -H "content-type: application/json" \
  -d '{"adGroupId":"<adGroupId>","periodDays":7,"mode":"insight"}' | head

curl -sS -X POST "http://localhost:3000/api/ai/summary" \
  -H "content-type: application/json" \
  -d '{"adGroupId":"<adGroupId>","periodDays":7,"mode":"full"}' | head
```

## 3) Demo run-through (2 รอบ)

### รอบ A: AI เปิด

1) Dashboard → เห็นรายการ “ต้องทำก่อน” เรียงแบบ Severity × Impact และมีคอลัมน์ “ยอดใช้จ่าย”
2) คลิกเข้า Campaign → เห็น “ภาพรวมแคมเปญ (Deterministic)” ใน 10 วินาที
3) คลิกเข้า AdGroup detail → เห็น Evidence E1–E3 + AI Copilot (insight + reco) + Daily trend

### รอบ B: AI ปิด/timeout

1) ปิด key (เช่น clear `AISHOP24H_API_KEY_INSIGHT`/`AISHOP24H_API_KEY_RECO`) แล้ว restart
2) เปิด 3 หน้าเดิมอีกครั้ง:
   - UI ไม่ crash
   - Fallback ไม่มี “ตัวเลขสมมติ” (แสดงจาก deterministic/evidence เท่านั้น)
   - ข้อความอธิบายสื่อชัดว่าเป็น deterministic-only
