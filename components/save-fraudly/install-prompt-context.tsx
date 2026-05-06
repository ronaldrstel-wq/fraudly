"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type BeforeInstallPromptEventTyped = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type Ctx = {
  deferredPrompt: BeforeInstallPromptEventTyped | null;
  clearDeferredPrompt: () => void;
};

const InstallPromptContext = createContext<Ctx | null>(null);

export function InstallPromptProvider({ children }: { children: ReactNode }) {
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

  const clearDeferredPrompt = useCallback(() => setDeferred(null), []);

  const value = useMemo(
    () => ({
      deferredPrompt: deferred,
      clearDeferredPrompt
    }),
    [deferred, clearDeferredPrompt]
  );

  return <InstallPromptContext.Provider value={value}>{children}</InstallPromptContext.Provider>;
}

export function useInstallPromptContext(): Ctx {
  const ctx = useContext(InstallPromptContext);
  if (!ctx) {
    throw new Error("useInstallPromptContext must be used within InstallPromptProvider");
  }
  return ctx;
}
