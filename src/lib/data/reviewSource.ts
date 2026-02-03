import type { CreativeType, EntityStatus } from "@/lib/types/canonical";
import { createMockReviewSource } from "@/lib/data/sources/mock";

export type DateRange = { start: Date; end: Date };

export type AccountRow = { id: string; name: string };

export type CampaignRow = {
  id: string;
  accountId: string;
  name: string;
  objective: string;
  status: EntityStatus;
};

export type CampaignWithAccountRow = CampaignRow & { account: AccountRow };

export type AdIdRow = { id: string };

export type AdRow = {
  id: string;
  adGroupId: string;
  name: string;
  creativeKey?: string | null;
  creativeType?: CreativeType | null;
  status: EntityStatus;
};

export type AdGroupRow = {
  id: string;
  campaignId: string;
  name: string;
  status: EntityStatus;
};

export type AdGroupListRow = AdGroupRow & {
  campaign: CampaignRow;
  ads: AdIdRow[];
};

export type AdGroupCampaignListRow = AdGroupRow & {
  campaign: CampaignWithAccountRow;
  ads: AdIdRow[];
};

export type AdGroupDetailRow = AdGroupRow & {
  campaign: CampaignRow;
  ads: AdRow[];
};

export type DailyMetricRow = {
  entityId: string;
  date: Date;
  spend: number;
  impressions: number;
  clicks: number;
  results: number;
  reach: number | null;
  revenue: number | null;
};

export type ReviewDataSource = {
  getLatestMetricDate(): Promise<Date | null>;
  getFirstAccountId(): Promise<string | null>;
  getAccounts(): Promise<AccountRow[]>;
  getAdGroupsForAccount(accountId: string): Promise<AdGroupListRow[]>;
  getAdGroupsForCampaign(campaignId: string): Promise<AdGroupCampaignListRow[]>;
  getAdGroupById(adGroupId: string): Promise<AdGroupDetailRow | null>;
  getDailyMetricsForAds(
    adIds: string[],
    range: DateRange,
  ): Promise<DailyMetricRow[]>;
};

let cached: ReviewDataSource | null = null;

export const getReviewDataSource = (): ReviewDataSource => {
  if (cached) return cached;
  cached = createMockReviewSource();
  return cached;
};
