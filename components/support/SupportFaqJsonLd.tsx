import { SUPPORT_FAQ_ITEMS } from "@/lib/support/supportFaq";
import { SITE_URL } from "@/lib/seo";

export function SupportFaqJsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: `${SITE_URL}/support`,
    mainEntity: SUPPORT_FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
