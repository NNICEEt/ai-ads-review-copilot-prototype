"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { InsightJSON, RecommendationJSON } from "@/lib/ai/contracts";

type AiSummaryStatus = "ok" | "partial" | "fallback" | "disabled";
type AiSummarySource = "live" | "cache";

type AiSummaryResult = {
  status: AiSummaryStatus;
  source: AiSummarySource;
  insight: InsightJSON | null;
  recommendation: RecommendationJSON | null;
  reason?: "missing_config" | "invalid_json" | "timeout" | "error";
};

type AiInsightSnippetProps = {
  adGroupId: string;
  periodDays: number;
  fallbackTitle: string;
  fallbackDetail?: string | null;
  variant?: "compact" | "card";
  tone?: "danger" | "warn" | "success" | "neutral";
  autoLoad?: boolean;
};

const MIN_LOADING_MS = 700;
const LOADING_STEP_MS = 900;
const LOADING_MESSAGES = [
  "กำลังอ่านสัญญาณจาก CPR/CTR/Frequency…",
  "กำลังสรุป insight แบบกระชับ…",
  "กำลังจัดลำดับสิ่งที่ควรทำก่อน…",
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

const statusMeta = (
  params:
    | { phase: "idle" }
    | { phase: "loading" }
    | { phase: "loaded"; status: AiSummaryStatus },
) => {
  if (params.phase === "idle") {
    return { label: "สรุปด้วย AI", dot: "bg-slate-400" };
  }

  if (params.phase === "loading") {
    return { label: "กำลังวิเคราะห์", dot: "bg-indigo-500" };
  }

  return params.status === "ok"
    ? { label: "AI", dot: "bg-emerald-500" }
    : params.status === "partial"
      ? { label: "AI (บางส่วน)", dot: "bg-amber-500" }
      : { label: "โหมดสำรอง", dot: "bg-slate-400" };
};

const toneStyles = {
  danger: {
    wrapper: "bg-red-50/70 border-red-200",
    title: "text-red-700",
    iconWrapper: "bg-red-100 text-red-600 border border-red-200",
    iconClass: "fa-solid fa-triangle-exclamation",
  },
  warn: {
    wrapper: "bg-amber-50/70 border-amber-200",
    title: "text-amber-800",
    iconWrapper: "bg-amber-100 text-amber-700 border border-amber-200",
    iconClass: "fa-solid fa-circle-exclamation",
  },
  success: {
    wrapper: "bg-emerald-50/70 border-emerald-200",
    title: "text-emerald-800",
    iconWrapper: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    iconClass: "fa-solid fa-check",
  },
  neutral: {
    wrapper: "bg-slate-50/70 border-slate-200",
    title: "text-slate-800",
    iconWrapper: "bg-slate-100 text-slate-600 border border-slate-200",
    iconClass: "fa-solid fa-minus",
  },
} as const;

export const AiInsightSnippet = ({
  adGroupId,
  periodDays,
  fallbackTitle,
  fallbackDetail = null,
  variant = "compact",
  tone = "neutral",
  autoLoad = true,
}: AiInsightSnippetProps) => {
  const [result, setResult] = useState<AiSummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [loadingStep, setLoadingStep] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      const startedAt = Date.now();
      setIsLoading(true);

      try {
        const response = await fetch("/api/ai/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adGroupId, periodDays, mode: "insight" }),
          signal,
        });
        if (!response.ok) {
          throw new Error(`AI summary request failed (${response.status})`);
        }
        const data = (await response.json()) as AiSummaryResult;
        if (signal?.aborted) return;
        setResult(data);
      } catch (error) {
        if (signal?.aborted) return;
        console.warn("[ai] summary request error", { adGroupId, error });
        setResult({
          status: "fallback",
          source: "live",
          insight: null,
          recommendation: null,
          reason: "error",
        });
      }

      const elapsedMs = Date.now() - startedAt;
      if (elapsedMs < MIN_LOADING_MS) {
        await sleep(MIN_LOADING_MS - elapsedMs, signal);
      }
      if (signal?.aborted) return;
      setIsLoading(false);
    },
    [adGroupId, periodDays],
  );

  useEffect(() => {
    if (!autoLoad) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    void load(controller.signal);
    return () => controller.abort();
  }, [autoLoad, load]);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    const timer = window.setInterval(() => {
      setLoadingStep((current) => current + 1);
    }, LOADING_STEP_MS);
    return () => window.clearInterval(timer);
  }, [isLoading]);

  const insight = useMemo(() => {
    if (isLoading) return null;
    return result?.insight?.insights?.[0] ?? null;
  }, [isLoading, result]);

  const requestAi = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    void load(controller.signal);
  }, [load]);

  const meta = useMemo(() => {
    if (isLoading) return statusMeta({ phase: "loading" });
    if (!result) return statusMeta({ phase: "idle" });
    return statusMeta({ phase: "loaded", status: result.status });
  }, [isLoading, result]);

  const title = insight?.title ?? fallbackTitle;
  const detail = insight?.detail ?? fallbackDetail;

  const loadingText = useMemo(() => {
    return LOADING_MESSAGES[loadingStep % LOADING_MESSAGES.length];
  }, [loadingStep]);

  if (variant === "card") {
    const toneStyle = toneStyles[tone];
    return (
      <div className={`rounded-lg p-2 border ${toneStyle.wrapper}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-bold flex items-center gap-2">
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded ${toneStyle.iconWrapper} shrink-0`}
            >
              {isLoading ? (
                <i className="fa-solid fa-rotate fa-spin text-[10px]"></i>
              ) : (
                <i className={`${toneStyle.iconClass} text-[10px]`}></i>
              )}
            </span>
            <span
              className={isLoading ? "text-slate-700" : toneStyle.title}
              title={title}
            >
              {isLoading ? fallbackTitle : title}
            </span>
          </div>
          {!autoLoad && !isLoading && !result ? (
            <button
              type="button"
              onClick={requestAi}
              className="text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
            >
              {meta.label}
            </button>
          ) : (
            <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              {meta.label}
            </span>
          )}
        </div>

        <p className="mt-1 text-[10px] text-slate-600 font-thai leading-snug">
          {isLoading ? fallbackDetail || loadingText : detail || "—"}
        </p>
      </div>
    );
  }

  if (!autoLoad && !isLoading && !result) {
    return (
      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 font-thai leading-snug">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-slate-50 text-slate-600 border border-slate-200 shrink-0">
          <i className="fa-solid fa-robot text-[10px]"></i>
        </span>
        <span className="text-slate-600 font-medium">{fallbackTitle}</span>
        <button
          type="button"
          onClick={requestAi}
          className="text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
        >
          สรุปด้วย AI
        </button>
      </div>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 font-thai leading-snug">
      <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
        {isLoading ? (
          <i className="fa-solid fa-rotate fa-spin text-[10px]"></i>
        ) : (
          <i className="fa-solid fa-robot text-[10px]"></i>
        )}
      </span>
      <span>
        {isLoading ? (
          fallbackTitle || loadingText
        ) : (
          <>
            <span className="text-slate-500 mr-1">AI:</span>
            <span className="font-medium text-slate-600">{title}</span>
          </>
        )}
      </span>
    </div>
  );
};
