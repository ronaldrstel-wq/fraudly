/**
 * Lightweight analytics hooks. Replace with Vercel Analytics, Plausible, or PostHog in production.
 *
 * Non-essential analytics only runs after the user opts in via cookie consent (see `lib/consent.ts`).
 *
 * TODO: Wire to Vercel Analytics (@vercel/analytics) for production dashboards.
 * TODO: Alternatively use Plausible or self-hosted analytics with privacy-friendly defaults.
 */

import { isAnalyticsConsentGranted } from "@/lib/consent";

function devLog(event: string, payload?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] ${event}`, payload ?? "");
  }
}

export function trackCheckStarted() {
  if (!isAnalyticsConsentGranted()) return;
  devLog("check_started");
}

export function trackCheckCompleted(score: number) {
  if (!isAnalyticsConsentGranted()) return;
  devLog("check_completed", { score });
}

export function trackCheckFailed(reason: string) {
  if (!isAnalyticsConsentGranted()) return;
  devLog("check_failed", { reason });
}
