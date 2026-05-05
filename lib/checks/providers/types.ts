export type ProviderCategory = "government" | "phishing" | "malware" | "domain" | "ssl" | "reputation";

export type ProviderSeverity = "positive" | "info" | "warning" | "danger";

export type ProviderConfidence = "low" | "medium" | "high";

export interface ProviderEvidenceResult {
  source: string;
  category: ProviderCategory;
  severity: ProviderSeverity;
  matched: boolean;
  title: string;
  description: string;
  confidence: ProviderConfidence;
  raw?: unknown;
}

export interface ProviderRun<TResult> {
  evidence: ProviderEvidenceResult[];
  result: TResult;
}
