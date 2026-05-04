import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const keyExists = Boolean(apiKey);

  if (!keyExists) {
    return NextResponse.json({ keyExists: false, ok: false });
  }

  try {
    const client = new OpenAI({ apiKey, timeout: 5000, maxRetries: 0 });
    await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_completion_tokens: 20,
      messages: [
        { role: "system", content: "You are a health check endpoint." },
        { role: "user", content: "Reply with OK." }
      ]
    });

    return NextResponse.json({
      keyExists: true,
      ok: true,
      message: "OpenAI connected"
    });
  } catch (error) {
    return NextResponse.json({
      keyExists: true,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown OpenAI error"
    });
  }
}
