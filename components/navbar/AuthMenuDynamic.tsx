"use client";

import dynamic from "next/dynamic";
import { SignedOutAuthNavLinks } from "@/components/auth/SignedOutAuthNavLinks";
import type { Dictionary } from "@/lib/i18n/dictionary-types";
import type { Locale } from "@/lib/i18n/locales";

type AuthMenuDynamicProps = {
  locale?: Locale;
  auth?: Dictionary["auth"];
};

const AuthMenuLazy = dynamic(
  () => import("@/components/auth/AuthMenu").then((m) => ({ default: m.AuthMenu })),
  { ssr: false }
);

/** Lazy Clerk UI for navbars — keeps Clerk out of the main homepage RSC payload. */
export function AuthMenuDynamic({ locale, auth }: AuthMenuDynamicProps) {
  return <AuthMenuLazy locale={locale} auth={auth} />;
}

/** Shown while Clerk chunk loads (also used inside AuthMenu when !isLoaded). */
export function AuthMenuSignedOutFallback({ locale, auth }: AuthMenuDynamicProps) {
  return (
    <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2 md:gap-3">
      <SignedOutAuthNavLinks locale={locale} auth={auth} />
    </div>
  );
}
