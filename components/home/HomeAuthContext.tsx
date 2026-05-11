"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type HomeAuthState = {
  /** False until the first `/api/auth/status` response. */
  authReady: boolean;
  signedIn: boolean;
  isAdmin: boolean;
};

const HomeAuthContext = createContext<HomeAuthState | null>(null);

export function HomeAuthProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/status", { credentials: "same-origin" });
        const data = (await res.json().catch(() => null)) as { signedIn?: boolean; isAdmin?: boolean } | null;
        if (!cancelled && data && typeof data.signedIn === "boolean") {
          setSignedIn(data.signedIn);
          setIsAdmin(data.isAdmin === true);
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ authReady, signedIn, isAdmin }), [authReady, signedIn, isAdmin]);

  return <HomeAuthContext.Provider value={value}>{children}</HomeAuthContext.Provider>;
}

export function useHomeAuth(): HomeAuthState {
  const ctx = useContext(HomeAuthContext);
  if (!ctx) {
    throw new Error("useHomeAuth must be used within HomeAuthProvider");
  }
  return ctx;
}
