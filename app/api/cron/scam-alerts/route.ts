import { NextResponse } from "next/server";
import { runScamAlertsIngestion } from "@/lib/scam-alerts/service";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const adminKey = process.env.ADMIN_RECALC_KEY?.trim();
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const xCronSecret = request.headers.get("x-cron-secret")?.trim();
  const xAdmin = request.headers.get("x-admin-key")?.trim();
  const accepted = [cronSecret, adminKey].filter((v): v is string => Boolean(v));
  // If no explicit secrets are configured, allow Vercel Cron header as a trusted automation hint.
  if (accepted.length === 0) return isVercelCron;
  return accepted.includes(bearer ?? "") || accepted.includes(xCronSecret ?? "") || accepted.includes(xAdmin ?? "");
}

async function runCron(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runScamAlertsIngestion();
    console.info("[scam-alerts][cron-route] completed", {
      scanned: summary.scanned,
      created: summary.created,
      updated: summary.updated,
      published: summary.published,
      statusCounts: summary.statusCounts,
      failedSources: summary.failedSources
    });
    return NextResponse.json({
      ok: true,
      ...summary
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_failure";
    return NextResponse.json(
      {
        ok: false,
        scanned: 0,
        created: 0,
        updated: 0,
        published: 0,
        failedSources: [{ source: "ingestion", error: message }]
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return runCron(request);
}

// Vercel Cron uses GET by default.
export async function GET(request: Request) {
  return runCron(request);
}
