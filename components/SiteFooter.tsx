import Link from "next/link";
import { CookieSettingsLink } from "@/components/CookieSettingsLink";
import { SaveFraudlyTrigger } from "@/components/save-fraudly/SaveFraudlyTrigger";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/80 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 text-sm text-slate-600 md:flex-row md:justify-between">
        <p className="text-center md:text-left">Fraudly helps you review suspicious links before you click.</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/features" className="font-medium text-slate-700 transition hover:text-slate-900">
            Features
          </Link>
          <Link href="/how-it-works" className="font-medium text-slate-700 transition hover:text-slate-900">
            How it works
          </Link>
          <Link href="/learn" className="font-medium text-slate-700 transition hover:text-slate-900">
            Learn
          </Link>
          <Link href="/scam-checker" className="font-medium text-slate-700 transition hover:text-slate-900">
            Scam checker
          </Link>
          <Link href="/latest-checks" className="font-medium text-slate-700 transition hover:text-slate-900">
            Latest checks
          </Link>
          <SaveFraudlyTrigger variant="footer" instanceSuffix="-footer" />
          <Link href="/privacy" className="font-medium text-slate-700 transition hover:text-slate-900">
            Privacy
          </Link>
          <Link href="/terms" className="font-medium text-slate-700 transition hover:text-slate-900">
            Terms
          </Link>
          <Link href="/disclaimer" className="font-medium text-slate-700 transition hover:text-slate-900">
            Disclaimer
          </Link>
          <Link href="/cookies" className="font-medium text-slate-700 transition hover:text-slate-900">
            Cookie Policy
          </Link>
          <CookieSettingsLink />
          <a href="mailto:support@fraudly.app" className="font-medium text-slate-700 transition hover:text-slate-900">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
