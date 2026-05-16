import Link from "next/link";
import { HomeTrustActivitySection } from "@/components/home/HomeTrustActivitySection";
import { HomeWhatWeCheckSection } from "@/components/home/HomeWhatWeCheckSection";
import { HOME_FAQ_ITEMS } from "@/lib/homeFaq";
import { getHomeTrustStats } from "@/lib/home/getHomeTrustStats";
import { EN_MESSAGES } from "@/lib/messages.en";

export async function HomeBelowFold() {
  const trustStats = await getHomeTrustStats();

  return (
    <div className="mx-auto mt-10 max-w-6xl space-y-14 [content-visibility:auto] [contain-intrinsic-size:1px_2800px] sm:mt-12 md:mt-14 md:space-y-16">
      <HomeTrustActivitySection stats={trustStats} />
      <HomeWhatWeCheckSection />

      <section id="trust-safety" aria-labelledby="trust-safety-heading" className="rounded-2xl border border-slate-100 bg-white p-6 shadow-subtle md:p-8">
        <h2 id="trust-safety-heading" className="text-xl font-bold text-slate-900 md:text-2xl">
          Calm checks for real-life shopping moments
        </h2>
        <p className="mt-3 max-w-3xl text-pretty text-sm leading-relaxed text-slate-600 md:text-base">
          Fraudly is a <strong className="font-semibold text-slate-800">consumer website trust checker</strong> for social
          ads, marketplaces, impulse buys, and “is this URL safe?” seconds. You get structured signals—never shock-value
          scare copy.
        </p>
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 md:text-base">
          <li>Scam intelligence layered with reputation, SSL, and historical context</li>
          <li>Optional deep scans when you need richer technical + review insight</li>
          <li>Public “latest checks” plus threat alerts for wider awareness</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/features" className="btn-secondary px-4">
            See features
          </Link>
          <Link href="/learn" className="btn-secondary px-4">
            Learn about online scams
          </Link>
        </div>
      </section>

      <section id="how-it-works-home" aria-labelledby="how-heading" className="rounded-2xl border border-slate-100 bg-white p-6 shadow-subtle md:p-8">
        <h2 id="how-heading" className="text-xl font-bold text-slate-900 md:text-2xl">
          How the check works
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-700 md:text-base">
          <li>Paste a URL before you pay, log in, or tap a sketchy ad.</li>
          <li>Fraudly pulls security context, domain history, scam feeds, and reputation hints when they are reachable.</li>
          <li>You see a trust score, headline guidance, and expandable detail if you want receipts.</li>
        </ol>
        <p className="mt-4 text-sm text-slate-600">
          Curious about the full pipeline? Read{" "}
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
            <details key={item.question} className="rounded-2xl border border-slate-200/85 bg-white p-4 shadow-subtle">
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
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-subtle">
            <p className="text-sm leading-relaxed text-slate-700">
              “Luckily I didn’t buy this product — Fraudly showed me it was a risky site.”
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">— Emma</p>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-subtle">
            <p className="text-sm leading-relaxed text-slate-700">
              “I now check every Instagram ad with Fraudly before ordering.”
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">— Noah</p>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-subtle">
            <p className="text-sm leading-relaxed text-slate-700">“Saved me from buying from a shady sneaker store.”</p>
            <p className="mt-3 text-sm font-semibold text-slate-900">— Jason</p>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-subtle">
            <p className="text-sm leading-relaxed text-slate-700">
              “Within seconds I knew that TikTok shop needed a second look.”
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">— Mila</p>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-subtle">
            <p className="text-sm leading-relaxed text-slate-700">
              “The ad looked legit. Fraudly showed the red flags in plain English.”
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">— Olivia</p>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-subtle">
            <p className="text-sm leading-relaxed text-slate-700">“Great for double-checking social promos before I buy.”</p>
            <p className="mt-3 text-sm font-semibold text-slate-900">— Daan</p>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100/85 bg-blue-50/55 p-6 text-center shadow-subtle md:p-8">
        <h2 className="text-lg font-bold text-slate-900 md:text-xl">Ready to check a link?</h2>
        <p className="mx-auto mt-2 max-w-xl text-pretty text-sm text-slate-600">
          Run a free scan and share a calm snapshot like{" "}
          <Link href="/check/example.com" className="font-medium text-blue-600 hover:underline">
            /check/example.com
          </Link>{" "}
          when someone asks, “Does this site look OK?”
        </p>
        <Link href="/#link-check" className="btn-primary mx-auto mt-5 px-8">
          {EN_MESSAGES.home.primaryCta}
        </Link>
      </section>
    </div>
  );
}
