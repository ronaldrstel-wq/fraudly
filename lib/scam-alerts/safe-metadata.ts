import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/seo-metadata";
import { privateRobots, publicRobots, SITE_URL } from "@/lib/seo";

const LIST_DESCRIPTION =
  "Fraudly aggregates public scam intelligence—phishing, risky domains, and emerging fraud patterns—with calm explanations so you know what to double-check.";

/** Stable metadata if `generateMetadata` throws (never takes down the route). */
export function scamAlertsIndexFallbackMetadata(canonicalPath = "/scam-alerts"): Metadata {
  const canonical = canonicalPath.startsWith("http") ? canonicalPath : `${SITE_URL}${canonicalPath}`;
  return {
    title: { absolute: "Threat alerts | Fraudly" },
    description: LIST_DESCRIPTION,
    alternates: { canonical },
    robots: publicRobots,
    openGraph: {
      type: "website",
      title: "Threat alerts | Fraudly",
      description: LIST_DESCRIPTION,
      url: canonical,
      siteName: "Fraudly",
      locale: "en_US",
      images: [OG_IMAGE]
    },
    twitter: {
      card: "summary_large_image",
      title: "Threat alerts | Fraudly",
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
    description: "This scam alert could not be loaded. Browse other published alerts on Fraudly.",
    alternates: { canonical },
    robots: privateRobots,
    openGraph: {
      type: "website",
      title: "Scam alert | Fraudly",
      description: "Published threat alert on Fraudly.",
      url: canonical,
      siteName: "Fraudly",
      locale: "en_US",
      images: [OG_IMAGE]
    },
    twitter: {
      card: "summary_large_image",
      title: "Scam alert | Fraudly",
      description: "Published threat alert on Fraudly.",
      images: [OG_IMAGE.url]
    }
  };
}
