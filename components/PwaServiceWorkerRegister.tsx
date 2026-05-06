"use client";

import { useEffect } from "react";

/** Registers a minimal pass-through worker in production to improve Chromium installability. */
export function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/fraudly-sw.js", { scope: "/" }).catch(() => {});
  }, []);

  return null;
}
