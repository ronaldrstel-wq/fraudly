import OpenAI from "openai";

const MODEL = "gpt-4o-mini";
const REQUEST_MS = 7000;

const SYSTEM_PROMPT = "You are a cybersecurity assistant. Analyze if a URL might be a scam.";

function buildUserPrompt(url: string): string {
  return `Analyze this URL: ${url}
Return:
- risk (low, medium, high)
- 3 short bullet reasons
Keep it concise.

Respond with only a JSON object using this shape: {"risk":"low"|"medium"|"high","reasons":["reason1","reason2","reason3"]}`;
}

export type AiScamReasonsResult = {
  risk: "low" | "medium" | "high";
  reasons: string[];
};

function normalizeRisk(value: unknown): AiScamReasonsResult["risk"] | null {
  if (typeof value !== "string") return null;
  const r = value.toLowerCase().trim();
  if (r === "low" || r === "medium" || r === "high") return r;
  return null;
}

function parseAiPayload(raw: string): AiScamReasonsResult | null {
  try {
    const data = JSON.parse(raw) as { risk?: unknown; reasons?: unknown };
    const risk = normalizeRisk(data.risk);
    if (!risk) return null;

    if (!Array.isArray(data.reasons)) return null;
    const reasons = data.reasons
      .filter((item): item is string => typeof item === "string")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    if (reasons.length < 1) return null;

    return { risk, reasons };
  } catch {
    return null;
  }
}

/**
 * Calls OpenAI for short scam-oriented reasons. Returns null on missing key, timeout, or parse errors.
 */
export async function fetchAiScamReasons(url: string): Promise<AiScamReasonsResult | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey, timeout: REQUEST_MS, maxRetries: 0 });

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_completion_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(url) }
      ]
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return null;

    return parseAiPayload(raw);
  } catch {
    return null;
  }
}

/** Prefer 2–3 AI bullets; pad with heuristics if AI returned too little. */
export function mergeReasonsWithHeuristics(ai: AiScamReasonsResult | null, heuristicReasons: string[]): string[] {
  const h = heuristicReasons.slice(0, 3);
  if (!ai?.reasons.length) return h;

  const cleaned = ai.reasons.map((r) => r.trim()).filter(Boolean).slice(0, 3);
  if (cleaned.length >= 2) return cleaned;
  if (cleaned.length === 1) return [cleaned[0], ...h].slice(0, 3);
  return h;
}
