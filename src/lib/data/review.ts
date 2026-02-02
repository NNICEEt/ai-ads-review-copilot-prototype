import { prisma } from "@/lib/db/prisma";
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
import { Totals } from "@/lib/types/canonical";
import {
  mapAccount,
  mapAd,
  mapAdGroup,
  mapCampaign,
} from "@/lib/adapters/dbToCanonical";

type DateRange = { start: Date; end: Date };

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

type DailyMetricRow = {
  entityId: string;
  date: Date;
  spend: number;
  impressions: number;
  clicks: number;
  results: number;
  reach: number | null;
  revenue: number | null;
};

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
  const result = await prisma.dailyMetric.aggregate({
    _max: { date: true },
  });
  if (!result._max.date) {
    return new Date();
  }
  return result._max.date;
};

const getAccountId = async (accountId?: string | null) => {
  if (accountId) return accountId;
  const first = await prisma.account.findFirst({ orderBy: { name: "asc" } });
  return first?.id ?? null;
};

export const getAccounts = async () => {
  const rows = await prisma.account.findMany({ orderBy: { name: "asc" } });
  return rows.map(mapAccount);
};

const loadAdGroupsForAccount = async (accountId: string) => {
  return prisma.adGroup.findMany({
    where: { campaign: { accountId } },
    include: {
      campaign: true,
      ads: { select: { id: true } },
    },
  });
};

const loadAdGroupsForCampaign = async (campaignId: string) => {
  return prisma.adGroup.findMany({
    where: { campaignId },
    include: {
      campaign: { include: { account: true } },
      ads: { select: { id: true } },
    },
  });
};

const loadMetricsForAds = async (
  adIds: string[],
  range: DateRange,
): Promise<DailyMetricRow[]> => {
  if (adIds.length === 0) return [];
  return prisma.dailyMetric.findMany({
    where: {
      entityType: "AD",
      entityId: { in: adIds },
      date: { gte: range.start, lte: range.end },
    },
    select: {
      entityId: true,
      date: true,
      spend: true,
      impressions: true,
      clicks: true,
      results: true,
      reach: true,
      revenue: true,
    },
  });
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
    priority: adGroupSummaries.sort((a, b) => a.score - b.score),
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

  return {
    period,
    campaign: adGroups[0]?.campaign ?? null,
    adGroups: adGroups.map((group) => {
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
    }),
  };
};

export const getAdGroupDetail = async (params: {
  adGroupId: string;
  periodDays?: string | number | null;
}) => {
  const periodDays = normalizePeriodDays(params.periodDays);
  const endDate = await getLatestMetricDate();
  const period = buildPeriodRange(endDate, periodDays);

  const adGroup = await prisma.adGroup.findUnique({
    where: { id: params.adGroupId },
    include: {
      campaign: true,
      ads: true,
    },
  });
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
    const rows = filterByRange(metricsByAdId.get(ad.id) ?? [], period.current);
    const totals = sumDailyRows(rows);
    const derived = computeDerived(totals);
    return {
      ...mapAd(ad),
      totals,
      derived,
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
  if (percent == null) return "N/A";
  return `${percent}%`;
};
