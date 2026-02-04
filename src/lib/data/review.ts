import { getReviewDataSource } from "@/lib/data/reviewSource";
import {
  buildPeriodRange,
  normalizePeriodDays,
  isWithinRange,
} from "@/lib/analysis/period";
import {
  computeDerived,
  deltaValue,
  formatPercent,
  sumTotals,
} from "@/lib/analysis/metrics";
import { buildEvidenceSlots } from "@/lib/analysis/evidence";
import {
  computeScore,
  diagnoseAdGroup,
  labelFromScore,
} from "@/lib/analysis/scoring";
import { SCORING_CONFIG } from "@/lib/config/scoring";
import { Totals } from "@/lib/types/canonical";
import {
  mapAccount,
  mapAd,
  mapAdGroup,
  mapCampaign,
} from "@/lib/adapters/dbToCanonical";
import type { DailyMetricRow, DateRange } from "@/lib/data/reviewSource";

const sumNullable = (values: Array<number | null | undefined>) => {
  const hasValue = values.some((value) => value != null);
  if (!hasValue) return null;
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
};

const sumDailyRows = (rows: DailyMetricRow[]): Totals => ({
  spend: rows.reduce((sum, row) => sum + row.spend, 0),
  impressions: rows.reduce((sum, row) => sum + row.impressions, 0),
  clicks: rows.reduce((sum, row) => sum + row.clicks, 0),
  results: rows.reduce((sum, row) => sum + row.results, 0),
  reach: sumNullable(rows.map((row) => row.reach)),
  revenue: sumNullable(rows.map((row) => row.revenue)),
});

