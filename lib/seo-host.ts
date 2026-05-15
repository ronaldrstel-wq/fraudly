/** Canonical production hostname (apex only). `www` redirects here in middleware. */
export const CANONICAL_PRODUCTION_HOST = "fraudly.app" as const;

/** Hostnames that serve the public, indexable production site (middleware / edge–safe; no `next` imports). */
const PRODUCTION_SITE_HOSTS = new Set([CANONICAL_PRODUCTION_HOST, `www.${CANONICAL_PRODUCTION_HOST}`]);

/**
 * Normalize hostname from `x-forwarded-host` or URL hostname (strip port), lowercase.
 * Safe for Edge middleware.
 */
export function normalizedRequestHost(forwardedHost: string | null, urlHostname: string): string {
  const fromForwarded = forwardedHost?.split(",")[0]?.trim() || "";
  const raw = fromForwarded || urlHostname;
  return raw.split(":")[0]?.toLowerCase() ?? "";
}

export function isProductionPublicSiteHost(host: string): boolean {
  const normalized = host.trim().toLowerCase().split(":")[0] ?? "";
  return PRODUCTION_SITE_HOSTS.has(normalized);
}

/** `host` must already be normalized (e.g. via `normalizedRequestHost`). */
export function isWwwFraudlyProductionHost(host: string): boolean {
  return host === `www.${CANONICAL_PRODUCTION_HOST}`;
}
