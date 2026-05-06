"use client";

import { useEffect } from "react";

/** Registers a minimal pass-through worker in production to improve Chromium installability. */
export function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;
    const register = () => {
      if (cancelled) return;
      navigator.serviceWorker.register("/fraudly-sw.js", { scope: "/" }).catch(() => {});
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => register(), { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const timeoutId = setTimeout(register, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
