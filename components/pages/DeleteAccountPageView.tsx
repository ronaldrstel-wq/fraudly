import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { footerHref } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/locales";
import { marketingBadgeClass, marketingPageH1Class } from "@/lib/i18n/typography";

const SUPPORT_EMAIL = "support@fraudly.app";
const DELETE_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Delete Account")}`;

export function DeleteAccountPageView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.deleteAccountPage;
  const privacyHref = footerHref("/privacy", locale);
  const termsHref = footerHref("/terms", locale);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar locale={locale} />

      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:pt-14 md:pt-16">
        <header className="text-center">
          <div className={`mx-auto mb-4 ${marketingBadgeClass(locale)}`}>{t.badge}</div>
          <h1 className={marketingPageH1Class(locale)}>{t.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-slate-600 md:text-base">{t.intro}</p>
        </header>

        <article className="mt-10 space-y-8 rounded-xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60 sm:mt-12 sm:p-8 md:mt-14">
          <section className="space-y-3 text-sm leading-relaxed text-slate-700 md:text-base">
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">{t.howTitle}</h2>
            <p>
              {t.howP1BeforeEmail}{" "}
              <a
                href={DELETE_MAILTO}
                className="font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              {t.howP1AfterEmail} <strong className="font-semibold text-slate-900">{t.howSubject}</strong>. {t.howP1AfterSubject}
            </p>
            <p>
              {t.howP2BeforeDays} <strong className="font-semibold text-slate-900">{t.howP2Days}</strong>. {t.howP2AfterDays}
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-slate-700 md:text-base">
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">{t.afterTitle}</h2>
            <p>{t.afterP1}</p>
            <p>{t.afterP2}</p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-slate-700 md:text-base">
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">{t.storesTitle}</h2>
            <p>
              {t.storesP1Before} <strong className="font-semibold text-slate-900">{t.storesP1Bold}</strong> {t.storesP1After}
            </p>
          </section>

          <div className="flex flex-col items-stretch gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={DELETE_MAILTO}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-md hover:brightness-110"
            >
              {t.emailCta}
            </a>
            <p className="text-center text-xs text-slate-500 sm:text-right">
              <Link href={privacyHref} className="font-medium text-blue-600 underline-offset-2 hover:underline">
                {t.privacyLink}
              </Link>
              {" · "}
              <Link href={termsHref} className="font-medium text-blue-600 underline-offset-2 hover:underline">
                {t.termsLink}
              </Link>
            </p>
          </div>
        </article>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
