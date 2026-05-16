import type { ExternalChecksResult } from "@/lib/checks/types";
import type { ReviewSignals } from "@/lib/reviewSignals";
import { parseDomainParts } from "@/lib/domain/parseDomain";
import { assessScamFeedThreatStatus } from "@/lib/signals/feedConsumerSignals";
import { resolveGoogleReviewMatch, resolveTrustpilotReviewMatch } from "@/lib/reputation/reviewMatchConfidence";
import type { TrustSignal } from "@/lib/checks/types";

export function logScanPipelineDebug(input: {
  submittedUrl: string;
  externalChecks: ExternalChecksResult;
  reviewSignals: ReviewSignals;
  trustSignals: TrustSignal[];
  riskScore: number;
  trustScore: number;
  verdict: string;
}): void {
  if (process.env.NODE_ENV === "production") return;

  const parsed = parseDomainParts(input.submittedUrl);
  const di = input.externalChecks.domainIntelligence;
  const feedStatus = assessScamFeedThreatStatus(input.trustSignals);
  const google = resolveGoogleReviewMatch(input.reviewSignals);
  const trustpilot = resolveTrustpilotReviewMatch(input.reviewSignals);

  console.info("[scan-pipeline]", {
    submittedUrl: input.submittedUrl,
    normalizedHostname: parsed.normalizedHostname,
    registrableDomain: parsed.registrableDomain,
    rdapQueryDomain: parsed.registrableDomain,
    domainAgeDays: di.ageDays ?? null,
    domainIntelligenceWarnings: di.warnings,
    ssl: {
      httpsEnabled: input.externalChecks.ssl.httpsEnabled,
      validCertificate: input.externalChecks.ssl.validCertificate
    },
    feeds: {
      openPhish: { listed: input.externalChecks.openPhish.listed, matches: input.externalChecks.openPhish.matches?.slice(0, 3) },
      urlHaus: { listed: input.externalChecks.urlHaus.listed, matches: input.externalChecks.urlHaus.matches?.slice(0, 3) },
      safeBrowsing: input.externalChecks.safeBrowsing.safeBrowsingStatus,
      police: input.externalChecks.police.listedInPoliceScamDatabase,
      aggregateStatus: feedStatus
    },
    reviews: {
      google: {
        displayable: google.displayable,
        confidence: google.confidence,
        rating: google.rating,
        reviewCount: google.reviewCount
      },
      trustpilot: {
        displayable: trustpilot.displayable,
        confidence: trustpilot.confidence,
        rating: trustpilot.rating,
        reviewCount: trustpilot.reviewCount
      }
    },
    riskScore: input.riskScore,
    trustScore: input.trustScore,
    verdict: input.verdict
  });
}
