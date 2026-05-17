import type { ConsumerVerdictLabel } from "@/lib/trust/types";
import type { ScamVerdict } from "@/types/scam";

/** Maps five-band consumer labels to legacy API verdict for humanRec / feed bucketing only. */
export function scamVerdictFromConsumerLabel(label: ConsumerVerdictLabel | string): ScamVerdict | null {
  switch (label) {
    case "Likely Safe":
    case "Mostly Safe":
      return "safe";
    case "High Risk":
      return "scam";
    case "Use Caution":
    case "Suspicious":
      return "suspicious";
    default:
      return null;
  }
}
