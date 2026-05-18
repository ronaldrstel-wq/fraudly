import type { ScamHelpFaq } from "@/lib/scam-help/countries";
import { SITE_URL } from "@/lib/seo";

export function ScamHelpFaqJsonLd({ faqs, path }: { faqs: ScamHelpFaq[]; path: string }) {
  const json = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    })),
    url: `${SITE_URL}${path}`
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  );
}
