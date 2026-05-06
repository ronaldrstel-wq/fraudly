import { checksConfig } from "@/lib/checks/config";
import type { ProviderEvidenceResult } from "@/lib/checks/providers/types";
import { wrapEvidence } from "@/lib/checks/providers/shared";

export async function runAbuseIpdbStub(): Promise<ProviderEvidenceResult[]> {
  if (!checksConfig.abuseIpdb) return [];
  return [
    wrapEvidence(
      "AbuseIPDB",
      "reputation",
      "info",
      false,
      "AbuseIPDB not integrated yet",
      "Reputation queries against AbuseIPDB are not wired for hostname-only scans in this build.",
      "high"
    )
  ];
}
