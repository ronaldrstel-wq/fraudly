import type { ScamVerdict } from "@/types/scam";

/** Calm consumer-facing snapshots only — aligns with Fraudly wording elsewhere (no accusatory claims). */
export function publicStatusLabelForVerdict(verdict: ScamVerdict): string {
  switch (verdict) {
    case "scam":
      return "Strong risk indicators snapshot";
    case "suspicious":
      return "Mixed signals snapshot";
    case "safe":
    default:
      return "Lower risk context snapshot";
  }
}
