"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const FeatureCards = dynamic(() => import("@/components/FeatureCards").then((m) => ({ default: m.FeatureCards })), {
  ssr: false,
  loading: () => <div className="h-44 w-full animate-pulse rounded-2xl bg-slate-100 md:h-36" aria-hidden />
});

function FeatureCardsSkeleton() {
  return <div className="h-44 w-full animate-pulse rounded-2xl bg-slate-100 md:h-36" aria-hidden />;
}

/** Defers marketing feature cards until after first paint / idle time. */
export function DeferredFeatureCards() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const show = () => {
      if (!cancelled) setReady(true);
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(show, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const t = setTimeout(show, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  if (!ready) return <FeatureCardsSkeleton />;
  return <FeatureCards />;
}
