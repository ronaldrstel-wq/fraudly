"use client";

import dynamic from "next/dynamic";

function AuthMenuSkeleton() {
  return (
    <div className="flex min-h-9 items-center gap-2" aria-hidden>
      <span className="h-9 w-[88px] animate-pulse rounded-xl bg-slate-100" />
      <span className="h-9 w-[98px] animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}

const AuthMenuLazy = dynamic(() => import("@/components/auth/AuthMenu").then((m) => ({ default: m.AuthMenu })), {
  loading: () => <AuthMenuSkeleton />,
  ssr: false
});

/** Lazy Clerk UI for navbars — keeps Clerk out of the main homepage RSC payload. */
export function AuthMenuDynamic() {
  return <AuthMenuLazy />;
}
