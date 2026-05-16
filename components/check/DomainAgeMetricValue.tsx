import { formatDomainAgeMetricFromSources } from "@/lib/format/domainAge";
import type { DomainIntelligence } from "@/lib/checks/types";

type DomainAgeMetricValueProps = {
  domainIntelligence?: DomainIntelligence | null;
  /** Optional enrichment layer (e.g. Outscraper public signals). */
  enrichmentAgeDays?: number | null;
  className?: string;
};

/** Domain age line for trust-style summary cards (check, domain intel, latest → detail). */
export function DomainAgeMetricValue({
  domainIntelligence,
  enrichmentAgeDays,
  className = "mt-1 text-lg font-bold leading-snug text-slate-900"
}: DomainAgeMetricValueProps) {
  return (
    <dd className={className}>
      {formatDomainAgeMetricFromSources(domainIntelligence, { domainAgeDays: enrichmentAgeDays })}
    </dd>
  );
}
