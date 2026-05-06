import { checksConfig } from "@/lib/checks/config";
import type { ProviderEvidenceResult } from "@/lib/checks/providers/types";
import { wrapEvidence } from "@/lib/checks/providers/shared";

export async function runFrAnssiStub(): Promise<ProviderEvidenceResult[]> {
  if (!checksConfig.govFr) return [];
  return [
    wrapEvidence(
      "FR ANSSI / national guidance",
      "government",
      "info",
      false,
      "French national feed not integrated yet",
      "Placeholder for ANSSI or other French public advisory integrations when a stable API or feed is available.",
      "high"
    )
  ];
}
