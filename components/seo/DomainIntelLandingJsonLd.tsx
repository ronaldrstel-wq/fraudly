import { SITE_URL } from "@/lib/seo";
import type { DomainLandingFaqItem } from "@/lib/domainIntelLandingCopy";
export function DomainIntelLandingJsonLd({
  domain,
  pathname,
  pageName,
  pageDescription,
  faqs
}: {
  domain: string;
  pathname: string;
  pageName: string;
  pageDescription: string;
  faqs: DomainLandingFaqItem[];
}) {
  const url = `${SITE_URL}${pathname}`;

  const faqEntities = faqs.map((f) => ({
    "@type": "Question" as const,
    name: f.question,
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: f.answer
    }
  }));

  const graph = [
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Learn — scams & phishing", item: `${SITE_URL}/learn` },
        { "@type": "ListItem", position: 3, name: domain, item: url }
      ]
    },
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: pageName,
      description: pageDescription,
      inLanguage: "en",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@type": "Thing", name: `Website trust indicators for ${domain}` },
      mainEntity: { "@id": `${url}#faq` }
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      url,
      inLanguage: "en",
      mainEntity: faqEntities
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
