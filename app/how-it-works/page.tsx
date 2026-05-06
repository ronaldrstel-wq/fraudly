import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  path: "/how-it-works",
  titleSegment: "How it works",
  description:
    "Learn how Fraudly combines identity, behavior, device, payment, network, reputation, and AI risk signals to help detect suspicious activity early."
});

const steps = [
  {
    title: "Paste a website link",
    text: "Enter the URL of a webshop, brand, or unknown website you want to check."
  },
  {
    title: "We review trust signals",
    text: "Fraudly checks signals like domain patterns, public reviews, website content, shipping cues, and business transparency."
  },
  {
    title: "AI explains the risk",
    text: "Our AI summarizes the findings in plain language, so you understand why a website looks safe, suspicious, or risky."
  },
  {
    title: "Get a clear trust score",
    text: "You receive an easy-to-read trust score, verdict, and reasons to help you decide what to do next."
  }
] as const;

const signalCards = [
  {
    title: "Identity & account signals",
    text: "We assess account-level trust context to catch identity risks early.",
    bullets: [
      "Email reputation and disposable email detection",
      "Phone number validity",
      "Device fingerprint consistency",
      "VPN, proxy, Tor, and datacenter IP detection",
      "Geolocation mismatches",
      "Account age and linked-account detection"
    ]
  },
  {
    title: "Behavioral signals",
    text: "Session and authentication behavior can reveal abuse before losses occur.",
    bullets: [
      "Session behavior",
      "Velocity checks",
      "Login/authentication anomalies",
      "Repeated failed attempts",
      "Bot-like or automated behavior",
      "Suspicious referral or invite activity"
    ]
  },
  {
    title: "Payment & transaction signals",
    text: "Payment patterns help surface fraud attempts and high-risk transactions.",
    bullets: [
      "Card testing patterns",
      "High-risk BIN/issuer analysis",
      "Billing/shipping mismatches",
      "Transaction amount anomalies",
      "Refund and chargeback indicators",
      "Cross-account payment reuse"
    ]
  },
  {
    title: "Reputation & network intelligence",
    text: "Network relationships and external intelligence add context beyond one event.",
    bullets: [
      "Shared device/IP relationships",
      "Known bad actor indicators",
      "Abuse history and blacklist matches",
      "Fraud rings/coordinated activity",
      "ASN and hosting provider risk",
      "Country/region risk analysis"
    ]
  },
  {
    title: "Security & trust checks",
    text: "Security integrity checks help identify account compromise and abuse.",
    bullets: [
      "MFA/authentication integrity",
      "Session hijacking indicators",
      "Credential stuffing patterns",
      "API abuse detection",
      "Automation/scraping detection",
      "Rate limit and abuse monitoring",
      "Spoofing/tampering attempts"
    ]
  },
  {
    title: "AI-powered risk analysis",
    text: "Fraudly combines deterministic rules with adaptive AI models for explainable scoring.",
    bullets: [
      "Rule-based + AI risk modeling",
      "Adaptive fraud detection",
      "False-positive reduction",
      "Transparent risk scoring and explanations"
    ]
  },
  {
    title: "Custom rules & workflows",
    text: "Teams can tailor decisioning and operations to their risk appetite.",
    bullets: [
      "Custom risk thresholds",
      "Real-time alerts/actions",
      "Review queues",
      "Block, allow, or challenge flows",
      "Webhook/API integrations",
      "Case management and audit trails"
    ]
  },
  {
    title: "Real-time monitoring",
    text: "Continuous monitoring helps detect and respond to abuse patterns quickly.",
    bullets: [
      "Account takeovers",
      "Fake accounts",
      "Promo/coupon abuse",
      "Payment fraud",
      "Marketplace scams",
      "Subscription abuse",
      "Spam/bot attacks",
      "Coordinated fraud campaigns"
    ]
  }
] as const;

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:pt-14 md:pt-16">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-blue-100 bg-white px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
            How Fraudly works
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            How Fraudly checks a website
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-slate-600 md:text-lg">
            Fraudly looks at identity, behavior, device, payment, network, and reputation signals — then combines
            them with AI-powered risk analysis to detect suspicious activity before it impacts your business.
          </p>
          <div className="mt-8">
            <Link
              href="/#link-check"
              className="inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
            >
              Try it free
            </Link>
          </div>
        </section>

        <section className="mt-14 sm:mt-16 md:mt-20">
          <h2 className="text-center text-xl font-bold text-slate-900 md:text-2xl">Step by step</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600">
            From paste to a clear readout — here is what happens when you run a check.
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title}>
                <article className="flex h-full flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60">
                  <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 sm:mt-16 md:mt-20">
          <h2 className="text-center text-xl font-bold text-slate-900 md:text-2xl">What Fraudly looks at</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600">
            Scan-ready coverage across identity, behavior, security, payment, and network risk layers.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {signalCards.map((card) => (
              <article
                key={card.title}
                className="rounded-xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60"
              >
                <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.text}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-3xl sm:mt-16 md:mt-20">
          <article className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-6 shadow-md shadow-amber-100/50 md:p-8">
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">Fraudly is a risk assistant, not a guarantee</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 md:text-base">
              No automated tool can guarantee that a website is 100% safe or unsafe. Fraudly helps you make a
              better-informed decision by highlighting signals that are often associated with trustworthy or suspicious
              websites.
            </p>
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
