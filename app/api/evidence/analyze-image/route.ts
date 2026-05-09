import { NextResponse } from "next/server";
import { analyzeEvidenceImageBuffer } from "@/lib/evidence/analyzeImageBuffer";
import { validateEvidenceImageBuffer } from "@/lib/evidence/imageValidation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validated = validateEvidenceImageBuffer(buffer);
    if (!validated.ok) {
      const status = validated.error === "file_too_large" ? 413 : 400;
      return NextResponse.json({ ok: false, error: validated.error }, { status });
    }

    const analyzed = await analyzeEvidenceImageBuffer(buffer, validated.mime, validated.hash);
    return NextResponse.json({ ok: true, ...analyzed });
  } catch (err) {
    console.error("[api/evidence/analyze-image]", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
