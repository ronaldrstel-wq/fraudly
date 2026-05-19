import { HomePageMainSections } from "@/components/home/HomePageMainSections";
import { HomeAuthProvider } from "@/components/home/HomeAuthContext";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { HomeFaqJsonLd } from "@/components/HomeFaqJsonLd";
import { HomeClient } from "@/components/HomeClient";
import { SiteFooter } from "@/components/SiteFooter";
import { localizedPageMetadata } from "@/lib/i18n/page-metadata";
import { isLocalizedLocale, type LocalizedLocale } from "@/lib/i18n/locales";
import { notFound } from "next/navigation";

export const revalidate = 3600;

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale: raw } = await params;
  if (!isLocalizedLocale(raw)) return {};
  return localizedPageMetadata(raw, "/", "home");
}

export default async function LocalizedHomePage({ params }: PageProps) {
  const { locale: raw } = await params;
  if (!isLocalizedLocale(raw)) notFound();
  const locale = raw as LocalizedLocale;

  return (
    <>
      <HomeFaqJsonLd />
      <HomeAuthProvider>
        <HomeNavbar />
        <HomeClient showFooter={false} footerLocale={locale}>
          <HomePageMainSections locale={locale} />
        </HomeClient>
        <SiteFooter locale={locale} />
      </HomeAuthProvider>
    </>
  );
}
