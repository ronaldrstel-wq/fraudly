import type { ClientPlatform } from "@prisma/client";

/**
 * Detects request client platform from headers — separate from identity OAuth provider.
 * A Google login on web must not be treated as `android`.
 */
export function detectClientPlatform(request: Request): ClientPlatform {
  const explicit = request.headers.get("x-fraudly-platform")?.trim().toLowerCase();
  if (explicit === "ios") return "ios";
  if (explicit === "android") return "android";
  if (explicit === "web") return "web";

  const ua = (request.headers.get("user-agent") ?? "").toLowerCase();
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "ios";
  if (ua.includes("android")) return "android";

  return "web";
}
