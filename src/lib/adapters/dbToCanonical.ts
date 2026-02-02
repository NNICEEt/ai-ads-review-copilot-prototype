import {
  Account,
  Campaign,
  AdGroup,
  Ad,
  EntityStatus,
  CreativeType,
} from "@/lib/types/canonical";

export const mapAccount = (row: { id: string; name: string }): Account => ({
  id: row.id,
  name: row.name,
});

export const mapCampaign = (row: {
  id: string;
  accountId: string;
  name: string;
  objective: string;
  status: EntityStatus;
}): Campaign => ({
  id: row.id,
  accountId: row.accountId,
  name: row.name,
  objective: row.objective,
  status: row.status,
});

export const mapAdGroup = (row: {
  id: string;
  campaignId: string;
  name: string;
  status: EntityStatus;
}): AdGroup => ({
  id: row.id,
  campaignId: row.campaignId,
  name: row.name,
  status: row.status,
});

export const mapAd = (row: {
  id: string;
  adGroupId: string;
  name: string;
  creativeKey?: string | null;
  creativeType?: CreativeType | null;
  status: EntityStatus;
}): Ad => ({
  id: row.id,
  adGroupId: row.adGroupId,
  name: row.name,
  creativeKey: row.creativeKey ?? null,
  creativeType: row.creativeType ?? null,
  status: row.status,
});
