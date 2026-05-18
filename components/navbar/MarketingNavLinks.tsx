import Link from "next/link";
import { marketingNavLinkClass, marketingNavRowClass } from "@/lib/i18n/typography";
import type { Locale } from "@/lib/i18n/locales";

export type MarketingNavLink = {
  href: string;
  label: string;
};

type MarketingNavLinksProps = {
  locale: Locale;
  links: MarketingNavLink[];
};

export function MarketingNavLinks({ locale, links }: MarketingNavLinksProps) {
  const linkClass = marketingNavLinkClass(locale);

  return (
    <div className={marketingNavRowClass(locale)}>
      {links.map((link) =>
        link.href.startsWith("/") ? (
          <Link key={link.href} href={link.href} className={linkClass}>
            {link.label}
          </Link>
        ) : (
          <a key={link.href} href={link.href} className={linkClass}>
            {link.label}
          </a>
        )
      )}
    </div>
  );
}
