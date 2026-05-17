import { standardVerdictLabel, trustScoreFromRisk } from "@/lib/scoring/displayScore";
import { scamVerdictFromConsumerLabel } from "@/lib/scoring/consumerVerdictMap";
import { logTrustDisplayAlignment } from "@/lib/trust/trustDisplayLog";
import type { ConsumerVerdictLabel } from "@/lib/trust/types";
import type { ScamVerdict } from "@/types/scam";

export type TrustDisplayDriftReport = {
  domain: string;
  source: string;
  riskScore: number;
  trustFromRisk: number;
  consumerVerdict: ConsumerVerdictLabel;
  legacyVerdict: ScamVerdict | null;
  storedStatusLabel?: string | null;
  mismatch: boolean;
  notes: string[];
};

/**
 * Development / audit helper: compares risk-derived trust with optional legacy snapshot label.
 * Logs when a stored 3-tier status label would disagree with the five-band consumer verdict.
 */
export function auditTrustDisplayAlignment(input: {
  domain: string;
  source: string;
  riskScore: number;
  storedStatusLabel?: string | null;
}): TrustDisplayDriftReport {
  const trustFromRisk = trustScoreFromRisk(input.riskScore);
  const consumerVerdict = standardVerdictLabel(trustFromRisk) as ConsumerVerdictLabel;
  const legacyVerdict = scamVerdictFromConsumerLabel(consumerVerdict);
  const notes: string[] = [];

  if (input.storedStatusLabel && legacyVerdict) {
    const labelLower = input.storedStatusLabel.toLowerCase();
    const legacyMismatch =
      (legacyVerdict === "safe" && labelLower.includes("risk")) ||
      (legacyVerdict === "scam" && labelLower.includes("safe")) ||
      (legacyVerdict === "suspicious" && labelLower.includes("strong"));
    if (legacyMismatch) {
      notes.push(
        `stored statusLabel "${input.storedStatusLabel}" may disagree with trust-derived ${consumerVerdict}`
      );
    }
  }

  const report: TrustDisplayDriftReport = {
    domain: input.domain,
    source: input.source,
    riskScore: input.riskScore,
    trustFromRisk,
    consumerVerdict,
    legacyVerdict,
    storedStatusLabel: input.storedStatusLabel,
    mismatch: notes.length > 0,
    notes
  };

  if (report.mismatch) {
    logTrustDisplayAlignment({
      domain: input.domain,
      riskScore: input.riskScore,
      trustScore: report.trustFromRisk,
      consumerVerdictLabel: report.consumerVerdict,
      statusLabel: input.storedStatusLabel ?? null,
      hasPublicPayloadV2: false,
      source: "snapshot",
      mismatchStatusLabel: true
    });
  }

  return report;
}
