import { getAdGroupDetail } from "@/lib/data/review";
import { AI_CONFIG } from "@/lib/config/ai";
import { z } from "zod";
import {
  InsightJSONSchema,
  RecommendationJSONSchema,
  type InsightJSON,
  type RecommendationJSON,
} from "@/lib/ai/contracts";
import { AiHttpError, callAishop24h } from "@/lib/ai/client";

export type AiSummaryStatus = "ok" | "partial" | "fallback" | "disabled";
export type AiSummaryMode = "insight" | "full";
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

const AI_CACHE_VERSION = "v2";

const normalizeBusinessContext = (value: string | null | undefined) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 2000);
};

const hashText = (value: string) => {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
};

const AiSummaryResultSchema = z.object({
  status: z.enum(["ok", "partial", "fallback", "disabled"]),
  source: z.enum(["live", "cache"]).default("cache"),
  insight: InsightJSONSchema.nullable(),
  recommendation: RecommendationJSONSchema.nullable(),
  reason: z
    .enum(["missing_config", "invalid_json", "timeout", "error"])
    .optional(),
});

const logAiEvent = (
  level: AiLogLevel,
  event: string,
  payload: Record<string, unknown>,
) => {
  const logger = console[level] ?? console.info;
  logger(`[ai] ${event}`, payload);
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<AiSummaryResult>>();

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const remoteCache =
  AI_CONFIG.cacheRemoteEnabled &&
  AI_CONFIG.cacheRestUrl &&
  AI_CONFIG.cacheRestToken
    ? {
        url: stripTrailingSlash(AI_CONFIG.cacheRestUrl),
        token: AI_CONFIG.cacheRestToken,
        timeoutMs: AI_CONFIG.cacheRemoteTimeoutMs,
      }
    : null;

const readCachedLocal = (key: string) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const writeCachedLocal = (
  key: string,
  value: AiSummaryResult,
  ttlMs: number,
) => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

type UpstashPipelineItem = { result?: unknown; error?: unknown };

const upstashExtractResult = (item: unknown) => {
  if (!item) return null;
  if (typeof item === "object" && "result" in item) {
    return (item as UpstashPipelineItem).result ?? null;
  }
  return item;
};

const upstashPipeline = async (commands: unknown[][]) => {
  if (!remoteCache) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), remoteCache.timeoutMs);
  try {
    const response = await fetch(`${remoteCache.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${remoteCache.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      signal: controller.signal,
    });

    if (!response.ok) return null;
    const payload = (await response.json().catch(() => null)) as unknown;
    return Array.isArray(payload) ? payload : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const readCachedRemote = async (
  key: string,
): Promise<AiSummaryResult | null> => {
  const items = await upstashPipeline([["GET", key]]);
  if (!items) return null;
  const raw = upstashExtractResult(items[0]);
  if (typeof raw !== "string") return null;

  try {
    const parsedJson = JSON.parse(raw) as unknown;
    const parsed = AiSummaryResultSchema.safeParse(parsedJson);
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

const writeCachedRemote = async (
  key: string,
  value: AiSummaryResult,
  ttlMs: number,
) => {
  const ttl = Math.max(1000, Math.round(ttlMs));
  const payload = JSON.stringify(value);
  await upstashPipeline([["SET", key, payload, "PX", ttl]]).catch(() => null);
};

const getCached = async (key: string) => {
  const local = readCachedLocal(key);
  if (local) return local;

  const remote = await readCachedRemote(key);
  if (!remote) return null;

  writeCachedLocal(key, remote, AI_CONFIG.cacheTtlMs);
  return remote;
};

const setCached = async (
  key: string,
  value: AiSummaryResult,
  ttlMs: number,
) => {
  writeCachedLocal(key, value, ttlMs);
  if (remoteCache) {
    await writeCachedRemote(key, value, ttlMs);
  }
};

const buildInsightMessages = (payload: Record<string, unknown>) => {
  const system =
    "You are an AI analyst for media buyers. Return only valid JSON. Do not invent numbers. Use only provided values. Every insight and bullet must reference evidenceRef entries (E1-E3).";

  const user = JSON.stringify({
    task: "Generate InsightJSON from provided derived metrics and evidence.",
    constraints: {
      noNewNumbers: true,
      maxInsights: 2,
      maxEvidenceBullets: 3,
      maxLimits: 3,
    },
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

const buildRecommendationMessages = (
  insight: InsightJSON,
  locale: string,
  businessContext?: string | null,
) => {
  const system =
    "You are an AI strategist. Return only valid JSON. Do not use raw metrics or add new numbers. Base every recommendation on insight and evidence references.";

  const user = JSON.stringify({
    task: "Generate RecommendationJSON from InsightJSON only.",
    locale,
    businessContext: businessContext ?? null,
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

const clampInsight = (insight: InsightJSON): InsightJSON => ({
  ...insight,
  evidenceBullets: insight.evidenceBullets.slice(0, 3),
  insights: insight.insights.slice(0, 2),
  limits: insight.limits.slice(0, 3),
});

const clampRecommendation = (
  recommendation: RecommendationJSON,
): RecommendationJSON => ({
  ...recommendation,
  recommendations: recommendation.recommendations.slice(0, 3),
});

const classifyError = (error: unknown): AiErrorReason => {
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  return "error";
};

const truncate = (value: string, max = 600) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
};

const safeJsonStringify = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

const safeHost = (value: string) => {
  try {
    return new URL(value).host;
  } catch {
    return value;
  }
};

const errorMeta = (error: unknown) => {
  if (error instanceof AiHttpError) {
    return {
      type: "http",
      status: error.status,
      statusText: error.statusText,
      host: safeHost(error.url),
      requestId: error.requestId,
      bodySnippet: error.bodyText ? truncate(error.bodyText, 800) : null,
    };
  }

  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause;
    const causeMeta =
      cause instanceof AiHttpError
        ? {
            type: "http",
            status: cause.status,
            statusText: cause.statusText,
            host: safeHost(cause.url),
            requestId: cause.requestId,
            bodySnippet: cause.bodyText ? truncate(cause.bodyText, 800) : null,
          }
        : cause instanceof Error
          ? { name: cause.name, message: cause.message }
          : typeof cause === "string"
            ? { message: cause }
            : cause
              ? {
                  value:
                    truncate(safeJsonStringify(cause) ?? String(cause), 400) ??
                    null,
                }
              : null;

    return {
      type: "exception",
      name: error.name,
      message: error.message,
      stack: error.stack ? truncate(error.stack, 1200) : null,
      cause: causeMeta,
    };
  }

  if (typeof error === "string") return { type: "unknown", message: error };
  try {
    return { type: "unknown", value: truncate(JSON.stringify(error), 400) };
  } catch {
    return { type: "unknown", value: String(error) };
  }
};

const buildInsightPayload = (
  detail: Awaited<ReturnType<typeof getAdGroupDetail>>,
  businessContext?: string | null,
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
      businessContext: businessContext ?? null,
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
        model: AI_CONFIG.modelInsight,
        host: safeHost(AI_CONFIG.apiUrl ?? ""),
        issues: parsed.error.issues.slice(0, 3).map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
        resultPreview: truncate(
          typeof result === "string"
            ? result
            : (safeJsonStringify(result) ?? "[unserializable result]"),
          800,
        ),
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
      model: AI_CONFIG.modelInsight,
      host: safeHost(AI_CONFIG.apiUrl ?? ""),
      error: errorMeta(error),
    });
    return { ok: false, reason, data: null };
  }
};

const callRecommendationStage = async (
  insight: InsightJSON,
  meta: { adGroupId: string; businessContext?: string | null },
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
      messages: buildRecommendationMessages(
        insight,
        AI_CONFIG.locale,
        meta.businessContext ?? null,
      ),
      temperature: 0.3,
      timeoutMs: AI_CONFIG.timeoutMs,
      useResponseFormat: AI_CONFIG.useResponseFormat,
    });
    const parsed = RecommendationJSONSchema.safeParse(result);
    if (!parsed.success) {
      logAiEvent("warn", "invalid_json", {
        stage: "recommendation",
        adGroupId: meta.adGroupId,
        model: AI_CONFIG.modelReco,
        host: safeHost(AI_CONFIG.apiUrl ?? ""),
        issues: parsed.error.issues.slice(0, 3).map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
        resultPreview: truncate(
          typeof result === "string"
            ? result
            : (safeJsonStringify(result) ?? "[unserializable result]"),
          800,
        ),
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
      model: AI_CONFIG.modelReco,
      host: safeHost(AI_CONFIG.apiUrl ?? ""),
      error: errorMeta(error),
    });
    return { ok: false, reason, data: null };
  }
};

export const getAiSummary = async (params: {
  adGroupId: string;
  periodDays?: number;
  mode?: AiSummaryMode;
  detail?: Awaited<ReturnType<typeof getAdGroupDetail>> | null;
  businessContext?: string | null;
}): Promise<AiSummaryResult> => {
  const mode = params.mode ?? "full";
  const businessContext = normalizeBusinessContext(params.businessContext);
  const contextKey = businessContext ? `:bc:${hashText(businessContext)}` : "";
  const baseKey = `ai_summary:${AI_CACHE_VERSION}:${params.adGroupId}:${params.periodDays ?? "default"}:${AI_CONFIG.locale}${contextKey}`;
  const insightKey = `${baseKey}:insight`;
  const fullKey = `${baseKey}:full`;
  const cacheKey = mode === "full" ? fullKey : insightKey;
  const cached = await getCached(cacheKey);
  if (cached) {
    logAiEvent("info", "cache_hit", {
      adGroupId: params.adGroupId,
      periodDays: params.periodDays ?? null,
      mode,
      status: cached.status,
    });
    return { ...cached, source: "cache" };
  }

  if (mode === "insight") {
    const cachedFull = await getCached(fullKey);
    if (cachedFull?.insight) {
      return {
        status: "partial",
        source: "cache",
        insight: cachedFull.insight,
        recommendation: null,
        reason:
          cachedFull.status === "partial" || cachedFull.status === "fallback"
            ? cachedFull.reason
            : undefined,
      };
    }
  }

  const pending = inflight.get(cacheKey);
  if (pending) {
    return pending;
  }

  const promise: Promise<AiSummaryResult> =
    (async (): Promise<AiSummaryResult> => {
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

      const payload = buildInsightPayload(detail, businessContext);
      if (!payload) {
        return {
          status: "fallback",
          source: "live",
          insight: null,
          recommendation: null,
          reason: "error",
        };
      }

      const cachedInsight =
        mode === "full" ? (await getCached(insightKey))?.insight : null;
      const insightStage = cachedInsight
        ? { ok: true as const, data: cachedInsight }
        : await callInsightStage(payload, {
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
        await setCached(cacheKey, result, AI_CONFIG.cacheTtlMs);
        return result;
      }

      const clampedInsight = clampInsight(insightStage.data);
      if (!cachedInsight) {
        await setCached(
          insightKey,
          {
            status: "partial",
            source: "live",
            insight: clampedInsight,
            recommendation: null,
          },
          AI_CONFIG.cacheTtlMs,
        );
      }

      if (mode === "insight") {
        const result: AiSummaryResult = {
          status: "partial",
          source: "live",
          insight: clampedInsight,
          recommendation: null,
        };
        await setCached(cacheKey, result, AI_CONFIG.cacheTtlMs);
        return result;
      }

      const recommendationStage = await callRecommendationStage(
        clampedInsight,
        {
          adGroupId: params.adGroupId,
          businessContext,
        },
      );
      if (!recommendationStage.ok || !recommendationStage.data) {
        const result: AiSummaryResult = {
          status: "partial",
          source: "live",
          insight: clampedInsight,
          recommendation: null,
          reason: recommendationStage.reason,
        };
        await setCached(cacheKey, result, AI_CONFIG.cacheTtlMs);
        return result;
      }

      const result: AiSummaryResult = {
        status: "ok",
        source: "live",
        insight: clampedInsight,
        recommendation: clampRecommendation(recommendationStage.data),
      };
      await setCached(cacheKey, result, AI_CONFIG.cacheTtlMs);
      return result;
    })();

  inflight.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(cacheKey);
  }
};
