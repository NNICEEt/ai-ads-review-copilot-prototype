import type {
  AccountRow,
  AdGroupCampaignListRow,
  AdGroupDetailRow,
  AdGroupListRow,
  CampaignRow,
  CampaignWithAccountRow,
  DateRange,
  DailyMetricRow,
  ReviewDataSource,
} from "@/lib/data/reviewSource";
import type { CreativeType, EntityStatus } from "@/lib/types/canonical";

const startOfUtcDay = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

const addUtcDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return startOfUtcDay(next);
};

const formatSqlDate = (date: Date) => date.toISOString().slice(0, 10);

const isWithinRange = (date: Date, range: DateRange) =>
  date >= range.start && date <= range.end;

const assertUniqueIds = (label: string, ids: string[]) => {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new Error(`Mock data integrity: duplicate ${label} id "${id}"`);
    }
    seen.add(id);
  }
};

type MockDb = {
  accounts: AccountRow[];
  campaigns: Array<CampaignWithAccountRow>;
  adGroups: Array<
    {
      id: string;
      campaignId: string;
      name: string;
      status: EntityStatus;
    } & { campaign: CampaignWithAccountRow }
  >;
  ads: Array<{
    id: string;
    adGroupId: string;
    name: string;
    creativeKey: string | null;
    creativeType: CreativeType | null;
    status: EntityStatus;
  }>;
  dailyMetrics: DailyMetricRow[];
  latestMetricDate: Date;
};

