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

export function trackEvent(name: string, payload?: Record<string, unknown>) {
  if (!isAnalyticsConsentGranted()) return;
  devLog(name, payload);
}

export function trackCheckStarted() {
  trackEvent("check_started");
}

export function trackCheckCompleted(score: number) {
  trackEvent("check_completed", { score });
}

export function trackCheckFailed(reason: string) {
  trackEvent("check_failed", { reason });
}

export function trackAnonymousCheckStarted() {
  trackEvent("anonymous_check_started");
}

export function trackAnonymousCheckCompleted(score: number) {
  trackEvent("anonymous_check_completed", { score });
}

export function trackRegisteredCheckStarted() {
  trackEvent("registered_check_started");
}

export function trackRegisteredCheckCompleted(score: number) {
  trackEvent("registered_check_completed", { score });
}
