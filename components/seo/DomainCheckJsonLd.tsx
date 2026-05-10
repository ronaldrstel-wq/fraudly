import { SITE_URL } from "@/lib/seo";
import { displayTrustScoreForResult } from "@/lib/scanPresentation";
import type { ScamCheckResult } from "@/types/scam";

export function DomainCheckJsonLd({ domain, pathname, result }: { domain: string; pathname: string; result: ScamCheckResult }) {
  const url = `${SITE_URL}${pathname}`;
  const trust = displayTrustScoreForResult(result);
  const sslLabel = result.ssl.httpsEnabled ? (result.ssl.validCertificate ? "HTTPS with valid certificate" : "HTTPS with certificate issues") : "HTTPS unavailable";

  const description =
    trust === null
      ? `Fraudly checked ${domain}. Trust-style score withheld because the apex is treated as inactive or invalid in this crawl. SSL: ${sslLabel}. Informational—not a guarantee of safety.`
      : `Fraudly checked ${domain} for scam signals and website trust indicators. Trust-style score about ${trust}/100. SSL: ${sslLabel}. This is informational—not a guarantee of safety.`;

  const graph = [
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Website check", item: `${SITE_URL}/#link-check` },
        { "@type": "ListItem", position: 3, name: domain, item: url }
      ]
    },
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: `Is ${domain} safe? Website trust analysis`,
      description,
      inLanguage: "en",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@type": "WebSite", name: domain },
      mainEntity: {
        "@type": "Thing",
        name: `Trust and risk signals for ${domain}`,
        description:
          trust === null
            ? `Special outcome: hostname not graded as Active website (${result.siteStatus}). Summary: ${result.reviewSummary}`
            : `Risk score (higher means more concern): ${result.score}/100. Summary: ${result.reviewSummary}`
      }
    }
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph })
      }}
    />
  );
}
