export const SCORING_CONFIG = {
  weights: {
    costPerResult: 0.35,
    roas: 0.25,
    ctr: 0.2,
    frequency: 0.2,
  },
  thresholds: {
    costPerResultTarget: 150_00, // satang => ฿150.00
    roasTarget: 3,
    ctrMin: 0.008, // 0.8%
    ctrWarning: 0.005, // 0.5%
    frequencyWarning: 3,
    frequencyHigh: 4,
    costCreepingPct: 0.1, // +10%
    costSpikePct: 0.2, // +20%
    labelTop: 80,
    labelNeedsAttention: 50,
  },
  labels: {
    top: "Top",
    normal: "Normal",
    needsAttention: "Needs attention",
  },
};
