import type { Locale } from "@/lib/i18n/locales";

const INTL_LOCALE: Record<Locale, string> = {
  en: "en-GB",
  nl: "nl-NL",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-PT"
};

const MS_DAY = 24 * 60 * 60 * 1000;

export function intlLocaleTag(locale: Locale): string {
  return INTL_LOCALE[locale] ?? "en-GB";
}

function safeDate(date: Date | null | undefined): Date | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  return date;
}

/** Long calendar date for cards (e.g. 9 May 2026). */
export function formatPublishedDateLong(date: Date, locale: Locale, unknownLabel = "Unknown"): string {
  const d = safeDate(date);
  if (!d) return unknownLabel;
  return d.toLocaleDateString(intlLocaleTag(locale), { day: "numeric", month: "long", year: "numeric" });
}

/** Medium date + short time for `title` attributes. */
export function formatDateTimeTitle(date: Date, locale: Locale): string {
  const d = safeDate(date);
  if (!d) return "";
  return d.toLocaleString(intlLocaleTag(locale), { dateStyle: "medium", timeStyle: "short" });
}

/** Full date + medium time for technical detail rows. */
export function formatDateTimeExact(date: Date, locale: Locale): string {
  const d = safeDate(date);
  if (!d) return "";
  return d.toLocaleString(intlLocaleTag(locale), { dateStyle: "full", timeStyle: "medium" });
}

export function formatRelativeTime(
  date: Date,
  locale: Locale,
  now: Date = new Date(),
  unknownLabel = "Unknown"
): { label: string; title: string } {
  const d = safeDate(date);
  if (!d) return { label: unknownLabel, title: unknownLabel };
  const tag = intlLocaleTag(locale);
  const title = formatDateTimeTitle(d, locale);
  const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
  const diffSec = (d.getTime() - now.getTime()) / 1000;
  const absSec = Math.abs(diffSec);
  const sign = diffSec < 0 ? -1 : 1;

  if (absSec < 60) return { label: rtf.format(Math.round(diffSec), "second"), title };
  if (absSec < 3600) return { label: rtf.format(sign * Math.round(absSec / 60), "minute"), title };
  if (absSec < MS_DAY / 1000) return { label: rtf.format(sign * Math.round(absSec / 3600), "hour"), title };
  if (absSec < 7 * (MS_DAY / 1000)) return { label: rtf.format(sign * Math.round(absSec / 86400), "day"), title };
  if (absSec < 30 * (MS_DAY / 1000)) return { label: rtf.format(sign * Math.round(absSec / (86400 * 7)), "week"), title };
  if (absSec < 365 * (MS_DAY / 1000)) return { label: rtf.format(sign * Math.round(absSec / (86400 * 30)), "month"), title };
  return { label: rtf.format(sign * Math.round(absSec / (86400 * 365)), "year"), title };
}
