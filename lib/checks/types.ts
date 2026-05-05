export type TrustSignal = {
  type: "positive" | "warning" | "danger";
  title: string;
  description: string;
  source?: string;
};

export type PoliceScamCheck = {
  listedInPoliceScamDatabase: boolean;
  policeScamMatch?: string;
  policeWarningReason?: string;
  source: string;
  warnings: string[];
};

export type DomainIntelligence = {
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
  warnings: string[];
};
