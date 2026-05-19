import { applyPathMap } from "@/lib/i18n/result-flow/apply-path-map";
import { resultFlowEn, type ResultFlowMessages } from "@/lib/i18n/result-flow/en";
import { buildPathMap, warnUntranslatedResultFlow } from "@/lib/i18n/result-flow/string-translations";
import type { Locale } from "@/lib/i18n/locales";

const cache = new Map<Locale, ResultFlowMessages>();

export type { ResultFlowMessages } from "@/lib/i18n/result-flow/en";

export function getResultFlowMessages(locale: Locale): ResultFlowMessages {
  if (locale === "en") return resultFlowEn;
  const cached = cache.get(locale);
  if (cached) return cached;

  const map = buildPathMap(locale);
  const merged = applyPathMap(resultFlowEn, map) as ResultFlowMessages;
  cache.set(locale, merged);
  warnUntranslatedResultFlow(locale, merged as unknown as Record<string, unknown>);
  return merged;
}
