import type { DomainIntelligence } from "@/lib/checks/types";

function pluralCount(n: number, singular: string, plural: string): string {
  const value = Math.max(0, Math.round(n));
  return value === 1 ? `1 ${singular}` : `${value} ${plural}`;
}

/** All known RDAP / intel field names that may carry domain age (days or registration timestamp). */
export type DomainAgeIntelSource = {
  ageDays?: number | null;
  domainAgeDays?: number | null;
  registrationAgeDays?: number | null;
  registrationDate?: string | null;
  createdDate?: string | null;
  registeredAt?: string | null;
};

export const DOMAIN_AGE_NOT_VERIFIED_LABEL = "Not verified";

function parseRegistrationAgeDays(raw?: string | null): number | null {
  if (!raw?.trim()) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  const days = Math.floor((Date.now() - parsed.getTime()) / 86400000);
  return days >= 0 ? days : null;
}

/** Resolves a single source to whole-day age, preferring explicit day counts over registration dates. */
export function resolveDomainAgeDays(source?: DomainAgeIntelSource | null): number | null {
  if (!source) return null;

  for (const value of [source.ageDays, source.domainAgeDays, source.registrationAgeDays]) {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      return Math.round(value);
    }
  }

  for (const dateValue of [source.registrationDate, source.createdDate, source.registeredAt]) {
    const fromDate = parseRegistrationAgeDays(dateValue);
    if (fromDate != null) return fromDate;
  }

  return null;
}

/** First non-null age across layered intel (e.g. scan result + reputation enrichment). */
export function resolveDomainAgeDaysFromSources(
  ...sources: Array<DomainAgeIntelSource | DomainIntelligence | null | undefined>
): number | null {
  for (const source of sources) {
    const days = resolveDomainAgeDays(source ?? undefined);
    if (days != null) return days;
  }
  return null;
}

/** Consumer metric card label — never raw day counts; uses {@link DOMAIN_AGE_NOT_VERIFIED_LABEL} when unknown. */
export function formatDomainAgeMetric(source?: DomainAgeIntelSource | null): string {
  return formatDomainAgeFromDays(resolveDomainAgeDays(source)) ?? DOMAIN_AGE_NOT_VERIFIED_LABEL;
}

export function formatDomainAgeMetricFromSources(
  ...sources: Array<DomainAgeIntelSource | DomainIntelligence | null | undefined>
): string {
  return formatDomainAgeFromDays(resolveDomainAgeDaysFromSources(...sources)) ?? DOMAIN_AGE_NOT_VERIFIED_LABEL;
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
    return `This website is relatively new (${formatted}), so there is limited public history.`;
  }
  if (d < ESTABLISHED_DOMAIN_DAYS) {
    return `This website is relatively new (${formatted}), so there is limited public history.`;
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
