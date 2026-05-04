import type { Metadata } from "next";
import { HomeClient } from "@/components/HomeClient";
import { OG_IMAGE } from "@/lib/seo-metadata";
import { defaultKeywords, SITE_URL } from "@/lib/seo";

const homeTitle = "Fraudly – Detect Scams, Phishing & Online Fraud";
const homeDescription =
  "Use Fraudly to check suspicious messages, emails, websites, and fraud risks. Get fast insights to help identify scams before they cause harm.";

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  keywords: [...defaultKeywords],
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    type: "website",
    siteName: "Fraudly",
    locale: "en_US",
    url: `${SITE_URL}/`,
    title: homeTitle,
    description: homeDescription,
    images: [OG_IMAGE]
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
    images: [OG_IMAGE.url]
  }
};

export default function HomePage() {
  return <HomeClient />;
}
