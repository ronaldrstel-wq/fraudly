import { NextResponse } from "next/server";
import { ScamAlertStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import {
  listScamAlertsForAdmin,
  updateScamAlertContent,
  updateScamAlertStatus
} from "@/lib/scam-alerts/admin-service";

export const runtime = "nodejs";

function parseStatus(raw: string | null): "all" | ScamAlertStatus {
  if (raw === "draft" || raw === "published" || raw === "archived") return raw;
  return "all";
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const url = new URL(request.url);
  const status = parseStatus(url.searchParams.get("status"));
  const alerts = await listScamAlertsForAdmin(status);
  return NextResponse.json({ alerts });
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = (await request.json()) as {
    id?: string;
    action?: "publish" | "draft" | "archive" | "edit";
    title?: string;
    summary?: string;
    safetyTips?: string[];
  };
  if (!body.id || !body.action) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (body.action === "publish") {
    const alert = await updateScamAlertStatus(body.id, ScamAlertStatus.published);
    return NextResponse.json({ alert });
  }
  if (body.action === "draft") {
    const alert = await updateScamAlertStatus(body.id, ScamAlertStatus.draft);
    return NextResponse.json({ alert });
  }
  if (body.action === "archive") {
    const alert = await updateScamAlertStatus(body.id, ScamAlertStatus.archived);
    return NextResponse.json({ alert });
  }
  const alert = await updateScamAlertContent({
    id: body.id,
    title: body.title,
    summary: body.summary,
    safetyTips: Array.isArray(body.safetyTips) ? body.safetyTips : undefined
  });
  return NextResponse.json({ alert });
}
