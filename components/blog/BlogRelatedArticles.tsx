import { BlogArticleCard } from "@/components/blog/BlogArticleCard";
import { INTELLIGENCE_BRAND } from "@/lib/blog/constants";
import { getBlogArticlesBySlugs } from "@/lib/blog/registry";

export function BlogRelatedArticles({ slugs }: { slugs: string[] }) {
  const related = getBlogArticlesBySlugs(slugs);
  if (related.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="related-articles-heading">
      <h2 id="related-articles-heading" className="text-xl font-bold text-slate-900 md:text-2xl">
        {INTELLIGENCE_BRAND.relatedHeading}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        More consumer protection and threat awareness guides from {INTELLIGENCE_BRAND.name}.
      </p>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2">
        {related.map((article) => (
          <li key={article.slug}>
            <BlogArticleCard article={article} />
          </li>
        ))}
      </ul>
    </section>
  );
}
