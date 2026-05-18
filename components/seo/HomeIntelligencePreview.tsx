import Link from "next/link";
import { IntelligenceCategoryBadge } from "@/components/blog/IntelligenceTrustBadges";
import { INTELLIGENCE_BRAND, intelligenceArticlePath } from "@/lib/blog/constants";
import { getAllBlogArticles } from "@/lib/blog/registry";
import { estimateReadingTimeMinutes, articlePlainText } from "@/lib/blog/reading-time";

const PREVIEW_LIMIT = 4;

export function HomeIntelligencePreview() {
  const articles = getAllBlogArticles().slice(0, PREVIEW_LIMIT);
  if (articles.length === 0) return null;

  return (
    <section
      id="home-intelligence"
      aria-labelledby="home-intelligence-heading"
      className="rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/70 via-white to-violet-50/35 p-5 shadow-subtle sm:p-6 md:p-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
            {INTELLIGENCE_BRAND.indexEyebrow}
          </p>
          <h2 id="home-intelligence-heading" className="mt-2 text-balance text-xl font-bold text-slate-900 md:text-2xl">
            Scam awareness guides
          </h2>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-slate-600">
            Practical, editorial reports on fake webshops, phishing, and warning signs—written to help you shop and
            browse more safely.
          </p>
        </div>
        <Link
          href="/intelligence"
          className="shrink-0 text-sm font-semibold text-blue-600 underline decoration-blue-600/35 underline-offset-2 hover:text-blue-800"
        >
          View all intelligence →
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
                  <h3 className="mt-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-blue-700 md:text-lg">
                    {article.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">{article.excerpt}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-slate-500 sm:pt-8">{minutes} min read</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
