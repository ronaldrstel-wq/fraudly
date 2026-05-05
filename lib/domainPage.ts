import { normalizeDomain } from "@/lib/cache";

const MAX_HOST_LEN = 253;

/**
 * Validates a URL path segment as a hostname for public check pages.
 * Returns normalized hostname (lowercase, no leading www) or null if invalid.
 */
export function parseCheckDomainParam(param: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(param).trim().toLowerCase();
  } catch {
    return null;
  }
  if (!decoded || decoded.length > MAX_HOST_LEN) return null;

  if (
    decoded.includes("/") ||
    decoded.includes("\\") ||
    decoded.includes("..") ||
    decoded.includes("@") ||
    decoded.includes(":") ||
    decoded.startsWith(".") ||
    decoded.endsWith(".")
  ) {
    return null;
  }

  if (!/^[a-z0-9.\-]+$/i.test(decoded)) return null;

  try {
    const normalized = normalizeDomain(decoded);
    if (!normalized.includes(".")) return null;
    return normalized;
  } catch {
    return null;
  }
}

export function checkPageUrlForDomain(normalizedHost: string): string {
  return `https://${normalizedHost}`;
}
