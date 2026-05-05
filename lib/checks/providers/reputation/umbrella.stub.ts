import { checksConfig } from "@/lib/checks/config";
import type { ProviderEvidenceResult } from "@/lib/checks/providers/types";
import { wrapEvidence } from "@/lib/checks/providers/shared";

export async function runUmbrellaStub(): Promise<ProviderEvidenceResult[]> {
  if (!checksConfig.umbrella) return [];
  return [
    wrapEvidence(
      "Cisco Umbrella",
      "reputation",
      "info",
      false,
      "Umbrella popularity data not integrated yet",
      "Cisco Umbrella rank / popularity feeds are not connected. These often require commercial access.",
      "high"
    )
  ];
}