const buildMockDb = (): MockDb => {
  const latestMetricDate = addUtcDays(startOfUtcDay(new Date()), -1);
  const dates = Array.from({ length: 28 }, (_, index) =>
    addUtcDays(latestMetricDate, index - 27),
  );

  const account: AccountRow = {
    id: "acc_7eleven_th",
    name: "7-Eleven Thailand (7Delivery)",
  };
  const account2: AccountRow = {
    id: "acc_lotus_th",
    name: "Lotus's Thailand (Online)",
  };
  const accounts = [account, account2];

  const campaigns: CampaignWithAccountRow[] = [
    {
      id: "camp_ao_purchase",
      accountId: account.id,
      name: "Always-on | 7DELIVERY | Purchase (Prospecting)",
      objective: "SALES",
      status: "ACTIVE",
      account,
    },
    {
      id: "camp_rt_purchase",
      accountId: account.id,
      name: "Always-on | 7DELIVERY | Retargeting (VC/ATC)",
      objective: "SALES",
      status: "ACTIVE",
      account,
    },
    {
      id: "camp_promo_0202",
      accountId: account.id,
      name: "Promo | 2.2 Flash Sale | Coupon 20฿",
      objective: "SALES",
      status: "ACTIVE",
      account,
    },
    {
      id: "camp_launch_allcafe",
      accountId: account.id,
      name: "Launch | All Café | Cold Brew",
      objective: "AWARENESS",
      status: "ACTIVE",
      account,
    },
    {
      id: "camp_crm_allmember",
      accountId: account.id,
      name: "CRM | ALL member | สมัครสมาชิก (App)",
      objective: "LEADS",
      status: "ACTIVE",
      account,
    },
    {
      id: "camp_allmember_privilege_160",
      accountId: account.id,
      name: "ALL member | Privilege | คูปองรวม 160฿",
      objective: "SALES",
      status: "ACTIVE",
      account,
    },
    {
      id: "camp_store_traffic",
      accountId: account.id,
      name: "Store Traffic | Near Me | Q1",
      objective: "TRAFFIC",
      status: "ACTIVE",
      account,
    },
    {
      id: "camp_tax_easy_ereceipt",
      accountId: account.id,
      name: "Tax | Easy E-Receipt | ลดหย่อนสูงสุด 50,000",
      objective: "TRAFFIC",
      status: "ACTIVE",
      account,
    },
    {
      id: "camp_stamp_hello_healjai",
      accountId: account.id,
      name: "Stamp | เฮลโล ฮีลใจ | สะสมแสตมป์แลกพรีเมียม",
      objective: "SALES",
      status: "ACTIVE",
      account,
    },
    {
      id: "camp_stamp_flying",
      accountId: account.id,
      name: "Stamp | แสตมป์บินได้ | แลกตั๋วเครื่องบิน",
      objective: "SALES",
      status: "ACTIVE",
      account,
    },
    {
      id: "camp_7delivery_deliver_love",
      accountId: account.id,
      name: "7DELIVERY | Deliver Love | ส่งความรัก 24 ชม.",
      objective: "SALES",
      status: "ACTIVE",
      account,
    },
    {
      id: "camp_privilege_proxie_fanmeeting",
      accountId: account.id,
      name: "Privilege | PROXIE Fan Meeting | แลกรับสิทธิ์",
      objective: "TRAFFIC",
      status: "ACTIVE",
      account,
    },
    {
      id: "camp_lotus_ao_purchase",
      accountId: account2.id,
      name: "Always-on | Lotus's Online | Purchase (Prospecting)",
      objective: "SALES",
      status: "ACTIVE",
      account: account2,
    },
    {
      id: "camp_lotus_rt_purchase",
      accountId: account2.id,
      name: "Always-on | Lotus's Online | Retargeting (VC/ATC)",
      objective: "SALES",
      status: "ACTIVE",
      account: account2,
    },
  ];

  assertUniqueIds(
    "campaign",
    campaigns.map((campaign) => campaign.id),
  );

  const campaignsById = new Map(
    campaigns.map((campaign) => [campaign.id, campaign]),
  );

  type AdGroupProfile =
    | "fatigue"
    | "cost_creeping"
    | "top"
    | "learning_limited"
    | "stable";

  type SeriesProfile = {
    impressionsPerDay: number;
    reachPerDay: number;
    ctrFrom: number;
    ctrTo: number;
    cprFrom: number;
    cprTo: number;
    conversionRate: number;
    roas?: number | null;
  };

  const PROFILES: Record<AdGroupProfile, SeriesProfile> = {
    fatigue: {
      impressionsPerDay: 5_200,
      reachPerDay: 980,
      ctrFrom: 0.0062,
      ctrTo: 0.0038,
      cprFrom: 16_000,
      cprTo: 24_500,
      conversionRate: 0.18,
      roas: null,
    },
    cost_creeping: {
      impressionsPerDay: 5_400,
      reachPerDay: 2_500,
      ctrFrom: 0.0102,
      ctrTo: 0.0092,
      cprFrom: 13_200,
      cprTo: 17_800,
      conversionRate: 0.11,
      roas: null,
    },
    top: {
      impressionsPerDay: 4_600,
      reachPerDay: 3_300,
      ctrFrom: 0.013,
      ctrTo: 0.0145,
      cprFrom: 10_500,
      cprTo: 9_200,
      conversionRate: 0.16,
      roas: 4.0,
    },
    learning_limited: {
      impressionsPerDay: 650,
      reachPerDay: 320,
      ctrFrom: 0.0105,
      ctrTo: 0.009,
      cprFrom: 16_800,
      cprTo: 17_400,
      conversionRate: 0.03,
      roas: null,
    },
    stable: {
      impressionsPerDay: 4_800,
      reachPerDay: 2_450,
      ctrFrom: 0.0092,
      ctrTo: 0.0098,
      cprFrom: 13_800,
      cprTo: 14_300,
      conversionRate: 0.1,
      roas: null,
    },
  };

  type AdGroupDefinition = {
    id: string;
    campaignId: string;
    name: string;
    status: EntityStatus;
    creativeTheme: string;
    profile: AdGroupProfile;
    seriesOverride?: Partial<SeriesProfile>;
  };

  const adGroupDefinitions: AdGroupDefinition[] = [
    {
      id: "ag_ao_broad_18_44",
      campaignId: "camp_ao_purchase",
      name: "Broad | 18–44 | Auto Placements",
      status: "ACTIVE",
      creativeTheme: "7DELIVERY ส่งด่วน 30 นาที",
      profile: "stable",
      seriesOverride: { roas: 3.2 },
    },
    {
      id: "ag_ao_lal_1pct_purch_180d",
      campaignId: "camp_ao_purchase",
      name: "LAL 1% | Purchasers 180D",
      status: "ACTIVE",
      creativeTheme: "Best Sellers + Bundle Deal",
      profile: "top",
    },
    {
      id: "ag_ao_interest_coffee",
      campaignId: "camp_ao_purchase",
      name: "Interest | Coffee Lovers",
      status: "ACTIVE",
      creativeTheme: "All Café + ส่งฟรี",
      profile: "cost_creeping",
      seriesOverride: { roas: 2.6 },
    },
    {
      id: "ag_ao_interest_health",
      campaignId: "camp_ao_purchase",
      name: "Interest | Health & Beauty",
      status: "ACTIVE",
      creativeTheme: "ของใช้ประจำวัน + ราคาโปร",
      profile: "stable",
    },
    {
      id: "ag_rt_vc_14d",
      campaignId: "camp_rt_purchase",
      name: "Retargeting | ViewContent 14D",
      status: "ACTIVE",
      creativeTheme: "คุณลืมของไว้ในตะกร้า?",
      profile: "fatigue",
    },
    {
      id: "ag_rt_atc_7d",
      campaignId: "camp_rt_purchase",
      name: "Retargeting | AddToCart 7D",
      status: "ACTIVE",
      creativeTheme: "กลับมาซื้อวันนี้ ส่งฟรี/คูปอง",
      profile: "cost_creeping",
      seriesOverride: { impressionsPerDay: 4_900, reachPerDay: 2_000 },
    },
    {
      id: "ag_rt_engagers_30d",
      campaignId: "camp_rt_purchase",
      name: "Retargeting | Page + IG Engagers 30D",
      status: "ACTIVE",
      creativeTheme: "รีวิวจริง + Social Proof",
      profile: "stable",
    },
    {
      id: "ag_promo_broad_coupon",
      campaignId: "camp_promo_0202",
      name: "Promo | Broad | Coupon Hunters",
      status: "ACTIVE",
      creativeTheme: "2.2 Flash Sale คูปอง 20฿",
      profile: "cost_creeping",
      seriesOverride: { impressionsPerDay: 6_400, reachPerDay: 3_200 },
    },
    {
      id: "ag_promo_lal_1pct",
      campaignId: "camp_promo_0202",
      name: "Promo | LAL 1% | Purchasers",
      status: "ACTIVE",
      creativeTheme: "2.2 Flash Sale (Best Deals)",
      profile: "top",
    },
    {
      id: "ag_promo_rt_atc_3d",
      campaignId: "camp_promo_0202",
      name: "Promo | Retargeting | ATC 3D",
      status: "ACTIVE",
      creativeTheme: "ใกล้หมดเวลา! ใช้คูปองวันนี้",
      profile: "fatigue",
      seriesOverride: {
        impressionsPerDay: 5_800,
        reachPerDay: 1_050,
        cprFrom: 18_500,
        cprTo: 32_000,
        roas: 1.8,
      },
    },
    {
      id: "ag_promo_newcust_excl_purch",
      campaignId: "camp_promo_0202",
      name: "Promo | New Customers | Exclude Purchasers",
      status: "ACTIVE",
      creativeTheme: "ดีลสำหรับลูกค้าใหม่",
      profile: "stable",
      seriesOverride: { roas: 3.1 },
    },
    {
      id: "ag_launch_reach_nationwide",
      campaignId: "camp_launch_allcafe",
      name: "Awareness | Reach | Nationwide",
      status: "ACTIVE",
      creativeTheme: "All Café Cold Brew (New)",
      profile: "stable",
      seriesOverride: {
        impressionsPerDay: 7_200,
        reachPerDay: 5_600,
        cprFrom: 12_500,
        cprTo: 13_000,
      },
    },
    {
      id: "ag_launch_video_reels",
      campaignId: "camp_launch_allcafe",
      name: "Video Views | Reels | 15s",
      status: "ACTIVE",
      creativeTheme: "Cold Brew 15s (UGC-style)",
      profile: "stable",
      seriesOverride: {
        impressionsPerDay: 6_000,
        reachPerDay: 4_800,
        ctrFrom: 0.0088,
        ctrTo: 0.0092,
        cprFrom: 12_000,
        cprTo: 12_700,
      },
    },
    {
      id: "ag_launch_engage_igreels",
      campaignId: "camp_launch_allcafe",
      name: "Engagement | IG Reels | Thailand",
      status: "ACTIVE",
      creativeTheme: "ลองแล้วต้องแชร์!",
      profile: "learning_limited",
      seriesOverride: { cprFrom: 15_000, cprTo: 15_600 },
    },
    {
      id: "ag_crm_signup_broad",
      campaignId: "camp_crm_allmember",
      name: "ALL member | Signup | Broad",
      status: "ACTIVE",
      creativeTheme: "สมัคร All Member รับสิทธิ์ทันที",
      profile: "learning_limited",
    },
    {
      id: "ag_crm_rt_app_visitors",
      campaignId: "camp_crm_allmember",
      name: "ALL member | Retargeting | App Visitors 30D",
      status: "ACTIVE",
      creativeTheme: "กลับมาสมัคร รับคูปอง/พอยท์",
      profile: "stable",
      seriesOverride: { impressionsPerDay: 3_800, reachPerDay: 1_900 },
    },
    {
      id: "ag_crm_lal_subscribers",
      campaignId: "camp_crm_allmember",
      name: "ALL member | Lookalike | Subscribers",
      status: "ACTIVE",
      creativeTheme: "สมัครสมาชิก + สะสมแต้ม",
      profile: "cost_creeping",
      seriesOverride: { impressionsPerDay: 3_200, reachPerDay: 1_650 },
    },
    {
      id: "ag_store_bkk_3km",
      campaignId: "camp_store_traffic",
      name: "Store Traffic | 3km | Bangkok",
      status: "ACTIVE",
      creativeTheme: "สาขาใกล้คุณ + โปรหน้าร้าน",
      profile: "stable",
      seriesOverride: { impressionsPerDay: 2_600, reachPerDay: 1_500 },
    },
    {
      id: "ag_store_cnx_3km",
      campaignId: "camp_store_traffic",
      name: "Store Traffic | 3km | Chiang Mai",
      status: "ACTIVE",
      creativeTheme: "สาขาใกล้คุณ (เชียงใหม่)",
      profile: "stable",
      seriesOverride: { impressionsPerDay: 1_900, reachPerDay: 1_100 },
    },
    {
      id: "ag_store_hkt_3km",
      campaignId: "camp_store_traffic",
      name: "Store Traffic | 3km | Phuket",
      status: "ACTIVE",
      creativeTheme: "สาขาใกล้คุณ (ภูเก็ต)",
      profile: "learning_limited",
      seriesOverride: { impressionsPerDay: 520, reachPerDay: 280 },
    },
    {
      id: "ag_allmember_priv_broad_18_44",
      campaignId: "camp_allmember_privilege_160",
      name: "ALL member | Broad | Coupon 160฿",
      status: "ACTIVE",
      creativeTheme: "ALL member คูปองรวม 160฿",
      profile: "stable",
      seriesOverride: { roas: 3.2 },
    },
    {
      id: "ag_allmember_priv_rt_members_14d",
      campaignId: "camp_allmember_privilege_160",
      name: "ALL member | Retargeting | Members 14D",
      status: "ACTIVE",
      creativeTheme: "คูปองสมาชิก • รีมายด์การใช้สิทธิ์",
      profile: "cost_creeping",
      seriesOverride: {
        impressionsPerDay: 4_200,
        reachPerDay: 1_900,
        roas: 2.6,
      },
    },
    {
      id: "ag_tax_ereceipt_broad",
      campaignId: "camp_tax_easy_ereceipt",
      name: "Easy E-Receipt | Broad | Info + Click",
      status: "ACTIVE",
      creativeTheme: "Easy E-Receipt ลดหย่อน 50,000",
      profile: "stable",
      seriesOverride: {
        impressionsPerDay: 6_200,
        reachPerDay: 4_900,
        ctrFrom: 0.0068,
        ctrTo: 0.0074,
        cprFrom: 12_600,
        cprTo: 13_500,
      },
    },
    {
      id: "ag_tax_ereceipt_rt_allmember_30d",
      campaignId: "camp_tax_easy_ereceipt",
      name: "Easy E-Receipt | Retargeting | ALL member 30D",
      status: "ACTIVE",
      creativeTheme: "E-Receipt สำหรับสมาชิก • วิธีใช้งาน",
      profile: "learning_limited",
      seriesOverride: {
        impressionsPerDay: 720,
        reachPerDay: 360,
        cprFrom: 13_800,
        cprTo: 14_900,
      },
    },
    {
      id: "ag_stamp_healjai_broad",
      campaignId: "camp_stamp_hello_healjai",
      name: "Stamp | Broad | Shoppers",
      status: "ACTIVE",
      creativeTheme: "แสตมป์ เฮลโล ฮีลใจ • สะสมแลกพรีเมียม",
      profile: "stable",
      seriesOverride: {
        roas: 3.1,
        impressionsPerDay: 6_600,
        reachPerDay: 3_900,
      },
    },
    {
      id: "ag_stamp_healjai_lal_1pct",
      campaignId: "camp_stamp_hello_healjai",
      name: "Stamp | LAL 1% | Frequent Buyers",
      status: "ACTIVE",
      creativeTheme: "สะสมแสตมป์ให้ไว • ของพรีเมียมลิมิเต็ด",
      profile: "top",
      seriesOverride: { roas: 4.2 },
    },
    {
      id: "ag_stamp_healjai_rt_receipt_14d",
      campaignId: "camp_stamp_hello_healjai",
      name: "Stamp | Retargeting | Receipt Buyers 14D",
      status: "ACTIVE",
      creativeTheme: "รีมายด์สะสมแสตมป์ • อย่าพลาดของแลก",
      profile: "fatigue",
      seriesOverride: {
        impressionsPerDay: 5_600,
        reachPerDay: 1_050,
        roas: 2.2,
      },
    },
    {
      id: "ag_stamp_flying_broad",
      campaignId: "camp_stamp_flying",
      name: "Stamp | Broad | Travel Lovers",
      status: "ACTIVE",
      creativeTheme: "แสตมป์บินได้ • แลกตั๋วเครื่องบิน",
      profile: "cost_creeping",
      seriesOverride: {
        roas: 2.7,
        impressionsPerDay: 5_900,
        reachPerDay: 3_100,
      },
    },
    {
      id: "ag_stamp_flying_rt_members_30d",
      campaignId: "camp_stamp_flying",
      name: "Stamp | Retargeting | ALL member 30D",
      status: "ACTIVE",
      creativeTheme: "สะสมเพิ่มอีกนิด • ใกล้แลกตั๋วแล้ว",
      profile: "stable",
      seriesOverride: {
        roas: 3.0,
        impressionsPerDay: 4_300,
        reachPerDay: 2_050,
      },
    },
    {
      id: "ag_deliverlove_broad",
      campaignId: "camp_7delivery_deliver_love",
      name: "7DELIVERY | Broad | Grocery + Ready-to-eat",
      status: "ACTIVE",
      creativeTheme: "Deliver Love • ส่งความรัก 24 ชม.",
      profile: "stable",
      seriesOverride: {
        roas: 3.4,
        impressionsPerDay: 5_400,
        reachPerDay: 3_000,
      },
    },
    {
      id: "ag_deliverlove_rt_vc_7d",
      campaignId: "camp_7delivery_deliver_love",
      name: "7DELIVERY | Retargeting | ViewContent 7D",
      status: "ACTIVE",
      creativeTheme: "รีมายด์สั่งด่วน • ส่งเร็วทันใจ",
      profile: "fatigue",
      seriesOverride: { impressionsPerDay: 5_100, reachPerDay: 980, roas: 2.0 },
    },
    {
      id: "ag_proxie_fanmeeting_broad",
      campaignId: "camp_privilege_proxie_fanmeeting",
      name: "PROXIE | Broad | Privilege Landing",
      status: "ACTIVE",
      creativeTheme: "PROXIE Fan Meeting • แลกรับสิทธิ์",
      profile: "learning_limited",
      seriesOverride: {
        impressionsPerDay: 820,
        reachPerDay: 420,
        ctrFrom: 0.012,
        ctrTo: 0.0102,
        cprFrom: 11_200,
        cprTo: 11_800,
        conversionRate: 0.06,
      },
    },
    {
      id: "ag_proxie_fanmeeting_rt_engagers_30d",
      campaignId: "camp_privilege_proxie_fanmeeting",
      name: "PROXIE | Retargeting | Engagers 30D",
      status: "ACTIVE",
      creativeTheme: "รีมายด์สิทธิ์ • ก่อนหมดเขต",
      profile: "stable",
      seriesOverride: { impressionsPerDay: 2_900, reachPerDay: 1_600 },
    },
    {
      id: "ag_lotus_ao_broad_18_44",
      campaignId: "camp_lotus_ao_purchase",
      name: "Broad | 18–44 | Auto Placements",
      status: "ACTIVE",
      creativeTheme: "Lotus's Online ส่งฟรี + ดีลเด่น",
      profile: "stable",
      seriesOverride: { roas: 2.9 },
    },
    {
      id: "ag_lotus_ao_lal_1pct_purch",
      campaignId: "camp_lotus_ao_purchase",
      name: "LAL 1% | Purchasers 180D",
      status: "ACTIVE",
      creativeTheme: "Best Deals (FMCG) + ส่งด่วน",
      profile: "top",
      seriesOverride: { roas: 4.1 },
    },
    {
      id: "ag_lotus_ao_interest_home",
      campaignId: "camp_lotus_ao_purchase",
      name: "Interest | Home & Living",
      status: "ACTIVE",
      creativeTheme: "ของใช้บ้าน + ราคาพิเศษ",
      profile: "cost_creeping",
      seriesOverride: { roas: 2.4 },
    },
    {
      id: "ag_lotus_rt_vc_14d",
      campaignId: "camp_lotus_rt_purchase",
      name: "Retargeting | ViewContent 14D",
      status: "ACTIVE",
      creativeTheme: "กลับมาดูดีลที่คุณสนใจ",
      profile: "fatigue",
      seriesOverride: { impressionsPerDay: 4_900, reachPerDay: 980 },
    },
    {
      id: "ag_lotus_rt_atc_7d",
      campaignId: "camp_lotus_rt_purchase",
      name: "Retargeting | AddToCart 7D",
      status: "ACTIVE",
      creativeTheme: "ใกล้จบโปร! สั่งวันนี้ส่งฟรี",
      profile: "cost_creeping",
      seriesOverride: { impressionsPerDay: 4_400, reachPerDay: 1_850 },
    },
    {
      id: "ag_lotus_rt_engagers_30d",
      campaignId: "camp_lotus_rt_purchase",
      name: "Retargeting | Page + IG Engagers 30D",
      status: "ACTIVE",
      creativeTheme: "รีวิวจริง + โปรเฉพาะสมาชิก",
      profile: "stable",
      seriesOverride: { roas: 3.3 },
    },
  ];

  assertUniqueIds(
    "adGroup",
    adGroupDefinitions.map((group) => group.id),
  );

  const adGroups: MockDb["adGroups"] = adGroupDefinitions.map((def) => {
    const campaign = campaignsById.get(def.campaignId);
    if (!campaign) {
      throw new Error(
        `Mock data integrity: missing campaign "${def.campaignId}" for adGroup "${def.id}"`,
      );
    }

    return {
      id: def.id,
      campaignId: def.campaignId,
      name: def.name,
      status: def.status,
      campaign,
    };
  });

  type CreativeSuffix = "A" | "B" | "C";

  const buildCreativesForTheme = (theme: string) => {
    return [
      {
        suffix: "A" as const,
        creativeType: "VIDEO" as const,
        name: `VID | ${theme} | Hook`,
      },
      {
        suffix: "B" as const,
        creativeType: "IMAGE" as const,
        name: `IMG | ${theme} | KV`,
      },
      {
        suffix: "C" as const,
        creativeType: "CAROUSEL" as const,
        name: `CAR | ${theme} | Bundle`,
      },
    ] satisfies Array<{
      suffix: CreativeSuffix;
      creativeType: CreativeType;
      name: string;
    }>;
  };

  const ads: MockDb["ads"] = adGroupDefinitions.flatMap((group) => {
    const creatives = buildCreativesForTheme(group.creativeTheme);
    return creatives.map((creative): MockDb["ads"][number] => ({
      id: `ad_${group.id}_${creative.suffix}`,
      adGroupId: group.id,
      name: creative.name,
      creativeKey: `${group.id}_${creative.suffix.toLowerCase()}`,
      creativeType: creative.creativeType,
      status: group.status,
    }));
  });

  assertUniqueIds(
    "ad",
    ads.map((ad) => ad.id),
  );

  const dailyMetrics: DailyMetricRow[] = [];

  const pushMetric = (params: {
    entityId: string;
    date: Date;
    spend: number;
    impressions: number;
    clicks: number;
    results: number;
    reach: number | null;
    revenue: number | null;
  }) => {
    dailyMetrics.push({
      entityId: params.entityId,
      date: params.date,
      spend: params.spend,
      impressions: params.impressions,
      clicks: params.clicks,
      results: params.results,
      reach: params.reach,
      revenue: params.revenue,
    });
  };

  const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

  const buildSeries = (params: {
    adIds: string[];
    impressionsPerDay: number;
    reachPerDay: number;
    ctrFrom: number;
    ctrTo: number;
    cprFrom: number;
    cprTo: number;
    conversionRate: number;
    roas?: number | null;
  }) => {
    dates.forEach((date, dayIndex) => {
      const t = dayIndex / Math.max(1, dates.length - 1);
      const ctr = lerp(params.ctrFrom, params.ctrTo, t);
      const baseCostPerResult = Math.round(
        lerp(params.cprFrom, params.cprTo, t),
      );

      const utcDay = date.getUTCDay();
      const weekendMultiplier = utcDay === 0 || utcDay === 6 ? 1.12 : 1.0;

      params.adIds.forEach((adId, adIndex) => {
        const centeredIndex = adIndex - (params.adIds.length - 1) / 2;
        const impressionVariance = 1 + centeredIndex * 0.08;
        const impressions = Math.max(
          0,
          Math.round(
            params.impressionsPerDay * impressionVariance * weekendMultiplier,
          ),
        );
        const ctrVariance = 1 + centeredIndex * 0.06;
        const ctrForAd = Math.max(0, ctr * ctrVariance);
        const clicks = Math.max(0, Math.round(impressions * ctrForAd));
        const results = Math.max(1, Math.round(clicks * params.conversionRate));
        const costPerResult = Math.max(
          500,
          Math.round(baseCostPerResult * (1 + centeredIndex * 0.12)),
        );
        const spend = Math.max(0, results * costPerResult);

        const reachVariance = 1 + -centeredIndex * 0.06;
        const reach = Math.max(
          1,
          Math.round(params.reachPerDay * reachVariance * weekendMultiplier),
        );

        const roas = params.roas ?? null;
        const revenue = roas ? Math.round(spend * roas) : null;

        pushMetric({
          entityId: adId,
          date,
          spend,
          impressions,
          clicks,
          results,
          reach,
          revenue,
        });
      });
    });
  };

  const adIdsByAdGroupId = ads.reduce((map, ad) => {
    const bucket = map.get(ad.adGroupId) ?? [];
    bucket.push(ad.id);
    map.set(ad.adGroupId, bucket);
    return map;
  }, new Map<string, string[]>());

  adGroupDefinitions.forEach((group) => {
    const adIds = adIdsByAdGroupId.get(group.id) ?? [];
    if (adIds.length === 0) {
      throw new Error(
        `Mock data integrity: missing ads for adGroup "${group.id}"`,
      );
    }
    const baseProfile = PROFILES[group.profile];
    buildSeries({
      adIds,
      ...baseProfile,
      ...(group.seriesOverride ?? {}),
    });
  });

  return {
    accounts,
    campaigns,
    adGroups,
    ads,
    dailyMetrics,
    latestMetricDate,
  };
};

