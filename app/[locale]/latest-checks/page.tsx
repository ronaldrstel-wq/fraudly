import { notFound } from "next/navigation";
import { revalidate } from "@/app/latest-checks/page";
import { renderLatestChecksPage } from "@/lib/pages/render-latest-checks-page";
import { localizedPageMetadata } from "@/lib/i18n/page-metadata";
import { isLocalizedLocale, type LocalizedLocale } from "@/lib/i18n/locales";

export { revalidate };

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

function clampPage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 500);
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { locale: raw } = await params;
  if (!isLocalizedLocale(raw)) return {};
  const page = clampPage((await searchParams).page);
  return localizedPageMetadata(raw, "/latest-checks", "latestChecks", {
    searchSuffix: page > 1 ? `page=${page}` : undefined
  });
}

export default async function LocalizedLatestChecksPage({ params, searchParams }: PageProps) {
  const { locale: raw } = await params;
  if (!isLocalizedLocale(raw)) notFound();
  return renderLatestChecksPage({ searchParams, locale: raw as LocalizedLocale });
}
