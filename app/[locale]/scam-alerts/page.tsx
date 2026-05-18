import { notFound } from "next/navigation";
import { ScamAlertsPageContent } from "@/components/scam-alerts/ScamAlertsPageContent";
import {
  revalidate,
  scamAlertsSearchSuffix
} from "@/app/scam-alerts/page";
import { parseScamAlertsPageParam } from "@/lib/scam-alerts/presentation";
import { localizedPageMetadata } from "@/lib/i18n/page-metadata";
import { isLocalizedLocale, type LocalizedLocale } from "@/lib/i18n/locales";

export { revalidate };

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; filter?: string; page?: string; time?: string }>;
};

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { locale: raw } = await params;
  if (!isLocalizedLocale(raw)) return {};
  const sp = await searchParams;
  const page = parseScamAlertsPageParam(sp.page);
  const searchSuffix = scamAlertsSearchSuffix({
    page,
    time: typeof sp.time === "string" ? sp.time : undefined,
    filter: typeof sp.filter === "string" ? sp.filter : undefined,
    type: typeof sp.type === "string" ? sp.type : undefined
  });
  return localizedPageMetadata(raw, "/scam-alerts", "scamAlerts", {
    titleAbsolute: true,
    searchSuffix
  });
}

export default async function LocalizedScamAlertsPage({ params, searchParams }: PageProps) {
  const { locale: raw } = await params;
  if (!isLocalizedLocale(raw)) notFound();
  return ScamAlertsPageContent({ searchParams, locale: raw as LocalizedLocale });
}
