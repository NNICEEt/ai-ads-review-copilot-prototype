import {
  PrismaClient,
  EntityStatus,
  CreativeType,
  EntityType,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DIRECT_URL or DATABASE_URL is required to run the seed script.",
  );
}

const sslRejectUnauthorized =
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED?.toLowerCase() !== "false";
const ssl = sslRejectUnauthorized ? undefined : { rejectUnauthorized: false };
const pool = new Pool({ connectionString: databaseUrl, ssl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type Totals = {
  spend: number;
  impressions: number;
  clicks: number;
  results: number;
  reach: number;
  revenue: number;
};

type DailyTotals = Totals;

type AdProfile = {
  id: string;
  name: string;
  adGroupId: string;
  creativeType: CreativeType;
  status: EntityStatus;
  spendWeight: number;
  quality: number;
};

const DAYS_IN_PERIOD = 7;

const startOfUtcDay = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

const addUtcDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return startOfUtcDay(next);
};

const buildDateRange = (endDate: Date, days: number) => {
  const end = startOfUtcDay(endDate);
  const dates: Date[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    dates.push(addUtcDays(end, -offset));
  }
  return dates;
};

const allocateTotalByWeights = (total: number, weights: number[]) => {
  const safeWeights = weights.map((weight) => Math.max(0, weight));
  const weightSum = safeWeights.reduce((sum, value) => sum + value, 0);
  if (weightSum === 0) {
    return Array.from({ length: weights.length }, () => 0);
  }

  const raw = safeWeights.map((weight) => (weight / weightSum) * total);
  const ints = raw.map((value) => Math.floor(value));
  let remainder = total - ints.reduce((sum, value) => sum + value, 0);
  let index = 0;
  while (remainder > 0) {
    ints[index % ints.length] += 1;
    remainder -= 1;
    index += 1;
  }
  return ints;
};

const buildDailySeries = (
  totals: Totals,
  weights: number[],
  overrides?: Partial<Record<keyof Totals, number[]>>,
): DailyTotals[] => {
  const spendSeries =
    overrides?.spend ?? allocateTotalByWeights(totals.spend, weights);
  const impressionSeries =
    overrides?.impressions ??
    allocateTotalByWeights(totals.impressions, weights);
  const clickSeries =
    overrides?.clicks ?? allocateTotalByWeights(totals.clicks, weights);
  const resultSeries =
    overrides?.results ?? allocateTotalByWeights(totals.results, weights);
  const reachSeries =
    overrides?.reach ?? allocateTotalByWeights(totals.reach, weights);
  const revenueSeries =
    overrides?.revenue ?? allocateTotalByWeights(totals.revenue, weights);

  return spendSeries.map((spend, index) => ({
    spend,
    impressions: impressionSeries[index],
    clicks: clickSeries[index],
    results: resultSeries[index],
    reach: reachSeries[index],
    revenue: revenueSeries[index],
  }));
};

const buildScenario = (params: {
  prev: Totals;
  current: Totals;
  prevWeights?: number[];
  currentWeights?: number[];
  currentOverrides?: Partial<Record<keyof Totals, number[]>>;
}) => {
  const weights = [0.14, 0.14, 0.14, 0.14, 0.14, 0.15, 0.15];
  const prevSeries = buildDailySeries(
    params.prev,
    params.prevWeights ?? weights,
  );
  const currentSeries = buildDailySeries(
    params.current,
    params.currentWeights ?? weights,
    params.currentOverrides,
  );
  return [...prevSeries, ...currentSeries];
};

const generateMetricsForGroup = (
  adProfiles: AdProfile[],
  dates: Date[],
  dailyTotals: DailyTotals[],
) => {
  const metrics: {
    entityType: EntityType;
    entityId: string;
    date: Date;
    spend: number;
    impressions: number;
    clicks: number;
    results: number;
    reach: number;
    revenue: number;
  }[] = [];

  dailyTotals.forEach((totals, index) => {
    const date = dates[index];
    const spendWeights = adProfiles.map((ad) => ad.spendWeight);
    const qualityWeights = adProfiles.map((ad) => ad.spendWeight * ad.quality);

    const spendAlloc = allocateTotalByWeights(totals.spend, spendWeights);
    const impressionAlloc = allocateTotalByWeights(
      totals.impressions,
      spendWeights,
    );
    const reachAlloc = allocateTotalByWeights(totals.reach, spendWeights);
    const clickAlloc = allocateTotalByWeights(totals.clicks, qualityWeights);
    const resultAlloc = allocateTotalByWeights(totals.results, qualityWeights);
    const revenueAlloc = allocateTotalByWeights(totals.revenue, qualityWeights);

    adProfiles.forEach((ad, adIndex) => {
      metrics.push({
        entityType: EntityType.AD,
        entityId: ad.id,
        date,
        spend: spendAlloc[adIndex],
        impressions: impressionAlloc[adIndex],
        clicks: clickAlloc[adIndex],
        results: resultAlloc[adIndex],
        reach: reachAlloc[adIndex],
        revenue: revenueAlloc[adIndex],
      });
    });
  });

  return metrics;
};

const accountId = "acct_brand_a";
const campaignSalesId = "camp_sales_conv";
const campaignAwarenessId = "camp_awareness_prospect";

const adGroupIds = {
  retargeting: "ag_retargeting_addcart_7d",
  broadTech: "ag_broad_interest_tech",
  lalPurchasers: "ag_lal_1p_purchasers",
  interestGamers: "ag_interest_gamers",
  broadLifestyle: "ag_broad_lifestyle",
  awarenessVideo: "ag_awareness_video",
  reachBrand: "ag_reach_brand",
};

const adProfiles: AdProfile[] = [
  {
    id: "ad_image_blue_01",
    name: "Ad_Image_Blue_01",
    adGroupId: adGroupIds.retargeting,
    creativeType: CreativeType.IMAGE,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.28,
    quality: 0.5,
  },
  {
    id: "ad_video_review_02",
    name: "Ad_Video_Review_02",
    adGroupId: adGroupIds.retargeting,
    creativeType: CreativeType.VIDEO,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.14,
    quality: 1.6,
  },
  {
    id: "ad_image_product_03",
    name: "Ad_Image_Product_03",
    adGroupId: adGroupIds.retargeting,
    creativeType: CreativeType.IMAGE,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.16,
    quality: 1,
  },
  {
    id: "ad_image_green_04",
    name: "Ad_Image_Green_04",
    adGroupId: adGroupIds.retargeting,
    creativeType: CreativeType.IMAGE,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.14,
    quality: 0.9,
  },
  {
    id: "ad_video_testimonial_05",
    name: "Ad_Video_Testimonial_05",
    adGroupId: adGroupIds.retargeting,
    creativeType: CreativeType.VIDEO,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.14,
    quality: 1.2,
  },
  {
    id: "ad_image_bundle_06",
    name: "Ad_Image_Bundle_06",
    adGroupId: adGroupIds.retargeting,
    creativeType: CreativeType.IMAGE,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.14,
    quality: 0.8,
  },
  {
    id: "ad_image_tech_01",
    name: "Ad_Image_Tech_01",
    adGroupId: adGroupIds.broadTech,
    creativeType: CreativeType.IMAGE,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.4,
    quality: 0.9,
  },
  {
    id: "ad_video_tech_02",
    name: "Ad_Video_Tech_02",
    adGroupId: adGroupIds.broadTech,
    creativeType: CreativeType.VIDEO,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.35,
    quality: 1.1,
  },
  {
    id: "ad_image_tech_03",
    name: "Ad_Image_Tech_03",
    adGroupId: adGroupIds.broadTech,
    creativeType: CreativeType.IMAGE,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.25,
    quality: 1,
  },
  {
    id: "ad_video_purchasers_01",
    name: "Ad_Video_Purchasers_01",
    adGroupId: adGroupIds.lalPurchasers,
    creativeType: CreativeType.VIDEO,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.45,
    quality: 1.3,
  },
  {
    id: "ad_image_purchasers_02",
    name: "Ad_Image_Purchasers_02",
    adGroupId: adGroupIds.lalPurchasers,
    creativeType: CreativeType.IMAGE,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.3,
    quality: 1.1,
  },
  {
    id: "ad_video_purchasers_03",
    name: "Ad_Video_Purchasers_03",
    adGroupId: adGroupIds.lalPurchasers,
    creativeType: CreativeType.VIDEO,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.25,
    quality: 1.2,
  },
  {
    id: "ad_image_gamer_01",
    name: "Ad_Image_Gamer_01",
    adGroupId: adGroupIds.interestGamers,
    creativeType: CreativeType.IMAGE,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.55,
    quality: 1,
  },
  {
    id: "ad_video_gamer_02",
    name: "Ad_Video_Gamer_02",
    adGroupId: adGroupIds.interestGamers,
    creativeType: CreativeType.VIDEO,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.45,
    quality: 1.05,
  },
  {
    id: "ad_image_life_01",
    name: "Ad_Image_Life_01",
    adGroupId: adGroupIds.broadLifestyle,
    creativeType: CreativeType.IMAGE,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.5,
    quality: 1,
  },
  {
    id: "ad_image_life_02",
    name: "Ad_Image_Life_02",
    adGroupId: adGroupIds.broadLifestyle,
    creativeType: CreativeType.IMAGE,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.5,
    quality: 0.95,
  },
  {
    id: "ad_video_awareness_01",
    name: "Ad_Video_Awareness_01",
    adGroupId: adGroupIds.awarenessVideo,
    creativeType: CreativeType.VIDEO,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.6,
    quality: 1,
  },
  {
    id: "ad_video_awareness_02",
    name: "Ad_Video_Awareness_02",
    adGroupId: adGroupIds.awarenessVideo,
    creativeType: CreativeType.VIDEO,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.4,
    quality: 0.9,
  },
  {
    id: "ad_image_reach_01",
    name: "Ad_Image_Reach_01",
    adGroupId: adGroupIds.reachBrand,
    creativeType: CreativeType.IMAGE,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.55,
    quality: 1,
  },
  {
    id: "ad_image_reach_02",
    name: "Ad_Image_Reach_02",
    adGroupId: adGroupIds.reachBrand,
    creativeType: CreativeType.IMAGE,
    status: EntityStatus.ACTIVE,
    spendWeight: 0.45,
    quality: 0.95,
  },
];

const scenarioA = buildScenario({
  prev: {
    spend: 758_000,
    impressions: 65_000,
    clicks: 780,
    results: 50,
    reach: 23_000,
    revenue: 1_400_000,
  },
  current: {
    spend: 850_000,
    impressions: 70_000,
    clicks: 320,
    results: 46,
    reach: 15_000,
    revenue: 1_530_000,
  },
});

const scenarioB = buildScenario({
  prev: {
    spend: 630_000,
    impressions: 78_000,
    clicks: 750,
    results: 60,
    reach: 31_000,
    revenue: 1_380_000,
  },
  current: {
    spend: 690_000,
    impressions: 80_000,
    clicks: 700,
    results: 60,
    reach: 32_000,
    revenue: 1_400_000,
  },
  currentOverrides: {
    spend: [83_000, 88_000, 93_000, 98_000, 103_000, 108_000, 117_000],
    results: [9, 9, 9, 9, 8, 8, 8],
  },
});

const scenarioC = buildScenario({
  prev: {
    spend: 520_000,
    impressions: 72_000,
    clicks: 1_400,
    results: 70,
    reach: 40_000,
    revenue: 1_800_000,
  },
  current: {
    spend: 500_000,
    impressions: 70_000,
    clicks: 1_350,
    results: 70,
    reach: 39_000,
    revenue: 1_850_000,
  },
});

const scenarioNormalA = buildScenario({
  prev: {
    spend: 400_000,
    impressions: 55_000,
    clicks: 600,
    results: 45,
    reach: 28_000,
    revenue: 1_000_000,
  },
  current: {
    spend: 410_000,
    impressions: 56_000,
    clicks: 610,
    results: 46,
    reach: 28_500,
    revenue: 1_020_000,
  },
});

const scenarioNormalB = buildScenario({
  prev: {
    spend: 380_000,
    impressions: 52_000,
    clicks: 540,
    results: 40,
    reach: 26_000,
    revenue: 920_000,
  },
  current: {
    spend: 390_000,
    impressions: 53_000,
    clicks: 550,
    results: 41,
    reach: 26_500,
    revenue: 940_000,
  },
});

const scenarioAwareness = buildScenario({
  prev: {
    spend: 300_000,
    impressions: 90_000,
    clicks: 650,
    results: 20,
    reach: 55_000,
    revenue: 0,
  },
  current: {
    spend: 310_000,
    impressions: 92_000,
    clicks: 660,
    results: 21,
    reach: 56_000,
    revenue: 0,
  },
});

const scenarioReach = buildScenario({
  prev: {
    spend: 280_000,
    impressions: 85_000,
    clicks: 600,
    results: 18,
    reach: 60_000,
    revenue: 0,
  },
  current: {
    spend: 290_000,
    impressions: 87_000,
    clicks: 610,
    results: 19,
    reach: 61_000,
    revenue: 0,
  },
});

async function main() {
  const endDate = addUtcDays(new Date(), -1);
  const dates = buildDateRange(endDate, DAYS_IN_PERIOD * 2);

  await prisma.dailyMetric.deleteMany();
  await prisma.ad.deleteMany();
  await prisma.adGroup.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.account.deleteMany();

  await prisma.account.create({
    data: {
      id: accountId,
      name: "Brand A - Official",
    },
  });

  await prisma.campaign.createMany({
    data: [
      {
        id: campaignSalesId,
        accountId,
        name: "2.2_Sales_Conv",
        objective: "Sales",
        status: EntityStatus.ACTIVE,
      },
      {
        id: campaignAwarenessId,
        accountId,
        name: "1.1_Awareness_Prospecting",
        objective: "Awareness",
        status: EntityStatus.ACTIVE,
      },
    ],
  });

  await prisma.adGroup.createMany({
    data: [
      {
        id: adGroupIds.retargeting,
        campaignId: campaignSalesId,
        name: "Retargeting_AddCart_7D",
        status: EntityStatus.ACTIVE,
      },
      {
        id: adGroupIds.broadTech,
        campaignId: campaignSalesId,
        name: "Broad_Interest_Tech",
        status: EntityStatus.ACTIVE,
      },
      {
        id: adGroupIds.lalPurchasers,
        campaignId: campaignSalesId,
        name: "LAL_1%_Purchasers",
        status: EntityStatus.ACTIVE,
      },
      {
        id: adGroupIds.interestGamers,
        campaignId: campaignSalesId,
        name: "Interest_Gamers",
        status: EntityStatus.ACTIVE,
      },
      {
        id: adGroupIds.broadLifestyle,
        campaignId: campaignSalesId,
        name: "Broad_Lifestyle",
        status: EntityStatus.ACTIVE,
      },
      {
        id: adGroupIds.awarenessVideo,
        campaignId: campaignAwarenessId,
        name: "Video_View_15s",
        status: EntityStatus.ACTIVE,
      },
      {
        id: adGroupIds.reachBrand,
        campaignId: campaignAwarenessId,
        name: "Reach_Brand_Safe",
        status: EntityStatus.ACTIVE,
      },
    ],
  });

  await prisma.ad.createMany({
    data: adProfiles.map((ad) => ({
      id: ad.id,
      adGroupId: ad.adGroupId,
      name: ad.name,
      creativeType: ad.creativeType,
      status: ad.status,
      creativeKey: ad.name,
    })),
  });

  const metrics = [
    ...generateMetricsForGroup(
      adProfiles.filter((ad) => ad.adGroupId === adGroupIds.retargeting),
      dates,
      scenarioA,
    ),
    ...generateMetricsForGroup(
      adProfiles.filter((ad) => ad.adGroupId === adGroupIds.broadTech),
      dates,
      scenarioB,
    ),
    ...generateMetricsForGroup(
      adProfiles.filter((ad) => ad.adGroupId === adGroupIds.lalPurchasers),
      dates,
      scenarioC,
    ),
    ...generateMetricsForGroup(
      adProfiles.filter((ad) => ad.adGroupId === adGroupIds.interestGamers),
      dates,
      scenarioNormalA,
    ),
    ...generateMetricsForGroup(
      adProfiles.filter((ad) => ad.adGroupId === adGroupIds.broadLifestyle),
      dates,
      scenarioNormalB,
    ),
    ...generateMetricsForGroup(
      adProfiles.filter((ad) => ad.adGroupId === adGroupIds.awarenessVideo),
      dates,
      scenarioAwareness,
    ),
    ...generateMetricsForGroup(
      adProfiles.filter((ad) => ad.adGroupId === adGroupIds.reachBrand),
      dates,
      scenarioReach,
    ),
  ];

  await prisma.dailyMetric.createMany({ data: metrics });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
