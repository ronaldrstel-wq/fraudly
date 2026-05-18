import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { SupportFaqJsonLd } from "@/components/support/SupportFaqJsonLd";
import { SUPPORT_FAQ_ITEMS } from "@/lib/support/supportFaq";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/locales";

const SUPPORT_EMAIL = "support@fraudly.app";

type SupportPageViewProps = {
  locale: Locale;
  dict: Dictionary;
};

export function SupportPageView({ locale, dict }: SupportPageViewProps) {
  const t = dict.support;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <SupportFaqJsonLd />
      <Navbar locale={locale} />

      <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:pt-14 md:pt-16">
        <header className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-blue-100 bg-white px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
            {t.badge}
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{t.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 md:text-lg">{t.intro}</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:brightness-110"
          >
            {t.emailCta}
          </a>
        </header>

        <section className="mt-12" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-bold text-slate-900 md:text-2xl">
            {t.faqTitle}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {locale !== "en" ? "FAQ answers are shown in English for now." : null}
          </p>
          <dl className="mt-6 space-y-4">
            {SUPPORT_FAQ_ITEMS.map((faq) => (
              <div key={faq.question} className="rounded-xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/50 sm:p-6">
                <dt className="text-base font-semibold text-slate-900">{faq.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12 rounded-xl border border-slate-200 bg-white/90 px-6 py-8 text-center shadow-md shadow-slate-200/50">
          <h2 className="text-lg font-bold text-slate-900">{t.stillNeedHelp}</h2>
          <p className="mt-2 text-sm text-slate-600">{t.stillNeedHelpBody}</p>
          <Link
            href={localizedPath("/", locale)}
            className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            {t.ctaCheck}
          </Link>
        </section>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
