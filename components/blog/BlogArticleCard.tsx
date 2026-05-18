import Link from "next/link";
import { IntelligenceArticleVisual } from "@/components/blog/IntelligenceArticleVisual";
import { IntelligenceCategoryBadge } from "@/components/blog/IntelligenceTrustBadges";
import { intelligenceCard, intelligenceCardMedia } from "@/components/blog/intelligenceUi";
import { intelligenceArticlePath } from "@/lib/blog/constants";
import type { BlogArticleDefinition } from "@/lib/blog/types";
import { estimateReadingTimeMinutes, articlePlainText } from "@/lib/blog/reading-time";

type BlogArticleCardProps = {
  article: BlogArticleDefinition;
  featured?: boolean;
  priorityImage?: boolean;
};

export function BlogArticleCard({ article, featured = false, priorityImage = false }: BlogArticleCardProps) {
  const minutes = estimateReadingTimeMinutes(articlePlainText(article));
  const href = intelligenceArticlePath(article.slug);

  if (featured) {
    return (
      <article className={intelligenceCard}>
        <Link href={href} className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className={`${intelligenceCardMedia} md:min-h-[248px] md:rounded-none md:rounded-l-2xl md:border-b-0 md:border-r md:border-slate-100/90`}>
            <IntelligenceArticleVisual
              hero={article.hero}
              priority={priorityImage}
              className="aspect-square w-full max-w-[228px] shadow-[0_3px_12px_rgba(15,23,42,0.08)]"
              sizes="(max-width: 768px) 80vw, 280px"
            />
          </div>
          <div className="flex flex-col justify-center border-t border-slate-100/90 p-5 sm:p-7 md:border-l-0 md:border-t-0 md:p-8">
            <IntelligenceCategoryBadge category={article.category} />
            <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-950 group-hover:text-blue-700 md:text-[1.75rem] md:leading-tight">
              {article.title}
            </h2>
            <p className="mt-2.5 text-pretty text-base leading-relaxed text-slate-700">{article.excerpt}</p>
            <p className="mt-4 text-sm font-semibold text-slate-600">
              {minutes} min read · {article.targetKeyword}
            </p>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className={`${intelligenceCard} flex h-full flex-col`}>
      <Link href={href} className="flex h-full flex-col">
        <div className={intelligenceCardMedia}>
          <IntelligenceArticleVisual
            hero={article.hero}
            priority={priorityImage}
            className="aspect-[4/3] w-full max-h-[9.5rem] max-w-[210px]"
            sizes="(max-width: 768px) 70vw, 210px"
          />
        </div>
        <div className="flex flex-1 flex-col border-t border-slate-100/90 p-4 sm:p-5">
          <IntelligenceCategoryBadge category={article.category} />
          <h2 className="mt-2 text-lg font-bold leading-snug text-slate-950 group-hover:text-blue-700 md:text-xl">
            {article.title}
          </h2>
          <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-700">{article.excerpt}</p>
          <p className="mt-3 text-xs font-semibold text-slate-600">{minutes} min read →</p>
        </div>
      </Link>
    </article>
  );
}
