import { checksConfig } from "@/lib/checks/config";
import type { ProviderEvidenceResult } from "@/lib/checks/providers/types";
import { wrapEvidence } from "@/lib/checks/providers/shared";

export async function runUsCisaStub(): Promise<ProviderEvidenceResult[]> {
  if (!checksConfig.govUs) return [];
  return [
    wrapEvidence(
      "US CISA / national guidance",
      "government",
      "info",
      false,
      "US national feed not integrated yet",
      "Placeholder for CISA or other US public advisory integrations when a stable machine-readable source is wired.",
      "high"
    )
  ];
}
