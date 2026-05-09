import OpenAI from "openai";
import type { AllowedEvidenceMime } from "@/lib/evidence/imageValidation";

export function isImageAiAnalysisEnabled(): boolean {
  return process.env.ENABLE_IMAGE_AI_ANALYSIS?.trim() === "true";
}

export function isOcrAnalysisEnabled(): boolean {
  return process.env.ENABLE_OCR_ANALYSIS?.trim() === "true";
}

export type ImageAnalysisOutput = {
  imageHash: string;
  riskDelta: number;
  summary: string;
  detectedText: string | null;
  extractedSignals: Record<string, unknown>;
  fallbackMessage: string | null;
  aiUsed: boolean;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function lightweightSignals(byteLength: number, mime: AllowedEvidenceMime): Record<string, unknown> {
  return {
    kind: "lightweight_metadata",
    mimeType: mime,
    byteLength,
    note: "Heuristic metadata only (no OCR in this pass)."
  };
}

export async function analyzeEvidenceImageBuffer(
  buffer: Buffer,
  mime: AllowedEvidenceMime,
  imageHash: string
): Promise<ImageAnalysisOutput> {
  const baseSignals = lightweightSignals(buffer.length, mime);
  let riskDelta = 0;
  let summary =
    "We inspected basic image properties (format and size). No automated vision model was run for this request.";
  let detectedText: string | null = null;
  let aiUsed = false;
  let fallbackMessage: string | null =
    "Image AI analysis is not enabled, but ad context and webshop signals were still checked.";

  if (isOcrAnalysisEnabled()) {
    baseSignals.ocrRequested = true;
    baseSignals.ocrNote = "OCR flag is on, but text extraction is not deployed in this MVP build.";
  }

  if (!isImageAiAnalysisEnabled() || !process.env.OPENAI_API_KEY?.trim()) {
    return {
      imageHash,
      riskDelta,
      summary,
      detectedText,
      extractedSignals: baseSignals,
      fallbackMessage,
      aiUsed: false
    };
  }

  fallbackMessage = null;

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const b64 = buffer.toString("base64");
    const dataUrl = `data:${mime};base64,${b64}`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 350,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            'You help consumers spot scam ecommerce or fake ad screenshots. Reply with JSON only: {"riskDelta":0-12 integer,"summary":"one or two short English sentences for a lay reader","stockLike":true/false,"signals":["short bullet strings"]}. Never claim legal proof. riskDelta 0 means no extra concern from the image alone.'
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Assess scam or fake-shop visual risk for this image." },
            { type: "image_url", image_url: { url: dataUrl } }
          ]
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    type VisionJson = {
      riskDelta?: unknown;
      summary?: unknown;
      stockLike?: unknown;
      signals?: unknown;
    };
    let parsed: VisionJson | null = null;
    try {
      parsed = JSON.parse(raw) as VisionJson;
    } catch {
      parsed = null;
    }

    const rd =
      parsed && typeof parsed.riskDelta === "number" && Number.isFinite(parsed.riskDelta) ? Math.round(parsed.riskDelta) : 0;
    riskDelta = clamp(rd, 0, 15);
    summary =
      parsed && typeof parsed.summary === "string" && parsed.summary.trim().length > 0
        ? parsed.summary.trim().slice(0, 400)
        : "The vision model returned a brief visual review of the screenshot.";
    aiUsed = true;

    const merged: Record<string, unknown> = {
      ...baseSignals,
      vision: true,
      stockLike: Boolean(parsed?.stockLike),
      signals:
        parsed && Array.isArray(parsed.signals)
          ? (parsed.signals as unknown[]).filter((s) => typeof s === "string").slice(0, 8)
          : []
    };

    if (isOcrAnalysisEnabled() && parsed && typeof parsed.summary === "string") {
      detectedText = parsed.summary.slice(0, 500);
    }

    return {
      imageHash,
      riskDelta,
      summary,
      detectedText,
      extractedSignals: merged,
      fallbackMessage: null,
      aiUsed
    };
  } catch (err) {
    console.error("[analyzeEvidenceImageBuffer] vision failed", err);
    return {
      imageHash,
      riskDelta: 0,
      summary: "Image analysis could not be completed; your URL scan can still continue without visual scoring.",
      detectedText: null,
      extractedSignals: { ...baseSignals, visionError: true },
      fallbackMessage: "Image AI analysis is not enabled, but ad context and webshop signals were still checked.",
      aiUsed: false
    };
  }
}
