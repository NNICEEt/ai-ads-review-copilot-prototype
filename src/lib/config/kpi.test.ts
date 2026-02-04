import { describe, expect, it } from "vitest";
import { resolveScoringThresholds } from "./kpi";
import { computeScore } from "@/lib/analysis/scoring";
import { SCORING_CONFIG } from "@/lib/config/scoring";

describe("kpi config", () => {
  it("falls back to base thresholds for unknown objective", () => {
    const thresholds = resolveScoringThresholds({
      accountId: "acc_7eleven_th",
      objective: "UNKNOWN_OBJECTIVE",
    });

    expect(thresholds.costPerResultTarget).toBe(
      SCORING_CONFIG.thresholds.costPerResultTarget,
    );
    expect(thresholds.roasTarget).toBe(SCORING_CONFIG.thresholds.roasTarget);
  });

  it("applies objective-level overrides", () => {
    const thresholds = resolveScoringThresholds({
      accountId: "acc_7eleven_th",
      objective: "AWARENESS",
    });

    expect(thresholds.frequencyHigh).toBe(5);
    expect(thresholds.costPerResultTarget).toBe(170_00);
  });

  it("applies account + objective overrides", () => {
    const thresholds = resolveScoringThresholds({
      accountId: "acc_lotus_th",
      objective: "SALES",
    });

    expect(thresholds.costPerResultTarget).toBe(140_00);
    expect(thresholds.roasTarget).toBe(3.2);
  });

  it("affects score via resolved targets", () => {
    const baseScore = computeScore(
      { costPerResult: 160_00 },
      SCORING_CONFIG.thresholds,
    );
    const awarenessScore = computeScore(
      { costPerResult: 160_00 },
      resolveScoringThresholds({
        accountId: "acc_7eleven_th",
        objective: "AWARENESS",
      }),
    );

    expect(baseScore).toBeLessThan(awarenessScore);
  });
});
