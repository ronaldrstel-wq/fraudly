export type PulseReliability = "reliable" | "limited" | "building";

export type PulseIntelligenceAccent = "blue" | "amber" | "rose" | "violet" | "emerald" | "slate";

/** Single scam-intelligence insight tile for Fraudly Pulse. */
export type PulseIntelligenceTile = {
  id: string;
  title: string;
  value: string;
  explanation: string;
  reliability: PulseReliability;
  /** Human confidence line shown under the chip (e.g. sample size). */
  confidenceNote: string;
  accent: PulseIntelligenceAccent;
  /** Featured “insight of the day” styling */
  featured?: boolean;
};

export type PulseKpi = {
  title: string;
  value: string;
  explanation: string;
  reliability: PulseReliability;
  trend: string | null;
};

export type PulseRankItem = {
  label: string;
  count: number;
};

export type PulseTrendBucket = {
  day: string;
  checks: number;
  suspicious: number;
  highRisk: number;
  alerts: number;
};

export type PulseHighRiskFeedItem = {
  id: string;
  domain: string;
  score: number;
  statusLabel: string;
  checkedAt: Date;
  href: string;
  reason: string;
};

export type FraudlyPulseStats = {
  generatedAt: Date;
  intelligenceTiles: PulseIntelligenceTile[];
  recentHighRiskDetections: PulseHighRiskFeedItem[];
  trendBuckets: PulseTrendBucket[];
  coverage: {
    todayScans: number;
    last30dScans: number;
    last30dHighRisk: number;
    last30dSuspicious: number;
    last30dAlerts: number;
  };
};
