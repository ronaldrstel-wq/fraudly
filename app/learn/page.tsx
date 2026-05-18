import Link from "next/link";
import { SeoConsumerLayout } from "@/components/seo/SeoConsumerLayout";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  path: "/learn",
  titleSegment: SEO_TITLE.learn,
  description: SEO_DESCRIPTION.learn
});

const topics = [
  {
    title: "How to spot fake webshops",
    body: "Look for missing contact details, copy-paste product text, brand-new domains, impossible delivery windows, and pressure to pay outside normal checkout. Pair your instinct with a website trust checker and a quick search for independent reviews."
  },
  {
    title: "Signs of a scam website",
    body: "Common patterns include unusual domains, hidden ownership, SSL problems, and inconsistent branding. Public threat feeds may flag malware or phishing; technical checks can catch certificate or HTTPS issues early."
  },
  {
    title: "How phishing websites work",
    body: "Phishing pages mimic banks, delivery firms, or popular brands to harvest passwords or card data. The visible brand and the real domain often do not match—Fraudly can help you compare the link to what you expect."
  },
  {
    title: "Is it safe to buy from unknown webshops?",
    body: "It depends. New stores are not automatically scams, but they deserve extra caution. Check domain age, policies, reviews on independent sites, and payment protections. When in doubt, wait or use a payment method with buyer protection."
  },
  {
    title: "What does domain age mean?",
    body: "Very new domains are often used for short-lived scams, while older domains are slightly more common among established businesses. Domain age alone never proves legitimacy—combine it with other trust and risk indicators."
  },
  {
    title: "How to verify an online store",
    body: "Verify contact options, return policies, business identifiers where relevant, and whether reviews look organic. Run a structured website check, then cross-check with official brand channels if the purchase is high value."
  }
] as const;

export default function LearnHubPage() {
  return (
    <SeoConsumerLayout>
      <header>
        <p className="text-sm font-medium text-blue-700">Consumer guides</p>
        <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Learn about scam websites and safer shopping
        </h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600">
          Calm, practical context for high-intent searches like{" "}
          <em className="not-italic text-slate-800">fake webshop check</em>,{" "}
          <em className="not-italic text-slate-800">phishing link checker</em>, and{" "}
          <em className="not-italic text-slate-800">is this website legit</em>. For longer guides, visit the{" "}
          <Link href="/intelligence" className="font-medium text-blue-600 hover:underline">
            Fraudly Intelligence
          </Link>
          . These pages complement Fraudly’s{" "}
          <Link href="/#link-check" className="font-medium text-blue-600 hover:underline">
            free website trust check
          </Link>
          .
        </p>
      </header>

      <div className="mt-10 space-y-8">
        {topics.map((topic) => (
          <section key={topic.title} className="rounded-xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-200/50">
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">{topic.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 md:text-base">{topic.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-12 rounded-xl border border-blue-100 bg-blue-50/70 p-6 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Put it into practice</h2>
        <p className="mt-2 text-sm text-slate-600">
          Run a <Link href="/#link-check" className="font-medium text-blue-600 hover:underline">website safety check</Link>{" "}
          or open a shareable snapshot like{" "}
          <Link href="/check/example.com" className="font-medium text-blue-600 hover:underline">
            /check/example.com
          </Link>
          .
        </p>
      </section>
    </SeoConsumerLayout>
  );
}
