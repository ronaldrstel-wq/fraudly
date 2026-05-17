"use client";

import { useEffect } from "react";

/** Dev-only: log hydrated feed card shell classes (verdict CSS purge debugging). */
export function FeedCardDevLogger({
  headlineId,
  componentName,
  domain,
  verdict,
  shellClassName
}: {
  headlineId: string;
  componentName: string;
  domain: string;
  verdict: string;
  shellClassName: string;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const article = document.getElementById(headlineId)?.closest("article");
    // eslint-disable-next-line no-console -- intentional dev-only verdict-style probe
    console.log("[Fraudly][FeedCard]", {
      component: componentName,
      domain,
      verdict,
      shellClassName,
      hydratedArticleClassName: article?.className ?? "(article not found)"
    });
  }, [headlineId, componentName, domain, verdict, shellClassName]);

  return null;
}
