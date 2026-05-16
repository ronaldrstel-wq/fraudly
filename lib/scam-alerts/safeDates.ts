/** Coerce Prisma/JSON dates; return null when missing or invalid. */
export function safeAlertDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function safeAlertIso(value: Date | string | null | undefined): string | null {
  const d = safeAlertDate(value);
  return d ? d.toISOString() : null;
}

export function formatAlertDateLongEn(value: Date | string | null | undefined): string | null {
  const d = safeAlertDate(value);
  if (!d) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function formatAlertDateTimeEn(value: Date | string | null | undefined, fallback = "Unknown"): string {
  const d = safeAlertDate(value);
  if (!d) return fallback;
  return d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}
