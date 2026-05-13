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
        if (!res.ok) {
          if (process.env.NODE_ENV === "development") {
            const body = await res.text().catch(() => "");
            console.warn("[auth/status] HomeAuthContext non-OK response:", res.status, res.statusText, body);
          }
          if (!cancelled) {
            setSignedIn(false);
            setIsAdmin(false);
          }
          return;
        }
        const data = (await res.json().catch(() => null)) as { signedIn?: boolean; isAdmin?: boolean } | null;
        if (!cancelled && data && typeof data.signedIn === "boolean") {
          setSignedIn(data.signedIn);
          setIsAdmin(data.isAdmin === true);
        } else if (!cancelled) {
          setSignedIn(false);
          setIsAdmin(false);
        }
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[auth/status] HomeAuthContext fetch failed:", e);
        }
        if (!cancelled) {
          setSignedIn(false);
          setIsAdmin(false);
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
