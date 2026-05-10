import type { Metadata } from "next";
import { HomeBelowFold } from "@/components/HomeBelowFold";
import { HomeFaqJsonLd } from "@/components/HomeFaqJsonLd";
import { HomeClient } from "@/components/HomeClient";
import { OG_IMAGE } from "@/lib/seo-metadata";
import { defaultKeywords, SITE_URL } from "@/lib/seo";

const homeTitle = "Fraudly — AI-Assisted Scam Website Checker";
const homeDescription =
  "See if a website looks trustworthy before you buy or sign in—Fraudly blends scam intelligence, reputation insight, phishing detection, SSL checks, and AI-assisted summaries in one calm readout.";

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
