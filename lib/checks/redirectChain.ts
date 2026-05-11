import { parseDomainParts } from "@/lib/domain/parseDomain";

export type RedirectChainAnalysis = {
  originalUrl: string;
  originalDomain: string;
  redirectChain: string[];
  finalUrl: string;
  finalDomain: string;
  redirectCount: number;
  crossDomainRedirect: boolean;
  timedOut: boolean;
  tooManyRedirects: boolean;
  error?: string;
};

const MAX_REDIRECTS = 5;
const REDIRECT_TIMEOUT_MS = 7000;

function isHttpProtocol(url: URL): boolean {
  return url.protocol === "http:" || url.protocol === "https:";
}

function toAbsLocation(current: URL, location: string): URL | null {
  try {
    const next = new URL(location, current);
    if (!isHttpProtocol(next)) return null;
    return next;
  } catch {
    return null;
  }
}

export async function resolveRedirectChain(
  inputUrl: string,
  opts?: {
    maxRedirects?: number;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  }
): Promise<RedirectChainAnalysis> {
  const fetchImpl = opts?.fetchImpl ?? fetch;
  const maxRedirects = Math.max(1, Math.min(10, opts?.maxRedirects ?? MAX_REDIRECTS));
  const timeoutMs = Math.max(1000, Math.min(15000, opts?.timeoutMs ?? REDIRECT_TIMEOUT_MS));

  const original = new URL(inputUrl);
  if (!isHttpProtocol(original)) {
    return {
      originalUrl: original.toString(),
      originalDomain: parseDomainParts(original.toString()).normalizedHostname,
      redirectChain: [],
      finalUrl: original.toString(),
      finalDomain: parseDomainParts(original.toString()).normalizedHostname,
      redirectCount: 0,
      crossDomainRedirect: false,
      timedOut: false,
      tooManyRedirects: false,
      error: "unsupported_protocol"
    };
  }

  const originalDomain = parseDomainParts(original.toString()).normalizedHostname;
  const originalRegistrable = parseDomainParts(original.toString()).registrableDomain;
  const chain: string[] = [];
  let current = original;
  let timedOut = false;
  let tooManyRedirects = false;
  let error: string | undefined;

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(current.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": "FraudlyRedirectResolver/1.0" }
      });
      clearTimeout(timeoutId);

      const status = res.status;
      const isRedirect = status >= 300 && status < 400;
      if (!isRedirect) break;

      const location = res.headers.get("location");
      if (!location) {
        error = "redirect_missing_location";
        break;
      }
      const next = toAbsLocation(current, location);
      if (!next) {
        error = "redirect_unsupported_protocol";
        break;
      }
      chain.push(next.toString());
      current = next;
      if (chain.length >= maxRedirects) {
        tooManyRedirects = true;
        break;
      }
    } catch (err) {
      clearTimeout(timeoutId);
      timedOut = err instanceof Error && err.name === "AbortError";
      error = timedOut ? "redirect_timeout" : "redirect_fetch_failed";
      break;
    }
  }

  const finalUrl = current.toString();
  const finalParsed = parseDomainParts(finalUrl);
  const crossDomainRedirect = chain.length > 0 && finalParsed.registrableDomain !== originalRegistrable;

  return {
    originalUrl: original.toString(),
    originalDomain,
    redirectChain: chain,
    finalUrl,
    finalDomain: finalParsed.normalizedHostname,
    redirectCount: chain.length,
    crossDomainRedirect,
    timedOut,
    tooManyRedirects,
    ...(error ? { error } : {})
  };
}
