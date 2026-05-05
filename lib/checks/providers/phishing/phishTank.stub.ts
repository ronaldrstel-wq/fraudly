import { checksConfig } from "@/lib/checks/config";
import type { ProviderEvidenceResult } from "@/lib/checks/providers/types";
import { wrapEvidence } from "@/lib/checks/providers/shared";

export async function runPhishTankStub(): Promise<ProviderEvidenceResult[]> {
  if (!checksConfig.phishTank) return [];
  return [
    wrapEvidence(
      "PhishTank",
      "phishing",
      "info",
      false,
      "PhishTank not integrated yet",
      "The PhishTank flag is on, but Fraudly does not call PhishTank in this release. Prefer official API access with registration when enabling.",
      "high"
    )
  ];
}
