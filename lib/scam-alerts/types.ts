export type ScamSignalSource =
  | "internal"
  | "urlhaus"
  | "phishtank"
  | "google_safe_browsing"
  | "google_web_risk";

export type ScamRiskLevel = "low" | "medium" | "high" | "critical";

export type NormalizedScamSignal = {
  source: ScamSignalSource;
  sourceRef?: string;
  url?: string;
  domain?: string;
  normalizedDomain?: string;
  scamType?: string;
  affectedBrand?: string;
  riskLevel: ScamRiskLevel;
  confidence: number;
  firstSeenAt?: Date;
  lastSeenAt?: Date;
  evidence: Record<string, unknown>;
};

export type ScamCluster = {
  clusterKey: string;
  scamType: string;
  affectedBrand?: string;
  riskLevel: ScamRiskLevel;
  confidence: number;
  signals: NormalizedScamSignal[];
  repeatedKeywords: string[];
  repeatedTlds: string[];
};

export type GeneratedAlertDraft = {
  slug: string;
  title: string;
  scamType: string;
  affectedBrand?: string;
  riskLevel: ScamRiskLevel;
  summary: string;
  safetyTips: string[];
  evidenceCount: number;
  exampleDomains: string[];
  sourceSummary: Array<{ source: ScamSignalSource; count: number }>;
  shouldPublish: boolean;
};
