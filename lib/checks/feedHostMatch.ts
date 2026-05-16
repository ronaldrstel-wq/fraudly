import { normalizeDomain } from "@/lib/cache";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Parses hostname from a feed line (URL or bare host). */
export function hostnameFromFeedEntry(entry: string): string | null {
  const trimmed = entry.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return normalizeDomain(url.hostname);
  } catch {
    const bare = normalizeDomain(trimmed.split(/[/?#]/)[0] ?? trimmed);
    return bare.includes(".") ? bare : null;
  }
}

/**
 * True when a feed entry targets the scanned host (exact host or registrable domain match).
 * Avoids substring false positives (e.g. `evil.com/coolblue.nl-phishing` matching `coolblue.nl`).
 */
export function feedEntryMatchesHost(entry: string, normalizedHost: string, registrableDomain: string): boolean {
  const host = hostnameFromFeedEntry(entry);
  if (host) {
    return host === normalizedHost || host === registrableDomain;
  }
  const lower = entry.toLowerCase();
  const hostRe = new RegExp(`(?:^|[/@])${escapeRegExp(normalizedHost)}(?:[/:?#]|$)`, "i");
  if (hostRe.test(lower)) return true;
  if (registrableDomain !== normalizedHost) {
    const regRe = new RegExp(`(?:^|[/@])${escapeRegExp(registrableDomain)}(?:[/:?#]|$)`, "i");
    if (regRe.test(lower)) return true;
  }
  return false;
}
