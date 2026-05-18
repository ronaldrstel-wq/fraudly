import Link from "next/link";
import { BlogArticleCard } from "@/components/blog/BlogArticleCard";
import { BlogCheckerCta } from "@/components/blog/BlogCheckerCta";
import { IntelligenceTrustBadges } from "@/components/blog/IntelligenceTrustBadges";
import { intelligencePageHero } from "@/components/blog/intelligenceUi";
import { SeoConsumerLayout } from "@/components/seo/SeoConsumerLayout";
import { INTELLIGENCE_BRAND } from "@/lib/blog/constants";
import { getAllBlogArticles } from "@/lib/blog/registry";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  path: "/intelligence",
  titleSegment: SEO_TITLE.intelligence,
  description: SEO_DESCRIPTION.intelligence
});

export const revalidate = 3600;

export default function IntelligenceIndexPage() {
  const articles = getAllBlogArticles();
  const [featured, ...rest] = articles;

  return (
    <SeoConsumerLayout mainClassName="max-w-6xl">
      <header className={intelligencePageHero}>
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-200/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-violet-200/20 blur-3xl"
          aria-hidden
        />
        <p className="relative text-sm font-semibold uppercase tracking-widest text-blue-700">
          {INTELLIGENCE_BRAND.indexEyebrow}
        </p>
        <h1 className="relative mt-3 max-w-2xl text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-[2.5rem] lg:leading-tight">
          Scam intelligence for safer shopping and browsing
        </h1>
        <p className="relative mt-4 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 md:text-lg">
          {INTELLIGENCE_BRAND.tagline}. Research-backed guides on fake webshops, phishing, reviews, and warning
          signs—paired with live trust checks from the Fraudly platform.
        </p>
        <IntelligenceTrustBadges />
        <div className="relative mt-8">
          <Link href="/#link-check" className="btn-primary inline-flex px-6">
            Run free website check
          </Link>
        </div>
      </header>

      {featured ? (
        <section className="mt-12" aria-labelledby="featured-intelligence-heading">
          <h2 id="featured-intelligence-heading" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {INTELLIGENCE_BRAND.featuredLabel}
          </h2>
          <div className="mt-4">
            <BlogArticleCard article={featured} featured priorityImage />
          </div>
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section className="mt-14" aria-labelledby="latest-intelligence-heading">
          <h2 id="latest-intelligence-heading" className="text-xl font-bold text-slate-900 md:text-2xl">
            {INTELLIGENCE_BRAND.latestHeading}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Consumer protection and threat awareness reports—updated regularly for Fraudly users and searchers.
          </p>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((article) => (
              <li key={article.slug} className="h-full">
                <BlogArticleCard article={article} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-14">
        <BlogCheckerCta
          title="Turn intelligence into action"
          body="Found a suspicious domain while reading? Check it instantly with Fraudly—no account required."
          primaryLabel="Open website checker"
        />
      </div>

      <section className="mt-10 fraudly-card border-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-900">Platform tools</h2>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <li>
            <Link href="/website-scam-checker" className="font-medium text-blue-600 hover:underline">
              Website scam checker
            </Link>
          </li>
          <li>
            <Link href="/latest-checks" className="font-medium text-blue-600 hover:underline">
              Latest checks
            </Link>
          </li>
          <li>
            <Link href="/scam-alerts" className="font-medium text-blue-600 hover:underline">
              Scam alerts
            </Link>
          </li>
          <li>
            <Link href="/learn" className="font-medium text-blue-600 hover:underline">
              Learn hub
            </Link>
          </li>
        </ul>
      </section>
    </SeoConsumerLayout>
  );
}
