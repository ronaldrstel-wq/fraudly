const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const FRAUDLY_INDEXNOW_HOST = "fraudly.app";
export const FRAUDLY_INDEXNOW_ORIGIN = `https://${FRAUDLY_INDEXNOW_HOST}`;

const BLOCKED_PATH_PREFIXES = ["/account", "/dashboard", "/sign-in", "/sign-up", "/api"] as const;

function isBlockedPath(pathname: string): boolean {
  return BLOCKED_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function parseAndValidateUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  if (parsed.hostname.toLowerCase() !== FRAUDLY_INDEXNOW_HOST) return null;
  const path = parsed.pathname || "/";
  if (isBlockedPath(path.startsWith("/") ? path : `/${path}`)) return null;
  return parsed.href;
}

function dedupePreserveOrder(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

export type IndexNowSubmitSuccess = {
  ok: true;
  submitted: number;
  duplicatesRemoved: number;
  rejected: number;
};

export type IndexNowSubmitFailure = {
  ok: false;
  error: string;
  httpStatus?: number;
  indexNowStatus?: number;
  detail?: string;
};

export type IndexNowSubmitResult = IndexNowSubmitSuccess | IndexNowSubmitFailure;

/**
 * Submits public https://fraudly.app URLs to IndexNow. Server-side only; logs API failures.
 */
export async function submitUrlsToIndexNow(urls: string[]): Promise<IndexNowSubmitResult> {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) {
    console.error("[indexnow] INDEXNOW_KEY is not set");
    return { ok: false, error: "indexnow_key_missing" };
  }

  if (!Array.isArray(urls)) {
    return { ok: false, error: "urls_must_be_array" };
  }

  const accepted: string[] = [];
  for (const item of urls) {
    if (typeof item !== "string") continue;
    const valid = parseAndValidateUrl(item);
    if (valid) accepted.push(valid);
  }

  const beforeDedupe = accepted.length;
  const urlList = dedupePreserveOrder(accepted);
  const duplicatesRemoved = beforeDedupe - urlList.length;
  const rejected = urls.filter((u) => typeof u === "string").length - beforeDedupe;

  if (urlList.length === 0) {
    console.warn("[indexnow] no URLs passed validation (origin, path rules, or empty input)");
    return {
      ok: false,
      error: "no_valid_urls",
      detail: "Only https://fraudly.app URLs are allowed; /account, /dashboard, /sign-in, /sign-up, and /api are blocked."
    };
  }

  const keyLocation = `${FRAUDLY_INDEXNOW_ORIGIN}/${key}.txt`;
  const body = JSON.stringify({
    host: FRAUDLY_INDEXNOW_HOST,
    key,
    keyLocation,
    urlList
  });

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(
        "[indexnow] IndexNow API rejected request",
        res.status,
        text.length > 800 ? `${text.slice(0, 800)}…` : text
      );
      return {
        ok: false,
        error: "indexnow_api_error",
        httpStatus: res.status,
        detail: text.length > 500 ? `${text.slice(0, 500)}…` : text
      };
    }

    return {
      ok: true,
      submitted: urlList.length,
      duplicatesRemoved,
      rejected
    };
  } catch (e) {
    console.error("[indexnow] IndexNow request failed", e);
    return {
      ok: false,
      error: "indexnow_request_failed",
      detail: e instanceof Error ? e.message : "unknown_error"
    };
  }
}
