import { describe, expect, it } from "vitest";
import { InsightJSONSchema, RecommendationJSONSchema } from "./contracts";

describe("AI contracts", () => {
  it("validates InsightJSON", () => {
    const insight = {
      insightSummary: "CTR dropped while cost increased.",
      evidenceBullets: [
        { text: "CTR declined vs previous period", evidenceRef: ["E2"] },
      ],
      insights: [
        {
          type: "creative_fatigue",
          title: "Creative fatigue likely",
          detail: "High frequency with lower CTR suggests fatigue.",
          severity: "high",
          evidenceRef: ["E3"],
        },
      ],
      limits: ["Insights are based on derived metrics only."],
    };
    expect(InsightJSONSchema.safeParse(insight).success).toBe(true);
  });

  it("rejects invalid RecommendationJSON", () => {
    const reco = {
      summary: "Adjust creatives.",
      recommendations: [
        {
          action: "Pause low CTR ads",
          reason: "CTR dropped",
          confidence: "high",
          basedOn: ["E3"],
        },
      ],
      notes: "Review before applying.",
    };
    expect(RecommendationJSONSchema.safeParse(reco).success).toBe(false);
  });
});
