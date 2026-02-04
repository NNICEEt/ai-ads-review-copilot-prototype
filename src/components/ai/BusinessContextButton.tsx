"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  BUSINESS_CONTEXT_STORAGE_KEY,
  readBusinessContextFromStorage,
} from "@/components/ai/businessContextStorage";

const writeBusinessContext = (value: string) => {
  try {
    if (!value.trim()) {
      window.localStorage.removeItem(BUSINESS_CONTEXT_STORAGE_KEY);
    } else {
      window.localStorage.setItem(BUSINESS_CONTEXT_STORAGE_KEY, value);
    }
    window.dispatchEvent(new Event("ai-business-context-updated"));
  } catch {
    // ignore
  }
};

export const BusinessContextButton = () => {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState("");
  const [draft, setDraft] = useState("");
  const titleId = useId();

  useEffect(() => {
    const handler = () => setSaved(readBusinessContextFromStorage());
    window.addEventListener("ai-business-context-updated", handler);
    handler();
    return () =>
      window.removeEventListener("ai-business-context-updated", handler);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const hasContext = useMemo(() => saved.trim().length > 0, [saved]);

  return (
    <>
      <button
        type="button"
        className={`text-slate-500 hover:text-slate-700 transition-colors ${hasContext ? "text-blue-700" : ""}`}
        aria-label="Business context"
        onClick={() => {
          setDraft(saved);
          setOpen(true);
        }}
        title={
          hasContext ? "Business context (ตั้งค่าแล้ว)" : "Business context"
        }
      >
        <i className="fa-solid fa-sliders text-lg"></i>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          ></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="w-full max-w-xl bg-white rounded-xl border border-slate-200 shadow-xl"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 id={titleId} className="text-sm font-bold text-slate-900">
                    Business Context (ส่งให้ AI)
                  </h2>
                  <p className="text-xs text-slate-500 font-thai mt-1">
                    ใส่ objective/ข้อจำกัด/นโยบาย/โทนแบรนด์ เพื่อให้ AI
                    แนะนำได้เหมาะขึ้น (ไม่เกี่ยวกับตัวเลข)
                  </p>
                </div>
                <button
                  type="button"
                  className="text-slate-500 hover:text-slate-700"
                  onClick={() => setOpen(false)}
                  aria-label="ปิด"
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              <div className="p-5">
                <label htmlFor="business-context" className="sr-only">
                  Business context
                </label>
                <textarea
                  id="business-context"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={6}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-thai"
                  placeholder={
                    "ตัวอย่าง:\n- Objective: SALES (เน้น ROAS ≥ 3.0)\n- ห้ามลดงบ retargeting ต่ำกว่า 20%\n- Creative ต้องโทน friendly\n- โปรโมชัน: 2.2 (เร่ง volume)"
                  }
                />

                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-thai">
                    ระบบจะส่งข้อความนี้ไปกับ prompt (Insight/Recommend) และแยก
                    cache ตามบริบท
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50"
                      onClick={() => {
                        writeBusinessContext("");
                        setSaved("");
                        setDraft("");
                        setOpen(false);
                      }}
                    >
                      ล้าง
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-blue-700 rounded hover:bg-blue-700"
                      onClick={() => {
                        writeBusinessContext(draft);
                        setSaved(draft);
                        setOpen(false);
                      }}
                    >
                      บันทึก
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
