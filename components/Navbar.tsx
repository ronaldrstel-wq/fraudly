import { Suspense } from "react";
import { MarketingNavbarClient } from "@/components/navbar/MarketingNavbarClient";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getMainNavLinks } from "@/lib/i18n/nav";
import type { Locale } from "@/lib/i18n/locales";

function NavbarFallback() {
  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur" aria-hidden>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-3 px-4 py-4">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </nav>
  );
}

async function NavbarInner({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const links = getMainNavLinks(locale, dict);
  return <MarketingNavbarClient locale={locale} dict={dict} links={links} />;
}

export function Navbar({ locale = "en" }: { locale?: Locale }) {
  return (
    <Suspense fallback={<NavbarFallback />}>
      <NavbarInner locale={locale} />
    </Suspense>
  );
}
