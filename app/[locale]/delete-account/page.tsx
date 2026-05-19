import { notFound } from "next/navigation";
import { DeleteAccountPageView } from "@/components/pages/DeleteAccountPageView";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/paths";
import { isLocalizedLocale, type LocalizedLocale } from "@/lib/i18n/locales";
import { buildPageMetadata } from "@/lib/seo-metadata";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale: raw } = await params;
  if (!isLocalizedLocale(raw)) return {};
  const dict = getDictionary(raw);
  const path = localizedPath("/delete-account", raw);
  return buildPageMetadata({
    path,
    titleSegment: "Delete Account",
    titleAbsolute: dict.meta.deleteAccount.title,
    description: dict.meta.deleteAccount.description
  });
}

export default async function LocalizedDeleteAccountPage({ params }: PageProps) {
  const { locale: raw } = await params;
  if (!isLocalizedLocale(raw)) notFound();
  const locale = raw as LocalizedLocale;
  const dict = getDictionary(locale);
  return <DeleteAccountPageView locale={locale} dict={dict} />;
}
