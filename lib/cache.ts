type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}

/**
 * Canonical hostname for caching and lookups: lowercase, no `www.`, no trailing slash.
 * Accepts full URLs or bare hostnames.
 */
export function normalizeDomain(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  try {
    const href = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const u = new URL(href);
    let host = u.hostname.toLowerCase();
    if (host.startsWith("www.")) host = host.slice(4);
    return host.replace(/\.$/, "");
  } catch {
    const raw = trimmed.toLowerCase().replace(/^www\./, "").replace(/\/+$/, "");
    const hostOnly = raw.split("/")[0]?.split("?")[0]?.split("#")[0] ?? raw;
    return hostOnly.replace(/\.$/, "");
  }
}
