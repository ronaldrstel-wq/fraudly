import { notFound } from "next/navigation";
import { AboutPageView } from "@/components/pages/AboutPageView";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPageMetadata } from "@/lib/i18n/page-metadata";
import { isLocalizedLocale, type LocalizedLocale } from "@/lib/i18n/locales";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale: raw } = await params;
  if (!isLocalizedLocale(raw)) return {};
  return localizedPageMetadata(raw, "/about", "about");
}

export default async function LocalizedAboutPage({ params }: PageProps) {
  const { locale: raw } = await params;
  if (!isLocalizedLocale(raw)) notFound();
  const locale = raw as LocalizedLocale;
  const dict = getDictionary(locale);
  return <AboutPageView locale={locale} dict={dict} />;
}
