export type TrustEvidenceSignalSeverity = "low" | "medium" | "high";

export type TrustEvidenceSignalChip = {
  id: string;
  label: string;
  severity: TrustEvidenceSignalSeverity;
  explanation: string;
};

export type TrustEvidenceSection = {
  title: string;
  summary: string;
  impactLevel: TrustEvidenceSignalSeverity;
  signals: TrustEvidenceSignalChip[];
  /** Portion attributed to this block before overall cap (for display). */
  riskDelta: number;
  notes?: string;
};

export type TrustEvidenceBundle = {
  screenshotAd?: TrustEvidenceSection;
  webshop?: TrustEvidenceSection;
  socialAd?: TrustEvidenceSection;
  /** Sum of module deltas after combining caps applied to the risk score. */
  appliedRiskDelta: number;
  imageHash?: string | null;
};

export type WebsiteAnalysisClientEvidence = {
  adText?: string | null;
  sourcePlatform?: string | null;
  imageAnalysis?: {
    imageHash: string;
    detectedText?: string | null;
    extractedSignals?: Record<string, unknown> | null;
    summary?: string | null;
    riskDelta?: number;
    fallbackMessage?: string | null;
    aiUsed?: boolean;
  } | null;
};

export function hasMeaningfulClientEvidence(ev: WebsiteAnalysisClientEvidence | null | undefined): boolean {
  if (!ev) return false;
  if (ev.imageAnalysis?.imageHash) return true;
  if (ev.adText?.trim()) return true;
  if (ev.sourcePlatform?.trim()) return true;
  return false;
}
