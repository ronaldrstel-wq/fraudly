import { checksConfig } from "@/lib/checks/config";
import type { ProviderEvidenceResult } from "@/lib/checks/providers/types";
import { wrapEvidence } from "@/lib/checks/providers/shared";

export async function runUkNcscStub(): Promise<ProviderEvidenceResult[]> {
  if (!checksConfig.govUk) return [];
  return [
    wrapEvidence(
      "UK NCSC / national guidance",
      "government",
      "info",
      false,
      "UK national feed not integrated yet",
      "Placeholder for NCSC or other UK public advisory sources when a stable, terms-compliant API or feed is available.",
      "high"
    )
  ];
}
