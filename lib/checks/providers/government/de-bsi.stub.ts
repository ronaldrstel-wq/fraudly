import { checksConfig } from "@/lib/checks/config";
import type { ProviderEvidenceResult } from "@/lib/checks/providers/types";
import { wrapEvidence } from "@/lib/checks/providers/shared";

export async function runDeBsiStub(): Promise<ProviderEvidenceResult[]> {
  if (!checksConfig.govDe) return [];
  return [
    wrapEvidence(
      "DE BSI / national guidance",
      "government",
      "info",
      false,
      "German national feed not integrated yet",
      "Placeholder for BSI or other German public cyber guidance sources when an official feed is integrated.",
      "high"
    )
  ];
}
