import type { ProviderEvidenceResult } from "@/lib/checks/providers/types";

export type TrustSignal = {
  type: "positive" | "info" | "warning" | "danger";
  title: string;
  description: string;
  source?: string;
  confidence?: ProviderEvidenceResult["confidence"];
};

export type PoliceScamCheck = {
  listedInPoliceScamDatabase: boolean;
  policeScamMatch?: string;
  policeWarningReason?: string;
  source: string;
  warnings: string[];
};

export type DomainIntelligence = {
  checkedHostname?: string;
  registrableDomain?: string;
  subdomain?: string;
  subdomainDepth?: number;
  suspiciousSubdomainTerms?: string[];
  registrationDate?: string;
  ageDays?: number;
  registrar?: string;
  country?: string;
  expirationDate?: string;
  hasPrivacyProtection?: boolean;
  suspiciouslyShortRegistration?: boolean;
  source: string;
  warnings: string[];
};

export type SafeBrowsingCheck = {
  safeBrowsingStatus: "safe" | "flagged" | "unknown";
  safeBrowsingThreats: string[];
  source: string;
  warnings: string[];
};

export type FeedThreatCheck = {
  listed: boolean;
  matches: string[];
  source: string;
  warnings: string[];
};

export type SslCheck = {
  httpsEnabled: boolean;
  validCertificate: boolean;
  certificateIssuer?: string;
  certificateExpiry?: string;
  selfSigned?: boolean;
  source: string;
  warnings: string[];
};

export type ExternalChecksResult = {
  police: PoliceScamCheck;
  domainIntelligence: DomainIntelligence;
  safeBrowsing: SafeBrowsingCheck;
  openPhish: FeedThreatCheck;
  urlHaus: FeedThreatCheck;
  ssl: SslCheck;
  /** Normalized modular provider output (includes Tier 1 + optional Tier 2 stubs). */
  providerEvidence: ProviderEvidenceResult[];
  warnings: string[];
};
