"use client";

import { useEffect, useMemo, useState } from "react";

type CampaignAiRecommendationProps = {
  fromAdGroupName: string | null;
  fromSpendLabel: string | null;
  toAdGroupName: string | null;
  improvementPercent: number | null;
};

const LOADING_MESSAGES = [
  "กำลังวิเคราะห์แนวโน้มค่าใช้จ่าย (Spend) และผลลัพธ์ (Results)…",
  "กำลังเทียบ CPA/CPR ระหว่าง Ad Group…",
  "กำลังหาโอกาสโยกงบไปยังกลุ่มที่คุ้มค่ากว่า…",
] as const;

export const CampaignAiRecommendation = ({
  fromAdGroupName,
  fromSpendLabel,
  toAdGroupName,
  improvementPercent,
}: CampaignAiRecommendationProps) => {
  const [status, setStatus] = useState<"loading" | "done">("loading");
  const [messageIndex, setMessageIndex] = useState(0);

  const hasSuggestion = useMemo(
    () =>
      Boolean(fromAdGroupName) &&
      Boolean(toAdGroupName) &&
      Boolean(fromSpendLabel) &&
      improvementPercent != null,
    [fromAdGroupName, fromSpendLabel, improvementPercent, toAdGroupName],
  );

  useEffect(() => {
    const loadingTimer = window.setTimeout(() => {
      setStatus("done");
    }, 900);

    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 1100);

    return () => {
      window.clearTimeout(loadingTimer);
      window.clearInterval(messageTimer);
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 text-slate-600 font-thai">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
          <i className="fa-solid fa-rotate fa-spin text-xs"></i>
        </span>
        <span>{LOADING_MESSAGES[messageIndex]}</span>
      </div>
    );
  }

  if (!hasSuggestion) {
    return (
      <span className="text-slate-600 font-thai">
        ยังไม่พบคำแนะนำที่ชัดเจนสำหรับแคมเปญนี้ (ข้อมูลไม่พอ/ตัวเลขใกล้เคียงกัน)
      </span>
    );
  }

  return (
    <span className="text-slate-600 font-thai">
      ควรโยกงบจาก{" "}
      <span className="text-red-600 font-bold">{fromAdGroupName}</span> (
      {fromSpendLabel}) ไปใส่{" "}
      <span className="text-emerald-600 font-bold">{toAdGroupName}</span> แทน
      เพราะ CPA ถูกกว่า {improvementPercent}%
    </span>
  );
};
