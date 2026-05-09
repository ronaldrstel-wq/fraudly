import { EN_MESSAGES } from "@/lib/messages.en";

/** Third‑party collector / scrape plumbing — not interpreted as signals about the checked website. */
const REVIEW_PROVIDER_PLUMBING = new RegExp(
  [
    "blocked\\s+by\\s+robots",
    "robots\\s*(?:\\.txt|\\s+policy)",
    "\\b502\\b",
    "\\b503\\b",
    "\\b401\\b",
    "\\b403\\b",
    "\\b404\\b",
    "\\b429\\b",
    "http\\s+\\d{3}",
    "failed\\s+to\\s+parse",
    "parse(?:r|ing)\\s+(?:provider\\s+)?response",
    "fetch\\s+failed",
    "collector\\s+failed",
    "ETIMEOUT",
    "ECONNRESET",
    "trustpilot",
    "indexed\\s+review\\s+snippet",
    "public\\s+page"
  ].join("|"),
  "i"
);

export type ReviewFetchDebugBucket =
  | "provider_error"
  | "source_unavailable"
  | "review_signal"
  | "website_behavior";

export type ReviewFetchDebugSource = "trustpilot_public" | "google_indexed_snippets";

export type ReviewFetchDebugEntry = {
  source: ReviewFetchDebugSource;
  bucket: ReviewFetchDebugBucket;
};

/** True when this warning string should never appear verbatim in consumer UI (checked-site risk context). */
export function isThirdPartyReviewPlumbingMessage(message: string): boolean {
  return REVIEW_PROVIDER_PLUMBING.test(message.trim());
}

/**
 * Filters legacy cached `warnings` so provider/crawler noise never surfaces in the UI.
 * Website-specific transparency notes stay (if ever added to this array deliberately).
 */
export function reviewWarningsSafeForUi(warnings: string[]): string[] {
  return warnings.filter((w) => typeof w === "string" && w.trim().length > 0 && !isThirdPartyReviewPlumbingMessage(w));
}

/** Drops scary third-party collector strings; keeps benign lines; adds one neutral summary when anything was redacted. */
export function sanitizePublicIntelWarningsForUi(warnings: string[]): string[] {
  if (!warnings.length) return [];
  const neutral = EN_MESSAGES.reviewEvidence.reviewSnapshotIncomplete;
  const safe = warnings.filter((w) => !isThirdPartyReviewPlumbingMessage(w));
  const hadPlumbing = safe.length < warnings.length;
  const out = [...safe];
  if (hadPlumbing && !out.includes(neutral)) out.push(neutral);
  return out.length ? out : [];
}

export function classifyThirdPartyCollectorWarning(raw: string | undefined): ReviewFetchDebugBucket {
  const w = raw?.trim() ?? "";
  if (!w) return "source_unavailable";
  if (/robots|disallowed|disallowed\s+path/i.test(w)) return "source_unavailable";
  if (/\b(401|403|404|429|50[0234])\b|http\s+\d{3}/i.test(w)) return "provider_error";
  if (/timeout|ECONNRESET|ENOTFOUND|network|fetch failed|parse/i.test(w)) return "provider_error";
  return "source_unavailable";
}

export function neutralLabelForReviewDebugEntry(entry: ReviewFetchDebugEntry): string {
  switch (entry.bucket) {
    case "provider_error":
      return `${formatSource(entry.source)}: connection or data feed issue on Fraudly’s side — not evidence about the seller.`;
    case "source_unavailable":
      return `${formatSource(entry.source)}: snapshot unavailable in this crawl (limits confidence only).`;
    case "website_behavior":
      return `${formatSource(entry.source)}: indexing / crawler transparency note about the checked site.`;
    case "review_signal":
      return `${formatSource(entry.source)}: review-derived signal`;
    default:
      return `${formatSource(entry.source)}: availability unknown`;
  }
}

function formatSource(s: ReviewFetchDebugSource): string {
  switch (s) {
    case "trustpilot_public":
      return "Third-party Trustpilot snapshot";
    case "google_indexed_snippets":
      return "Indexed review snippets probe";
    default:
      return "Review probe";
  }
}

export function appendNeutralAvailabilityOnce(bucket: ReviewFetchDebugBucket, lines: string[]): void {
  if (bucket === "provider_error" || bucket === "source_unavailable") {
    const line = EN_MESSAGES.reviewEvidence.reviewDataUnavailable;
    if (!lines.includes(line)) lines.push(line);
  }
}
