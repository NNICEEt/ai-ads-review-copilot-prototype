import { SCORING_CONFIG } from "@/lib/config/scoring";

type ScoringThresholds = typeof SCORING_CONFIG.thresholds;

type KpiOverride = Partial<
  Pick<
    ScoringThresholds,
    | "costPerResultTarget"
    | "roasTarget"
    | "ctrMin"
    | "ctrWarning"
    | "frequencyWarning"
    | "frequencyHigh"
  >
>;

export type ObjectiveKey = "SALES" | "LEADS" | "AWARENESS" | "TRAFFIC";

const normalizeObjective = (
  value: string | null | undefined,
): ObjectiveKey | null => {
  const key = value?.toUpperCase().trim();
  if (key === "SALES") return key;
  if (key === "LEADS") return key;
  if (key === "AWARENESS") return key;
  if (key === "TRAFFIC") return key;
  return null;
};

const OBJECTIVE_KPI: Partial<Record<ObjectiveKey, KpiOverride>> = {
  SALES: {
    costPerResultTarget: 150_00,
    roasTarget: 3,
    ctrMin: 0.008,
    ctrWarning: 0.005,
    frequencyWarning: 3,
    frequencyHigh: 4,
  },
  LEADS: {
    costPerResultTarget: 120_00,
    roasTarget: 3,
    ctrMin: 0.007,
    ctrWarning: 0.0045,
    frequencyWarning: 3,
    frequencyHigh: 4,
  },
  TRAFFIC: {
    costPerResultTarget: 130_00,
    roasTarget: 3,
    ctrMin: 0.007,
    ctrWarning: 0.0045,
    frequencyWarning: 3,
    frequencyHigh: 4,
  },
  AWARENESS: {
    costPerResultTarget: 170_00,
    roasTarget: 3,
    ctrMin: 0.006,
    ctrWarning: 0.004,
    frequencyWarning: 4,
    frequencyHigh: 5,
  },
};

const ACCOUNT_KPI: Record<
  string,
  {
    default?: KpiOverride;
    objectives?: Partial<Record<ObjectiveKey, KpiOverride>>;
  }
> = {
  acc_7eleven_th: {
    objectives: {
      SALES: {
        costPerResultTarget: 150_00,
        roasTarget: 3,
      },
      LEADS: {
        costPerResultTarget: 110_00,
      },
    },
  },
  acc_lotus_th: {
    objectives: {
      SALES: {
        costPerResultTarget: 140_00,
        roasTarget: 3.2,
      },
    },
  },
};

export const resolveScoringThresholds = (params: {
  accountId: string | null | undefined;
  objective: string | null | undefined;
}): ScoringThresholds => {
  const base = SCORING_CONFIG.thresholds;
  const objectiveKey = normalizeObjective(params.objective);
  const account = params.accountId ? ACCOUNT_KPI[params.accountId] : null;

  return {
    ...base,
    ...(objectiveKey ? OBJECTIVE_KPI[objectiveKey] : null),
    ...(account?.default ?? null),
    ...(objectiveKey ? account?.objectives?.[objectiveKey] : null),
  };
};
