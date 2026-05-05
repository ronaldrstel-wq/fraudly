import { normalizeDomain } from "@/lib/cache";
import { checksConfig } from "@/lib/checks/config";
import { runPoliceNlProvider } from "@/lib/checks/providers/government/police-nl";
import { runDeBsiStub } from "@/lib/checks/providers/government/de-bsi.stub";
import { runFrAnssiStub } from "@/lib/checks/providers/government/fr-anssi.stub";
import { runUkNcscStub } from "@/lib/checks/providers/government/uk-ncsc.stub";
import { runUsCisaStub } from "@/lib/checks/providers/government/us-cisa.stub";
import { runRdapProvider } from "@/lib/checks/providers/domain/rdap";
import { runUrlHausProvider } from "@/lib/checks/providers/malware/urlhaus";
import { runGoogleSafeBrowsingProvider } from "@/lib/checks/providers/phishing/googleSafeBrowsing";
import { runOpenPhishProvider } from "@/lib/checks/providers/phishing/openphish";
import { runPhishTankStub } from "@/lib/checks/providers/phishing/phishTank.stub";
import { runAbuseIpdbStub } from "@/lib/checks/providers/reputation/abuseIpdb.stub";
import { runTrancoStub } from "@/lib/checks/providers/reputation/tranco.stub";
import { runUmbrellaStub } from "@/lib/checks/providers/reputation/umbrella.stub";
import { runVirusTotalStub } from "@/lib/checks/providers/reputation/virusTotal.stub";
import { runTlsProvider } from "@/lib/checks/providers/ssl/tls";
import { evidenceUnavailable } from "@/lib/checks/providers/shared";
import { runWithDeadline } from "@/lib/checks/providers/shared";
import type { ProviderEvidenceResult, ProviderRun } from "@/lib/checks/providers/types";
import type {
  DomainIntelligence,
  ExternalChecksResult,
  FeedThreatCheck,
  PoliceScamCheck,
  SafeBrowsingCheck,
  SslCheck
} from "@/lib/checks/types";

const DEADLINE_LABEL = {
  police: "Dutch Police (public pages)",
  rdap: "RDAP",
  safeBrowsing: "Google Safe Browsing",
  openPhish: "OpenPhish",
  urlHaus: "URLhaus",
  ssl: "TLS"
};

async function withDeadline<TResult>(
  key: keyof typeof DEADLINE_LABEL,
  fn: () => Promise<ProviderRun<TResult>>,
  degrade: (message: string) => ProviderRun<TResult>
): Promise<ProviderRun<TResult>> {
  try {
    return await runWithDeadline(`${DEADLINE_LABEL[key]} provider`, checksConfig.providerDeadlineMs, fn);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return degrade(message);
  }
}

export async function runAllChecks(url: string): Promise<ExternalChecksResult> {
  const domain = normalizeDomain(url);

  const [
    policeOutcome,
    domainOutcome,
    safeBrowsingOutcome,
    openPhishOutcome,
    urlHausOutcome,
    sslOutcome,
    tier2
  ] = await Promise.all([
    withDeadline("police", () => runPoliceNlProvider(domain), (message) => ({
      evidence: [
        evidenceUnavailable(DEADLINE_LABEL.police, "government", `Police page check overrun or error: ${message}`)
      ],
      result: {
        listedInPoliceScamDatabase: false,
        source: "Dutch Police (public pages)",
        warnings: [message]
      } satisfies PoliceScamCheck
    })),
    withDeadline("rdap", () => runRdapProvider(domain), (message) => ({
      evidence: [evidenceUnavailable(DEADLINE_LABEL.rdap, "domain", `RDAP lookup overrun or error: ${message}`)],
      result: {
        source: "RDAP (rdap.org)",
        warnings: [message]
      } satisfies DomainIntelligence
    })),
    withDeadline(
      "safeBrowsing",
      () => runGoogleSafeBrowsingProvider(url),
      (message) => ({
        evidence: [
          evidenceUnavailable(DEADLINE_LABEL.safeBrowsing, "malware", `Safe Browsing overrun or error: ${message}`)
        ],
        result: {
          safeBrowsingStatus: "unknown",
          safeBrowsingThreats: [],
          source: "Google Safe Browsing",
          warnings: [message]
        } satisfies SafeBrowsingCheck
      })
    ),
    withDeadline(
      "openPhish",
      () => runOpenPhishProvider(url, domain),
      (message) => ({
        evidence: [
          evidenceUnavailable(DEADLINE_LABEL.openPhish, "phishing", `OpenPhish overrun or error: ${message}`)
        ],
        result: {
          listed: false,
          matches: [],
          source: "OpenPhish",
          warnings: [message]
        } satisfies FeedThreatCheck
      })
    ),
    withDeadline("urlHaus", () => runUrlHausProvider(domain), (message) => ({
      evidence: [evidenceUnavailable(DEADLINE_LABEL.urlHaus, "malware", `URLhaus overrun or error: ${message}`)],
      result: {
        listed: false,
        matches: [],
        source: "URLhaus",
        warnings: [message]
      } satisfies FeedThreatCheck
    })),
    withDeadline("ssl", () => runTlsProvider(domain), (message) => ({
      evidence: [evidenceUnavailable(DEADLINE_LABEL.ssl, "ssl", `TLS check overrun or error: ${message}`)],
      result: {
        httpsEnabled: false,
        validCertificate: false,
        source: "TLS certificate check",
        warnings: [message]
      } satisfies SslCheck
    })),
    Promise.all([
      runPhishTankStub(),
      runAbuseIpdbStub(),
      runVirusTotalStub(),
      runTrancoStub(),
      runUmbrellaStub(),
      runUkNcscStub(),
      runUsCisaStub(),
      runDeBsiStub(),
      runFrAnssiStub()
    ]).then((chunks) => chunks.flat() as ProviderEvidenceResult[])
  ]);

  const providerEvidence: ProviderEvidenceResult[] = [
    ...policeOutcome.evidence,
    ...domainOutcome.evidence,
    ...safeBrowsingOutcome.evidence,
    ...openPhishOutcome.evidence,
    ...urlHausOutcome.evidence,
    ...sslOutcome.evidence,
    ...tier2
  ];

  const severityOrder: Record<ProviderEvidenceResult["severity"], number> = {
    danger: 0,
    warning: 1,
    info: 2,
    positive: 3
  };
  providerEvidence.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    police: policeOutcome.result,
    domainIntelligence: domainOutcome.result,
    safeBrowsing: safeBrowsingOutcome.result,
    openPhish: openPhishOutcome.result,
    urlHaus: urlHausOutcome.result,
    ssl: sslOutcome.result,
    providerEvidence,
    warnings: [
      ...policeOutcome.result.warnings,
      ...domainOutcome.result.warnings,
      ...safeBrowsingOutcome.result.warnings,
      ...openPhishOutcome.result.warnings,
      ...urlHausOutcome.result.warnings,
      ...sslOutcome.result.warnings
    ]
  };
}
