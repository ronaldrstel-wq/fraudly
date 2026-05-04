import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  path: "/pricing",
  titleSegment: "Pricing",
  description: "Kies tussen Gratis, losse checks of Premium voor uitgebreide fraudeanalyse met Fraudly."
});

function Card({
  title,
  price,
  badge,
  features,
  cta
}: {
  title: string;
  price: string;
  badge?: string;
  features: string[];
  cta: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {badge ? <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{badge}</span> : null}
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{price}</p>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <Link
        href="/#link-check"
        className="mt-6 inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
      >
        {cta}
      </Link>
    </article>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-12">
        <h1 className="text-center text-4xl font-bold tracking-tight text-slate-900">Kies je plan</h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">Start gratis en ontgrendel volledige analyses wanneer je ze nodig hebt.</p>
        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <Card
            title="Gratis"
            price="€0"
            features={["5 gratis checks", "Basis fraudedetectie", "Snelle scan", "Beperkte details"]}
            cta="Start gratis"
          />
          <Card
            title="Losse checks"
            badge="Aanbevolen"
            price="1 check: €0,99 · 5 checks: €3,99 · 20 checks: €9,99"
            features={["Geen abonnement", "Direct volledige analyse", "Credits blijven beschikbaar"]}
            cta="Koop checks"
          />
          <Card
            title="Premium"
            price="€6,99/mnd"
            features={["200 checks per maand", "Volledige analyse", "Geschiedenis", "Alerts", "Ideaal voor wie vaker checkt"]}
            cta="Start Premium"
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
