import type { ExternalChecksResult } from "@/lib/checks/types";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { ReviewSignals } from "@/lib/reviewSignals";
import type { ScoringIdentityContext } from "@/lib/scoringIdentityContext";
import type { ConfidenceLevel } from "@/types/site-outcome";

export type ConfidenceModelResult = {
  level: ConfidenceLevel;
  rationale: string;
};

/**
 * Confidence reflects **evidence completeness**, not “safe vs unsafe”.
 */
export function computeRatingConfidence(args: {
  ctx: ScoringIdentityContext | undefined;
  checks: ExternalChecksResult;
  reviewSignals: ReviewSignals;
  websiteTextLength: number;
}): ConfidenceModelResult {
  let scorePts = 0;
  const notes: string[] = [];

  if (!args.ctx) {
    return { level: "medium", rationale: "Limited calibration context attached to this run." };
  }

  const c = args.ctx;
  if (!c.rdapFailed && typeof c.ageDaysKnown === "number") {
    scorePts += 2;
    if (c.ageDaysKnown >= 90) scorePts += 1;
    if (c.ageDaysKnown >= 365) scorePts += 1;
  } else {
    notes.push("Registration lifecycle fields were unavailable or flaky.");
    scorePts -= 1;
  }

  if (reviewSignalsAnchored(args.reviewSignals)) {
    scorePts += 3;
    notes.push("Public review footprint observed.");
  } else if (reviewSignalsThin(args.reviewSignals)) {
    scorePts -= 1;
    notes.push("No public review profile surfaced in this crawl — this limits certainty.");
  }

  const reviewDebug = args.reviewSignals.reviewFetchDebug ?? [];
  const thirdPartyFriction = reviewDebug.some((r) => r.bucket === "provider_error" || r.bucket === "source_unavailable");
  if (thirdPartyFriction && !reviewSignalsAnchored(args.reviewSignals)) {
    scorePts -= 1;
    notes.push(EN_MESSAGES.reviewEvidence.reviewSnapshotIncomplete);
  }

  if (args.checks.ssl.httpsEnabled && args.checks.ssl.validCertificate) {
    scorePts += 1;
  } else if (!args.checks.ssl.httpsEnabled) {
    notes.push("HTTPS could not be negotiated in this probe.");
    scorePts -= 1;
  }

  if (args.websiteTextLength >= 400) scorePts += 1;
  else if (args.websiteTextLength < 120 && args.ctx.rdapFailed) scorePts -= 1;

  if (args.checks.safeBrowsing.safeBrowsingStatus === "unknown") notes.push("Safe Browsing status was unclear.");

  let level: ConfidenceLevel;
  if (scorePts >= 5) level = "high";
  else if (scorePts >= 2) level = "medium";
  else level = "low";

  let rationale =
    level === "low"
      ? `We do not have enough corroborating evidence for a firm rating.${notes.length ? ` ${notes.join(" ")}` : ""}`
      : level === "medium"
        ? `Evidence is partially complete.${notes.length ? ` ${notes.slice(0, 2).join(" ")}` : ""}`
        : `Several independent stewardship and technical checks aligned.${notes.length ? ` ${notes[0] ?? ""}` : ""}`;

  if (level === "low") {
    rationale = `${rationale.trim()} ${EN_MESSAGES.scoring.limitedPublicSources}`.trim();
  }

  return { level, rationale: rationale.trim() };
}

function reviewSignalsAnchored(review: ReviewSignals): boolean {
  const g =
    review.googleFound &&
    review.googleRating != null &&
    review.googleReviewCount != null &&
    review.googleRating >= 4 &&
    review.googleReviewCount >= 25;
  const tp =
    review.trustpilotFound &&
    review.trustpilotRating != null &&
    review.trustpilotReviewCount != null &&
    review.trustpilotRating >= 4 &&
    review.trustpilotReviewCount >= 25;
  return Boolean(g || tp);
}

function reviewSignalsThin(review: ReviewSignals): boolean {
  return !review.googleFound && !review.trustpilotFound;
}
