type CacheEntry<T> = {
  ok: boolean;
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const rateLimitWindow = new Map<string, number>();

const DEFAULT_TIMEOUT_MS = 5000;
const SUCCESS_TTL_MS = 24 * 60 * 60 * 1000;
const FAILURE_TTL_MS = 6 * 60 * 60 * 1000;

export const FRAUDLY_USER_AGENT = "Mozilla/5.0 (compatible; FraudlyPublicIntel/1.0; +https://fraudly.app/bot)";

export type PublicIntelResult<T> = {
  ok: boolean;
  source: string;
  data: T | null;
  warning?: string;
};

function getCached<T>(key: string): CacheEntry<T> | null {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit;
}

function setCached<T>(key: string, value: T, ok: boolean): void {
  cache.set(key, {
    ok,
    value,
    expiresAt: Date.now() + (ok ? SUCCESS_TTL_MS : FAILURE_TTL_MS)
  });
}

export async function withCache<T>(
  key: string,
  fn: () => Promise<PublicIntelResult<T>>
): Promise<PublicIntelResult<T> & { fromCache: boolean }> {
  const hit = getCached<PublicIntelResult<T>>(key);
  if (hit) {
    return { ...hit.value, fromCache: true };
  }
  const fresh = await fn();
  setCached(key, fresh, fresh.ok);
  return { ...fresh, fromCache: false };
}

export function enforceRateLimit(bucket: string, minIntervalMs = 500): void {
  const now = Date.now();
  const last = rateLimitWindow.get(bucket) ?? 0;
  if (now - last < minIntervalMs) {
    throw new Error(`Rate limited for ${bucket}`);
  }
  rateLimitWindow.set(bucket, now);
}

export async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent": FRAUDLY_USER_AGENT,
        "accept-language": "en-US,en;q=0.8",
        ...(init?.headers ?? {})
      }
    });
  } finally {
    clearTimeout(timeout);
  }
}

function parseRobotsDisallows(robotsTxt: string): string[] {
  const lines = robotsTxt.split(/\r?\n/);
  const disallowed: string[] = [];
  let applies = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [k, ...rest] = line.split(":");
    if (!k || rest.length === 0) continue;
    const key = k.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") {
      applies = value === "*" || /fraudlypublicintel/i.test(value);
      continue;
    }
    if (applies && key === "disallow" && value) {
      disallowed.push(value);
    }
  }
  return disallowed;
}

export async function isPathAllowedByRobots(origin: string, path: string): Promise<boolean> {
  try {
    const robotsUrl = new URL("/robots.txt", origin).toString();
    const response = await fetchWithTimeout(robotsUrl, undefined, 3000);
    if (!response.ok) return true;
    const robots = await response.text();
    const disallowed = parseRobotsDisallows(robots);
    return !disallowed.some((prefix) => path.startsWith(prefix));
  } catch {
    return true;
  }
}

export function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
}

export function settledWarning(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
