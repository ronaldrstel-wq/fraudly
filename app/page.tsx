import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeBelowFold } from "@/components/HomeBelowFold";
import { HomeAuthProvider } from "@/components/home/HomeAuthContext";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { HomeFaqJsonLd } from "@/components/HomeFaqJsonLd";
import { HomeClient } from "@/components/HomeClient";
import { OG_IMAGE } from "@/lib/seo-metadata";
import { defaultKeywords, publicRobots, SITE_URL } from "@/lib/seo";

const homeTitle = "Fraudly — AI-Assisted Scam Website Checker";
const homeDescription =
  "See if a website looks trustworthy before you buy or sign in—Fraudly blends scam intelligence, reputation insight, phishing detection, SSL checks, and AI-assisted summaries in one calm readout.";

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  keywords: [...defaultKeywords],
  robots: publicRobots,
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

/** Hint CDN / data cache refresh for the marketing shell (no `force-static` — incompatible with Clerk + prerender). */
export const revalidate = 3600;

function HomeBelowFoldFallback() {
  return (
    <div className="mx-auto mt-14 max-w-6xl space-y-6 sm:mt-16 md:mt-20" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-44 w-full animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <HomeFaqJsonLd />
      <HomeAuthProvider>
        <HomeNavbar />
        <HomeClient>
          <Suspense fallback={<HomeBelowFoldFallback />}>
            <HomeBelowFold />
          </Suspense>
        </HomeClient>
      </HomeAuthProvider>
    </>
  );
}
