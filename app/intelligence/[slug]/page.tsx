import { notFound } from "next/navigation";
import { BlogArticleView } from "@/components/blog/BlogArticleView";
import { SeoConsumerLayout } from "@/components/seo/SeoConsumerLayout";
import { getAllBlogSlugs, getBlogArticle } from "@/lib/blog/registry";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = getBlogArticle(slug);
  if (!article) return { title: "Intelligence report not found" };

  return buildPageMetadata({
    path: `/intelligence/${article.slug}`,
    titleSegment: article.metaTitle,
    description: article.metaDescription
  });
}

export default async function IntelligenceArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getBlogArticle(slug);
  if (!article) notFound();

  return (
    <SeoConsumerLayout>
      <BlogArticleView article={article} />
    </SeoConsumerLayout>
  );
}
