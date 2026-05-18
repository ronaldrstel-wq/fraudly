import type { ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/locales";

function SectionCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8 ${className}`}>
      {children}
    </section>
  );
}

export function AboutPageView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.about;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar locale={locale} />

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:pt-14 md:pt-16">
        <header className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-blue-100 bg-white px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
            {t.badge}
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{t.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 md:text-lg">{t.intro}</p>
        </header>

        <div className="mt-10 space-y-8 sm:mt-12 md:mt-14 md:space-y-10">
          <SectionCard>
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {t.independentBadge}
            </div>
            <h2 className="mt-3 text-lg font-bold text-slate-900 md:text-xl">{t.independentTitle}</h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-700 md:text-base">{t.independentP1}</p>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-700 md:text-base">{t.independentP2}</p>
          </SectionCard>

          <SectionCard>
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">{t.whyTitle}</h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-700 md:text-base">{t.whyBody}</p>
          </SectionCard>

          <SectionCard>
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">{t.approachTitle}</h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-700 md:text-base">{t.approachBody}</p>
            <ul className="mt-6 space-y-4 text-sm leading-relaxed text-slate-700 md:text-base">
              {t.pillars.map((pillar) => (
                <li key={pillar.title} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                  <p className="font-semibold text-slate-900">{pillar.title}</p>
                  <p className="mt-2 text-slate-600">{pillar.body}</p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard className="border-amber-200/80 bg-amber-50/50">
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">{t.limitsTitle}</h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-700 md:text-base">{t.limitsBody}</p>
          </SectionCard>
        </div>

        <section className="mt-12 rounded-xl border border-slate-200 bg-white/90 px-6 py-8 text-center shadow-md shadow-slate-200/50 sm:mt-14 md:mt-16">
          <p className="text-base font-medium text-slate-900">{t.ctaPrompt}</p>
          <Link
            href={localizedPath("/", locale)}
            className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
          >
            {t.ctaButton}
          </Link>
        </section>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
