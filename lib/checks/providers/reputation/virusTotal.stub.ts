import { checksConfig } from "@/lib/checks/config";
import type { ProviderEvidenceResult } from "@/lib/checks/providers/types";
import { wrapEvidence } from "@/lib/checks/providers/shared";

export async function runVirusTotalStub(): Promise<ProviderEvidenceResult[]> {
  if (!checksConfig.virusTotal) return [];
  return [
    wrapEvidence(
      "VirusTotal",
      "reputation",
      "info",
      false,
      "VirusTotal not integrated yet",
      "No VirusTotal API key workflow is active. Enable only when you can comply with VirusTotal terms and quotas.",
      "high"
    )
  ];
}
