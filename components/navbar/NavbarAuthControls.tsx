"use client";

import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { EN_MESSAGES } from "@/lib/messages.en";

export function NavbarAuthControls() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <span className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" aria-hidden />;
  }

  if (isSignedIn) {
    return (
      <>
        <Link
          href="/recent-searches"
          className="rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 md:hidden"
        >
          {EN_MESSAGES.recentSearches.navLabelShort}
        </Link>
        <Link
          href="/recent-searches"
          className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 md:inline"
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
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 sm:px-4"
        >
          {EN_MESSAGES.auth.loginCta}
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button
          type="button"
          className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:brightness-110 sm:px-4"
        >
          {EN_MESSAGES.auth.signUpCta}
        </button>
      </SignUpButton>
    </>
  );
}
