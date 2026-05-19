import { EN_MESSAGES } from "@/lib/messages.en";

/** Check/result page shell copy (not in messages.en). */
export const checkPageEn = {
  breadcrumbHome: "Home",
  breadcrumbCheck: "Check a website",
  eyebrow: "Website trust check",
  titlePrefix: "Is ",
  titleSuffix: " safe to use?",
  introBefore: "Below is an automated, evidence-based snapshot of ",
  introMiddle:
    " showing risk indicators, trust signals, and technical checks. Results are not legal or financial advice and are not a guarantee that a site is safe or unsafe.",
  guidePrefix: "Looking for the long-form trust guide (FAQs, scam vs. legit framing)? ",
  guideLinkBefore: "Open the ",
  guideLinkAfter: " trust intelligence page",
  snapshotTitle: "Snapshot only.",
  snapshotBody:
    "Data comes from public feeds, technical checks, and limited page context. Phishing and scam sites change quickly—use your judgment and official channels when in doubt.",
  ctaAnother: "Check another website",
  ctaLatest: "Latest public checks",
  metricsTrustScore: "Trust-style score",
  metricsDomainAge: "Domain age",
  metricsSsl: "Secure connection",
  visitWebsiteCta: "Visit website",
  visitWebsiteDisclaimer:
    "Fraudly did not detect strong risk indicators in this scan. Always use your own judgment.",
  limitedInspection:
    "The website responded, but some page details could not be fully inspected during this scan.",
  fallbackSummary: "Automated trust snapshot for this domain.",
  fallbackVerdict: "Check complete",
  threatSummary: "Confirmed threat intelligence affected this result.",
  discovery: {
    relatedTitle: "Related website checks",
    relatedDescription: "Other recently reviewed sites with similar risk signals, region, or naming patterns.",
    alsoCheckedTitle: "People also checked",
    alsoCheckedDescription: "Recent public checks from the Fraudly feed—explore other domains others are verifying.",
    footerLatestChecks: "View latest checks →"
  },
  emptySignals: {
    confirmedIntel:
      "No Safe Browsing, OpenPhish, URLhaus, or police-aligned list matches were returned in this crawl.",
    otherRisk: "No additional prioritized risk rows were raised beyond curated list matches.",
    supportive: "No supportive or informational trust rows were returned."
  },
  resultCardUi: {
    trustScoreUnavailable: "Trust score unavailable for this snapshot.",
    redirectNotice: "This website redirects to another domain. Fraudly also checked the final destination.",
    limitedInspectionShort:
      "Website responded, but some page details could not be fully inspected during this scan.",
    registeredDomainLabel: "Registered domain:",
    subdomainNote:
      "The submitted address is a subdomain. Fraudly also checked the registered domain because domain age and ownership belong to the root domain.",
    signalSourcePrefix: "Source:",
    fallbackSummary: "Fraudly could not verify all trust signals for this website."
  },
  domainRows: {
    checkedHostname: "Checked URL/hostname:",
    registeredDomain: "Registered domain:",
    registrationDate: "Registration date:",
    domainAge: "Domain age:",
    registrar: "Registrar:",
    country: "Country:",
    expirationDate: "Expiration date:",
    privacyHints: "Privacy / redacted ownership hints:",
    subdomainAnalysis: "Subdomain analysis:",
    unknown: "unknown",
    yes: "yes",
    no: "no",
    noOrUnknown: "no / unknown",
    possible: "possible",
    sourcePrefix: "Source:",
    subdomainRisky: "Potentially risky wording found ({terms}).",
    subdomainClean: "No high-risk wording detected in subdomain labels."
  }
} as const;

export const resultFlowEn = {
  scanResult: EN_MESSAGES.scanResult,
  threatOverride: EN_MESSAGES.threatOverride,
  paywall: EN_MESSAGES.paywall,
  check: {
    urlPlaceholder: EN_MESSAGES.check.urlPlaceholder,
    urlFieldLabel: EN_MESSAGES.check.urlFieldLabel
  },
  basicResult: EN_MESSAGES.basicResult,
  domainInfrastructure: EN_MESSAGES.domainInfrastructure,
  specialOutcomes: EN_MESSAGES.specialOutcomes,
  siteOutcome: EN_MESSAGES.siteOutcome,
  checkPage: checkPageEn
} as const;

export type ResultFlowMessages = {
  scanResult: typeof EN_MESSAGES.scanResult;
  threatOverride: typeof EN_MESSAGES.threatOverride;
  paywall: typeof EN_MESSAGES.paywall;
  check: {
    urlPlaceholder: string;
    urlFieldLabel: string;
  };
  basicResult: typeof EN_MESSAGES.basicResult;
  domainInfrastructure: typeof EN_MESSAGES.domainInfrastructure;
  specialOutcomes: typeof EN_MESSAGES.specialOutcomes;
  siteOutcome: typeof EN_MESSAGES.siteOutcome;
  checkPage: typeof checkPageEn;
};

export type CheckPageCopy = ResultFlowMessages["checkPage"];
