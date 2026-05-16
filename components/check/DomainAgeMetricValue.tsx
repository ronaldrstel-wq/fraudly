import {
  displayAgeFromNormalized,
  normalizeDomainAge,
  type NormalizeDomainAgeInput
} from "@/lib/domain/normalizeDomainAge";

type DomainAgeMetricValueProps = NormalizeDomainAgeInput & {
  className?: string;
  debug?: { route: string; domain: string };
};

/** Domain age line for trust-style summary cards (check, domain intel, latest → detail). */
export function DomainAgeMetricValue({
  className = "mt-1 text-lg font-bold leading-snug text-slate-900",
  debug,
  ...input
}: DomainAgeMetricValueProps) {
  const normalized = normalizeDomainAge(input, debug);
  return <dd className={className}>{displayAgeFromNormalized(normalized)}</dd>;
}
