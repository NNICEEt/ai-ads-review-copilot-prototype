"use client";

import type { InsightJSON, RecommendationJSON } from "@/lib/ai/contracts";

type AiSummaryStatus = "ok" | "partial" | "fallback" | "disabled";
type AiSummarySource = "live" | "cache";

export type AiSummaryResult = {
  status: AiSummaryStatus;
  source: AiSummarySource;
  insight: InsightJSON | null;
  recommendation: RecommendationJSON | null;
  reason?: "missing_config" | "invalid_json" | "timeout" | "error";
};

type CacheKey = string;
type CacheListener = (key: CacheKey, value: AiSummaryResult) => void;

const cache = new Map<CacheKey, AiSummaryResult>();
const listeners = new Set<CacheListener>();

export const buildAiInsightCacheKey = (params: {
  adGroupId: string;
  periodDays: number;
  contextKey: string;
}) => `${params.adGroupId}:${params.periodDays}:${params.contextKey}`;

export const getAiInsightCached = (key: CacheKey) => cache.get(key) ?? null;

export const publishAiInsightCached = (
  key: CacheKey,
  value: AiSummaryResult,
) => {
  cache.set(key, value);
  listeners.forEach((listener) => listener(key, value));
};

export const subscribeAiInsightCache = (listener: CacheListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
