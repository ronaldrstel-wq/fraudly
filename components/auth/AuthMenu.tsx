"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SignedOutAuthNavLinks } from "@/components/auth/SignedOutAuthNavLinks";
import { EN_MESSAGES } from "@/lib/messages.en";

function logAuthStatusFailure(context: string, err: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[auth/status] ${context}:`, err);
  }
}

/**
 * Clerk-only nav island: profile menu + sign-out (via UserButton) when signed in;
 * lightweight links when signed out (no extra Clerk button components).
 * Clerk v7+ removed `SignedIn` / `SignedOut` from `@clerk/nextjs` — use `useAuth` instead.
 *
 * While Clerk is still loading, we still render Sign in / Create account so the navbar
 * never looks empty if Clerk keys or scripts are slow or misconfigured.
 */
export function AuthMenu() {
  const { isLoaded, userId } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/auth/status", { credentials: "same-origin" });
        if (!res.ok) {
          logAuthStatusFailure(`AuthMenu admin check non-OK (${res.status})`, await res.text().catch(() => ""));
          if (!cancelled) setIsAdmin(false);
          return;
        }
        const data = (await res.json().catch(() => null)) as { isAdmin?: boolean } | null;
        if (!cancelled) setIsAdmin(data?.isAdmin === true);
      } catch (e) {
        logAuthStatusFailure("AuthMenu admin fetch failed", e);
        if (!cancelled) setIsAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2 md:gap-3">
        <SignedOutAuthNavLinks />
      </div>
    );
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
        {isAdmin ? (
          <Link
            href="/admin"
            className="fraudly-motion rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 md:text-sm"
          >
            Admin
          </Link>
        ) : null}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-9 w-9 ring-1 ring-slate-200/80"
            }
          }}
        >
          {isAdmin ? (
            <UserButton.MenuItems>
              <UserButton.Link
                label="Admin tools"
                labelIcon={<span className="text-[10px] font-bold text-violet-700">A</span>}
                href="/admin"
              />
            </UserButton.MenuItems>
          ) : null}
        </UserButton>
      </>
    );
  }

  return (
    <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2 md:gap-3">
      <SignedOutAuthNavLinks />
    </div>
  );
}
