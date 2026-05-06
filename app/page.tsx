import type { Metadata } from "next";
import { HomeBelowFold } from "@/components/HomeBelowFold";
import { HomeFaqJsonLd } from "@/components/HomeFaqJsonLd";
import { HomeClient } from "@/components/HomeClient";
import { OG_IMAGE } from "@/lib/seo-metadata";
import { defaultKeywords, SITE_URL } from "@/lib/seo";

const homeTitle = "Free Scam Website Checker & Website Trust Checker | Fraudly";
const homeDescription =
  "Check if a website is legit with Fraudly’s free website safety checker—scam signals, phishing-style risks, fake webshop patterns, and trust indicators in one place before you click or pay.";

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
  return (
    <>
      <HomeFaqJsonLd />
      <HomeClient>
        <HomeBelowFold />
      </HomeClient>
    </>
  );
}
