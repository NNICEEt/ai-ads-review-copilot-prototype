import { DerivedMetrics, Totals } from "@/lib/types/canonical";
import { DeltaValue } from "./metrics";
import { SCORING_CONFIG } from "@/lib/config/scoring";

type Diagnosis = {
  label: string;
  severity: "low" | "med" | "high";
  reason: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const computeScore = (metrics: DerivedMetrics) => {
  const { thresholds, weights } = SCORING_CONFIG;
  let penalty = 0;

  if (metrics.costPerResult != null) {
    const ratio = metrics.costPerResult / thresholds.costPerResultTarget;
    if (ratio > 1) {
      penalty += Math.min((ratio - 1) * 100 * weights.costPerResult, 35);
    }
  }

  if (metrics.roas != null) {
    const ratio = thresholds.roasTarget / metrics.roas;
    if (ratio > 1) {
      penalty += Math.min((ratio - 1) * 100 * weights.roas, 25);
    }
  }

  if (metrics.ctr != null) {
    if (metrics.ctr < thresholds.ctrWarning) {
      penalty += 20 * weights.ctr;
    } else if (metrics.ctr < thresholds.ctrMin) {
      penalty += 10 * weights.ctr;
    }
  }

  if (metrics.frequency != null) {
    if (metrics.frequency > thresholds.frequencyHigh) {
      penalty += 20 * weights.frequency;
    } else if (metrics.frequency > thresholds.frequencyWarning) {
      penalty += 10 * weights.frequency;
    }
  }

  return clamp(Math.round(100 - penalty), 0, 100);
};

export const labelFromScore = (score: number) => {
  if (score >= SCORING_CONFIG.thresholds.labelTop) {
    return SCORING_CONFIG.labels.top;
  }
  if (score <= SCORING_CONFIG.thresholds.labelNeedsAttention) {
    return SCORING_CONFIG.labels.needsAttention;
  }
  return SCORING_CONFIG.labels.normal;
};

export const diagnoseAdGroup = (params: {
  totals: Totals;
  metrics: DerivedMetrics;
  costPerResultDelta: DeltaValue;
}): Diagnosis => {
  const { thresholds } = SCORING_CONFIG;

  const cpr = params.metrics.costPerResult;
  const ctr = params.metrics.ctr;
  const freq = params.metrics.frequency;
  const roas = params.metrics.roas;
  const costDelta = params.costPerResultDelta.percent ?? 0;

  if (
    cpr != null &&
    ctr != null &&
    freq != null &&
    cpr > thresholds.costPerResultTarget &&
    freq > thresholds.frequencyHigh &&
    ctr < thresholds.ctrWarning
  ) {
    return {
      label: "Fatigue Detected",
      severity: "high",
      reason: "High frequency and CTR drop with rising cost per result",
    };
  }

  if (cpr != null && costDelta > thresholds.costCreepingPct) {
    return {
      label: "Cost Creeping",
      severity: "med",
      reason: "Cost per result trending upward",
    };
  }

  if (params.totals.spend > 0 && params.totals.results < 50) {
    return {
      label: "Learning Limited",
      severity: "med",
      reason: "Spend without enough results in learning phase",
    };
  }

  if (
    (roas != null && roas >= thresholds.roasTarget) ||
    (cpr != null && cpr <= thresholds.costPerResultTarget * 0.8)
  ) {
    return {
      label: "Top Performer",
      severity: "low",
      reason: "Strong efficiency vs target",
    };
  }

  return {
    label: "Stable",
    severity: "low",
    reason: "No significant anomalies detected",
  };
};
