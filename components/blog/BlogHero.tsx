import Image from "next/image";
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
    <header className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-subtle">
      <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-slate-950 via-blue-950 to-violet-950 sm:aspect-[2.1/1]">
        <Image
          src={article.hero.src}
          alt={article.hero.alt}
          width={article.hero.width}
          height={article.hero.height}
          className="h-full w-full object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 896px"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-slate-900/10"
          aria-hidden
        />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8">
          <IntelligenceCategoryBadge category={article.category} />
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-blue-200/90">
            {INTELLIGENCE_BRAND.articleEyebrow}
          </p>
        </div>
      </div>
      <div className="border-t border-slate-100 p-6 sm:p-8">
        <p className="text-sm font-medium text-blue-700">{INTELLIGENCE_BRAND.name}</p>
        <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          {article.title}
        </h1>
        <p className="mt-3 text-pretty text-base leading-relaxed text-slate-600 md:text-lg">{article.excerpt}</p>
        <p className="mt-4 text-xs text-slate-500">
          Published {published} · {readingMinutes} min read
        </p>
      </div>
    </header>
  );
}
