import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  path: "/pricing",
  titleSegment: SEO_TITLE.pricing,
  description: SEO_DESCRIPTION.pricing
});

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-12">
        <article className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Continue with a free account</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Your first website check is available without an account. To continue checking websites, create a free
            account or log in.
          </p>
          <div className="mt-8">
            <Link
              href="/#link-check"
              className="inline-flex justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Go to website checker
            </Link>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
