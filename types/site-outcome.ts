/** User-facing lifecycle / evidence state (orthogonal to numeric verdict). */
export type SiteStatus =
  | "trusted"
  | "unverified"
  | "caution"
  | "high_risk"
  | "confirmed_malicious"
  | "nonexistent"
  | "inactive";

/** How much evidence supports the numeric trust projection. */
export type ConfidenceLevel = "high" | "medium" | "low";
