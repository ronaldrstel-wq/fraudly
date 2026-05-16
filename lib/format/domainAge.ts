function pluralCount(n: number, singular: string, plural: string): string {
  const value = Math.max(0, Math.round(n));
  return value === 1 ? `1 ${singular}` : `${value} ${plural}`;
}

/** Human-readable age from day count (years, months, days). */
export function formatDomainAgeFromDays(days?: number | null): string | null {
  if (days == null || !Number.isFinite(days)) return null;

  const total = Math.max(0, Math.round(days));

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
