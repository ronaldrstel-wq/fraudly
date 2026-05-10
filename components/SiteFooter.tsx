import dynamic from "next/dynamic";
import Link from "next/link";

const CookieSettingsLink = dynamic(
  () => import("@/components/CookieSettingsLink").then((m) => m.CookieSettingsLink),
  { loading: () => <span className="inline-block h-5 w-28 rounded bg-slate-100" aria-hidden /> }
);

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/80 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 text-sm text-slate-600 md:flex-row md:justify-between">
        <p className="text-center md:text-left">Fraudly helps you review suspicious links before you click.</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/features" className="fraudly-footer-link">
            Features
          </Link>
          <Link href="/how-it-works" className="fraudly-footer-link">
            How it works
          </Link>
          <Link href="/learn" className="fraudly-footer-link">
            Learn
          </Link>
          <Link href="/scam-checker" className="fraudly-footer-link">
            Scam checker
          </Link>
          <Link href="/latest-checks" className="fraudly-footer-link">
            Latest checks
          </Link>
          <Link href="/scam-alerts" className="fraudly-footer-link">
            Scam alerts
          </Link>
          <Link href="/privacy" className="fraudly-footer-link">
            Privacy
          </Link>
          <Link href="/terms" className="fraudly-footer-link">
            Terms
          </Link>
          <Link href="/disclaimer" className="fraudly-footer-link">
            Disclaimer
          </Link>
          <Link href="/cookies" className="fraudly-footer-link">
            Cookie Policy
          </Link>
          <CookieSettingsLink />
          <a href="mailto:support@fraudly.app" className="fraudly-footer-link">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
