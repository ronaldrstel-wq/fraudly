import { NextResponse } from "next/server";
import { submitUrlsToIndexNow } from "@/lib/indexnow";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_RECALC_KEY?.trim();
  const provided = request.headers.get("x-admin-key")?.trim();
  return Boolean(expected && provided && provided === expected);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const urls = (body as { urls?: unknown }).urls;
  if (!Array.isArray(urls)) {
    return NextResponse.json({ error: "urls_required_array" }, { status: 400 });
  }

  const result = await submitUrlsToIndexNow(urls as string[]);

  if (!result.ok) {
    const status =
      result.error === "indexnow_key_missing"
        ? 503
        : result.error === "no_valid_urls" || result.error === "urls_must_be_array"
          ? 400
          : result.httpStatus && result.httpStatus >= 400 && result.httpStatus < 600
            ? 502
            : 502;
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        ...(result.detail ? { detail: result.detail } : {}),
        ...(result.httpStatus ? { indexNowHttpStatus: result.httpStatus } : {})
      },
      { status }
    );
  }

  return NextResponse.json({
    ok: true,
    submitted: result.submitted,
    duplicatesRemoved: result.duplicatesRemoved,
    rejectedInvalid: result.rejected
  });
}
