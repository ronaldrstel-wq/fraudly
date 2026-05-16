import type { TrustSignal } from "@/lib/checks/types";
import { consumerSignalSummary, isInternalImplementationSignal } from "@/lib/consumerSignalCopy";
import { extractTrustHighlightFacts, type TrustHighlightFact } from "@/lib/signals/trustHighlightFacts";
import type { ScamCheckResult } from "@/types/scam";

export type NormalizedConsumerSignals = {
  helpful: string[];
  watch: string[];
};

const MAX_PER_SECTION = 5;
const MAX_HERO_PREVIEW = 3;

/** Consumer-safe context lines (not raw trust-signal rows). */
const INTERNAL_CONTEXT =
  /\b(enrichment (?:is )?not enabled|enrichment was not run|cache bypassed|outscraper|parser unavailable|rdap failed|feed hit composite)\b/i;

function signalBlob(signal: TrustSignal): string {
  return `${signal.title} ${signal.description ?? ""}`.trim();
}

function isNegatedListing(blob: string): boolean {
  return /\b(no match|not listed|no listing|not found|no overlapping|clean\b|passed\b|not flagged|absent|does not prove|unavailable in this snapshot)\b/i.test(
    blob
  );
}

function isConfirmedListing(blob: string): boolean {
  if (isNegatedListing(blob)) return false;
  return (
    /\b(listed in|appears on|flagged|reported threat|police reference|malware url|phishing)\b/i.test(blob) ||
    (/\b(openphish|urlhaus|safe browsing)\b/i.test(blob) && /\b(listed|match|flagged|threat)\b/i.test(blob))
  );
}

function hasCautionSemantics(blob: string): boolean {
  if (isConfirmedListing(blob)) return true;
  return /\b(very new domain|young domain|recently registered|short initial registration|validation issue|not established|privacy-protected|redacted ownership|limited reputation|suspicious)\b/i.test(
    blob
  );
}

function hasPositiveSemantics(blob: string): boolean {
  if (isConfirmedListing(blob)) return false;
  if (/\b(not established|validation issue|expired|self-signed|untrusted)\b/i.test(blob)) return false;
  return /\b(https is available|valid certificate|older domain|registered for roughly|no openphish|no urlhaus|safe browsing.{0,40}safe|reviews? found|rating)\b/i.test(
    blob
  );
}

/** Which consumer section this trust signal belongs in. */
export function resolveConsumerBucket(signal: TrustSignal): "positive" | "caution" | null {
  const blob = signalBlob(signal);
  if (isInternalImplementationSignal(blob)) return null;

  if (isConfirmedListing(blob)) return "caution";
  if (isNegatedListing(blob) && /\b(openphish|urlhaus|safe browsing|phishing|malware)\b/i.test(blob)) {
    return "positive";
  }

  switch (signal.type) {
    case "danger":
      return "caution";
    case "warning":
      return hasPositiveSemantics(blob) && !hasCautionSemantics(blob) ? "positive" : "caution";
    case "positive":
      return hasCautionSemantics(blob) ? "caution" : "positive";
    case "info":
      if (hasCautionSemantics(blob)) return "caution";
      if (hasPositiveSemantics(blob)) return "positive";
      return null;
    default:
      return null;
  }
}

function dedupePush(target: string[], seen: Set<string>, line: string): void {
  const key = line.toLowerCase().replace(/\s+/g, " ").trim();
  if (!key || seen.has(key)) return;
  seen.add(key);
  target.push(line);
}

function mergeHighlightFacts(highlights: TrustHighlightFact[], signals: TrustSignal[]): NormalizedConsumerSignals {
  const helpful: string[] = [];
  const watch: string[] = [];
  const seen = new Set<string>();

  for (const fact of highlights) {
    if (fact.bucket === "positive") dedupePush(helpful, seen, fact.consumerLine);
    else dedupePush(watch, seen, fact.consumerLine);
  }

  for (const signal of signals) {
    const bucket = resolveConsumerBucket(signal);
    if (!bucket) continue;

    const line = consumerSignalSummary(signal.title, signal.description, bucket);
    if (!line) continue;

    if (isDuplicateOfHighlight(line, highlights)) continue;

    if (bucket === "positive") dedupePush(helpful, seen, line);
    else dedupePush(watch, seen, line);
  }

  return {
    helpful: helpful.slice(0, MAX_PER_SECTION),
    watch: watch.slice(0, MAX_PER_SECTION)
  };
}

function isDuplicateOfHighlight(line: string, highlights: TrustHighlightFact[]): boolean {
  const normalized = line.toLowerCase().trim();
  return highlights.some((fact) => {
    const factLine = fact.consumerLine.toLowerCase().trim();
    if (normalized === factLine) return true;
    if (fact.id === "ssl" && /secure connection|valid secure/i.test(normalized)) return true;
    if (fact.id === "domain_age" && /domain|registered|existed|only \d/i.test(normalized)) return true;
    return false;
  });
}

export function normalizeConsumerSignals(signals: TrustSignal[]): NormalizedConsumerSignals {
  return mergeHighlightFacts([], signals);
}

/** Merges structured domain age / SSL facts with trust-signal summaries (deduped). */
export function normalizeConsumerSignalsForResult(
  result: Pick<ScamCheckResult, "trustSignals" | "domainIntelligence" | "ssl">
): NormalizedConsumerSignals {
  return mergeHighlightFacts(extractTrustHighlightFacts(result), result.trustSignals);
}

export function heroPreviewReasons(signals: NormalizedConsumerSignals): string[] {
  const combined = [...signals.watch, ...signals.helpful];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of combined) {
    const key = line.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
    if (out.length >= MAX_HERO_PREVIEW) break;
  }
  return out;
}

const MAX_HERO_WITH_HIGHLIGHTS = 5;

/** Hero bullets: domain age + SSL first when available, then other signals (max 5). */
export function heroPreviewReasonsForResult(
  result: Pick<ScamCheckResult, "trustSignals" | "domainIntelligence" | "ssl">
): string[] {
  const highlights = extractTrustHighlightFacts(result);
  const normalized = normalizeConsumerSignalsForResult(result);
  const seen = new Set<string>();
  const out: string[] = [];

  for (const fact of highlights) {
    const key = fact.consumerLine.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(fact.consumerLine);
  }

  for (const line of [...normalized.watch, ...normalized.helpful]) {
    const key = line.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
    if (out.length >= MAX_HERO_WITH_HIGHLIGHTS) break;
  }

  return out.slice(0, MAX_HERO_PREVIEW);
}

export function filterConsumerContextNotes(notes: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of notes) {
    const note = raw?.trim();
    if (!note || INTERNAL_CONTEXT.test(note) || isInternalImplementationSignal(note)) continue;
    const key = note.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(note);
  }

  return out.slice(0, 3);
}
