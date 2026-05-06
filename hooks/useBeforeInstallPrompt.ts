"use client";

import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEventTyped = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

/** Captures Chromium `beforeinstallprompt` so we can call `prompt()` after a user gesture. */
export function useBeforeInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEventTyped | null>(null);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEventTyped);
    };
    const onInstalled = () => setDeferred(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const clearDeferred = useCallback(() => setDeferred(null), []);

  return { deferredPrompt: deferred, clearDeferredPrompt: clearDeferred };
}
