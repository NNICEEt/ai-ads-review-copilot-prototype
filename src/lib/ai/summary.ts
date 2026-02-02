import { getAdGroupDetail } from "@/lib/data/review";
import { AI_CONFIG } from "@/lib/config/ai";
import {
  InsightJSONSchema,
  RecommendationJSONSchema,
  type InsightJSON,
  type RecommendationJSON,
} from "@/lib/ai/contracts";
import { callAishop24h } from "@/lib/ai/client";

export type AiSummaryStatus = "ok" | "partial" | "fallback" | "disabled";
export type AiSummarySource = "live" | "cache";

export type AiSummaryResult = {
  status: AiSummaryStatus;
  source: AiSummarySource;
  insight: InsightJSON | null;
  recommendation: RecommendationJSON | null;
  reason?: "missing_config" | "invalid_json" | "timeout" | "error";
};

type AiErrorReason = NonNullable<AiSummaryResult["reason"]>;

type CacheEntry = {
  value: AiSummaryResult;
  expiresAt: number;
};

type AiLogLevel = "info" | "warn" | "error";

const logAiEvent = (
  level: AiLogLevel,
  event: string,
  payload: Record<string, unknown>,
) => {
  const logger = console[level] ?? console.info;
  logger(`[ai] ${event}`, payload);
};

const cache = new Map<string, CacheEntry>();

const getCached = (key: string) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const setCached = (key: string, value: AiSummaryResult, ttlMs: number) => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

const buildInsightMessages = (payload: Record<string, unknown>) => {
  const system =
    "You are an AI analyst for media buyers. Return only valid JSON. Do not invent numbers. Use only provided values. Every insight and bullet must reference evidenceRef entries (E1-E3).";

  const user = JSON.stringify({
    task: "Generate InsightJSON from provided derived metrics and evidence.",
    schema: {
      insightSummary: "string",
      evidenceBullets: [{ text: "string", evidenceRef: ["E1"] }],
      insights: [
        {
          type: "efficiency|traffic_quality|creative_fatigue|volume|learning",
          title: "string",
          detail: "string",
          severity: "low|med|high",
          evidenceRef: ["E2"],
        },
      ],
      limits: ["string"],
    },
    payload,
  });

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
};

const buildRecommendationMessages = (insight: InsightJSON, locale: string) => {
  const system =
    "You are an AI strategist. Return only valid JSON. Do not use raw metrics or add new numbers. Base every recommendation on insight and evidence references.";

  const user = JSON.stringify({
    task: "Generate RecommendationJSON from InsightJSON only.",
    locale,
    constraints: {
      noRawMetrics: true,
      noNewNumbers: true,
      maxRecommendations: 3,
    },
    schema: {
      summary: "string",
      recommendations: [
        {
          action: "string",
          reason: "string",
          confidence: "low|med|high",
          basedOn: ["insight:creative_fatigue", "evidence:E3"],
        },
      ],
      notes: "string",
    },
    insight,
  });

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
};

const classifyError = (error: unknown): AiErrorReason => {
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  return "error";
};

const buildInsightPayload = (
  detail: Awaited<ReturnType<typeof getAdGroupDetail>>,
) => {
  if (!detail) return null;
  return {
    locale: AI_CONFIG.locale,
    context: {
      campaignName: detail.campaign.name,
      adGroupName: detail.adGroup.name,
      periodDays: detail.period.days,
      score: detail.score,
      label: detail.label,
      currency: "THB",
      currencyMinorUnit: "satang",
    },
    derivedMetrics: detail.derived,
    evidence: detail.evidence.map((slot) => ({
      id: slot.id,
      title: slot.title,
      metricLabel: slot.metricLabel,
      current: slot.value.current,
      previous: slot.value.previous,
      percent: slot.value.percent,
    })),
  };
};

const callInsightStage = async (
  payload: Record<string, unknown>,
  meta: { adGroupId: string },
): Promise<
  | { ok: true; data: InsightJSON }
  | { ok: false; reason: AiErrorReason; data: null }
> => {
  const apiKey = AI_CONFIG.apiKeyInsight || AI_CONFIG.apiKeyDefault;
  if (!AI_CONFIG.apiUrl || !apiKey || !AI_CONFIG.modelInsight) {
    logAiEvent("warn", "missing_config", {
      stage: "insight",
      adGroupId: meta.adGroupId,
    });
    return { ok: false, reason: "missing_config" as const, data: null };
  }

  try {
    logAiEvent("info", "request_start", {
      stage: "insight",
      adGroupId: meta.adGroupId,
      model: AI_CONFIG.modelInsight,
      timeoutMs: AI_CONFIG.timeoutMs,
    });
    const result = await callAishop24h({
      apiUrl: AI_CONFIG.apiUrl,
      apiKey,
      model: AI_CONFIG.modelInsight,
      messages: buildInsightMessages(payload),
      temperature: 0.2,
      timeoutMs: AI_CONFIG.timeoutMs,
      useResponseFormat: AI_CONFIG.useResponseFormat,
    });
    const parsed = InsightJSONSchema.safeParse(result);
    if (!parsed.success) {
      logAiEvent("warn", "invalid_json", {
        stage: "insight",
        adGroupId: meta.adGroupId,
      });
      return { ok: false, reason: "invalid_json" as const, data: null };
    }
    logAiEvent("info", "request_success", {
      stage: "insight",
      adGroupId: meta.adGroupId,
    });
    return { ok: true, data: parsed.data };
  } catch (error) {
    const reason = classifyError(error);
    logAiEvent("warn", "request_error", {
      stage: "insight",
      adGroupId: meta.adGroupId,
      reason,
    });
    return { ok: false, reason, data: null };
  }
};

