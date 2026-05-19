"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { SignedOutAuthNavLinks } from "@/components/auth/SignedOutAuthNavLinks";
import type { Dictionary } from "@/lib/i18n/dictionary-types";
import type { Locale } from "@/lib/i18n/locales";

const SignedInAuthNavClerk = dynamic(
  () => import("@/components/auth/SignedInAuthNavClerk").then((m) => ({ default: m.SignedInAuthNavClerk })),
  { ssr: false }
);

type AuthMenuProps = {
  locale?: Locale;
  auth?: Dictionary["auth"];
};

type AuthStatus = "loading" | "signed-out" | "signed-in";

/**
 * Navbar auth: uses `/api/auth/status` so we never call Clerk's `useAuth` while signed out.
 * Avoids client crashes when ClerkProvider is still loading (deferred root provider).
 */
export function AuthMenu({ locale, auth }: AuthMenuProps) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/status", { credentials: "same-origin" });
        if (!res.ok) {
          if (!cancelled) {
            setIsAdmin(false);
            setStatus("signed-out");
          }
          return;
        }
        const data = (await res.json().catch(() => null)) as { signedIn?: boolean; isAdmin?: boolean } | null;
        if (cancelled) return;
        if (data?.signedIn) {
          setIsAdmin(data.isAdmin === true);
          setStatus("signed-in");
        } else {
          setIsAdmin(false);
          setStatus("signed-out");
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setStatus("signed-out");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status !== "signed-in") {
    return (
      <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2 md:gap-3">
        <SignedOutAuthNavLinks locale={locale} auth={auth} />
      </div>
    );
  }

  return (
    <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2 md:gap-3">
      <SignedInAuthNavClerk isAdmin={isAdmin} />
    </div>
  );
}
