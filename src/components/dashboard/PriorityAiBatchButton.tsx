"use client";

import { useMemo, useState } from "react";
import {
  buildAiInsightCacheKey,
  publishAiInsightCached,
  type AiSummaryResult,
} from "@/components/ai/aiClientCache";
import {
  readBusinessContextFromStorage,
  readBusinessContextKeyFromStorage,
} from "@/components/ai/businessContextStorage";

type PriorityAiBatchButtonProps = {
  items: Array<{ adGroupId: string; periodDays: number }>;
};

type BatchResponse = {
  items: Array<{ adGroupId: string; result: AiSummaryResult }>;
  periodDays: number;
  mode: "insight";
};

export const PriorityAiBatchButton = ({
  items,
}: PriorityAiBatchButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const payload = useMemo(() => {
    if (items.length === 0) return null;
    const periodDays = items[0]?.periodDays ?? 7;
    const adGroupIds = Array.from(new Set(items.map((item) => item.adGroupId)));
    return { adGroupIds, periodDays };
  }, [items]);

  if (!payload) return null;

  const label = `สรุป AI (${payload.adGroupIds.length} รายการ)`;

  return (
    <button
      type="button"
      className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition-colors disabled:opacity-60"
      onClick={async () => {
        setIsLoading(true);
        try {
          const businessContext = readBusinessContextFromStorage().trim();
          const response = await fetch("/api/ai/summary/batch", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              ...payload,
              ...(businessContext ? { businessContext } : null),
            }),
          });
          if (!response.ok) {
            throw new Error(`Batch AI request failed (${response.status})`);
          }
          const data = (await response.json()) as BatchResponse;
          const contextKey = readBusinessContextKeyFromStorage();
          data.items.forEach((item) => {
            const key = buildAiInsightCacheKey({
              adGroupId: item.adGroupId,
              periodDays: data.periodDays,
              contextKey,
            });
            publishAiInsightCached(key, item.result);
          });
        } finally {
          setIsLoading(false);
        }
      }}
      aria-label={label}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <i className="fa-solid fa-rotate fa-spin mr-1"></i>
          กำลังสรุป…
        </>
      ) : (
        <>
          <i className="fa-solid fa-wand-magic-sparkles mr-1"></i>
          {label}
        </>
      )}
    </button>
  );
};
