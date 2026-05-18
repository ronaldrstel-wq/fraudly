"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { marketingAuthButtonClass } from "@/lib/i18n/typography";

/** Stable CTAs when Clerk is still loading or unavailable — keeps navbar usable. */
export function SignedOutAuthNavLinks() {
  const { locale, dict } = useLocale();

  return (
    <>
      <Link href="/sign-in" className={marketingAuthButtonClass(locale, "secondary")}>
        {dict.auth.login}
      </Link>
      <Link href="/sign-up" className={marketingAuthButtonClass(locale, "primary")}>
        {dict.auth.signUp}
      </Link>
    </>
  );
}
