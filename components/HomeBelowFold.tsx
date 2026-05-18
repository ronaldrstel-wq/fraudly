import Link from "next/link";
import { HomeTrustActivitySection } from "@/components/home/HomeTrustActivitySection";
import { HomeWhatWeCheckSection } from "@/components/home/HomeWhatWeCheckSection";
import { getHomeTrustStats } from "@/lib/home/getHomeTrustStats";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/locales";
import { marketingPrimaryCtaClass } from "@/lib/i18n/typography";

type HomeBelowFoldProps = {
  locale?: Locale;
};

export async function HomeBelowFold({ locale = "en" }: HomeBelowFoldProps) {
  const dict = getDictionary(locale);
  const trustStats = await getHomeTrustStats();
  const below = dict.homeBelowFold;

  return (
    <div className="mx-auto mt-10 max-w-6xl space-y-14 [content-visibility:auto] [contain-intrinsic-size:1px_2800px] sm:mt-12 md:mt-14 md:space-y-16">
      <HomeTrustActivitySection stats={trustStats} locale={locale} />
      <HomeWhatWeCheckSection locale={locale} />

      <section id="trust-safety" aria-labelledby="trust-safety-heading" className="rounded-2xl border border-slate-100 bg-white p-6 shadow-subtle md:p-8">
        <h2 id="trust-safety-heading" className="text-balance text-xl font-bold leading-snug text-slate-900 md:text-2xl">
          {below.trustSafety.title}
        </h2>
        <p className="mt-3 max-w-3xl text-pretty text-sm leading-relaxed text-slate-600 md:text-base">{below.trustSafety.body}</p>
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 md:text-base">
          {below.trustSafety.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/features" className="btn-secondary px-4">
            {below.trustSafety.featuresCta}
          </Link>
          <Link href="/learn" className="btn-secondary px-4">
            {below.trustSafety.learnCta}
          </Link>
        </div>
      </section>

      <section id="how-it-works-home" aria-labelledby="how-heading" className="rounded-2xl border border-slate-100 bg-white p-6 shadow-subtle md:p-8">
        <h2 id="how-heading" className="text-balance text-xl font-bold leading-snug text-slate-900 md:text-2xl">
          {below.howItWorks.title}
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-700 md:text-base">
          {below.howItWorks.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-4 text-pretty text-sm text-slate-600">
          {below.howItWorks.footerPrefix}{" "}
          <Link href="/how-it-works" className="font-medium text-blue-600 hover:underline">
            {below.howItWorks.footerLinkLabel}
          </Link>
          .
        </p>
      </section>

      <section id="faq" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-center text-balance text-xl font-bold text-slate-900 md:text-2xl">
          {below.faq.title}
        </h2>
        <div className="mx-auto mt-8 max-w-3xl space-y-3">
          {below.faq.items.map((item) => (
            <details key={item.question} className="rounded-2xl border border-slate-200/85 bg-white p-4 shadow-subtle">
              <summary className="cursor-pointer list-none text-sm font-semibold leading-snug text-slate-900">{item.question}</summary>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="testimonials" aria-labelledby="testimonials-heading">
        <h2 id="testimonials-heading" className="text-center text-balance text-xl font-bold text-slate-900 md:text-2xl">
          {below.testimonials.title}
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {below.testimonials.items.map((item) => (
            <article key={item.name} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-subtle">
              <p className="text-pretty text-sm leading-relaxed text-slate-700">“{item.quote}”</p>
              <p className="mt-3 text-sm font-semibold text-slate-900">— {item.name}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100/85 bg-blue-50/55 p-6 text-center shadow-subtle md:p-8">
        <h2 className="text-balance text-lg font-bold text-slate-900 md:text-xl">{below.bottomCta.title}</h2>
        <p className="mx-auto mt-2 max-w-xl text-pretty text-sm text-slate-600">
          {below.bottomCta.bodyPrefix}{" "}
          <Link href="/check/example.com" className="font-medium text-blue-600 hover:underline">
            {below.bottomCta.bodyLinkLabel}
          </Link>{" "}
          {below.bottomCta.bodySuffix}
        </p>
        <Link href={`${localizedPath("/", locale)}#link-check`} className={`btn-primary mx-auto mt-5 ${marketingPrimaryCtaClass(locale)}`}>
          {below.bottomCta.button}
        </Link>
      </section>
    </div>
  );
}
