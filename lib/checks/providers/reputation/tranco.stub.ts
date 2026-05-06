import { checksConfig } from "@/lib/checks/config";
import type { ProviderEvidenceResult } from "@/lib/checks/providers/types";
import { wrapEvidence } from "@/lib/checks/providers/shared";

export async function runTrancoStub(): Promise<ProviderEvidenceResult[]> {
  if (!checksConfig.tranco) return [];
  return [
    wrapEvidence(
      "Tranco",
      "reputation",
      "info",
      false,
      "Tranco popularity ranking not integrated yet",
      "Global popularity ranking via Tranco list downloads is not wired in this release.",
      "high"
    )
  ];
}
