import { Suspense } from "react";
import Link from "next/link";
import { MarketingNavbarClient } from "@/components/navbar/MarketingNavbarClient";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";

function NavbarFallback({ locale = "en" }: { locale?: Locale }) {
  const dict = getDictionary(locale);
  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-3 px-4 py-4">
        <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2 md:gap-3">
          <Link href="/sign-in" className="fraudly-motion btn-secondary px-3 sm:px-4">
            {dict.auth.login}
          </Link>
          <Link href="/sign-up" className="fraudly-motion btn-primary px-3 sm:px-4">
            {dict.auth.signUp}
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function Navbar({ locale = "en" }: { locale?: Locale }) {
  return (
    <Suspense fallback={<NavbarFallback locale={locale} />}>
      <MarketingNavbarClient />
    </Suspense>
  );
}