const callRecommendationStage = async (
  insight: InsightJSON,
  meta: { adGroupId: string },
): Promise<
  | { ok: true; data: RecommendationJSON }
  | { ok: false; reason: AiErrorReason; data: null }
> => {
  const apiKey = AI_CONFIG.apiKeyReco || AI_CONFIG.apiKeyDefault;
  if (!AI_CONFIG.apiUrl || !apiKey || !AI_CONFIG.modelReco) {
    logAiEvent("warn", "missing_config", {
      stage: "recommendation",
      adGroupId: meta.adGroupId,
    });
    return { ok: false, reason: "missing_config" as const, data: null };
  }

  try {
    logAiEvent("info", "request_start", {
      stage: "recommendation",
      adGroupId: meta.adGroupId,
      model: AI_CONFIG.modelReco,
      timeoutMs: AI_CONFIG.timeoutMs,
    });
    const result = await callAishop24h({
      apiUrl: AI_CONFIG.apiUrl,
      apiKey,
      model: AI_CONFIG.modelReco,
      messages: buildRecommendationMessages(insight, AI_CONFIG.locale),
      temperature: 0.3,
      timeoutMs: AI_CONFIG.timeoutMs,
      useResponseFormat: AI_CONFIG.useResponseFormat,
    });
    const parsed = RecommendationJSONSchema.safeParse(result);
    if (!parsed.success) {
      logAiEvent("warn", "invalid_json", {
        stage: "recommendation",
        adGroupId: meta.adGroupId,
      });
      return { ok: false, reason: "invalid_json" as const, data: null };
    }
    logAiEvent("info", "request_success", {
      stage: "recommendation",
      adGroupId: meta.adGroupId,
    });
    return { ok: true, data: parsed.data };
  } catch (error) {
    const reason = classifyError(error);
    logAiEvent("warn", "request_error", {
      stage: "recommendation",
      adGroupId: meta.adGroupId,
      reason,
    });
    return { ok: false, reason, data: null };
  }
};

export const getAiSummary = async (params: {
  adGroupId: string;
  periodDays?: number;
  detail?: Awaited<ReturnType<typeof getAdGroupDetail>> | null;
}): Promise<AiSummaryResult> => {
  const cacheKey = `${params.adGroupId}:${params.periodDays ?? "default"}:${AI_CONFIG.locale}`;
  const cached = getCached(cacheKey);
  if (cached) {
    logAiEvent("info", "cache_hit", {
      adGroupId: params.adGroupId,
      periodDays: params.periodDays ?? null,
      status: cached.status,
    });
    return { ...cached, source: "cache" };
  }

  const detail =
    params.detail ??
    (await getAdGroupDetail({
      adGroupId: params.adGroupId,
      periodDays: params.periodDays ?? null,
    }));
  if (!detail) {
    return {
      status: "fallback",
      source: "live",
      insight: null,
      recommendation: null,
      reason: "error",
    };
  }

  const payload = buildInsightPayload(detail);
  if (!payload) {
    return {
      status: "fallback",
      source: "live",
      insight: null,
      recommendation: null,
      reason: "error",
    };
  }

  const insightStage = await callInsightStage(payload, {
    adGroupId: params.adGroupId,
  });
  if (!insightStage.ok || !insightStage.data) {
    const status =
      insightStage.reason === "missing_config" ? "disabled" : "fallback";
    const result: AiSummaryResult = {
      status,
      source: "live",
      insight: null,
      recommendation: null,
      reason: insightStage.reason,
    };
    setCached(cacheKey, result, AI_CONFIG.cacheTtlMs);
    return result;
  }

  const recommendationStage = await callRecommendationStage(insightStage.data, {
    adGroupId: params.adGroupId,
  });
  if (!recommendationStage.ok || !recommendationStage.data) {
    const result: AiSummaryResult = {
      status: "partial",
      source: "live",
      insight: insightStage.data,
      recommendation: null,
      reason: recommendationStage.reason,
    };
    setCached(cacheKey, result, AI_CONFIG.cacheTtlMs);
    return result;
  }

  const result: AiSummaryResult = {
    status: "ok",
    source: "live",
    insight: insightStage.data,
    recommendation: recommendationStage.data,
  };
  setCached(cacheKey, result, AI_CONFIG.cacheTtlMs);
  return result;
};
