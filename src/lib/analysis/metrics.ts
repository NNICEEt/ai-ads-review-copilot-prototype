import { DerivedMetrics, Totals } from "@/lib/types/canonical";

export type DeltaValue = {
  current: number | null;
  previous: number | null;
  absolute: number | null;
  percent: number | null;
};

export const safeDivide = (numerator: number, denominator: number) => {
  if (denominator === 0) return null;
  return numerator / denominator;
};

export const sumTotals = (totals: Totals[]) =>
  totals.reduce<Totals>(
    (acc, item) => ({
      spend: acc.spend + item.spend,
      impressions: acc.impressions + item.impressions,
      clicks: acc.clicks + item.clicks,
      results: acc.results + item.results,
      reach:
        acc.reach === null && item.reach == null
          ? null
          : (acc.reach ?? 0) + (item.reach ?? 0),
      revenue:
        acc.revenue === null && item.revenue == null
          ? null
          : (acc.revenue ?? 0) + (item.revenue ?? 0),
    }),
    {
      spend: 0,
      impressions: 0,
      clicks: 0,
      results: 0,
      reach: null,
      revenue: null,
    },
  );

export const computeDerived = (totals: Totals): DerivedMetrics => ({
  ctr: safeDivide(totals.clicks, totals.impressions),
  costPerResult: safeDivide(totals.spend, totals.results),
  cpc: safeDivide(totals.spend, totals.clicks),
  conversionRate: safeDivide(totals.results, totals.clicks),
  frequency: totals.reach ? safeDivide(totals.impressions, totals.reach) : null,
  roas: totals.revenue ? safeDivide(totals.revenue, totals.spend) : null,
});

export const deltaValue = (
  current: number | null,
  previous: number | null,
): DeltaValue => {
  if (current == null || previous == null) {
    return { current, previous, absolute: null, percent: null };
  }
  const absolute = current - previous;
  const percent = previous === 0 ? null : absolute / previous;
  return { current, previous, absolute, percent };
};

export const formatPercent = (value: number | null, decimals = 0) => {
  if (value == null) return null;
  return Number((value * 100).toFixed(decimals));
};
