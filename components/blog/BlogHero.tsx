import { IntelligenceArticleVisual } from "@/components/blog/IntelligenceArticleVisual";
import { IntelligenceCategoryBadge } from "@/components/blog/IntelligenceTrustBadges";
import { INTELLIGENCE_BRAND } from "@/lib/blog/constants";
import type { BlogArticleDefinition } from "@/lib/blog/types";

type BlogHeroProps = {
  article: BlogArticleDefinition;
  readingMinutes: number;
};

export function BlogHero({ article, readingMinutes }: BlogHeroProps) {
  const published = new Date(article.publishedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <header className="fraudly-card overflow-hidden border-slate-200/90 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.05)] ring-1 ring-slate-100/90">
      <div className="border-b border-slate-200/80 bg-gradient-to-br from-blue-100/40 via-white to-violet-50/55 px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
          <IntelligenceArticleVisual
            hero={article.hero}
            priority
            className="mx-auto aspect-[4/3] w-full max-w-[200px] sm:mx-0 sm:max-w-[180px]"
            sizes="200px"
          />
          <div className="min-w-0 text-center sm:text-left">
            <IntelligenceCategoryBadge category={article.category} />
            <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-blue-700">
              {INTELLIGENCE_BRAND.articleEyebrow}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-600">{INTELLIGENCE_BRAND.name}</p>
          </div>
        </div>
      </div>
      <div className="p-6 sm:p-8">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">{article.title}</h1>
        <p className="mt-3 text-pretty text-base leading-relaxed text-slate-700 md:text-lg">{article.excerpt}</p>
        <p className="mt-4 text-xs text-slate-500">
          Published {published} · {readingMinutes} min read
        </p>
      </div>
    </header>
  );
}
