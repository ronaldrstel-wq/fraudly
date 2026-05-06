import Link from "next/link";
import { HOME_FAQ_ITEMS } from "@/lib/homeFaq";

export function HomeBelowFold() {
  return (
    <div className="mx-auto mt-14 max-w-6xl space-y-14 [content-visibility:auto] [contain-intrinsic-size:1px_2400px] sm:mt-16 md:mt-20">
      <section id="trust-safety" aria-labelledby="trust-safety-heading" className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60 md:p-8">
        <h2 id="trust-safety-heading" className="text-xl font-bold text-slate-900 md:text-2xl">
          Website safety checker you can use in seconds
        </h2>
        <p className="mt-3 max-w-3xl text-pretty text-sm leading-relaxed text-slate-600 md:text-base">
          Fraudly is a <strong className="font-semibold text-slate-800">website trust checker</strong> for everyday
          decisions: online store scam checks, suspicious ads, marketplace sellers, and &ldquo;is this website
          legit?&rdquo; moments. Paste a URL to see risk indicators and trust signals—not hype, not fear-mongering.
        </p>
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-slate-700 md:text-base">
          <li>Phishing website detector signals from public feeds and technical checks</li>
          <li>Fake webshop–style patterns and transparency hints from page context</li>
          <li>Clear trust score–style readout with explainable reasons</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/features"
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            See features
          </Link>
          <Link
            href="/learn"
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Learn how scam websites work
          </Link>
        </div>
      </section>

      <section id="how-it-works-home" aria-labelledby="how-heading" className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60 md:p-8">
        <h2 id="how-heading" className="text-xl font-bold text-slate-900 md:text-2xl">
          How the check works
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-slate-700 md:text-base">
          <li>Paste a website URL you want to vet—before you buy, log in, or tap an ad.</li>
          <li>Fraudly reviews technical security, public threat lists, domain context, and on-page trust hints.</li>
          <li>You get a structured snapshot with risk indicators and a short summary you can act on.</li>
        </ol>
        <p className="mt-4 text-sm text-slate-600">
          Want more detail? Read{" "}
          <Link href="/how-it-works" className="font-medium text-blue-600 hover:underline">
            how Fraudly works
          </Link>
          .
        </p>
      </section>

      <section id="faq" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-center text-xl font-bold text-slate-900 md:text-2xl">
          Frequently asked questions
        </h2>
        <div className="mx-auto mt-8 max-w-3xl space-y-3">
          {HOME_FAQ_ITEMS.map((item) => (
            <details key={item.question} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">{item.question}</summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="testimonials" aria-labelledby="testimonials-heading">
        <h2 id="testimonials-heading" className="text-center text-xl font-bold text-slate-900 md:text-2xl">
          What people say
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60">
            <p className="text-sm leading-relaxed text-slate-700">
              “Luckily I didn’t buy this product — Fraudly showed me it was a scam site.”
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">— Emma</p>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60">
            <p className="text-sm leading-relaxed text-slate-700">
              “I now check every Instagram ad with Fraudly before ordering.”
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">— Noah</p>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60">
            <p className="text-sm leading-relaxed text-slate-700">“Saved me from buying from a fake sneaker store.”</p>
            <p className="mt-3 text-sm font-semibold text-slate-900">— Jason</p>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60">
            <p className="text-sm leading-relaxed text-slate-700">
              “Within seconds I knew that TikTok shop couldn’t be trusted.”
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">— Mila</p>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60">
            <p className="text-sm leading-relaxed text-slate-700">
              “The ad looked legit. Fraudly showed all the red flags instantly.”
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">— Olivia</p>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60">
            <p className="text-sm leading-relaxed text-slate-700">
              “Perfect for impulse buys from social media ads.”
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">— Daan</p>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 text-center md:p-8">
        <h2 className="text-lg font-bold text-slate-900 md:text-xl">Ready to check a link?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
          Run a free website safety check and share a result page like{" "}
          <Link href="/check/example.com" className="font-medium text-blue-600 hover:underline">
            /check/example.com
          </Link>{" "}
          when you want a quick, shareable snapshot.
        </p>
        <Link
          href="/#link-check"
          className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
        >
          Check a website now
        </Link>
      </section>
    </div>
  );
}
