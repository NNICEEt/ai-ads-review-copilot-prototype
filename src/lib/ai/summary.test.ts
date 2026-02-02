import { describe, expect, it } from "vitest";
import { getAiSummary } from "./summary";
import type { getAdGroupDetail } from "@/lib/data/review";

describe("AI summary resilience", () => {
  it("returns disabled when AI config is missing", async () => {
    type AdGroupDetail = Awaited<ReturnType<typeof getAdGroupDetail>>;
    const detail: NonNullable<AdGroupDetail> = {
      period: {
        days: 7,
        current: { start: new Date(), end: new Date() },
        previous: { start: new Date(), end: new Date() },
      },
      campaign: {
        id: "camp_1",
        accountId: "acc_1",
        name: "Campaign",
        objective: "Conversions",
        status: "ACTIVE",
      },
      adGroup: {
        id: "adg_1",
        campaignId: "camp_1",
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
          adGroupId: "adg_1",
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
        },
      ],
    };

    const result = await getAiSummary({
      adGroupId: "adg_1",
      periodDays: 7,
      detail,
    });

    expect(result.status).toBe("disabled");
    expect(result.insight).toBeNull();
    expect(result.recommendation).toBeNull();
  });
});
