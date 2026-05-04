/**
 * Environment-based daily request cap for keyed clients (e.g. IP).
 * Development: higher ceiling for local testing.
 */
export const DAILY_CHECK_LIMIT = process.env.NODE_ENV === "development" ? 100 : 5;

type DayBucket = { day: string; count: number };

export type DailyConsumeResult =
  | { allowed: true; count: number; limit: number }
  | { allowed: false; count: number; limit: number };

/**
 * Resolves client IP for rate limiting.
 * 1. `x-forwarded-for` (first hop — original client when set by a trusted proxy)
 * 2. Request connection IP when available (`NextRequest` on supported runtimes)
 * 3. Common proxy headers, then `"unknown"`
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const clientIp = forwarded.split(",")[0]?.trim();
    if (clientIp) return clientIp;
  }

  // Some hosts expose a resolved client IP on the request object (not on the Web Request type).
  const requestWithIp = request as Request & { ip?: string };
  const fromRequest = requestWithIp.ip?.trim();
  if (fromRequest) return fromRequest;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;

  return "unknown";
}

/**
 * Fixed-window daily limiter (UTC calendar day). Keys are arbitrary strings (typically IP).
 *
 * TODO: Replace in-memory store with Redis (Upstash) in production for distributed rate limiting.
 */
export class DailyInMemoryRateLimiter {
  private readonly store = new Map<string, DayBucket>();

  constructor(private readonly limit: number) {}

  getLimit(): number {
    return this.limit;
  }

  consume(clientKey: string, now: Date = new Date()): DailyConsumeResult {
    const day = now.toISOString().slice(0, 10);
    let bucket = this.store.get(clientKey);

    if (!bucket || bucket.day !== day) {
      bucket = { day, count: 0 };
    }

    if (bucket.count >= this.limit) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[rateLimiter] ip=${clientKey} blocked usage=${bucket.count}/${this.limit}`);
      }
      return { allowed: false, count: bucket.count, limit: this.limit };
    }

    bucket.count += 1;
    this.store.set(clientKey, bucket);

    if (process.env.NODE_ENV === "development") {
      console.log(`[rateLimiter] ip=${clientKey} usage=${bucket.count}/${this.limit}`);
    }

    return { allowed: true, count: bucket.count, limit: this.limit };
  }
}

/** Shared limiter for `/api/check` (swap store implementation here later). */
export const checkDailyLimiter = new DailyInMemoryRateLimiter(DAILY_CHECK_LIMIT);
