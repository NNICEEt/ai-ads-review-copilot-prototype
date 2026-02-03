import { describe, expect, it } from "vitest";
import { computeDerived, deltaValue, safeDivide } from "./metrics";

describe("metrics", () => {
  it("safeDivide returns null when denominator is zero", () => {
    expect(safeDivide(10, 0)).toBeNull();
  });

  it("deltaValue returns null percent when previous is zero", () => {
    const result = deltaValue(10, 0);
    expect(result.percent).toBeNull();
    expect(result.absolute).toBe(10);
  });

  it("computeDerived handles missing reach and revenue", () => {
    const derived = computeDerived({
      spend: 1000,
      impressions: 10000,
      clicks: 200,
      results: 10,
      reach: null,
      revenue: null,
    });

    expect(derived.ctr).toBeCloseTo(0.02);
    expect(derived.costPerResult).toBeCloseTo(100);
    expect(derived.cpc).toBeCloseTo(5);
    expect(derived.conversionRate).toBeCloseTo(0.05);
    expect(derived.frequency).toBeNull();
    expect(derived.roas).toBeNull();
  });
});
