import type { Metadata } from "next";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { OG_IMAGE } from "@/lib/seo-metadata";
import { privateRobots, publicRobots, SITE_URL } from "@/lib/seo";

const LIST_DESCRIPTION = SEO_DESCRIPTION.scamAlerts;

/** Stable metadata if `generateMetadata` throws (never takes down the route). */
export function scamAlertsIndexFallbackMetadata(canonicalPath = "/scam-alerts"): Metadata {
  const canonical = canonicalPath.startsWith("http") ? canonicalPath : `${SITE_URL}${canonicalPath}`;
  return {
    title: { absolute: `${SEO_TITLE.scamAlerts} | Fraudly` },
    description: LIST_DESCRIPTION,
    alternates: { canonical },
    robots: publicRobots,
    openGraph: {
      type: "website",
      title: `${SEO_TITLE.scamAlerts} | Fraudly`,
      description: LIST_DESCRIPTION,
      url: canonical,
      siteName: "Fraudly",
      locale: "en_US",
      images: [OG_IMAGE]
    },
    twitter: {
      card: "summary_large_image",
      title: `${SEO_TITLE.scamAlerts} | Fraudly`,
      description: LIST_DESCRIPTION,
      images: [OG_IMAGE.url]
    }
  };
}

export function scamAlertDetailFallbackMetadata(opts?: { slug?: string }): Metadata {
  const slug = opts?.slug?.trim();
  const canonical = slug ? `${SITE_URL}/scam-alerts/${encodeURIComponent(slug)}` : `${SITE_URL}/scam-alerts`;
  return {
    title: { absolute: "Scam alert | Fraudly" },
    description: SEO_DESCRIPTION.scamAlertLoadError,
    alternates: { canonical },
    robots: privateRobots,
    openGraph: {
      type: "website",
      title: "Scam alert | Fraudly",
      description: SEO_DESCRIPTION.scamAlertDetailFallback,
      url: canonical,
      siteName: "Fraudly",
      locale: "en_US",
      images: [OG_IMAGE]
    },
    twitter: {
      card: "summary_large_image",
      title: "Scam alert | Fraudly",
      description: SEO_DESCRIPTION.scamAlertDetailFallback,
      images: [OG_IMAGE.url]
    }
  };
}
