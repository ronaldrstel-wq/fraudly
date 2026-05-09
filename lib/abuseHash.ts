import { createHash } from "crypto";

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** Server secret pepper for privacy-safe fingerprints (minimum 16 chars recommended in production). */
export function getRateLimitHashPepper(): string {
  const secret = process.env.RATE_LIMIT_HASH_SECRET?.trim();
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[abuseHash] Set RATE_LIMIT_HASH_SECRET (at least 16 characters) for production rate limiting."
      );
    }
    return "____dev-rate-limit-hash-secret______";
  }
  return secret;
}

export function hashClientIp(pepper: string, rawIp: string): string {
  const ip = rawIp.trim() || "unknown";
  return sha256Hex(`${pepper}:ip:v1:${ip}`);
}

export function hashUserAgent(pepper: string, userAgent: string | null): string {
  const ua = typeof userAgent === "string" && userAgent.trim() ? userAgent.trim() : "unknown-agent";
  return sha256Hex(`${pepper}:ua:v1:${ua}`);
}

export function hashAcceptLanguage(pepper: string, acceptLanguage: string | null): string {
  const al =
    typeof acceptLanguage === "string" && acceptLanguage.trim()
      ? acceptLanguage.trim().toLowerCase().slice(0, 256)
      : "unknown-language";
  return sha256Hex(`${pepper}:lang:v1:${al}`);
}

/** Combined fingerprint; does not expose raw headers or stored raw IP when logged. */
export function deriveAbuseKey(pepper: string, ipHash: string, userAgentHash: string, langHash: string): string {
  return sha256Hex(`${pepper}:abuse:v1:${ipHash}|${userAgentHash}|${langHash}`);
}

export function buildPrivacySafeRequestFingerprints(pepper: string, request: Request, rawIp: string) {
  const userAgentHash = hashUserAgent(pepper, request.headers.get("user-agent"));
  const langHash = hashAcceptLanguage(pepper, request.headers.get("accept-language"));
  const ipHash = hashClientIp(pepper, rawIp);
  const abuseKey = deriveAbuseKey(pepper, ipHash, userAgentHash, langHash);
  return { ipHash, userAgentHash, langHash, abuseKey };
}
