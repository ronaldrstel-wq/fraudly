import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { getPublishedScamAlertBySlug } from "@/lib/scam-alerts/service";
import { SITE_URL } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 10800;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const alert = await getPublishedScamAlertBySlug(slug);
  if (!alert) {
    return { title: "Scam alert", robots: { index: false, follow: false } };
  }
  const url = `${SITE_URL}/scam-alerts/${alert.slug}`;
  return {
    title: `${alert.title} | Fraudly Scam Alerts`,
    description: alert.summary.slice(0, 158),
    alternates: { canonical: url },
    openGraph: {
      title: `${alert.title} | Fraudly Scam Alerts`,
      description: alert.summary.slice(0, 180),
      url,
      type: "article"
    }
  };
}

export default async function ScamAlertDetailPage({ params }: Props) {
  const { slug } = await params;
  const alert = await getPublishedScamAlertBySlug(slug);
  if (!alert) notFound();

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10">
        <p className="text-sm text-blue-700">Scam Alert</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{alert.title}</h1>
        <p className="mt-3 text-sm text-slate-600">
          {alert.scamType}
          {alert.affectedBrand ? ` • Affected brand: ${alert.affectedBrand}` : ""}
          {` • Updated ${new Date(alert.updatedAt).toLocaleString("en")}`}
        </p>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Summary</h2>
          <p className="mt-2 text-sm text-slate-700">{alert.summary}</p>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Known patterns</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {alert.exampleDomains.length > 0 ? (
              alert.exampleDomains.map((domain) => <li key={domain}>{domain}</li>)
            ) : (
              <li>Patterns are based on aggregated threat indicators and may evolve.</li>
            )}
          </ul>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Safety tips</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {alert.safetyTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>

        <div className="mt-6">
          <Link href="/#link-check" className="text-sm font-semibold text-blue-600 hover:underline">
            Check a suspicious website
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
