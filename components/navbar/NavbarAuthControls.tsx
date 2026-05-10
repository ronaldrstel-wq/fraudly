"use client";

import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { EN_MESSAGES } from "@/lib/messages.en";

export function NavbarAuthControls() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <span className="h-9 w-20 animate-pulse rounded-xl bg-slate-100" aria-hidden />;
  }

  if (isSignedIn) {
    return (
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
        <UserButton />
      </>
    );
  }

  return (
    <>
      <SignInButton mode="modal">
        <button type="button" className="btn-secondary px-3 sm:px-4">
          {EN_MESSAGES.auth.loginCta}
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button type="button" className="btn-primary px-3 sm:px-4">
          {EN_MESSAGES.auth.signUpCta}
        </button>
      </SignUpButton>
    </>
  );
}
