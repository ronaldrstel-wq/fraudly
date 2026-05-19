import { Suspense } from "react";
import { HomeBelowFold } from "@/components/HomeBelowFold";
import { HomePublicChecksDiscovery } from "@/components/seo/HomePublicChecksDiscovery";
import type { Locale } from "@/lib/i18n/locales";

function HomeBelowFoldFallback() {
  return (
    <div className="mx-auto mt-14 max-w-6xl space-y-6 sm:mt-16 md:mt-20" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-44 w-full animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}

type HomePageMainSectionsProps = {
  locale?: Locale;
};

/** Shared homepage body below the hero: latest checks discovery + intelligence + below-fold sections. */
export function HomePageMainSections({ locale = "en" }: HomePageMainSectionsProps) {
  return (
    <>
      <HomePublicChecksDiscovery locale={locale} />
      <Suspense fallback={<HomeBelowFoldFallback />}>
        <HomeBelowFold locale={locale} />
      </Suspense>
    </>
  );
}
