"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { InsightJSON, RecommendationJSON } from "@/lib/ai/contracts";
import type { EvidenceSlot } from "@/lib/analysis/evidence";
import { formatCurrency } from "@/lib/utils/metrics";
import { readBusinessContextFromStorage } from "@/components/ai/businessContextStorage";

const MIN_LOADING_MS = 900;
const LOADING_STEP_MS = 900;
const LOADING_MESSAGES = [
  "กำลังอ่าน Evidence (E1–E3)…",
  "กำลังวิเคราะห์ pattern ของ Cost/CTR/Frequency…",
  "กำลังสร้างคำแนะนำที่ทำได้ทันที…",
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

type AiSummaryStatus = "ok" | "partial" | "fallback" | "disabled";
type AiSummarySource = "live" | "cache";

type AiSummaryResult = {
  status: AiSummaryStatus;
  source: AiSummarySource;
  insight: InsightJSON | null;
  recommendation: RecommendationJSON | null;
  reason?: "missing_config" | "invalid_json" | "timeout" | "error";
};

type AiCopilotPanelProps = {
  adGroupId: string;
  periodDays: number;
  fallbackEvidence?: EvidenceSlot[] | null;
};

type AiInsightItem = {
  title: string;
  detail: ReactNode;
  iconWrapperClass: string;
  iconClass: string;
};

type AiRecommendationItem = {
  title: string;
  detail: ReactNode;
  iconWrapperClass: string;
  iconClass: string;
};

const insightStyles = {
  high: {
    iconWrapperClass:
      "mt-0.5 bg-amber-100 w-6 h-6 rounded shrink-0 flex items-center justify-center text-amber-500",
    iconClass: "fa-solid fa-triangle-exclamation text-xs",
  },
  med: {
    iconWrapperClass:
      "mt-0.5 bg-red-100 w-6 h-6 rounded shrink-0 flex items-center justify-center text-red-500",
    iconClass: "fa-solid fa-arrow-trend-up text-xs",
  },
  low: {
    iconWrapperClass:
      "mt-0.5 bg-slate-100 w-6 h-6 rounded shrink-0 flex items-center justify-center text-slate-500",
    iconClass: "fa-solid fa-minus text-xs",
  },
};

const recommendationStyles = {
  high: {
    iconWrapperClass:
      "mt-0.5 bg-indigo-100 w-6 h-6 rounded shrink-0 flex items-center justify-center text-indigo-500",
    iconClass: "fa-solid fa-wand-magic-sparkles text-xs",
  },
  med: {
    iconWrapperClass:
      "mt-0.5 bg-blue-100 w-6 h-6 rounded shrink-0 flex items-center justify-center text-blue-500",
    iconClass: "fa-solid fa-users text-xs",
  },
  low: {
    iconWrapperClass:
      "mt-0.5 bg-slate-100 w-6 h-6 rounded shrink-0 flex items-center justify-center text-slate-500",
    iconClass: "fa-solid fa-lightbulb text-xs",
  },
};

const formatEvidenceValue = (metricLabel: string, value: number | null) => {
  if (value == null) return "ไม่มีข้อมูล";
  if (metricLabel === "ROAS") return `${value.toFixed(1)}x`;
  if (metricLabel.includes("Rate") || metricLabel.includes("CTR")) {
    return `${(value * 100).toFixed(2)}%`;
  }
  if (metricLabel === "Cost per Result") return formatCurrency(value);
  return value.toFixed(2);
};

const metricPolarity = (metricLabel: string) => {
  if (metricLabel === "Cost per Result") return "lower_is_better";
  if (metricLabel === "Frequency") return "lower_is_better";
  if (metricLabel === "ROAS") return "higher_is_better";
  if (metricLabel.includes("Rate") || metricLabel.includes("CTR"))
    return "higher_is_better";
  return "neutral";
};

const classifyEvidenceSeverity = (slot: EvidenceSlot) => {
  const polarity = metricPolarity(slot.metricLabel);
  const percent = slot.value.percent;
  if (percent == null || polarity === "neutral") return "low" as const;

  const isWorse =
    (polarity === "lower_is_better" && percent > 0) ||
    (polarity === "higher_is_better" && percent < 0);

  if (!isWorse) return "low" as const;
  return Math.abs(percent) >= 0.2 ? ("high" as const) : ("med" as const);
};

const buildFallbackInsights = (fallbackEvidence?: EvidenceSlot[] | null) => {
  if (!fallbackEvidence || fallbackEvidence.length === 0) {
    return [
      {
        title: "AI ไม่พร้อมใช้งาน",
        detail:
          "แสดงสรุปจาก deterministic logic เท่านั้น (โปรดดู Evidence E1–E3 และแนวโน้มรายวันเพื่อประกอบการตัดสินใจ)",
        ...insightStyles.low,
      },
    ] satisfies AiInsightItem[];
  }

  return fallbackEvidence.map((slot) => {
    const current = formatEvidenceValue(slot.metricLabel, slot.value.current);
    const previous = formatEvidenceValue(slot.metricLabel, slot.value.previous);
    const percent =
      slot.value.percent != null
        ? `${slot.value.percent > 0 ? "+" : ""}${Math.round(slot.value.percent * 100)}%`
        : null;

    const severity = classifyEvidenceSeverity(slot);
    return {
      title: `${slot.id}: ${slot.title}`,
      detail: (
        <span className="font-thai text-sm leading-relaxed text-slate-600">
          <span className="font-medium text-slate-800">{slot.metricLabel}</span>
          : {current}
          {slot.value.previous != null ? (
            <span className="text-slate-500"> (ก่อนหน้า {previous})</span>
          ) : null}
          {percent ? (
            <span className="text-slate-500"> • {percent}</span>
          ) : null}
        </span>
      ),
      ...insightStyles[severity],
    } satisfies AiInsightItem;
  });
};

const buildFallbackRecommendations = (
  fallbackEvidence?: EvidenceSlot[] | null,
) => {
  const evidenceById = new Map(
    (fallbackEvidence ?? []).map((slot) => [slot.id, slot]),
  );
  const e1 = evidenceById.get("E1");
  const e2 = evidenceById.get("E2");
  const e3 = evidenceById.get("E3");

  const isWorse = (slot: EvidenceSlot | undefined) => {
    if (!slot) return false;
    const polarity = metricPolarity(slot.metricLabel);
    const percent = slot.value.percent;
    if (percent == null || polarity === "neutral") return false;
    return (
      (polarity === "lower_is_better" && percent > 0) ||
      (polarity === "higher_is_better" && percent < 0)
    );
  };

  const items: AiRecommendationItem[] = [];
  if (isWorse(e3)) {
    items.push({
      title: "รีเฟรชครีเอทีฟ (Creative)",
      detail:
        "มีสัญญาณล้า/เห็นซ้ำจาก Evidence E3 • พิจารณาเปลี่ยนมุมข้อความ/ภาพ และกระจายชุดโฆษณาให้หลากหลายขึ้น",
      ...recommendationStyles.high,
    });
  }
  if (isWorse(e1)) {
    items.push({
      title: "คุมต้นทุนการส่งมอบ",
      detail:
        "Evidence E1 บ่งชี้ว่าประสิทธิภาพต้นทุนแย่ลง • ตรวจสอบการกระจายงบ, placement, และตัวแปรที่ทำให้ Cost per Result/ROAS เปลี่ยน",
      ...recommendationStyles.med,
    });
  }
  if (isWorse(e2)) {
    items.push({
      title: "ทบทวนคุณภาพทราฟฟิก/กลุ่มเป้าหมาย",
      detail:
        "Evidence E2 ชี้ว่าคุณภาพการคลิก/การคอนเวิร์สลดลง • ตรวจสอบ creative-message fit และการกำหนดกลุ่มเป้าหมาย",
      ...recommendationStyles.low,
    });
  }

  if (items.length > 0) return items.slice(0, 3);

  return [
    {
      title: "ตรวจสอบสัญญาณจาก Evidence",
      detail:
        "AI ไม่พร้อมใช้งาน • ใช้ Evidence E1–E3 + แนวโน้มรายวันเพื่อหาสาเหตุหลักก่อนตัดสินใจปรับแคมเปญ",
      ...recommendationStyles.low,
    },
  ];
};

const statusMetaFromResult = (
  params:
    | { phase: "loading" }
    | { phase: "loaded"; status: AiSummaryResult["status"] },
) => {
  if (params.phase === "loading") {
    return { label: "กำลังวิเคราะห์", dot: "bg-indigo-500" };
  }

  return params.status === "ok"
    ? { label: "พร้อมใช้งาน", dot: "bg-green-400" }
    : params.status === "partial"
      ? { label: "บางส่วน", dot: "bg-amber-400" }
      : params.status === "disabled"
        ? { label: "ปิดใช้งาน", dot: "bg-slate-400" }
        : { label: "โหมดสำรอง", dot: "bg-amber-400" };
};

const SkeletonLine = ({ className }: { className: string }) => (
  <div className={`bg-slate-200/70 rounded ${className}`} />
);

const SkeletonCard = () => (
  <li className="group flex gap-3 text-sm text-slate-700 bg-white/80 p-3.5 rounded-lg border border-indigo-50 shadow-sm">
    <div className="mt-0.5 bg-indigo-100 w-6 h-6 rounded shrink-0 flex items-center justify-center text-indigo-500">
      <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
    </div>
    <div className="flex-1 space-y-2">
      <SkeletonLine className="h-3 w-44" />
      <SkeletonLine className="h-2.5 w-full" />
      <SkeletonLine className="h-2.5 w-5/6" />
    </div>
  </li>
);

export const AiCopilotPanel = ({
  adGroupId,
  periodDays,
  fallbackEvidence = null,
}: AiCopilotPanelProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<AiSummaryResult | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      const startedAt = Date.now();
      setIsLoading(true);
      setLoadingStep(0);
      try {
        const businessContext = readBusinessContextFromStorage().trim();
        const response = await fetch("/api/ai/summary", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            adGroupId,
            periodDays,
            mode: "full",
            ...(businessContext ? { businessContext } : null),
          }),
          signal,
        });

        if (!response.ok) {
          throw new Error(`AI summary request failed (${response.status})`);
        }

        const data = (await response.json()) as AiSummaryResult;
        setResult(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;

        setResult({
          status: "fallback",
          source: "live",
          insight: null,
          recommendation: null,
          reason: "error",
        });
      } finally {
        if (signal?.aborted) return;
        const elapsedMs = Date.now() - startedAt;
        if (elapsedMs < MIN_LOADING_MS) {
          await sleep(MIN_LOADING_MS - elapsedMs, signal);
        }
        if (signal?.aborted) return;
        setIsLoading(false);
      }
    },
    [adGroupId, periodDays],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!isLoading) return;
    const timer = window.setInterval(() => {
      setLoadingStep((current) => current + 1);
    }, LOADING_STEP_MS);
    return () => window.clearInterval(timer);
  }, [isLoading]);

  const statusMeta = useMemo(() => {
    return isLoading || !result
      ? statusMetaFromResult({ phase: "loading" })
      : statusMetaFromResult({ phase: "loaded", status: result.status });
  }, [isLoading, result]);

  const aiSubtitle = useMemo(() => {
    if (isLoading)
      return "กำลังวิเคราะห์ evidence เพื่อสรุป insight และคำแนะนำ…";
    return (
      result?.insight?.insightSummary ??
      "สรุปจาก evidence เพื่อหา insight และคำแนะนำที่ทำได้ทันที"
    );
  }, [isLoading, result]);

  const loadingMessage = useMemo(() => {
    return LOADING_MESSAGES[loadingStep % LOADING_MESSAGES.length];
  }, [loadingStep]);

  const aiInsights: AiInsightItem[] | null = useMemo(() => {
    if (isLoading) return null;
    if (result?.insight?.insights?.length) {
      return result.insight.insights.map((insight) => ({
        title: insight.title,
        detail: insight.detail,
        ...insightStyles[insight.severity],
      }));
    }
    return buildFallbackInsights(fallbackEvidence);
  }, [fallbackEvidence, isLoading, result]);

  const aiRecommendations: AiRecommendationItem[] | null = useMemo(() => {
    if (isLoading) return null;
    if (result?.recommendation?.recommendations?.length) {
      return result.recommendation.recommendations.map((item) => ({
        title: item.action,
        detail: item.reason,
        ...recommendationStyles[item.confidence],
      }));
    }
    return buildFallbackRecommendations(fallbackEvidence);
  }, [fallbackEvidence, isLoading, result]);

  const aiFooterText = useMemo(() => {
    if (isLoading) return "กำลังวิเคราะห์…";
    if (result?.status === "ok") {
      return "คำแนะนำนี้สร้างโดย AI จากภาพรวมตัวเลข โปรดตรวจสอบก่อนนำไปใช้";
    }
    return "ไม่สามารถสร้างสรุป AI ได้ในขณะนี้ (แสดงผลจาก deterministic logic เท่านั้น)";
  }, [isLoading, result]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  return (
    <div className="bg-linear-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl shadow-sm overflow-hidden mb-8 relative ring-1 ring-indigo-500/10">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-linear-to-b from-blue-500 to-indigo-600"></div>
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <i className="fa-solid fa-robot text-9xl text-indigo-900"></i>
      </div>

      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-indigo-200/50">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-indigo-900">
              <i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i>
              AI Copilot วิเคราะห์
            </h3>
            <p className="text-xs text-indigo-600/70 mt-0.5 font-medium ml-7">
              {aiSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-indigo-500 font-bold bg-white px-2 py-1 rounded border border-indigo-100 shadow-sm">
              {isLoading ? (
                <i className="fa-solid fa-circle-notch fa-spin mr-1"></i>
              ) : (
                <span
                  className={`w-1.5 h-1.5 ${statusMeta.dot} rounded-full inline-block mr-1`}
                ></span>
              )}
              {statusMeta.label}
            </span>
            <button
              type="button"
              onClick={refresh}
              disabled={isLoading}
              className="text-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="รีเฟรชการวิเคราะห์ AI"
            >
              <i className="fa-solid fa-rotate-right"></i>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="mb-5 bg-white/80 border border-indigo-100 rounded-lg px-3 py-2 text-xs text-indigo-700 flex items-center gap-2 shadow-sm">
            <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
              <i className="fa-solid fa-circle-notch fa-spin text-[10px]"></i>
            </span>
            <span className="font-bold">AI กำลังวิเคราะห์</span>
            <span className="text-indigo-600/80 font-medium">
              {loadingMessage}
            </span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider mb-3 flex items-center gap-2">
              <span className="bg-indigo-100 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                1
              </span>
              สรุปสถานการณ์
            </h4>
            <ul className="space-y-3">
              {aiInsights
                ? aiInsights.map((item, index) => (
                    <li
                      key={`${item.title}-${index}`}
                      className="group flex gap-3 text-sm text-slate-700 bg-white/80 p-3.5 rounded-lg border border-indigo-50 hover:border-indigo-200 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className={item.iconWrapperClass}>
                        <i className={item.iconClass}></i>
                      </div>
                      <div className="flex-1">
                        <span className="font-bold block text-slate-900 mb-1">
                          {item.title}
                        </span>
                        <span className="text-slate-600 font-thai text-sm leading-relaxed">
                          {item.detail}
                        </span>
                      </div>
                    </li>
                  ))
                : Array.from({ length: 2 }, (_, index) => (
                    <SkeletonCard key={`insight-skeleton-${index}`} />
                  ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider mb-3 flex items-center gap-2">
              <span className="bg-indigo-100 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                2
              </span>
              คำแนะนำที่ทำได้ทันที
            </h4>
            <ul className="space-y-3">
              {aiRecommendations
                ? aiRecommendations.map((item, index) => (
                    <li
                      key={`${item.title}-${index}`}
                      className="group flex gap-3 text-sm text-slate-700 bg-white p-3.5 rounded-lg border border-indigo-100 hover:border-indigo-200 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className={item.iconWrapperClass}>
                        <i className={item.iconClass}></i>
                      </div>
                      <div className="flex-1">
                        <span className="font-bold block text-slate-900 mb-1">
                          {item.title}
                        </span>
                        <p className="text-slate-500 text-xs font-thai leading-relaxed">
                          {item.detail}
                        </p>
                      </div>
                    </li>
                  ))
                : Array.from({ length: 2 }, (_, index) => (
                    <SkeletonCard key={`reco-skeleton-${index}`} />
                  ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50/50 px-6 py-2 text-[10px] text-indigo-400 text-center border-t border-indigo-100 font-medium">
        <i className="fa-brands fa-markdown mr-1"></i> {aiFooterText}
      </div>
    </div>
  );
};
