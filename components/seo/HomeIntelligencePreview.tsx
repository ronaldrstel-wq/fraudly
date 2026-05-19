import Link from "next/link";
import { IntelligenceCategoryBadge } from "@/components/blog/IntelligenceTrustBadges";
import { intelligenceArticlePath } from "@/lib/blog/constants";
import { getAllBlogArticles } from "@/lib/blog/registry";
import { estimateReadingTimeMinutes, articlePlainText } from "@/lib/blog/reading-time";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fillTemplate } from "@/lib/i18n/fill-template";
import type { Locale } from "@/lib/i18n/locales";

const PREVIEW_LIMIT = 4;

type HomeIntelligencePreviewProps = {
  locale?: Locale;
};

/** Homepage Intelligence / scam awareness guides — article cards stay English until translated. */
export function HomeIntelligencePreview({ locale = "en" }: HomeIntelligencePreviewProps) {
  const copy = getDictionary(locale).homeDiscovery;
  const articles = getAllBlogArticles().slice(0, PREVIEW_LIMIT);
  if (articles.length === 0) return null;

  return (
    <section
      id="home-intelligence"
      aria-labelledby="home-intelligence-heading"
      className="rounded-2xl border border-blue-200/85 bg-gradient-to-br from-blue-50 via-white to-violet-50/45 p-5 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.05)] ring-1 ring-blue-100/75 sm:p-6 md:p-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">{copy.intelligenceEyebrow}</p>
          <h2 id="home-intelligence-heading" className="mt-2 text-balance text-xl font-bold tracking-tight text-slate-950 md:text-2xl">
            {copy.intelligenceTitle}
          </h2>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-slate-600">{copy.intelligenceIntro}</p>
        </div>
        <Link
          href="/intelligence"
          className="shrink-0 text-sm font-semibold text-blue-600 underline decoration-blue-600/35 underline-offset-2 hover:text-blue-800"
        >
          {copy.viewAllIntelligence}
        </Link>
      </div>

      <ul className="mt-5 divide-y divide-slate-200/70 border-t border-slate-200/70">
        {articles.map((article) => {
          const minutes = estimateReadingTimeMinutes(articlePlainText(article));
          return (
            <li key={article.slug}>
              <Link
                href={intelligenceArticlePath(article.slug)}
                className="group flex flex-col gap-2 py-4 transition sm:flex-row sm:items-start sm:justify-between sm:gap-6"
              >
                <div className="min-w-0 flex-1">
                  <IntelligenceCategoryBadge category={article.category} />
                  <h3 className="mt-2 text-base font-bold leading-snug text-slate-950 group-hover:text-blue-700 md:text-lg">
                    {article.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">{article.excerpt}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-slate-500 sm:pt-8">
                  {fillTemplate(copy.minRead, { minutes })}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
