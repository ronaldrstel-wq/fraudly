import { SITE_URL } from "@/lib/seo";

const graph = [
  {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Fraudly",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    description:
      "Fraudly helps people check scam websites, phishing links, fake webshops, and other suspicious URLs with clear trust and risk indicators.",
    sameAs: [] as string[]
  },
  {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "Fraudly",
    url: SITE_URL,
    description:
      "Website trust checker for scam signals, phishing-style risks, and fake online stores—with explainable indicators and calm guidance.",
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
      "Free website checker for scam indicators, phishing links, and dubious shops—risk signals and optional AI summary in plain language.",
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
