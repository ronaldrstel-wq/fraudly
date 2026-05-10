import type { ScamVerdict } from "@/types/scam";

/** Published on {@link LatestPublicCheck.statusLabel} — stable strings for snapshot → verdict inference in overview UIs. */
export const PUBLIC_SNAPSHOT_LABEL_STRONG_RISK = "Strong risk indicators snapshot";
export const PUBLIC_SNAPSHOT_LABEL_MIXED = "Mixed signals snapshot";
export const PUBLIC_SNAPSHOT_LABEL_LOWER_RISK = "Lower risk context snapshot";

/** Calm consumer-facing snapshots only — aligns with Fraudly wording elsewhere (no accusatory claims). */
export function publicStatusLabelForVerdict(verdict: ScamVerdict): string {
  switch (verdict) {
    case "scam":
      return PUBLIC_SNAPSHOT_LABEL_STRONG_RISK;
    case "suspicious":
      return PUBLIC_SNAPSHOT_LABEL_MIXED;
    case "safe":
    default:
      return PUBLIC_SNAPSHOT_LABEL_LOWER_RISK;
  }
}

/** Best-effort verdict for `/latest-checks` rows (only safe | suspicious | scam; no Tier‑1 detail in the snapshot). */
export function verdictFromPublicSnapshotLabel(statusLabel: string): ScamVerdict | null {
  if (statusLabel === PUBLIC_SNAPSHOT_LABEL_STRONG_RISK) return "scam";
  if (statusLabel === PUBLIC_SNAPSHOT_LABEL_MIXED) return "suspicious";
  if (statusLabel === PUBLIC_SNAPSHOT_LABEL_LOWER_RISK) return "safe";
  return null;
}
