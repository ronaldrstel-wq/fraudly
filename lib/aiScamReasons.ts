import OpenAI from "openai";
import { getCached, normalizeDomain, setCached } from "@/lib/cache";
import type { ReviewSignals } from "@/lib/reviewSignals";

const MODEL = "gpt-4o-mini";
const REQUEST_MS = 7000;
const WEBSITE_FETCH_MS = 4500;
const WEBSITE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const POLICY_PATH_CANDIDATES = [
  "/policies/shipping-policy",
  "/policies/refund-policy",
  "/policies/terms-of-service",
  "/shipping",
  "/shipping-policy",
  "/returns",
  "/return-policy",
  "/refund-policy",
  "/terms",
  "/terms-and-conditions"
];
const POLICY_FETCH_LIMIT = 4;

const SYSTEM_PROMPT =
  "You are a cybersecurity assistant helping consumers interpret website trust signals. Always respond in English. Do not use Dutch. Prefer phrases like \"risk indicators\", \"trust signals\", and \"mixed evidence\". Do not claim a third-party blacklist or government database match unless the appended intelligence JSON lists a providerEvidence row for that named source with matched=true (or supplemental.safeBrowsing.safeBrowsingStatus is \"flagged\"). Never invent VirusTotal/PhishTank/AbuseIPDB or national-feed hits—the appended JSON reflects what actually ran.";

export type WebsiteSignals = {
  title: string;
  metaDescription: string;
  bodySnippet: string;
  /** Combined visible text for downstream heuristics (not sent to client as env). */
  text: string;
  imageUrls: string[];
  productSnippets: Array<{
    title?: string;
    description?: string;
    price?: string;
    imageUrl?: string;
  }>;
};

type WebsiteCacheBox = { v: WebsiteSignals | null };

function cleanWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractTag(html: string, regex: RegExp): string {
  const match = html.match(regex);
  return cleanWhitespace(match?.[1] ?? "");
}

function extractBodyText(html: string): string {
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  const withoutScripts = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const plain = withoutScripts
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");
  return cleanWhitespace(plain).slice(0, 2200);
}

function extractImageUrls(html: string, baseUrl: string): string[] {
  const urls = new Set<string>();
  const addUrl = (raw?: string) => {
    if (!raw) return;
    const src = raw.trim();
    if (!src || src.startsWith("data:")) return;
    try {
      const u = new URL(src, baseUrl);
      if (!/^https?:$/.test(u.protocol)) return;
      urls.add(u.toString());
    } catch {
      // ignore malformed image URLs
    }
  };

  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  for (const m of html.matchAll(imgRegex)) addUrl(m[1]);

  const ogRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi;
  for (const m of html.matchAll(ogRegex)) addUrl(m[1]);

  return [...urls].slice(0, 60);
}

function extractProductSnippets(html: string, baseUrl: string): WebsiteSignals["productSnippets"] {
  const snippets: WebsiteSignals["productSnippets"] = [];
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(jsonLdRegex)) {
    const raw = m[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown> | Array<Record<string, unknown>>;
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      for (const row of rows) {
        const type = String(row["@type"] ?? "").toLowerCase();
        if (!type.includes("product")) continue;
        const title = typeof row.name === "string" ? cleanWhitespace(row.name).slice(0, 160) : undefined;
        const description = typeof row.description === "string" ? cleanWhitespace(row.description).slice(0, 220) : undefined;
        const offers = row.offers as Record<string, unknown> | undefined;
        const price = offers && typeof offers.price === "string" ? offers.price.slice(0, 40) : undefined;
        let imageUrl: string | undefined;
        if (typeof row.image === "string") {
          try {
            imageUrl = new URL(row.image, baseUrl).toString();
          } catch {
            imageUrl = row.image;
          }
        } else if (Array.isArray(row.image) && typeof row.image[0] === "string") {
          try {
            imageUrl = new URL(row.image[0], baseUrl).toString();
          } catch {
            imageUrl = row.image[0];
          }
        }
        snippets.push({ title, description, price, imageUrl });
      }
    } catch {
      // ignore malformed json-ld
    }
  }
  return snippets.slice(0, 20);
}

