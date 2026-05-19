import type { Locale } from "@/lib/i18n/locales";
import { LOCALIZED_LOCALES } from "@/lib/i18n/locales";
import resultFlowPaths from "@/lib/i18n/result-flow/_paths.json";
import { TRANSLATION_BY_EN } from "@/lib/i18n/result-flow/translation-by-en";

const pathEntries = resultFlowPaths as [string, string][];

function translateEnglish(en: string, locale: Locale): string {
  if (locale === "en") return en;
  const row = TRANSLATION_BY_EN[en];
  if (!row) return en;
  return row[locale] ?? en;
}

/** Dot-path overrides for a locale (English source string → localized). */
export function buildPathMap(locale: Locale): Record<string, string> {
  if (locale === "en") return {};
  const map: Record<string, string> = {};
  for (const [path, en] of pathEntries) {
    map[path] = translateEnglish(en, locale);
  }
  return map;
}

/** Symbols and tokens that are intentionally identical in every locale. */
const LOCALE_IDENTICAL_OK = new Set(["✓", "ⓘ", "⚠", "⛔", "Is ", "Registrar:", "possible", "no"]);

/** English paths that still resolve to the English string for a localized locale. */
export function untranslatedPaths(locale: Locale, localized: Record<string, unknown>): string[] {
  if (locale === "en") return [];
  const map = buildPathMap(locale);
  const untranslated: string[] = [];
  for (const [path, en] of pathEntries) {
    if (LOCALE_IDENTICAL_OK.has(en)) continue;
    const translated = map[path];
    if (translated === en) untranslated.push(path);
  }
  return untranslated;
}

export function warnUntranslatedResultFlow(locale: Locale, localized: Record<string, unknown>): void {
  if (locale === "en" || process.env.NODE_ENV === "production") return;
  const missing = untranslatedPaths(locale, localized);
  if (missing.length > 0) {
    console.warn(
      `[i18n] resultFlow/${locale}: ${missing.length} string(s) still English (e.g. ${missing.slice(0, 3).join(", ")})`
    );
  }
}

export const RESULT_FLOW_LOCALES = ["en", ...LOCALIZED_LOCALES] as const;
