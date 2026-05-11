"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { EN_MESSAGES } from "@/lib/messages.en";

function AuthMenuSkeleton() {
  return (
    <div className="flex min-h-9 items-center gap-2" aria-hidden>
      <span className="h-9 w-[88px] animate-pulse rounded-xl bg-slate-100" />
      <span className="h-9 w-[98px] animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}

/**
 * Clerk-only nav island: profile menu + sign-out (via UserButton) when signed in;
 * lightweight links when signed out (no extra Clerk button components).
 * Clerk v7+ removed `SignedIn` / `SignedOut` from `@clerk/nextjs` — use `useAuth` instead.
 */
export function AuthMenu() {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <AuthMenuSkeleton />;
  }

  if (userId) {
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
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-9 w-9 ring-1 ring-slate-200/80"
            }
          }}
        />
      </>
    );
  }

  return (
    <>
      <Link href="/sign-in" className="fraudly-motion btn-secondary px-3 sm:px-4">
        {EN_MESSAGES.auth.loginCta}
      </Link>
      <Link href="/sign-up" className="fraudly-motion btn-primary px-3 sm:px-4">
        {EN_MESSAGES.auth.signUpCta}
      </Link>
    </>
  );
}
