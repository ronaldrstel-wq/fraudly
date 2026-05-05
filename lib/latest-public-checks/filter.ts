import { normalizeDomain } from "@/lib/cache";

const STANDALONE_EMAIL = /^[^\s@:]+@[^\s@:]+\.[a-z]{2,}$/i;

function isProbablyEmailInQuery(searchParams: URLSearchParams): boolean {
  for (const v of searchParams.values()) {
    if (/@/.test(v) && STANDALONE_EMAIL.test(v.trim())) return true;
  }
  return false;
}

/** Very rough IPv4 / loopback avoidance for public indexing. */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local")) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) {
    const [a, b] = h.split(".").map(Number);
    if (a === 127 || a === 0) return true;
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true;
  }
  if (h.includes("@")) return true;
  return false;
}

/** When uncertain, bail out — only publish clearly website-style checks today. */
export function classifyWebsiteCheckForPublication(parsedUrl: URL, originalTrimmed: string): {
  publish: boolean;
  normalizedValue: string;
  entityType: "domain";
  checkedValueForDisplay: string;
} | { publish: false } {
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") return { publish: false };
  if (parsedUrl.username || parsedUrl.password) return { publish: false };
  if (STANDALONE_EMAIL.test(originalTrimmed.trim())) return { publish: false };

  const host = parsedUrl.hostname.toLowerCase();
  if (!host || isBlockedHost(host)) return { publish: false };

  /** Avoid URLs that likely embed personal identifiers in queries. */
  if (isProbablyEmailInQuery(parsedUrl.searchParams)) return { publish: false };

  const normalizedValue = truncate(normalizeDomain(parsedUrl.href), 2048);

  /** Display without credentials — mostly hostname-focused. */
  const path = truncate(`${parsedUrl.pathname}${parsedUrl.search}`, 1536).replace(/\s+/g, " ").trim();
  const checkedUrl = path && path !== "/"
    ? truncate(`${parsedUrl.protocol}//${parsedUrl.hostname}${path}`, 4096)
    : truncate(`${parsedUrl.protocol}//${parsedUrl.hostname}/`, 512);

  return {
    publish: true,
    normalizedValue,
    entityType: "domain",
    checkedValueForDisplay: checkedUrl.slice(0, 4096)
  };
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(0, max - 1))}…`;
}
