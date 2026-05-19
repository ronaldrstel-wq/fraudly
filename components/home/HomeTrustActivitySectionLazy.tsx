"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n/dictionary-types";
import type { HomeTrustStats } from "@/lib/home/getHomeTrustStats";

function HomeTrustActivitySkeleton() {
  return (
    <section className="mx-auto mt-8" aria-hidden>
      <div className="mx-auto h-8 max-w-md animate-pulse rounded-lg bg-slate-100" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </section>
  );
}

const HomeTrustActivitySection = dynamic(
  () => import("@/components/home/HomeTrustActivitySection").then((m) => ({ default: m.HomeTrustActivitySection })),
  { ssr: false, loading: () => <HomeTrustActivitySkeleton /> }
);

type Props = {
  stats: HomeTrustStats;
  copy: Dictionary["homeSections"]["trustActivity"];
};

/** Below-fold trust stats; loaded after hydration to keep initial JS small. */
export function HomeTrustActivitySectionLazy({ stats, copy }: Props) {
  return <HomeTrustActivitySection stats={stats} copy={copy} />;
}
