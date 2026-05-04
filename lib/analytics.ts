/**
 * Lightweight analytics hooks. Replace with Vercel Analytics, Plausible, or PostHog in production.
 *
 * TODO: Wire to Vercel Analytics (@vercel/analytics) for production dashboards.
 * TODO: Alternatively use Plausible or self-hosted analytics with privacy-friendly defaults.
 */

function devLog(event: string, payload?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] ${event}`, payload ?? "");
  }
}

export function trackCheckStarted() {
  devLog("check_started");
}

export function trackCheckCompleted(score: number) {
  devLog("check_completed", { score });
}

export function trackCheckFailed(reason: string) {
  devLog("check_failed", { reason });
}
