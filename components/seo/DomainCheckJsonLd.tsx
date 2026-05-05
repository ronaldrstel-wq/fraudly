import { SITE_URL } from "@/lib/seo";
import type { ScamCheckResult } from "@/types/scam";

function trustScoreFromResult(result: ScamCheckResult): number {
  return Math.round(100 - result.score);
}

export function DomainCheckJsonLd({ domain, pathname, result }: { domain: string; pathname: string; result: ScamCheckResult }) {
  const url = `${SITE_URL}${pathname}`;
  const trust = trustScoreFromResult(result);
  const sslLabel = result.ssl.httpsEnabled ? (result.ssl.validCertificate ? "HTTPS with valid certificate" : "HTTPS with certificate issues") : "HTTPS unavailable";

  const description = `Fraudly checked ${domain} for scam signals and website trust indicators. Trust-style score about ${trust}/100. SSL: ${sslLabel}. This is informational—not a guarantee of safety.`;

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
        description: `Risk score (higher means more concern): ${result.score}/100. Summary: ${result.reviewSummary}`
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