function extractPolicyLinks(html: string, baseUrl: string): string[] {
  const links = new Set<string>();
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  const pathHint = /(ship|return|refund|policy|terms|delivery)/i;
  for (const m of html.matchAll(re)) {
    const href = m[1]?.trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      const u = new URL(href, baseUrl);
      if (!/^https?:$/.test(u.protocol)) continue;
      if (!pathHint.test(u.pathname)) continue;
      links.add(`${u.protocol}//${u.host}${u.pathname}`);
    } catch {
      // ignore invalid href
    }
  }
  return [...links];
}

function resolveWebsiteFetchUrl(inputUrl: string, normalizedHost: string): string {
  try {
    const u = new URL(inputUrl.includes("://") ? inputUrl : `https://${inputUrl}`);
    const proto = u.protocol === "http:" ? "http:" : "https:";
    if (u.port) return `${proto}//${normalizedHost}:${u.port}`;
    return `${proto}//${normalizedHost}`;
  } catch {
    return `https://${normalizedHost}`;
  }
}

export async function fetchWebsiteSignals(url: string): Promise<WebsiteSignals | null> {
  const normalizedHost = normalizeDomain(url);
  const cacheKey = `website:${normalizedHost}`;
  const boxed = getCached<WebsiteCacheBox>(cacheKey);
  if (boxed) {
    console.log("[Cache] website hit:", normalizedHost);
    return boxed.v;
  }
  console.log("[Cache] website miss:", normalizedHost);

  const fetchUrl = resolveWebsiteFetchUrl(url, normalizedHost);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBSITE_FETCH_MS);

  let cacheable = true;
  let payload: WebsiteSignals | null = null;

  try {
    const response = await fetch(fetchUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; FraudlyBot/1.0; +https://fraudly.app)"
      }
    });

    if (!response.ok) {
      payload = null;
    } else {
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html")) {
        payload = null;
      } else {
        const html = await response.text();
        const title = extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
        const metaDescription = extractTag(
          html,
          /<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i
        );
        const bodySnippet = extractBodyText(html);
        const base = fetchUrl.includes("://") ? fetchUrl : `https://${normalizedHost}`;
        const policyUrls = new Set<string>();
        for (const p of POLICY_PATH_CANDIDATES) {
          try {
            const u = new URL(p, base);
            policyUrls.add(`${u.protocol}//${u.host}${u.pathname}`);
          } catch {
            // noop
          }
        }
        for (const found of extractPolicyLinks(html, base)) {
          policyUrls.add(found);
        }

        const policyTextParts: string[] = [];
        const candidates = [...policyUrls].slice(0, POLICY_FETCH_LIMIT);
        for (const policyUrl of candidates) {
          try {
            const policyResp = await fetch(policyUrl, {
              method: "GET",
              redirect: "follow",
              signal: controller.signal,
              headers: {
                "user-agent": "Mozilla/5.0 (compatible; FraudlyBot/1.0; +https://fraudly.app)"
              }
            });
            if (!policyResp.ok) continue;
            const policyCt = policyResp.headers.get("content-type") ?? "";
            if (!policyCt.includes("text/html")) continue;
            const policyHtml = await policyResp.text();
            const policyBody = extractBodyText(policyHtml);
            if (policyBody) {
              policyTextParts.push(`${policyUrl}: ${policyBody}`);
            }
          } catch {
            // best-effort; skip failing policy pages
          }
        }
        const policySnippet = policyTextParts.join("\n\n").slice(0, 3600);

        if (!title && !metaDescription && !bodySnippet && !policySnippet) {
          payload = null;
        } else {
          const text = [title, metaDescription, bodySnippet, policySnippet].filter(Boolean).join("\n\n");
          const imageUrls = extractImageUrls(html, base);
          const productSnippets = extractProductSnippets(html, base);
          payload = { title, metaDescription, bodySnippet, text, imageUrls, productSnippets };
        }
      }
    }
  } catch {
    cacheable = false;
    payload = null;
  } finally {
    clearTimeout(timeout);
  }

  if (cacheable) {
    setCached(cacheKey, { v: payload }, WEBSITE_CACHE_TTL_MS);
  }
  return payload;
}

