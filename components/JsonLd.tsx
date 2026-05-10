import { SITE_URL } from "@/lib/seo";

const graph = [
  {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Fraudly",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    description:
      "Fraudly helps consumers quietly vet websites—combining phishing intelligence, HTTPS checks, domain history cues, curated scam feeds, and AI-assisted narration without fear-based hype.",
    sameAs: [] as string[]
  },
  {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "Fraudly",
    url: SITE_URL,
    description:
      "Website trust checker with scam intelligence, reputation snapshots, SSL signals, deep scans, and AI-assisted explanations for everyday shoppers.",
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
      "Free AI-assisted website checker for scam signals, phishing-style pages, fake stores, and suspicious URLs—plain-language trust guidance with honest limits.",
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