const groupRowsByDate = (rows: DailyMetricRow[]) => {
  const map = new Map<string, DailyMetricRow[]>();
  rows.forEach((row) => {
    const key = row.date.toISOString().slice(0, 10);
    const bucket = map.get(key) ?? [];
    bucket.push(row);
    map.set(key, bucket);
  });
  return Array.from(map.entries())
    .map(([dateKey, bucket]) => ({
      date: dateKey,
      totals: sumDailyRows(bucket),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const filterByRange = (rows: DailyMetricRow[], range: DateRange) =>
  rows.filter((row) => isWithinRange(row.date, range));

const getLatestMetricDate = async () => {
  const source = getReviewDataSource();
  return (await source.getLatestMetricDate()) ?? new Date();
};

const getAccountId = async (accountId?: string | null) => {
  const source = getReviewDataSource();
  if (accountId) {
    const accounts = await source.getAccounts();
    const exists = accounts.some((row) => row.id === accountId);
    if (exists) return accountId;
  }
  return source.getFirstAccountId();
};

export const getAccounts = async () => {
  const source = getReviewDataSource();
  const rows = await source.getAccounts();
  return rows.map(mapAccount);
};

const loadAdGroupsForAccount = async (accountId: string) => {
  const source = getReviewDataSource();
  return source.getAdGroupsForAccount(accountId);
};

const loadAdGroupsForCampaign = async (campaignId: string) => {
  const source = getReviewDataSource();
  return source.getAdGroupsForCampaign(campaignId);
};

const loadMetricsForAds = async (
  adIds: string[],
  range: DateRange,
): Promise<DailyMetricRow[]> => {
  if (adIds.length === 0) return [];
  const source = getReviewDataSource();
  return source.getDailyMetricsForAds(adIds, range);
};

const mapRowsByAdId = (rows: DailyMetricRow[]) => {
  const map = new Map<string, DailyMetricRow[]>();
  rows.forEach((row) => {
    const bucket = map.get(row.entityId) ?? [];
    bucket.push(row);
    map.set(row.entityId, bucket);
  });
  return map;
};

const buildAdGroupMetrics = (
  adIds: string[],
  metricsByAdId: Map<string, DailyMetricRow[]>,
  range: DateRange,
) => {
  const rows = adIds.flatMap((id) => metricsByAdId.get(id) ?? []);
  const filtered = filterByRange(rows, range);
  const totals = sumDailyRows(filtered);
  const derived = computeDerived(totals);
  return { totals, derived };
};

export const getDashboardData = async (params: {
  accountId?: string | null;
  periodDays?: string | number | null;
}) => {
  const accountId = await getAccountId(params.accountId);
  if (!accountId) {
    return null;
  }
  const periodDays = normalizePeriodDays(params.periodDays);
  const endDate = await getLatestMetricDate();
  const period = buildPeriodRange(endDate, periodDays);

  const adGroups = await loadAdGroupsForAccount(accountId);
  const adIds = adGroups.flatMap((group) => group.ads.map((ad) => ad.id));

  const allMetrics = await loadMetricsForAds(adIds, {
    start: period.previous.start,
    end: period.current.end,
  });
  const metricsByAdId = mapRowsByAdId(allMetrics);

  const adGroupSummaries = adGroups.map((group) => {
    const adIdList = group.ads.map((ad) => ad.id);
    const current = buildAdGroupMetrics(
      adIdList,
      metricsByAdId,
      period.current,
    );
    const previous = buildAdGroupMetrics(
      adIdList,
      metricsByAdId,
      period.previous,
    );
    const score = computeScore(current.derived);
    const label = labelFromScore(score);
    const costDelta = deltaValue(
      current.derived.costPerResult ?? null,
      previous.derived.costPerResult ?? null,
    );
    const diagnosis = diagnoseAdGroup({
      totals: current.totals,
      metrics: current.derived,
      costPerResultDelta: costDelta,
    });
    const evidence = buildEvidenceSlots({
      current: current.derived,
      previous: previous.derived,
    });

    return {
      adGroupId: group.id,
      adGroupName: group.name,
      campaignId: group.campaignId,
      campaignName: group.campaign.name,
      score,
      label,
      diagnosis,
      totals: current.totals,
      derived: current.derived,
      deltas: {
        costPerResult: costDelta,
        ctr: deltaValue(
          current.derived.ctr ?? null,
          previous.derived.ctr ?? null,
        ),
      },
      evidence,
    };
  });

  const currentTotals = sumTotals(adGroupSummaries.map((item) => item.totals));
  const previousTotals = sumTotals(
    adGroupSummaries.map((item) => {
      const adIdList = adGroups
        .find((group) => group.id === item.adGroupId)
        ?.ads.map((ad) => ad.id);
      if (!adIdList)
        return {
          spend: 0,
          impressions: 0,
          clicks: 0,
          results: 0,
          reach: null,
          revenue: null,
        };
      return buildAdGroupMetrics(adIdList, metricsByAdId, period.previous)
        .totals;
    }),
  );

  const currentDerived = computeDerived(currentTotals);
  const previousDerived = computeDerived(previousTotals);

  const impactSpendTotal = currentTotals.spend;
  const priority = adGroupSummaries
    .map((item) => {
      const spendShare =
        impactSpendTotal > 0 ? item.totals.spend / impactSpendTotal : null;

      const severityRatio = Math.max(
        0,
        (SCORING_CONFIG.thresholds.labelTop - item.score) /
          SCORING_CONFIG.thresholds.labelTop,
      );
      const severityWeight = severityRatio ** 2;
      const impactWeight = spendShare != null ? Math.sqrt(spendShare) : 1;

      return {
        ...item,
        impact: {
          spendShare,
        },
        priorityScore: severityWeight * impactWeight,
      };
    })
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      if (a.score !== b.score) {
        return a.score - b.score;
      }
      return b.totals.spend - a.totals.spend;
    });

  return {
    accountId,
    period,
    summary: {
      spend: deltaValue(currentTotals.spend, previousTotals.spend),
      results: deltaValue(currentTotals.results, previousTotals.results),
      costPerResult: deltaValue(
        currentDerived.costPerResult ?? null,
        previousDerived.costPerResult ?? null,
      ),
      roas: deltaValue(
        currentDerived.roas ?? null,
        previousDerived.roas ?? null,
      ),
    },
    priority,
  };
};

export const getCampaignBreakdown = async (params: {
  campaignId: string;
  periodDays?: string | number | null;
}) => {
  const periodDays = normalizePeriodDays(params.periodDays);
  const endDate = await getLatestMetricDate();
  const period = buildPeriodRange(endDate, periodDays);

  const adGroups = await loadAdGroupsForCampaign(params.campaignId);
  const adIds = adGroups.flatMap((group) => group.ads.map((ad) => ad.id));

  const allMetrics = await loadMetricsForAds(adIds, {
    start: period.previous.start,
    end: period.current.end,
  });
  const metricsByAdId = mapRowsByAdId(allMetrics);

  const breakdownAdGroups = adGroups.map((group) => {
    const adIdList = group.ads.map((ad) => ad.id);
    const current = buildAdGroupMetrics(
      adIdList,
      metricsByAdId,
      period.current,
    );
    const previous = buildAdGroupMetrics(
      adIdList,
      metricsByAdId,
      period.previous,
    );
    const costDelta = deltaValue(
      current.derived.costPerResult ?? null,
      previous.derived.costPerResult ?? null,
    );
    const diagnosis = diagnoseAdGroup({
      totals: current.totals,
      metrics: current.derived,
      costPerResultDelta: costDelta,
    });

    return {
      id: group.id,
      name: group.name,
      totals: current.totals,
      derived: current.derived,
      costDelta,
      diagnosis,
      label: labelFromScore(computeScore(current.derived)),
    };
  });

  const diagnosisCounts = breakdownAdGroups.reduce(
    (acc, group) => {
      if (group.diagnosis.label === "Fatigue Detected") acc.fatigue += 1;
      else if (group.diagnosis.label === "Learning Limited")
        acc.learningLimited += 1;
      else if (group.diagnosis.label === "Cost Creeping") acc.costCreeping += 1;
      else if (group.diagnosis.label === "Top Performer") acc.topPerformer += 1;
      else acc.stable += 1;
      return acc;
    },
    {
      fatigue: 0,
      learningLimited: 0,
      costCreeping: 0,
      topPerformer: 0,
      stable: 0,
    },
  );

  const cprGroups = breakdownAdGroups.filter(
    (group) => group.derived.costPerResult != null,
  );
  const bestCpr =
    cprGroups.length > 0
      ? cprGroups.reduce((best, group) => {
          const currentBest =
            best.derived.costPerResult ?? Number.POSITIVE_INFINITY;
          const next = group.derived.costPerResult ?? Number.POSITIVE_INFINITY;
          return next < currentBest ? group : best;
        })
      : null;
  const worstCpr =
    cprGroups.length > 0
      ? cprGroups.reduce((worst, group) => {
          const currentWorst =
            worst.derived.costPerResult ?? Number.NEGATIVE_INFINITY;
          const next = group.derived.costPerResult ?? Number.NEGATIVE_INFINITY;
          return next > currentWorst ? group : worst;
        })
      : null;

  const roasGroups = breakdownAdGroups.filter(
    (group) => group.derived.roas != null,
  );
  const bestRoas =
    roasGroups.length > 0
      ? roasGroups.reduce((best, group) => {
          const currentBest = best.derived.roas ?? Number.NEGATIVE_INFINITY;
          const next = group.derived.roas ?? Number.NEGATIVE_INFINITY;
          return next > currentBest ? group : best;
        })
      : null;
  const worstRoas =
    roasGroups.length > 0
      ? roasGroups.reduce((worst, group) => {
          const currentWorst = worst.derived.roas ?? Number.POSITIVE_INFINITY;
          const next = group.derived.roas ?? Number.POSITIVE_INFINITY;
          return next < currentWorst ? group : worst;
        })
      : null;

  const actions: string[] = [];
  if (
    bestCpr?.derived.costPerResult != null &&
    worstCpr?.derived.costPerResult != null &&
    worstCpr.derived.costPerResult > 0 &&
    bestCpr.id !== worstCpr.id
  ) {
    const improvementPercent = Math.max(
      0,
      Math.round(
        (1 - bestCpr.derived.costPerResult / worstCpr.derived.costPerResult) *
          100,
      ),
    );
    if (improvementPercent >= 15) {
      actions.push(
        `มีช่องว่าง CPR ระหว่างกลุ่มที่แพงสุด/คุ้มสุด ~${improvementPercent}% • พิจารณาโยกงบจาก "${worstCpr.name}" ไป "${bestCpr.name}" (ถ้า objective/creative ใกล้เคียงกัน)`,
      );
    }
  }
  if (diagnosisCounts.fatigue > 0) {
    actions.push(
      `พบ Creative Fatigue ${diagnosisCounts.fatigue} กลุ่ม • วางแผนรีเฟรชครีเอทีฟ/หมุนเวียนชิ้นงาน และตรวจดูความถี่การเห็นซ้ำ`,
    );
  }
  if (diagnosisCounts.learningLimited > 0) {
    actions.push(
      `พบ Learning จำกัด ${diagnosisCounts.learningLimited} กลุ่ม • พิจารณาลดการแตกกลุ่ม (fragmentation) หรือรวมชุดโฆษณาเพื่อเพิ่มสัญญาณต่อชุด`,
    );
  }
  if (diagnosisCounts.costCreeping > 0) {
    actions.push(
      `ต้นทุนเริ่มไหลขึ้น ${diagnosisCounts.costCreeping} กลุ่ม • ตรวจสอบ bid/placement/ช่วงเวลา และดูว่า Cost per Result แย่ลงจาก traffic หรือจาก conversion`,
    );
  }

  const summary = {
    spendTotal: breakdownAdGroups.reduce(
      (sum, group) => sum + group.totals.spend,
      0,
    ),
    diagnosisCounts,
    highlights: {
      cpr:
        bestCpr && worstCpr
          ? { bestId: bestCpr.id, worstId: worstCpr.id }
          : null,
      roas:
        bestRoas && worstRoas
          ? { bestId: bestRoas.id, worstId: worstRoas.id }
          : null,
    },
    bestCpr: bestCpr?.derived.costPerResult ?? null,
    bestCprName: bestCpr?.name ?? null,
    worstCpr: worstCpr?.derived.costPerResult ?? null,
    worstCprName: worstCpr?.name ?? null,
    bestRoas: bestRoas?.derived.roas ?? null,
    bestRoasName: bestRoas?.name ?? null,
    worstRoas: worstRoas?.derived.roas ?? null,
    worstRoasName: worstRoas?.name ?? null,
    actions: actions.slice(0, 3),
  };

  return {
    period,
    campaign: adGroups[0]?.campaign ?? null,
    summary,
    adGroups: breakdownAdGroups,
  };
};

export const getAdGroupDetail = async (params: {
  adGroupId: string;
  periodDays?: string | number | null;
}) => {
  const periodDays = normalizePeriodDays(params.periodDays);
  const endDate = await getLatestMetricDate();
  const period = buildPeriodRange(endDate, periodDays);

  const source = getReviewDataSource();
  const adGroup = await source.getAdGroupById(params.adGroupId);
  if (!adGroup) return null;

  const adIds = adGroup.ads.map((ad) => ad.id);
  const metrics = await loadMetricsForAds(adIds, {
    start: period.previous.start,
    end: period.current.end,
  });
  const metricsByAdId = mapRowsByAdId(metrics);

  const current = buildAdGroupMetrics(adIds, metricsByAdId, period.current);
  const previous = buildAdGroupMetrics(adIds, metricsByAdId, period.previous);

  const costDelta = deltaValue(
    current.derived.costPerResult ?? null,
    previous.derived.costPerResult ?? null,
  );

  const evidence = buildEvidenceSlots({
    current: current.derived,
    previous: previous.derived,
  });

  const score = computeScore(current.derived);
  const label = labelFromScore(score);

  const daily = groupRowsByDate(filterByRange(metrics, period.current)).map(
    (item) => ({
      date: item.date,
      totals: item.totals,
      derived: computeDerived(item.totals),
    }),
  );

  const ads = adGroup.ads.map((ad) => {
    const allRows = metricsByAdId.get(ad.id) ?? [];
    const currentRows = filterByRange(allRows, period.current);
    const previousRows = filterByRange(allRows, period.previous);

    const totals = sumDailyRows(currentRows);
    const previousTotals = sumDailyRows(previousRows);

    const derived = computeDerived(totals);
    const previousDerived = computeDerived(previousTotals);

    const costDelta = deltaValue(
      derived.costPerResult ?? null,
      previousDerived.costPerResult ?? null,
    );
    const diagnosis = diagnoseAdGroup({
      totals,
      metrics: derived,
      costPerResultDelta: costDelta,
    });

    const score = computeScore(derived);

    return {
      ...mapAd(ad),
      totals,
      derived,
      previous: previousDerived,
      deltas: {
        costPerResult: costDelta,
        cpc: deltaValue(derived.cpc ?? null, previousDerived.cpc ?? null),
        ctr: deltaValue(derived.ctr ?? null, previousDerived.ctr ?? null),
        frequency: deltaValue(
          derived.frequency ?? null,
          previousDerived.frequency ?? null,
        ),
        roas: deltaValue(derived.roas ?? null, previousDerived.roas ?? null),
        conversionRate: deltaValue(
          derived.conversionRate ?? null,
          previousDerived.conversionRate ?? null,
        ),
      },
      diagnosis,
      score,
      label: labelFromScore(score),
    };
  });

  return {
    period,
    adGroup: mapAdGroup(adGroup),
    campaign: mapCampaign(adGroup.campaign),
    totals: current.totals,
    derived: current.derived,
    previous: previous.derived,
    score,
    label,
    costDelta,
    evidence,
    daily,
    ads,
  };
};

export const percentText = (value: number | null, decimals = 0) => {
  const percent = formatPercent(value, decimals);
  if (percent == null) return "ไม่มีข้อมูล";
  return `${percent}%`;
};
