import { Suspense } from "react";
import { HomeBelowFold } from "@/components/HomeBelowFold";
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

function HomeBelowFoldFallback() {
  return (
    <div className="mx-auto mt-14 max-w-6xl space-y-6 sm:mt-16 md:mt-20" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-44 w-full animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
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
          <Suspense fallback={<HomeBelowFoldFallback />}>
            <HomeBelowFold locale={locale} />
          </Suspense>
        </HomeClient>
        <SiteFooter locale={locale} />
      </HomeAuthProvider>
    </>
  );
}
