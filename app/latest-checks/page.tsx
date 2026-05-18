import type { Metadata } from "next";
import { hreflangLanguages, localizedCanonicalUrl } from "@/lib/i18n/seo";
import { OG_IMAGE } from "@/lib/seo-metadata";
import { SEO_DESCRIPTION, SEO_TITLE, warnMetaDescriptionIfNeeded } from "@/lib/seo-description";
import { publicRobots } from "@/lib/seo";
import { renderLatestChecksPage } from "@/lib/pages/render-latest-checks-page";

export const revalidate = 120;

type PageProps = { searchParams: Promise<{ page?: string }> };

function clampPage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 500);
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const page = clampPage((await searchParams).page);
  const titleSegment =
    page > 1 ? `${SEO_TITLE.latestChecks} (page ${page})` : SEO_TITLE.latestChecks;
  const sharingTitle = `${titleSegment} | Fraudly`;
  const searchSuffix = page > 1 ? `page=${page}` : "";
  const canonical = localizedCanonicalUrl("/latest-checks", "en", searchSuffix);

  const description = SEO_DESCRIPTION.latestChecks;
  warnMetaDescriptionIfNeeded(page > 1 ? `/latest-checks?page=${page}` : "/latest-checks", description);

  return {
    title: titleSegment,
    description,
    alternates: {
      canonical,
      languages: hreflangLanguages("/latest-checks", searchSuffix)
    },
    robots: publicRobots,
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "Fraudly",
      locale: "en_US",
      title: sharingTitle,
      description,
      images: [OG_IMAGE]
    },
    twitter: {
      card: "summary_large_image",
      title: sharingTitle,
      description,
      images: [OG_IMAGE.url]
    }
  };
}

export default async function LatestChecksPage(props: PageProps) {
  return renderLatestChecksPage(props);
}
