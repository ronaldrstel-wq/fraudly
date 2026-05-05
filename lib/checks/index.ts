import { normalizeDomain } from "@/lib/cache";
import { runOpenPhishCheck } from "@/lib/checks/openPhish";
import { runPoliceScamCheck } from "@/lib/checks/police";
import { runSafeBrowsingCheck } from "@/lib/checks/safeBrowsing";
import { runSslCheck } from "@/lib/checks/ssl";
import type { ExternalChecksResult } from "@/lib/checks/types";
import { runUrlHausCheck } from "@/lib/checks/urlHaus";
import { runDomainIntelligenceCheck } from "@/lib/checks/whois";

export async function runAllChecks(url: string): Promise<ExternalChecksResult> {
  const domain = normalizeDomain(url);
  const [police, domainIntelligence, safeBrowsing, openPhish, urlHaus, ssl] = await Promise.all([
    runPoliceScamCheck(domain),
    runDomainIntelligenceCheck(domain),
    runSafeBrowsingCheck(url),
    runOpenPhishCheck(url, domain),
    runUrlHausCheck(domain),
    runSslCheck(domain)
  ]);

  return {
    police,
    domainIntelligence,
    safeBrowsing,
    openPhish,
    urlHaus,
    ssl,
    warnings: [
      ...police.warnings,
      ...domainIntelligence.warnings,
      ...safeBrowsing.warnings,
      ...openPhish.warnings,
      ...urlHaus.warnings,
      ...ssl.warnings
    ]
  };
}
