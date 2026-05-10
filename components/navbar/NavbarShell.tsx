import "server-only";

import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { EN_MESSAGES } from "@/lib/messages.en";

const navLinks = [
  { label: EN_MESSAGES.latestChecks.navLabel, href: "/latest-checks" },
  { label: "Scam alerts", href: "/scam-alerts" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Features", href: "/features" },
  { label: "Learn", href: "/learn" },
  { label: "About", href: "/about" }
] as const;

export async function NavbarShell() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="mr-2 inline-flex shrink-0 items-center opacity-90 transition-opacity hover:opacity-100">
          <Image
            src="/logo.png"
            alt="Fraudly — scam and fraud checker"
            width={120}
            height={40}
            sizes="120px"
            className="h-8 w-auto object-contain md:h-9"
          />
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-7 text-sm font-medium text-slate-600 md:flex">
          {navLinks.map((link) =>
            link.href.startsWith("/") ? (
              <Link key={link.label} href={link.href} className="fraudly-nav-link">
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className="fraudly-nav-link">
                {link.label}
              </a>
            )
          )}
        </div>

        <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2 md:gap-3">
          {isSignedIn ? (
            <>
              <Link
                href="/recent-searches"
                className="fraudly-motion rounded-xl px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
              >
                {EN_MESSAGES.recentSearches.navLabelShort}
              </Link>
              <Link
                href="/recent-searches"
                className="fraudly-motion hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:inline"
              >
                {EN_MESSAGES.recentSearches.navLabel}
              </Link>
              <form action="/api/auth/sign-out" method="post" className="inline">
                <button type="submit" className="fraudly-motion btn-secondary px-3 sm:px-4">
                  {EN_MESSAGES.auth.signOutCta}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="fraudly-motion btn-secondary px-3 sm:px-4">
                {EN_MESSAGES.auth.loginCta}
              </Link>
              <Link href="/sign-up" className="fraudly-motion btn-primary px-3 sm:px-4">
                {EN_MESSAGES.auth.signUpCta}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
