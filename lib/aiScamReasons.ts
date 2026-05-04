import OpenAI from "openai";
import type { ReviewSignals } from "@/lib/reviewSignals";

const MODEL = "gpt-4o-mini";
const REQUEST_MS = 7000;
const WEBSITE_FETCH_MS = 4500;

const SYSTEM_PROMPT = "You are a cybersecurity assistant. Analyze if a URL might be a scam.";

export type WebsiteSignals = {
  title: string;
  metaDescription: string;
  bodySnippet: string;
};

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
  return cleanWhitespace(plain).slice(0, 900);
}

export async function fetchWebsiteSignals(url: string): Promise<WebsiteSignals | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBSITE_FETCH_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; FraudlyBot/1.0; +https://fraudly.app)"
      }
    });

    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    const html = await response.text();
    const title = extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const metaDescription = extractTag(
      html,
      /<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i
    );
    const bodySnippet = extractBodyText(html);

    if (!title && !metaDescription && !bodySnippet) return null;
    return { title, metaDescription, bodySnippet };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function buildUserPrompt(url: string, signals: WebsiteSignals | null): string {
  const title = signals?.title || "(missing)";
  const meta = signals?.metaDescription || "(missing)";
  const body = signals?.bodySnippet || "(missing)";

  return `Analyze this URL: ${url}

Website text signals:
- title: ${title}
- meta: ${meta}
- body_snippet: ${body}`;
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
  heuristicReasons: string[]
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
        content: `${buildUserPrompt(url, signals)}

Review signals:
${reviewSignalsContext}

Domain heuristics:
${heuristicContext}

Analyze the URL using:
- domain heuristics
- review signals
- website text if available

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
  const h = heuristicReasons.slice(0, 3);
  if (!ai?.reasons.length) return h;

  const cleaned = ai.reasons.map((r) => r.trim()).filter(Boolean).slice(0, 2);
  const riskReason = `AI risk signal: ${ai.risk}`;
  const composed = [riskReason, ...cleaned].slice(0, 3);
  if (composed.length >= 2) return composed;
  if (composed.length === 1) return [composed[0], ...h].slice(0, 3);
  return h;
}
