/**
 * Flexible website URL parsing for the fraud checker: accepts bare domains and paths
 * without requiring http(s)://, then normalizes to a canonical https URL for analysis.
 */

export type ParseWebsiteInputResult =
  | { ok: true; url: URL; canonicalHref: string; userTrimmed: string }
  | { ok: false; reason: "empty" | "invalid" };

const LOCAL_NO_DOT = new Set(["localhost"]);

function hasInternalWhitespace(s: string): boolean {
  return /\s/.test(s);
}

/**
 * Rejects schemes other than http(s) (mailto:, javascript:, ftp:, …).
 * Distinguishes `host:443/path` (no ://) from real schemes.
 */
function hasUnsupportedBareScheme(s: string): boolean {
  if (s.startsWith("//")) return false;
  if (s.includes("://")) {
    const proto = s.split("://")[0]!.toLowerCase();
    return proto !== "http" && proto !== "https";
  }
  const colonIdx = s.indexOf(":");
  if (colonIdx === -1) return false;
  const afterColon = s.slice(colonIdx + 1);
  if (/^\d/.test(afterColon)) {
    return false;
  }
  const maybeProto = s.slice(0, colonIdx).toLowerCase();
  return maybeProto !== "http" && maybeProto !== "https";
}

function hostnameLooksPlausible(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (!h) return false;
  if (LOCAL_NO_DOT.has(h)) return true;
  // IPv6 (WHATWG URL exposes hostname without brackets)
  if (h.includes(":") && !h.includes(".")) {
    return /^[0-9a-f:]+$/i.test(h);
  }
  // IPv4 or domain with at least one dot (avoids treating random words as hosts)
  if (!h.includes(".")) return false;
  if (!/^[\d.a-z._-]+$/i.test(h)) return false;
  return true;
}

/**
 * Parses user input into an http(s) URL.
 * - Trims; rejects interior whitespace.
 * - Adds https:// when no scheme (default).
 * - Normalizes `HTTPS://Host` → `https://host` via `URL.href`.
 * - Rejects non-http(s) schemes and URLs with userinfo (`user@host`).
 */
export function parseFlexibleWebsiteInput(raw: string): ParseWebsiteInputResult {
  const userTrimmed = raw.trim();
  if (!userTrimmed) return { ok: false, reason: "empty" };
  if (userTrimmed.length > 8000) return { ok: false, reason: "invalid" };
  if (hasInternalWhitespace(userTrimmed)) return { ok: false, reason: "invalid" };
  if (hasUnsupportedBareScheme(userTrimmed)) return { ok: false, reason: "invalid" };

  let candidate = userTrimmed;

  if (candidate.startsWith("//")) {
    candidate = `https:${candidate}`;
  } else if (!candidate.includes("://")) {
    const hostPort = /^[a-z0-9._-]+:\d{2,5}(\/|\?|#|$)/i;
    if (hostPort.test(candidate)) {
      candidate = `https://${candidate}`;
    } else if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
      candidate = `https://${candidate}`;
    }
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "invalid" };
  }

  if (url.username || url.password) {
    return { ok: false, reason: "invalid" };
  }

  if (!hostnameLooksPlausible(url.hostname)) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, url, canonicalHref: url.href, userTrimmed };
}

export function isValidFlexibleWebsiteInput(raw: string): boolean {
  return parseFlexibleWebsiteInput(raw).ok;
}
