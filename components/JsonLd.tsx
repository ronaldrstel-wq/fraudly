import { SITE_URL } from "@/lib/seo";

const graph = [
  {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Fraudly",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    sameAs: [] as string[]
  },
  {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "Fraudly",
    url: SITE_URL,
    description:
      "Fraudly helps users identify suspicious messages, websites, emails, and potential online fraud.",
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en"
  },
  {
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: "Fraudly",
    applicationCategory: "SecurityApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description:
      "Fraudly helps users identify suspicious messages, websites, emails, and potential online fraud.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    publisher: { "@id": `${SITE_URL}/#organization` }
  }
];

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
