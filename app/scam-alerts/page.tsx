import type { Metadata } from "next";
import { ScamAlertsPageContent, type ScamAlertsPageContentProps } from "@/components/scam-alerts/ScamAlertsPageContent";
import {
  buildScamAlertsQuery,
  parseListFilterKey,
  parseScamAlertsPageParam,
  parseScamAlertsTimeWindow
} from "@/lib/scam-alerts/presentation";
import { hreflangLanguages } from "@/lib/i18n/seo";
import { OG_IMAGE } from "@/lib/seo-metadata";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { publicRobots, SITE_URL } from "@/lib/seo";
import { scamAlertsIndexFallbackMetadata } from "@/lib/scam-alerts/safe-metadata";

export const revalidate = 300;

const PAGE_DESCRIPTION = SEO_DESCRIPTION.scamAlerts;

type PageProps = {
  searchParams: ScamAlertsPageContentProps["searchParams"];
};

export function scamAlertsSearchSuffix(options: {
  page: number;
  time?: string;
  filter?: string;
  type?: string;
}): string {
  let filter = parseListFilterKey(options.filter);
  let timeWindow = parseScamAlertsTimeWindow(options.time);
  if (filter === "new-today") {
    filter = "all";
    timeWindow = "today";
  }
  return buildScamAlertsQuery({
    time: timeWindow === "all" ? undefined : timeWindow,
    filter: filter === "all" ? undefined : filter,
    type: options.type?.trim() || undefined,
    page: options.page > 1 ? options.page : undefined
  });
}

function scamAlertsCanonicalPath(options: {
  page: number;
  time?: string;
  filter?: string;
  type?: string;
}): string {
  const q = scamAlertsSearchSuffix(options);
  return `${SITE_URL}/scam-alerts${q}`;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  try {
    const params = await searchParams;
    const page = parseScamAlertsPageParam(params.page);
    const canonical = scamAlertsCanonicalPath({
      page,
      time: typeof params.time === "string" ? params.time : undefined,
      filter: typeof params.filter === "string" ? params.filter : undefined,
      type: typeof params.type === "string" ? params.type : undefined
    });
    const titleAbsolute =
      page > 1 ? `${SEO_TITLE.scamAlerts} · Page ${page} | Fraudly` : `${SEO_TITLE.scamAlerts} | Fraudly`;

    const query = canonical.startsWith(SITE_URL) ? canonical.slice(SITE_URL.length) : canonical;
    const searchSuffix = query.replace(/^\/scam-alerts/, "");

    return {
      title: { absolute: titleAbsolute },
      description: PAGE_DESCRIPTION,
      alternates: {
        canonical,
        languages: hreflangLanguages("/scam-alerts", searchSuffix)
      },
      robots: publicRobots,
      openGraph: {
        type: "website",
        siteName: "Fraudly",
        locale: "en_US",
        title: titleAbsolute,
        description: PAGE_DESCRIPTION,
        url: canonical,
        images: [OG_IMAGE]
      },
      twitter: {
        card: "summary_large_image",
        title: titleAbsolute,
        description: PAGE_DESCRIPTION,
        images: [OG_IMAGE.url]
      }
    };
  } catch {
    return scamAlertsIndexFallbackMetadata();
  }
}

export default async function ScamAlertsPage(props: PageProps) {
  return ScamAlertsPageContent(props);
}
