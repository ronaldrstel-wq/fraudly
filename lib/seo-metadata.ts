import type { Metadata } from "next";
import { defaultKeywords, publicRobots, SITE_URL } from "@/lib/seo";

export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Fraudly – scam checker and fraud detection tool"
} as const;

/**
 * Page title in browser becomes "{titleSegment} | Fraudly" via root layout template.
 * Open Graph / Twitter use the same full title string for consistent sharing previews.
 */
export function buildPageMetadata(opts: {
  path: string;
  titleSegment: string;
  description: string;
}): Metadata {
  const url = `${SITE_URL}${opts.path}`;
  const sharingTitle = `${opts.titleSegment} | Fraudly`;
  return {
    title: opts.titleSegment,
    description: opts.description,
    keywords: [...defaultKeywords],
    robots: publicRobots,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "Fraudly",
      locale: "en_US",
      url,
      title: sharingTitle,
      description: opts.description,
      images: [OG_IMAGE]
    },
    twitter: {
      card: "summary_large_image",
      title: sharingTitle,
      description: opts.description,
      images: [OG_IMAGE.url]
    }
  };
}
