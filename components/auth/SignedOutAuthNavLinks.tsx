"use client";

import Link from "next/link";
import { useContext } from "react";
import { LocaleContext } from "@/components/i18n/LocaleProvider";
import type { Dictionary } from "@/lib/i18n/dictionary-types";
import type { Locale } from "@/lib/i18n/locales";
import { marketingAuthButtonClass } from "@/lib/i18n/typography";

const FALLBACK_AUTH: Dictionary["auth"] = {
  login: "Log in",
  signUp: "Sign up"
};

type SignedOutAuthNavLinksProps = {
  locale?: Locale;
  auth?: Dictionary["auth"];
};

/** Stable CTAs when Clerk is still loading or when no LocaleProvider wraps the page. */
export function SignedOutAuthNavLinks({ locale: localeProp, auth: authProp }: SignedOutAuthNavLinksProps = {}) {
  const ctx = useContext(LocaleContext);
  const locale = localeProp ?? ctx?.locale ?? "en";
  const auth = authProp ?? ctx?.dict.auth ?? FALLBACK_AUTH;

  return (
    <>
      <Link href="/sign-in" className={marketingAuthButtonClass(locale, "secondary")}>
        {auth.login}
      </Link>
      <Link href="/sign-up" className={marketingAuthButtonClass(locale, "primary")}>
        {auth.signUp}
      </Link>
    </>
  );
}
