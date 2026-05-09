import { describe, expect, it } from "vitest";
import { EN_MESSAGES } from "@/lib/messages.en";
import {
  classifyThirdPartyCollectorWarning,
  isThirdPartyReviewPlumbingMessage,
  neutralLabelForReviewDebugEntry,
  reviewWarningsSafeForUi,
  sanitizePublicIntelWarningsForUi
} from "@/lib/reviewSourceNormalization";

describe("reviewSourceNormalization", () => {
  it("flags Trustpilot robots / HTTP plumbing as non-user-safe", () => {
    expect(isThirdPartyReviewPlumbingMessage("Trustpilot (public page): Blocked by robots policy.")).toBe(true);
    expect(isThirdPartyReviewPlumbingMessage("HTTP 403")).toBe(true);
    expect(isThirdPartyReviewPlumbingMessage("HTTP 401")).toBe(true);
    expect(isThirdPartyReviewPlumbingMessage("Failed to parse provider response")).toBe(true);
  });

  it("keeps consumer-safe review copy untouched", () => {
    expect(isThirdPartyReviewPlumbingMessage(EN_MESSAGES.reviewEvidence.noPublicReviewProfile)).toBe(false);
    expect(isThirdPartyReviewPlumbingMessage(EN_MESSAGES.reviewEvidence.reviewDataUnavailable)).toBe(false);
    expect(isThirdPartyReviewPlumbingMessage(EN_MESSAGES.reviewEvidence.reviewInformationUnverified)).toBe(false);
  });

  it("reviewWarningsSafeForUi strips legacy Trustpilot crawler messages", () => {
    expect(reviewWarningsSafeForUi(["Trustpilot collector failed.", "Trustpilot (public page): Blocked by robots policy."])).toEqual([]);
  });

  it("sanitizePublicIntelWarningsForUi collapses Plumbing to a neutral acknowledgement", () => {
    expect(sanitizePublicIntelWarningsForUi(["Trustpilot (public page): Blocked by robots policy."])).toEqual([
      EN_MESSAGES.reviewEvidence.reviewSnapshotIncomplete
    ]);
    expect(sanitizePublicIntelWarningsForUi(["indexed: HTTP 401"])).toEqual([EN_MESSAGES.reviewEvidence.reviewSnapshotIncomplete]);
  });

  it("sanitize keeps benign enrichment lines while appending neutral when Plumbing is mixed in", () => {
    expect(sanitizePublicIntelWarningsForUi(["Reddit chatter elevated", "googleIndexedReviews: HTTP 403"])).toEqual([
      "Reddit chatter elevated",
      EN_MESSAGES.reviewEvidence.reviewSnapshotIncomplete
    ]);
  });

  it("sanitize leaves Outscraper-friendly bundles untouched when no Plumbing", () => {
    expect(sanitizePublicIntelWarningsForUi(["Public-source enrichment is disabled."])).toEqual([
      "Public-source enrichment is disabled."
    ]);
    expect(sanitizePublicIntelWarningsForUi([])).toEqual([]);
  });

  it("classifyThirdPartyCollectorWarning maps robots vs HTTP distinctly", () => {
    expect(classifyThirdPartyCollectorWarning("Blocked by robots policy.")).toBe("source_unavailable");
    expect(classifyThirdPartyCollectorWarning("HTTP 503")).toBe("provider_error");
    expect(classifyThirdPartyCollectorWarning("timeout contacting host")).toBe("provider_error");
  });

  it("neutralLabelForReviewDebugEntry stays non-alarming", () => {
    const line = neutralLabelForReviewDebugEntry({
      source: "trustpilot_public",
      bucket: "provider_error"
    });
    expect(line.toLowerCase()).not.toContain("http");
    expect(line.toLowerCase()).not.toContain("403");
    expect(line).toMatch(/fraudly/i);
  });
});
