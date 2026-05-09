import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/seo";
import { getPublishedScamAlertBySlug } from "@/lib/scam-alerts/service";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const alert = await getPublishedScamAlertBySlug(slug);
  if (!alert) {
    return {
      title: "Scam alert not found | Fraudly",
      robots: { index: false, follow: false }
    };
  }
  return {
    title: `${alert.title} | Fraudly Scam Alert`,
    description: alert.summary,
    alternates: { canonical: `${SITE_URL}/scam-alerts/${alert.slug}` },
    openGraph: {
      title: `${alert.title} | Fraudly Scam Alert`,
      description: alert.summary,
      url: `${SITE_URL}/scam-alerts/${alert.slug}`,
      type: "article"
    },
    robots: { index: true, follow: true }
  };
}

export default async function ScamAlertDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const alert = await getPublishedScamAlertBySlug(slug);
  if (!alert) notFound();

  const detectedUrls = Array.from(new Set(alert.signals.map((s) => s.url).filter((v): v is string => Boolean(v))));
  const detectedDomains = Array.from(new Set(alert.signals.map((s) => s.domain).filter((v): v is string => Boolean(v))));

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10">
        <Link href="/scam-alerts" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
          ← Back to scam alerts
        </Link>

        <article className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">{alert.scamType}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{alert.title}</h1>
          <p className="mt-3 text-base text-slate-700">{alert.summary}</p>

          <dl className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-900">Source</dt>
              <dd>
                {alert.sourceUrl ? (
                  <a href={alert.sourceUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:text-blue-900">
                    {alert.sourceName}
                  </a>
                ) : (
                  alert.sourceName
                )}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Confidence</dt>
              <dd>{alert.confidence}%</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Published</dt>
              <dd>{(alert.publishedAt ?? alert.lastSeenAt).toLocaleString("en")}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Last seen</dt>
              <dd>{alert.lastSeenAt.toLocaleString("en")}</dd>
            </div>
          </dl>

          <section className="mt-6">
            <h2 className="text-lg font-semibold text-slate-900">Why it may be risky</h2>
            <p className="mt-2 text-sm text-slate-700">{alert.whyRisky ?? "The alert was flagged by public threat-intel signals."}</p>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-semibold text-slate-900">Detected domains / URLs</h2>
            {detectedDomains.length === 0 && detectedUrls.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No concrete domains or URLs were extracted for this alert.</p>
            ) : (
              <div className="mt-2 space-y-3 text-sm text-slate-700">
                {detectedDomains.length > 0 ? (
                  <div>
                    <p className="font-semibold text-slate-900">Domains</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {detectedDomains.map((domain) => (
                        <li key={domain}>{domain}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {detectedUrls.length > 0 ? (
                  <div>
                    <p className="font-semibold text-slate-900">URLs</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {detectedUrls.map((url) => (
                        <li key={url} className="break-all">
                          {url}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
