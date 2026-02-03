export type EntityStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";
export type CreativeType = "IMAGE" | "VIDEO" | "CAROUSEL" | "OTHER";
export type EntityType = "CAMPAIGN" | "AD_GROUP" | "AD";

export type Account = {
  id: string;
  name: string;
};

export type Campaign = {
  id: string;
  accountId: string;
  name: string;
  objective: string;
  status: EntityStatus;
};

export type AdGroup = {
  id: string;
  campaignId: string;
  name: string;
  status: EntityStatus;
};

export type Ad = {
  id: string;
  adGroupId: string;
  name: string;
  creativeKey?: string | null;
  creativeType?: CreativeType | null;
  status: EntityStatus;
};

export type DailyMetric = {
  entityType: EntityType;
  entityId: string;
  date: Date;
  spend: number; // minor units (satang)
  impressions: number;
  clicks: number;
  results: number;
  reach?: number | null;
  revenue?: number | null; // minor units (satang)
};

export type Totals = {
  spend: number;
  impressions: number;
  clicks: number;
  results: number;
  reach?: number | null;
  revenue?: number | null;
};

export type DerivedMetrics = {
  ctr?: number | null;
  costPerResult?: number | null;
  cpc?: number | null;
  conversionRate?: number | null;
  frequency?: number | null;
  roas?: number | null;
};