function buildUserPrompt(url: string, signals: WebsiteSignals | null, language: "en" | "nl"): string {
  const title = signals?.title || "(missing)";
  const meta = signals?.metaDescription || "(missing)";
  const body = signals?.bodySnippet || "(missing)";

  return `Analyze this URL: ${url}

Website text signals:
- title: ${title}
- meta: ${meta}
- body_snippet: ${body}

Language requirement:
- requested language: ${language}
- output language: English only`;
}

export type AiScamReasonsResult = {
  risk: "low" | "medium" | "high";
  reasons: string[];
  reviewSummary: string;
};

function normalizeRisk(value: unknown): AiScamReasonsResult["risk"] | null {
  if (typeof value !== "string") return null;
  const risk = value.toLowerCase().trim();
  if (risk === "low" || risk === "medium" || risk === "high") return risk;
  return null;
}

function normalizeReviewSummary(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const summary = value.trim().slice(0, 160);
  return summary.length > 0 ? summary : null;
}

function parseAiPayload(raw: string): AiScamReasonsResult | null {
  try {
    const data = JSON.parse(raw) as { risk?: unknown; reasons?: unknown; reviewSummary?: unknown };
    const risk = normalizeRisk(data.risk);
    if (!risk) return null;
    const reviewSummary = normalizeReviewSummary(data.reviewSummary);
    if (!reviewSummary) return null;

    if (!Array.isArray(data.reasons)) return null;
    const reasons = data.reasons
      .filter((item): item is string => typeof item === "string")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    if (reasons.length < 1) return null;

    return { risk, reasons, reviewSummary };
  } catch {
    return null;
  }
}

/**
 * Calls OpenAI for short scam-oriented analysis. Returns null on missing key or invalid payload.
 * Request/runtime errors are intentionally thrown to the caller for route-level logging.
 */
export async function fetchAiScamReasons(
  url: string,
  signals: WebsiteSignals | null,
  reviewSignals: ReviewSignals,
  heuristicReasons: string[],
  scoringSignalsJson: string,
  trustIntelJson: string,
  language: "en" | "nl" = "en"
): Promise<AiScamReasonsResult | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey, timeout: REQUEST_MS, maxRetries: 0 });

  const reviewSignalsContext = JSON.stringify(reviewSignals);
  const heuristicContext = heuristicReasons.join(" | ");

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    max_completion_tokens: 400,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `${buildUserPrompt(url, signals, language)}

Review signals:
${reviewSignalsContext}

Domain / supply heuristics:
${heuristicContext}

Server-side scoring signals (weighted; final numeric score is computed only on the server — do not invent a different score):
${scoringSignalsJson}

Analyze the URL using:
- domain and supply-chain heuristics
- review signals
- technical trust intelligence (blacklist checks, SSL/TLS, domain intelligence)
- website text if available
- the scoring signals above (explain and align with them; do not contradict the weighted risk picture)

Consider supply-chain risk (dropshipping / long international fulfillment vs local stock) when relevant.
Do not use dramatic language, certainty claims, or accusations. Keep a calm and factual consumer-friendly tone.

Trust intelligence signals (canonical providerEvidence plus supplemental structured fields):
${trustIntelJson}

When summarizing intelligence:
- Cite matched=true rows and name their source strings.
- If evidence is contradictory, recommend caution without certainty.
- Reference intelScoreBreakdown when explaining how server weighting leaned toward risk or trust.
- Mention cache/TTL limits; absence of a hit is not proof of safety.

Return JSON:
{
  "risk": "low" | "medium" | "high",
  "reasons": ["reason1", "reason2", "reason3"],
  "reviewSummary": "short review signal summary"
}`
      }
    ]
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) return null;

  return parseAiPayload(raw);
}

/** Prefer 2–3 AI bullets; pad with heuristics if AI returned too little. */
export function mergeReasonsWithHeuristics(ai: AiScamReasonsResult | null, heuristicReasons: string[]): string[] {
  const h = heuristicReasons.slice(0, 6);
  if (!ai?.reasons.length) return h.slice(0, 3);

  const cleaned = ai.reasons.map((r) => r.trim()).filter(Boolean).slice(0, 2);
  const riskReason = `AI risk signal: ${ai.risk}`;
  const composed = [riskReason, ...cleaned].slice(0, 3);
  if (composed.length >= 2) return composed;
  if (composed.length === 1) return [composed[0], ...h].slice(0, 3);
  return h;
}
