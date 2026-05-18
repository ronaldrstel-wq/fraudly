import Link from "next/link";
import { BlogCheckerCta } from "@/components/blog/BlogCheckerCta";
import { BlogHero } from "@/components/blog/BlogHero";
import { BlogRelatedArticles } from "@/components/blog/BlogRelatedArticles";
import { BlogRichText } from "@/components/blog/BlogRichText";
import { BlogSectionBody } from "@/components/blog/BlogSectionBody";
import { InternalCheckLinksSection } from "@/components/seo/InternalCheckLinksSection";
import { INTELLIGENCE_BRAND } from "@/lib/blog/constants";
import type { BlogArticleDefinition } from "@/lib/blog/types";
import { articlePlainText, estimateReadingTimeMinutes } from "@/lib/blog/reading-time";
import { fetchPublicCheckLinkItems } from "@/lib/seo/public-check-links";

type BlogArticleViewProps = {
  article: BlogArticleDefinition;
};

export async function BlogArticleView({ article }: BlogArticleViewProps) {
  const plain = articlePlainText(article);
  const readingMinutes = estimateReadingTimeMinutes(plain);
  const recentChecks = await fetchPublicCheckLinkItems(6);
  const midSection = Math.floor(article.sections.length / 2);

  return (
    <>
      <BlogHero article={article} readingMinutes={readingMinutes} />

      <div className="mt-8 fraudly-card border-slate-100 p-6 sm:p-8">
        <p className="text-pretty text-lg leading-relaxed text-slate-700">
          <BlogRichText text={article.intro} />
        </p>

        <div className="mt-10 space-y-10">
          {article.sections.map((section, index) => {
            const Heading = section.level === 3 ? "h3" : "h2";
            return (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <Heading
                  className={
                    section.level === 3
                      ? "text-lg font-bold text-slate-900"
                      : "text-xl font-bold text-slate-900 md:text-2xl"
                  }
                >
                  {section.title}
                </Heading>
                <div className="mt-4">
                  <BlogSectionBody blocks={section.blocks} />
                </div>
                {index === midSection - 1 ? (
                  <div className="mt-8">
                    <BlogCheckerCta />
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        <div className="mt-10">
          <BlogCheckerCta
            title="Verify the site with Fraudly"
            body="Paste a suspicious shop or login link for a public trust and scam-risk snapshot before you pay or sign in."
          />
        </div>

        <nav className="mt-10 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-6 text-sm" aria-label="Fraudly resources">
          <Link href="/website-scam-checker" className="font-medium text-blue-600 hover:underline">
            Website scam checker
          </Link>
          <Link href="/latest-checks" className="font-medium text-blue-600 hover:underline">
            Latest checks
          </Link>
          <Link href="/scam-alerts" className="font-medium text-blue-600 hover:underline">
            Scam alerts
          </Link>
          <Link href="/intelligence" className="font-medium text-blue-600 hover:underline">
            {INTELLIGENCE_BRAND.name}
          </Link>
        </nav>
      </div>

      {recentChecks.length > 0 ? (
        <div className="mt-8">
          <InternalCheckLinksSection
            id="blog-recent-checks"
            title="Recent website safety checks"
            description="Real public trust snapshots from Fraudly—open a full report for any domain."
            items={recentChecks}
            compact
            footerHref="/latest-checks"
            footerLabel="Browse all latest checks →"
          />
        </div>
      ) : null}

      <BlogRelatedArticles slugs={article.relatedSlugs} />

      <p className="mt-10 text-center text-sm text-slate-600">
        <Link href="/intelligence" className="font-medium text-blue-600 hover:underline">
          {INTELLIGENCE_BRAND.backToIndex}
        </Link>
      </p>
    </>
  );
}
