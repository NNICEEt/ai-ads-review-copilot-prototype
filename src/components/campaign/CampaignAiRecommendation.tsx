"use client";

import { useEffect, useMemo, useState } from "react";
import type { InsightJSON, RecommendationJSON } from "@/lib/ai/contracts";

type CampaignAiRecommendationProps = {
  fromAdGroupId: string | null;
  periodDays: number;
  fromAdGroupName: string | null;
  fromSpendLabel: string | null;
  toAdGroupName: string | null;
  improvementPercent: number | null;
};

type AiSummaryStatus = "ok" | "partial" | "fallback" | "disabled";
type AiSummarySource = "live" | "cache";

type AiSummaryResult = {
  status: AiSummaryStatus;
  source: AiSummarySource;
  insight: InsightJSON | null;
  recommendation: RecommendationJSON | null;
  reason?: "missing_config" | "invalid_json" | "timeout" | "error";
};

const MIN_LOADING_MS = 900;
const LOADING_MESSAGES = [
  "กำลังวิเคราะห์แนวโน้มค่าใช้จ่าย (Spend) และผลลัพธ์ (Results)…",
  "กำลังเทียบ CPA/CPR ระหว่างกลุ่มโฆษณา…",
  "กำลังหาโอกาสโยกงบไปยังกลุ่มที่คุ้มค่ากว่า…",
] as const;

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });

export const CampaignAiRecommendation = ({
  fromAdGroupId,
  periodDays,
  fromAdGroupName,
  fromSpendLabel,
  toAdGroupName,
  improvementPercent,
}: CampaignAiRecommendationProps) => {
  const [status, setStatus] = useState<"loading" | "done">("loading");
  const [messageIndex, setMessageIndex] = useState(0);
  const [aiResult, setAiResult] = useState<AiSummaryResult | null>(null);

  const hasSuggestion = useMemo(
    () =>
      Boolean(fromAdGroupName) &&
      Boolean(toAdGroupName) &&
      Boolean(fromSpendLabel) &&
      improvementPercent != null,
    [fromAdGroupName, fromSpendLabel, improvementPercent, toAdGroupName],
  );

  useEffect(() => {
    const controller = new AbortController();
    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 1100);

    const run = async () => {
      const startedAt = Date.now();

      let data: AiSummaryResult | null = null;
      try {
        if (fromAdGroupId) {
          const response = await fetch("/api/ai/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adGroupId: fromAdGroupId, periodDays }),
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error(`AI summary request failed (${response.status})`);
          }
          data = (await response.json()) as AiSummaryResult;
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn("[ai] campaign recommendation error", {
          fromAdGroupId,
          error,
        });
        data = {
          status: "fallback",
          source: "live",
          insight: null,
          recommendation: null,
          reason: "error",
        };
      }

      const elapsedMs = Date.now() - startedAt;
      if (elapsedMs < MIN_LOADING_MS) {
        await sleep(MIN_LOADING_MS - elapsedMs, controller.signal);
      }
      if (controller.signal.aborted) return;
      setAiResult(data);
      setStatus("done");
    };

    void run();

    return () => {
      window.clearInterval(messageTimer);
      controller.abort();
    };
  }, [fromAdGroupId, periodDays]);

  const aiRecommendation = useMemo(() => {
    return aiResult?.recommendation?.recommendations?.[0] ?? null;
  }, [aiResult]);

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

  if (aiRecommendation) {
    return (
      <span className="text-slate-600 font-thai">
        {fromAdGroupName ? (
          <>
            โฟกัสที่{" "}
            <span className="text-slate-900 font-bold">{fromAdGroupName}</span>
            :{" "}
          </>
        ) : null}
        <span className="text-indigo-700 font-bold">
          {aiRecommendation.action}
        </span>{" "}
        — {aiRecommendation.reason}
      </span>
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
