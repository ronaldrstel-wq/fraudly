import { permanentRedirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Legacy /blog/[slug] → canonical /intelligence/[slug]. */
export default async function BlogArticleRedirect({ params }: PageProps) {
  const { slug } = await params;
  permanentRedirect(`/intelligence/${slug}`);
}
