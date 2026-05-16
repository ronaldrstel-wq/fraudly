function pluralCount(n: number, singular: string, plural: string): string {
  const value = Math.max(0, Math.round(n));
  return value === 1 ? `1 ${singular}` : `${value} ${plural}`;
}

/** Human-readable age from day count (years, months, days). */
export function formatDomainAgeFromDays(days?: number | null): string | null {
  if (days == null || !Number.isFinite(days)) return null;

  const total = Math.round(days);
  if (total < 0) return null;

  if (total <= 30) {
    return pluralCount(total, "day", "days");
  }

  const years = Math.floor(total / 365);
  let remainder = total % 365;
  const months = Math.floor(remainder / 30);
  remainder %= 30;

  const parts: string[] = [];
  if (years > 0) parts.push(pluralCount(years, "year", "years"));
  if (months > 0) parts.push(pluralCount(months, "month", "months"));
  if (remainder > 0 || parts.length === 0) parts.push(pluralCount(remainder, "day", "days"));

  return parts.join(", ");
}

const YOUNG_DOMAIN_DAYS = 30;
const ESTABLISHED_DOMAIN_DAYS = 180;

/**
 * Consumer-facing domain age line for safety signals / hero bullets.
 * Returns null when age is unknown.
 */
export function formatDomainAgeSignal(days?: number | null): string | null {
  const formatted = formatDomainAgeFromDays(days);
  if (formatted == null) return null;

  const d = Math.max(0, Math.round(days ?? 0));
  if (d <= YOUNG_DOMAIN_DAYS) {
    return `This domain is only ${formatted} old.`;
  }
  if (d >= ESTABLISHED_DOMAIN_DAYS) {
    return `This domain has existed for ${formatted}.`;
  }
  return `This domain is ${formatted} old.`;
}

/** Neutral copy when RDAP/age is unavailable — not a risk signal. */
export const DOMAIN_REGISTRATION_UNAVAILABLE_COPY =
  "Domain registration details were unavailable during this scan.";

/** Bucket for safety-signal sections (does not affect scoring). */
export function domainAgeConsumerBucket(days?: number | null): "positive" | "caution" {
  if (days == null || !Number.isFinite(days)) return "caution";
  const d = Math.max(0, Math.round(days));
  if (d <= YOUNG_DOMAIN_DAYS) return "caution";
  if (d >= ESTABLISHED_DOMAIN_DAYS) return "positive";
  return "caution";
}
