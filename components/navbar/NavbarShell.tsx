import "server-only";

import Image from "next/image";
import Link from "next/link";
import { AuthMenuDynamic } from "@/components/navbar/AuthMenuDynamic";
import { MarketingNavLinks } from "@/components/navbar/MarketingNavLinks";
import { MarketingNavScanCta } from "@/components/navbar/MarketingNavScanCta";
import { getMainNavLinks } from "@/lib/i18n/nav";
import { homeHref } from "@/lib/i18n/paths";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";

type NavbarShellProps = {
  locale?: Locale;
};

export async function NavbarShell({ locale = "en" }: NavbarShellProps) {
  const dict = getDictionary(locale);
  const links = getMainNavLinks(locale, dict);

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <Link href={homeHref(locale)} className="mr-2 inline-flex shrink-0 items-center opacity-90 transition-opacity hover:opacity-100">
          <Image
            src="/logo.png"
            alt="Fraudly — scam and fraud checker"
            width={120}
            height={40}
            sizes="120px"
            className="h-8 w-auto object-contain md:h-9"
          />
        </Link>

        <MarketingNavLinks locale={locale} links={links} />

        <div className="flex min-h-9 shrink-0 items-center justify-end gap-2 sm:gap-2.5 md:gap-3">
          <MarketingNavScanCta locale={locale} />
          <AuthMenuDynamic />
        </div>
      </div>
    </nav>
  );
}
