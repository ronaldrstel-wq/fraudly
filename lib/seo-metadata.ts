import type { Metadata } from "next";
import { warnMetaDescriptionIfNeeded } from "@/lib/seo-description";
import { defaultKeywords, publicRobots, SITE_URL } from "@/lib/seo";

export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Fraudly — check if a website or webshop is safe"
} as const;

type BuildPageMetadataOptions = {
  path: string;
  titleSegment: string;
  description: string;
  /** When set, used as the full document title (no `| Fraudly` suffix from layout). */
  titleAbsolute?: string;
  robots?: Metadata["robots"];
};

/**
 * Page title in browser becomes "{titleSegment} | Fraudly" unless `titleAbsolute` is set.
 * Open Graph / Twitter use the sharing title for consistent link previews.
 */
export function buildPageMetadata(opts: BuildPageMetadataOptions): Metadata {
  warnMetaDescriptionIfNeeded(opts.path, opts.description);
  const url = `${SITE_URL}${opts.path}`;
  const sharingTitle = opts.titleAbsolute ?? `${opts.titleSegment} | Fraudly`;
  const title: Metadata["title"] = opts.titleAbsolute
    ? { absolute: opts.titleAbsolute }
    : opts.titleSegment;

  return {
    title,
    description: opts.description,
    keywords: [...defaultKeywords],
    robots: opts.robots ?? publicRobots,
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
