import Image from "next/image";
import Link from "next/link";
import { IntelligenceCategoryBadge } from "@/components/blog/IntelligenceTrustBadges";
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
      <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-subtle transition hover:border-slate-300 hover:shadow-lg">
        <Link href={href} className="grid md:grid-cols-2">
          <div className="relative aspect-[16/10] overflow-hidden bg-slate-900 md:aspect-auto md:min-h-[280px]">
            <Image
              src={article.hero.src}
              alt={article.hero.alt}
              width={article.hero.width}
              height={article.hero.height}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
              priority={priorityImage}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent md:bg-gradient-to-r md:from-transparent md:to-slate-950/20"
              aria-hidden
            />
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10">
            <IntelligenceCategoryBadge category={article.category} />
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 group-hover:text-blue-700 md:text-3xl">
              {article.title}
            </h2>
            <p className="mt-3 text-pretty text-base leading-relaxed text-slate-600">{article.excerpt}</p>
            <p className="mt-5 text-sm font-medium text-slate-500">
              {minutes} min read · {article.targetKeyword}
            </p>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-subtle transition hover:border-slate-300 hover:shadow-md">
      <Link href={href} className="flex h-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
          <Image
            src={article.hero.src}
            alt={article.hero.alt}
            width={article.hero.width}
            height={article.hero.height}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading={priorityImage ? undefined : "lazy"}
            priority={priorityImage}
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <IntelligenceCategoryBadge category={article.category} />
          <h2 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-blue-700 md:text-xl">{article.title}</h2>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{article.excerpt}</p>
          <p className="mt-4 text-xs font-medium text-slate-500">{minutes} min read →</p>
        </div>
      </Link>
    </article>
  );
}
