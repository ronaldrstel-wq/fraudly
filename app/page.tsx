import type { Metadata } from "next";
import { HomePageMainSections } from "@/components/home/HomePageMainSections";
import { HomeAuthProvider } from "@/components/home/HomeAuthContext";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { HomeFaqJsonLd } from "@/components/HomeFaqJsonLd";
import { HomeClient } from "@/components/HomeClient";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LocaleSuggestionServer } from "@/components/i18n/LocaleSuggestionServer";
import { OG_IMAGE } from "@/lib/seo-metadata";
import { hreflangLanguages } from "@/lib/i18n/seo";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { defaultKeywords, publicRobots, SITE_URL } from "@/lib/seo";

const homeTitle = SEO_TITLE.homeAbsolute;
const homeDescription = SEO_DESCRIPTION.home;

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  keywords: [...defaultKeywords],
  robots: publicRobots,
  alternates: { canonical: `${SITE_URL}/`, languages: hreflangLanguages("/") },
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

/** Hint CDN / data cache refresh for the marketing shell (no `force-static` — incompatible with Clerk + prerender). */
export const revalidate = 3600;

export default function HomePage() {
  const dict = getDictionary("en");

  return (
    <>
      <HomeFaqJsonLd />
      <HomeAuthProvider>
        <LocaleProvider locale="en" dict={dict}>
          <LocaleSuggestionServer marketingPath="/" />
          <HomeNavbar />
          <HomeClient>
            <HomePageMainSections locale="en" />
          </HomeClient>
        </LocaleProvider>
      </HomeAuthProvider>
    </>
  );
}
