import { notFound } from "next/navigation";
import { ScamHelpPageView } from "@/components/pages/ScamHelpPageView";
import { localizedPageMetadata } from "@/lib/i18n/page-metadata";
import { isLocalizedLocale, type LocalizedLocale } from "@/lib/i18n/locales";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale: raw } = await params;
  if (!isLocalizedLocale(raw)) return {};
  return localizedPageMetadata(raw, "/scam-help", "scamHelp");
}

export default async function LocalizedScamHelpPage({ params }: PageProps) {
  const { locale: raw } = await params;
  if (!isLocalizedLocale(raw)) notFound();
  const locale = raw as LocalizedLocale;
  const dict = (await import("@/lib/i18n/get-dictionary")).getDictionary(locale);
  return <ScamHelpPageView locale={locale} dict={dict} />;
}
