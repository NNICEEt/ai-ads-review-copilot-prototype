import { describe, expect, it, vi } from "vitest";
import type { getAdGroupDetail } from "@/lib/data/review";
import { deltaValue } from "@/lib/analysis/metrics";

const callAishop24h = vi.fn(async (params: { model: string }) => {
  if (params.model === "insight-model") {
    return {
      insightSummary:
        "สรุปจาก evidence (deterministic) เพื่อช่วยตัดสินใจเร็วขึ้น",
      evidenceBullets: [
        { text: "E1 ชี้ว่าต้นทุนเปลี่ยนไป", evidenceRef: ["E1"] },
        { text: "E2 ชี้ว่าคุณภาพทราฟฟิกเปลี่ยนไป", evidenceRef: ["E2"] },
        { text: "E3 ชี้สัญญาณ fatigue", evidenceRef: ["E3"] },
        { text: "ควรถูกตัดทิ้งโดย clamp", evidenceRef: ["E1"] },
      ],
      insights: [
        {
          type: "creative_fatigue",
          title: "Fatigue signal",
          detail: "เริ่มเห็นสัญญาณความถี่สูงขึ้น",
          severity: "high",
          evidenceRef: ["E3"],
        },
        {
          type: "efficiency",
          title: "Cost efficiency",
          detail: "ต้นทุนเริ่มแย่ลง",
          severity: "med",
          evidenceRef: ["E1"],
        },
        {
          type: "traffic_quality",
          title: "Extra insight (should be clamped)",
          detail: "ควรถูกตัดทิ้ง",
          severity: "low",
          evidenceRef: ["E2"],
        },
      ],
      limits: ["Limit 1", "Limit 2", "Limit 3", "Limit 4 (should be clamped)"],
    };
  }

  if (params.model === "reco-model") {
    return {
      summary: "สรุปคำแนะนำจาก insight",
      recommendations: [
        {
          action: "Action 1",
          reason: "Reason 1",
          confidence: "high",
          basedOn: ["insight:creative_fatigue", "evidence:E3"],
        },
      ],
      notes: "Notes",
    };
  }

  throw new Error(`Unexpected model: ${params.model}`);
});

vi.mock("@/lib/config/ai", () => ({
  AI_CONFIG: {
    apiUrl: "https://example.com/v1/chat/completions",
    apiKeyDefault: "test-key",
    apiKeyInsight: "",
    apiKeyReco: "",
    modelInsight: "insight-model",
    modelReco: "reco-model",
    timeoutMs: 2000,
    cacheTtlMs: 300000,
    locale: "th-TH",
    useResponseFormat: false,
  },
}));

vi.mock("@/lib/ai/client", () => ({
  callAishop24h,
  AiHttpError: class AiHttpError extends Error {},
}));

describe("AI summary mode", () => {
  it('mode="insight" returns insight only and clamps arrays', async () => {
    const { getAiSummary } = await import("./summary");

    type AdGroupDetail = Awaited<ReturnType<typeof getAdGroupDetail>>;
    const detail: NonNullable<AdGroupDetail> = {
      period: {
        days: 7,
        current: { start: new Date(), end: new Date() },
        previous: { start: new Date(), end: new Date() },
      },
      campaign: {
        id: "camp_mode",
        accountId: "acc_1",
        name: "Campaign",
        objective: "Conversions",
        status: "ACTIVE",
      },
      adGroup: {
        id: "adg_mode",
        campaignId: "camp_mode",
        name: "AdGroup",
        status: "ACTIVE",
      },
      totals: {
        spend: 1000,
        impressions: 10000,
        clicks: 200,
        results: 10,
        reach: 4000,
        revenue: 2000,
      },
      score: 50,
      label: "Normal",
      derived: {
        ctr: 0.01,
        costPerResult: 100,
        conversionRate: 0.1,
        frequency: 2,
        roas: 2,
      },
      previous: {
        ctr: 0.02,
        costPerResult: 90,
        conversionRate: 0.12,
        frequency: 1.8,
        roas: 2.2,
      },
      costDelta: {
        current: 100,
        previous: 90,
        absolute: 10,
        percent: 0.11,
      },
      evidence: [
        {
          id: "E1",
          title: "Cost Efficiency",
          metricLabel: "Cost per Result",
          value: { current: 100, previous: 90, absolute: 10, percent: 0.11 },
        },
        {
          id: "E2",
          title: "Audience Quality",
          metricLabel: "CTR",
          value: {
            current: 0.01,
            previous: 0.02,
            absolute: -0.01,
            percent: -0.5,
          },
        },
        {
          id: "E3",
          title: "Ad Fatigue",
          metricLabel: "Frequency",
          value: { current: 3.5, previous: 2.8, absolute: 0.7, percent: 0.25 },
        },
      ],
      daily: [
        {
          date: new Date().toISOString().slice(0, 10),
          totals: {
            spend: 1000,
            impressions: 10000,
            clicks: 200,
            results: 10,
            reach: 4000,
            revenue: 2000,
          },
          derived: {
            ctr: 0.01,
            costPerResult: 100,
            conversionRate: 0.1,
            frequency: 2,
            roas: 2,
          },
        },
      ],
      ads: [
        {
          id: "ad_1",
          adGroupId: "adg_mode",
          name: "Ad 1",
          creativeKey: null,
          creativeType: "IMAGE",
          status: "ACTIVE",
          totals: {
            spend: 500,
            impressions: 5000,
            clicks: 100,
            results: 5,
            reach: 2000,
            revenue: 1000,
          },
          derived: {
            ctr: 0.02,
            costPerResult: 100,
            conversionRate: 0.05,
            frequency: 2.5,
            roas: 2,
          },
          previous: {
            ctr: 0.018,
            costPerResult: 90,
            conversionRate: 0.06,
            frequency: 2.2,
            roas: 2.2,
          },
          deltas: {
            costPerResult: deltaValue(100, 90),
            cpc: deltaValue(null, null),
            ctr: deltaValue(0.02, 0.018),
            frequency: deltaValue(2.5, 2.2),
            roas: deltaValue(2, 2.2),
            conversionRate: deltaValue(0.05, 0.06),
          },
          diagnosis: {
            label: "Stable",
            severity: "low",
            reason: "Test fixture",
          },
          score: 80,
          label: "Normal",
        },
      ],
    };

    const result = await getAiSummary({
      adGroupId: "adg_mode",
      periodDays: 7,
      mode: "insight",
      detail,
    });

    expect(callAishop24h).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("partial");
    expect(result.insight).not.toBeNull();
    expect(result.recommendation).toBeNull();
    expect(result.insight?.insights).toHaveLength(2);
    expect(result.insight?.evidenceBullets).toHaveLength(3);
    expect(result.insight?.limits).toHaveLength(3);
  });
});
