import dynamic from "next/dynamic";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/locales";

const CookieSettingsLink = dynamic(
  () => import("@/components/CookieSettingsLink").then((m) => m.CookieSettingsLink),
  { loading: () => <span className="inline-block h-5 w-28 rounded bg-slate-100" aria-hidden /> }
);

type SiteFooterProps = {
  locale?: Locale;
};

export function SiteFooter({ locale = "en" }: SiteFooterProps) {
  const dict = getDictionary(locale);

  return (
    <footer className="border-t border-slate-200/80 bg-white/80 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 text-sm text-slate-600 md:flex-row md:justify-between">
        <p className="text-center md:text-left">{dict.footer.tagline}</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/features" className="fraudly-footer-link">
            {dict.footer.features}
          </Link>
          <Link href={localizedPath("/support", locale)} className="fraudly-footer-link">
            {dict.footer.support}
          </Link>
          <Link href="/how-it-works" className="fraudly-footer-link">
            {dict.footer.howItWorks}
          </Link>
          <Link href="/learn" className="fraudly-footer-link">
            {dict.footer.learn}
          </Link>
          <Link href="/scam-checker" className="fraudly-footer-link">
            {dict.footer.scamChecker}
          </Link>
          <Link href={localizedPath("/latest-checks", locale)} className="fraudly-footer-link">
            {dict.footer.latestChecks}
          </Link>
          <Link href="/pulse" className="fraudly-footer-link">
            {dict.footer.pulse}
          </Link>
          <Link href={localizedPath("/scam-alerts", locale)} className="fraudly-footer-link">
            {dict.footer.scamAlerts}
          </Link>
          <Link href={localizedPath("/scam-help", locale)} className="fraudly-footer-link">
            {dict.footer.scamHelp}
          </Link>
          <Link href="/privacy" className="fraudly-footer-link">
            {dict.footer.privacy}
          </Link>
          <Link href="/terms" className="fraudly-footer-link">
            {dict.footer.terms}
          </Link>
          <Link href="/disclaimer" className="fraudly-footer-link">
            {dict.footer.disclaimer}
          </Link>
          <Link href="/cookies" className="fraudly-footer-link">
            {dict.footer.cookies}
          </Link>
          <CookieSettingsLink />
          <a href="mailto:support@fraudly.app" className="fraudly-footer-link">
            {dict.footer.contact}
          </a>
        </nav>
      </div>
    </footer>
  );
}