const buildCampaignRow = (campaign: CampaignWithAccountRow): CampaignRow => ({
  id: campaign.id,
  accountId: campaign.accountId,
  name: campaign.name,
  objective: campaign.objective,
  status: campaign.status,
});

export const createMockReviewSource = (): ReviewDataSource => {
  const db = buildMockDb();

  const campaignsById = new Map(db.campaigns.map((row) => [row.id, row]));
  const adsByAdGroupId = db.ads.reduce((map, ad) => {
    const bucket = map.get(ad.adGroupId) ?? [];
    bucket.push(ad);
    map.set(ad.adGroupId, bucket);
    return map;
  }, new Map<string, MockDb["ads"]>());

  const adGroupsById = new Map(db.adGroups.map((row) => [row.id, row]));

  return {
    async getLatestMetricDate() {
      return db.latestMetricDate;
    },

    async getFirstAccountId() {
      return db.accounts[0]?.id ?? null;
    },

    async getAccounts() {
      return [...db.accounts].sort((a, b) => a.name.localeCompare(b.name));
    },

    async getAdGroupsForAccount(accountId: string): Promise<AdGroupListRow[]> {
      return db.adGroups
        .filter((group) => group.campaign.accountId === accountId)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((group) => ({
          id: group.id,
          campaignId: group.campaignId,
          name: group.name,
          status: group.status,
          campaign: buildCampaignRow(group.campaign),
          ads: (adsByAdGroupId.get(group.id) ?? []).map((ad) => ({
            id: ad.id,
          })),
        }));
    },

    async getAdGroupsForCampaign(
      campaignId: string,
    ): Promise<AdGroupCampaignListRow[]> {
      const campaign = campaignsById.get(campaignId);
      if (!campaign) return [];

      return db.adGroups
        .filter((group) => group.campaignId === campaignId)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((group) => ({
          id: group.id,
          campaignId: group.campaignId,
          name: group.name,
          status: group.status,
          campaign: {
            ...buildCampaignRow(campaign),
            account: campaign.account,
          },
          ads: (adsByAdGroupId.get(group.id) ?? []).map((ad) => ({
            id: ad.id,
          })),
        }));
    },

    async getAdGroupById(adGroupId: string): Promise<AdGroupDetailRow | null> {
      const group = adGroupsById.get(adGroupId);
      if (!group) return null;

      return {
        id: group.id,
        campaignId: group.campaignId,
        name: group.name,
        status: group.status,
        campaign: buildCampaignRow(group.campaign),
        ads: (adsByAdGroupId.get(group.id) ?? []).map((ad) => ({
          id: ad.id,
          adGroupId: ad.adGroupId,
          name: ad.name,
          creativeKey: ad.creativeKey,
          creativeType: ad.creativeType,
          status: ad.status,
        })),
      };
    },

    async getDailyMetricsForAds(adIds: string[], range: DateRange) {
      const allowed = new Set(adIds);
      const start = formatSqlDate(range.start);
      const end = formatSqlDate(range.end);

      return db.dailyMetrics
        .filter((row) => allowed.has(row.entityId))
        .filter((row) => {
          const day = formatSqlDate(row.date);
          return day >= start && day <= end && isWithinRange(row.date, range);
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    },
  };
};
