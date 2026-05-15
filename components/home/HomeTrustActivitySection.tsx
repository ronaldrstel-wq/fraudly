"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { formatHomeStatCount } from "@/lib/home/formatHomeStatCount";
import type { HomeTrustStats } from "@/lib/home/getHomeTrustStats";
import { EN_MESSAGES } from "@/lib/messages.en";
import { IconAlert, IconAnalytics, IconGlobe, IconShield } from "@/components/home/HomeSectionIcons";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ReactNode;
  numericTarget?: number;
  animateValue?: boolean;
};

function useInViewOnce(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, threshold]);

  return { ref, visible };
}

function AnimatedCount({ target, active }: { target: number; active: boolean }) {
  const [display, setDisplay] = useState(active ? 0 : target);

  useEffect(() => {
    if (!active || target <= 0) {
      setDisplay(target);
      return;
    }
    const duration = 720;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);

  return <>{formatHomeStatCount(display)}</>;
}

function StatCard({ label, value, hint, icon, numericTarget, animateValue }: StatCardProps) {
  const showAnimated = typeof numericTarget === "number";

  return (
    <article className="fraudly-motion group flex h-full flex-col rounded-2xl border border-slate-200/75 bg-white/95 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:border-slate-300/80 hover:shadow-[0_12px_36px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/80 text-blue-700 ring-1 ring-slate-200/60">
        {icon}
      </div>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">
        {showAnimated ? (
          <AnimatedCount target={numericTarget} active={Boolean(animateValue)} />
        ) : (
          value
        )}
      </p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
    </article>
  );
}

export function HomeTrustActivitySection({ stats }: { stats: HomeTrustStats }) {
  const { ref, visible } = useInViewOnce();
  const copy = EN_MESSAGES.home.trustActivity;
  const hasChecks = stats.websiteChecks > 0;
  const hasSignals = stats.threatSignalsAnalyzed > 0;

  return (
    <section
      ref={ref}
      id="trust-activity"
      aria-labelledby="trust-activity-heading"
      className={`scroll-mt-16 transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <div className="text-center">
        <h2 id="trust-activity-heading" className="text-balance text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
          {copy.title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-slate-600 md:text-base">{copy.subtitle}</p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label={copy.stats.websiteChecksLabel}
          hint={hasChecks ? copy.stats.websiteChecksHint : copy.stats.buildingHint}
          icon={<IconShield className="h-5 w-5" />}
          numericTarget={hasChecks ? stats.websiteChecks : undefined}
          animateValue={visible && hasChecks}
          value={copy.stats.websiteChecksFallback}
        />
        <StatCard
          label={copy.stats.threatSignalsLabel}
          hint={hasSignals ? copy.stats.threatSignalsHint : copy.stats.buildingHint}
          icon={<IconGlobe className="h-5 w-5" />}
          numericTarget={hasSignals ? stats.threatSignalsAnalyzed : undefined}
          animateValue={visible && hasSignals}
          value={copy.stats.threatSignalsFallback}
        />
        <StatCard
          label={copy.stats.aiLabel}
          value={copy.stats.aiValue}
          hint={copy.stats.aiHint}
          icon={<IconAlert className="h-5 w-5" />}
        />
        <StatCard
          label={copy.stats.growingLabel}
          value={stats.checksLast24Hours > 0 ? copy.stats.growingValueActive : copy.stats.growingValue}
          hint={
            stats.checksLast24Hours > 0
              ? copy.stats.growingHintActive.replace("{count}", String(stats.checksLast24Hours))
              : copy.stats.growingHint
          }
          icon={<IconAnalytics className="h-5 w-5" />}
        />
      </div>

      {stats.fromDatabase && hasChecks ? (
        <p className="mx-auto mt-5 max-w-xl text-center text-[11px] leading-relaxed text-slate-500">
          {copy.footnote.replace("{count}", formatHomeStatCount(stats.checksLast30Days))}
        </p>
      ) : null}
    </section>
  );
}
