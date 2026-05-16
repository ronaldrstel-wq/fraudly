import type { TrustSignal } from "@/lib/checks/types";

export const FEED_CLEAN_SUMMARY =
  "No matches were found on major scam or phishing lists in this scan.";

export const FEED_HIT_SUMMARY = "This website appears in known scam or phishing reports.";

const FEED_SOURCES =
  /\b(openphish|urlhaus|safe browsing|google safe browsing|phishing feed|malware feed)\b/i;

const CONFIRMED_LISTING_TITLES =
  /\b(listed in openphish|listed in urlhaus|appears in google safe browsing|google safe browsing match|openphish intelligence|urlhaus intelligence)\b/i;

const NEGATED_FEED =
  /\b(no openphish|no urlhaus|no safe browsing|no match found|not listed|not flagged|no overlapping)\b/i;

export type ScamFeedThreatStatus = "hit" | "clean" | "unknown";

function signalBlob(signal: TrustSignal): string {
  return `${signal.title} ${signal.description ?? ""}`.trim();
}

export function isFeedRelatedSignal(signal: TrustSignal): boolean {
  const blob = signalBlob(signal);
  return FEED_SOURCES.test(blob) || CONFIRMED_LISTING_TITLES.test(blob) || NEGATED_FEED.test(blob);
}

/** Confirmed malicious listing from tier-1 feeds (not negated clean-feed rows). */
export function isConfirmedScamFeedHitSignal(signal: TrustSignal): boolean {
  const blob = signalBlob(signal);
  if (NEGATED_FEED.test(blob)) return false;
  if (signal.type === "danger" && CONFIRMED_LISTING_TITLES.test(blob)) return true;
  if (signal.type === "danger" && FEED_SOURCES.test(blob) && /\b(listed|match|flagged|threat)\b/i.test(blob)) {
    return true;
  }
  return false;
}

export function isCleanScamFeedSignal(signal: TrustSignal): boolean {
  if (!isFeedRelatedSignal(signal)) return false;
  if (isConfirmedScamFeedHitSignal(signal)) return false;
  const blob = signalBlob(signal);
  return NEGATED_FEED.test(blob) || (signal.type === "info" && /\bno\b/i.test(blob));
}

export function assessScamFeedThreatStatus(signals: TrustSignal[]): ScamFeedThreatStatus {
  let sawFeedCheck = false;
  let anyHit = false;

  for (const signal of signals) {
    if (!isFeedRelatedSignal(signal)) continue;
    sawFeedCheck = true;
    if (isConfirmedScamFeedHitSignal(signal)) anyHit = true;
  }

  if (anyHit) return "hit";
  if (sawFeedCheck) return "clean";
  return "unknown";
}

function isFeedCleanSummaryLine(line: string): boolean {
  return line.toLowerCase().includes("no matches were found on major scam or phishing lists");
}

function isFeedHitSummaryLine(line: string): boolean {
  return line.toLowerCase().includes("appears in known scam or phishing reports");
}

/** Ensures feed copy is never contradictory on the same scan. */
export function reconcileScamFeedConsumerLines(helpful: string[], watch: string[]): {
  helpful: string[];
  watch: string[];
} {
  const hasHitLine = watch.some(isFeedHitSummaryLine);
  const hasCleanLine = helpful.some(isFeedCleanSummaryLine);

  let nextHelpful = helpful.filter((line) => !isFeedHitSummaryLine(line));
  let nextWatch = watch.filter((line) => !isFeedCleanSummaryLine(line));

  if (hasHitLine) {
    nextHelpful = nextHelpful.filter((line) => !isFeedCleanSummaryLine(line));
    if (!nextWatch.some(isFeedHitSummaryLine)) {
      nextWatch = [FEED_HIT_SUMMARY, ...nextWatch];
    }
  } else if (hasCleanLine) {
    nextWatch = nextWatch.filter((line) => !isFeedHitSummaryLine(line));
  }

  return { helpful: nextHelpful, watch: nextWatch };
}
