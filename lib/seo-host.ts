/** Canonical production hostname (apex only). `www` redirects here in middleware. */
export const CANONICAL_PRODUCTION_HOST = "fraudly.app" as const;

/** Hostnames that serve the public, indexable production site (middleware / edge–safe; no `next` imports). */
const PRODUCTION_SITE_HOSTS = new Set([CANONICAL_PRODUCTION_HOST, `www.${CANONICAL_PRODUCTION_HOST}`]);

const LOCAL_DEV_HOSTS = new Set(["localhost", "127.0.0.1"]);

export type CrawlerHostInput = {
  forwardedHost: string | null;
  hostHeader: string | null;
  urlHostname: string;
};

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

function normalizeHostname(raw: string): string {
  return raw.trim().toLowerCase().split(":")[0] ?? "";
}

export function isCanonicalProductionRequest(opts: CrawlerHostInput): boolean {
  const urlHost = normalizeHostname(opts.urlHostname);
  const resolvedHost = normalizedRequestHost(opts.forwardedHost ?? opts.hostHeader, opts.urlHostname);
  return isProductionPublicSiteHost(urlHost) || isProductionPublicSiteHost(resolvedHost);
}

/**
 * Paths that must never be indexed (HTTP header), regardless of host.
 */
export function isPrivateNoindexPath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return (
    path.startsWith("/api/") ||
    path.startsWith("/admin") ||
    path.startsWith("/dashboard") ||
    path.startsWith("/account") ||
    path.startsWith("/settings") ||
    path.startsWith("/sign-in") ||
    path.startsWith("/sign-up") ||
    path.startsWith("/recent-searches")
  );
}

/**
 * Whether middleware should set `X-Robots-Tag: noindex, nofollow`.
 *
 * `VERCEL_ENV=production` on `fraudly.app` / `www.fraudly.app` must return false.
 * `NODE_ENV` alone must not noindex production (preview uses `VERCEL_ENV=preview`).
 */
export function shouldSetPreviewNoindexHeader(opts: CrawlerHostInput): boolean {
  const vercelEnv = process.env.VERCEL_ENV;

  if (isCanonicalProductionRequest(opts)) {
    if (vercelEnv === "production") {
      return false;
    }
    if (vercelEnv === "preview") {
      return true;
    }
    return false;
  }

  if (vercelEnv === "preview" || vercelEnv === "development") {
    return true;
  }

  const urlHost = normalizeHostname(opts.urlHostname);
  const resolvedHost = normalizedRequestHost(opts.forwardedHost ?? opts.hostHeader, opts.urlHostname);

  if (resolvedHost.endsWith(".vercel.app") || urlHost.endsWith(".vercel.app")) {
    return true;
  }

  if (LOCAL_DEV_HOSTS.has(resolvedHost) || LOCAL_DEV_HOSTS.has(urlHost)) {
    return true;
  }

  return true;
}

/**
 * Explicit allow signal for canonical production HTML (optional but helps crawlers).
 */
export function shouldSetProductionAllHeader(opts: CrawlerHostInput): boolean {
  if (!isCanonicalProductionRequest(opts)) {
    return false;
  }
  return !shouldSetPreviewNoindexHeader(opts);
}
