import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/80 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 text-sm text-slate-600 md:flex-row md:justify-between">
        <p className="text-center md:text-left">Trusted by thousands of users</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/privacy" className="font-medium text-slate-700 transition hover:text-slate-900">
            Privacy
          </Link>
          <Link href="/terms" className="font-medium text-slate-700 transition hover:text-slate-900">
            Terms
          </Link>
          <a href="mailto:support@fraudly.app" className="font-medium text-slate-700 transition hover:text-slate-900">
            Contact
          </a>
        </nav>
        <p className="text-amber-500" aria-hidden>
          ★★★★★
        </p>
      </div>
    </footer>
  );
}
