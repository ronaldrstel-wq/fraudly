"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { EN_MESSAGES } from "@/lib/messages.en";

/** Clerk UserButton island — only mount when `/api/auth/status` reports a signed-in user. */
export function SignedInAuthNavClerk({ isAdmin }: { isAdmin: boolean }) {
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
