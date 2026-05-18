import { notFound } from "next/navigation";
import { SupportPageView } from "@/components/pages/SupportPageView";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPageMetadata } from "@/lib/i18n/page-metadata";
import { isLocalizedLocale, type LocalizedLocale } from "@/lib/i18n/locales";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale: raw } = await params;
  if (!isLocalizedLocale(raw)) return {};
  return localizedPageMetadata(raw, "/support", "support");
}

export default async function LocalizedSupportPage({ params }: PageProps) {
  const { locale: raw } = await params;
  if (!isLocalizedLocale(raw)) notFound();
  const locale = raw as LocalizedLocale;
  return <SupportPageView locale={locale} dict={getDictionary(locale)} />;
}
