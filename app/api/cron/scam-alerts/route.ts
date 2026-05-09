import { NextResponse } from "next/server";
import { runScamAlertsIngestion } from "@/lib/scam-alerts/service";

export const runtime = "nodejs";

type ProvidedMethod = "authorization" | "x-cron-secret" | "x-admin-key" | "none";

type CronAuthDebug = {
  hasCronSecret: boolean;
  hasAdminRecalcKey: boolean;
  providedMethod: ProvidedMethod;
  providedLength: number;
  expectedCronLength: number;
  expectedAdminLength: number;
  /** True when any accepted header value equals CRON_SECRET (safe: no values logged). */
  matchesCronSecret: boolean;
  /** True when any accepted header value equals ADMIN_RECALC_KEY. */
  matchesAdminRecalcKey: boolean;
};

type CronAuthResult =
  | { authorized: true; bypass?: boolean }
  | { authorized: false; debug: CronAuthDebug };

/**
 * TEMPORARY: When `SCAM_ALERTS_DEBUG_BYPASS=true`, skips all auth checks so you can trigger ingestion
 * manually in production. Remove or set to false after debugging. Never enable in production long-term.
 */
function isDebugBypassEnabled(): boolean {
  return process.env.SCAM_ALERTS_DEBUG_BYPASS?.trim() === "true";
}

function parseBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const m = authorization.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() ?? null;
}

/**
 * Evaluates cron auth: Bearer, `x-cron-secret`, or `x-admin-key` against `CRON_SECRET` and `ADMIN_RECALC_KEY`.
 * When both env vars are unset/empty, only `x-vercel-cron: 1` is accepted (Vercel Cron).
 */
function evaluateCronScamAlertsAuth(request: Request): CronAuthResult {
  if (isDebugBypassEnabled()) {
    return { authorized: true, bypass: true };
  }

  const cronSecret = process.env.CRON_SECRET?.trim() ?? "";
  const adminKey = process.env.ADMIN_RECALC_KEY?.trim() ?? "";
  const hasCronSecret = cronSecret.length > 0;
  const hasAdminRecalcKey = adminKey.length > 0;

  const bearerToken = parseBearerToken(request.headers.get("authorization"));
  const xCronSecret = request.headers.get("x-cron-secret")?.trim() ?? "";
  const xAdmin = request.headers.get("x-admin-key")?.trim() ?? "";

  let providedMethod: ProvidedMethod = "none";
  let providedCredential = "";

  if (bearerToken) {
    providedMethod = "authorization";
    providedCredential = bearerToken;
  } else if (xCronSecret) {
    providedMethod = "x-cron-secret";
    providedCredential = xCronSecret;
  } else if (xAdmin) {
    providedMethod = "x-admin-key";
    providedCredential = xAdmin;
  }

  const providedLength = providedCredential.length;

  const channelMatches = (secret: string) =>
    (bearerToken !== null && bearerToken === secret) ||
    (xCronSecret.length > 0 && xCronSecret === secret) ||
    (xAdmin.length > 0 && xAdmin === secret);

  /** Any header may satisfy auth (same as legacy `accepted.includes` per channel). */
  const matchesCronSecret = hasCronSecret && channelMatches(cronSecret);
  const matchesAdminRecalcKey = hasAdminRecalcKey && channelMatches(adminKey);

  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const accepted = [cronSecret, adminKey].filter((v) => v.length > 0);

  const buildDebug = (): CronAuthDebug => ({
    hasCronSecret,
    hasAdminRecalcKey,
    providedMethod,
    providedLength,
    expectedCronLength: cronSecret.length,
    expectedAdminLength: adminKey.length,
    matchesCronSecret,
    matchesAdminRecalcKey
  });

  if (accepted.length === 0) {
    if (isVercelCron) return { authorized: true };
    const debug = buildDebug();
    console.warn("[scam-alerts][cron-route] unauthorized (no secrets configured; need x-vercel-cron or set CRON_SECRET)", {
      ...debug
    });
    return { authorized: false, debug };
  }

  if (matchesCronSecret || matchesAdminRecalcKey) return { authorized: true };

  const debug = buildDebug();
  console.warn("[scam-alerts][cron-route] unauthorized", { ...debug });
  return { authorized: false, debug };
}

async function runCron(request: Request) {
  const auth = evaluateCronScamAlertsAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "unauthorized", debug: auth.debug }, { status: 401 });
  }

  try {
    const summary = await runScamAlertsIngestion();
    console.info("[scam-alerts][cron-route] completed", {
      authBypass: auth.bypass === true,
      scanned: summary.scanned,
      created: summary.created,
      updated: summary.updated,
      published: summary.published,
      statusCounts: summary.statusCounts,
      failedSources: summary.failedSources
    });
    return NextResponse.json({
      ok: true,
      ...(auth.bypass ? { authDebugBypass: true as const } : {}),
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
