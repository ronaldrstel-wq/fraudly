import { PUBLIC_RESULT_PAYLOAD_SCHEMA_VERSION } from "@/lib/trust/canonicalTrustBridge";

export type TrustDisplayLogSource =
  | "api"
  | "snapshot"
  | "latest-checks"
  | "check-page"
  | "persist"
  | "backfill";

export type TrustDisplayLogEvent = {
  domain: string;
  scanId?: string | null;
  riskScore?: number | null;
  trustScore?: number | null;
  consumerVerdictLabel?: string | null;
  consumerVerdictBand?: string | null;
  statusLabel?: string | null;
  hasPublicPayloadV2: boolean;
  source: TrustDisplayLogSource;
  mismatchStatusLabel?: boolean;
  mismatchRiskTrust?: boolean;
};

const SAMPLE_RATE = (() => {
  const raw = process.env.TRUST_DISPLAY_LOG_SAMPLE_RATE;
  if (raw == null || raw === "") return 0.05;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0.05;
})();

function shouldSample(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  if (process.env.TRUST_DISPLAY_LOG_ALWAYS === "1") return true;
  return Math.random() < SAMPLE_RATE;
}

function sanitizeDomain(domain: string): string {
  return domain.trim().toLowerCase().slice(0, 253);
}

/** Production-safe, sampled trust alignment telemetry (no PII). */
export function logTrustDisplayAlignment(event: TrustDisplayLogEvent): void {
  const mismatchStatusLabel = event.mismatchStatusLabel === true;
  const mismatchRiskTrust = event.mismatchRiskTrust === true;
  const hasMismatch = mismatchStatusLabel || mismatchRiskTrust;

  if (!hasMismatch && !shouldSample()) return;

  const payload = {
    type: "trust_display_alignment",
    domain: sanitizeDomain(event.domain),
    scanId: event.scanId ?? null,
    riskScore: event.riskScore ?? null,
    trustScore: event.trustScore ?? null,
    consumerVerdictLabel: event.consumerVerdictLabel ?? null,
    consumerVerdictBand: event.consumerVerdictBand ?? null,
    statusLabel: event.statusLabel ?? null,
    hasPublicPayloadV2: event.hasPublicPayloadV2,
    source: event.source,
    mismatchStatusLabel,
    mismatchRiskTrust
  };

  if (hasMismatch) {
    console.warn(JSON.stringify(payload));
  } else {
    console.info(JSON.stringify(payload));
  }
}

export function payloadHasV2Schema(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  return (payload as { schemaVersion?: number }).schemaVersion === PUBLIC_RESULT_PAYLOAD_SCHEMA_VERSION;
}

export function detectRiskTrustMismatch(riskScore: number | null | undefined, trustScore: number | null | undefined): boolean {
  if (riskScore == null || trustScore == null) return false;
  if (!Number.isFinite(riskScore) || !Number.isFinite(trustScore)) return false;
  return Math.abs(trustScore - (100 - riskScore)) > 2;
}
