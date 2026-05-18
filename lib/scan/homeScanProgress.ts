import type { CheckFlowMessages } from "@/lib/i18n/check-flow";
import { getCheckFlowMessages } from "@/lib/i18n/check-flow";
import type { Locale } from "@/lib/i18n/locales";

/** @deprecated Use getHomeScanRotatingMessages(locale) */
export const HOME_SCAN_ROTATING_MESSAGES = getCheckFlowMessages("en").scanProgress.rotating;

export const HOME_SCAN_PROGRESS_FAST_CAP = 70;
export const HOME_SCAN_PROGRESS_SLOW_CAP = 95;
export const HOME_SCAN_SIM_INTERVAL_MS = 420;
export const HOME_SCAN_SLOW_INTERVAL_MS = 560;

export type HomeSearchCardState = "idle" | "scanning" | "complete";

export function getHomeScanRotatingMessages(locale: Locale = "en"): readonly string[] {
  return getCheckFlowMessages(locale).scanProgress.rotating;
}

export function homeScanStatusMessage(
  progress: number,
  failed: boolean,
  messages: CheckFlowMessages["scanProgress"],
  failedMessage?: string
): string {
  if (failed && failedMessage) return failedMessage;
  if (progress >= 100) return messages.complete;
  const rotating = messages.rotating;
  const idx = Math.min(rotating.length - 1, Math.floor((progress / 100) * rotating.length));
  return rotating[idx] ?? rotating[0];
}

/** Simulated progress: quick 0→70, slow 70→95, then hold for API. */
export function nextHomeScanSimulatedProgress(current: number): number {
  if (current >= HOME_SCAN_PROGRESS_SLOW_CAP) return current;
  if (current < HOME_SCAN_PROGRESS_FAST_CAP) {
    const bump = 1.8 + Math.random() * 4.2;
    return Math.min(HOME_SCAN_PROGRESS_FAST_CAP, current + bump);
  }
  const bump = 0.25 + Math.random() * 1.1;
  return Math.min(HOME_SCAN_PROGRESS_SLOW_CAP, current + bump);
}

export async function animateHomeScanProgressTo100(
  setProgress: (value: number) => void,
  from: number
): Promise<void> {
  let p = Math.max(0, from);
  while (p < 100) {
    const step = Math.max(1.5, (100 - p) / 5);
    p = Math.min(100, p + step);
    setProgress(Math.round(p));
    await new Promise((resolve) => setTimeout(resolve, 36));
  }
  setProgress(100);
}
