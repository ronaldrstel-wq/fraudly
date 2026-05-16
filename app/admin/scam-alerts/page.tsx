import type { Metadata } from "next";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { privateRobots } from "@/lib/seo";
import Link from "next/link";
import { ScamAlertStatus } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { getAdminIdentityOrNull, isCurrentUserAdmin } from "@/lib/admin-auth";
import {
  listScamAlertsForAdmin,
  updateScamAlertContent,
  updateScamAlertStatus
} from "@/lib/scam-alerts/admin-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...buildPageMetadata({
    path: "/admin/scam-alerts",
    titleSegment: SEO_TITLE.adminScamAlerts,
    description: SEO_DESCRIPTION.adminScamAlerts,
    robots: privateRobots
  }),
  robots: privateRobots
};

type PageProps = { searchParams: Promise<{ status?: string }> };

function parseStatus(raw?: string): "all" | ScamAlertStatus {
  if (raw === "draft" || raw === "published" || raw === "archived") return raw;
  return "all";
}

async function ensureAdminAccess() {
  const identity = await getAdminIdentityOrNull();
  if (!identity) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent("/admin/scam-alerts")}`);
  }
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) notFound();
}

async function setAlertStatusAction(formData: FormData) {
  "use server";
  await ensureAdminAccess();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["draft", "published", "archived"].includes(status)) return;
  await updateScamAlertStatus(id, status as ScamAlertStatus);
  revalidatePath("/admin/scam-alerts");
  revalidatePath("/scam-alerts");
}

async function editAlertAction(formData: FormData) {
  "use server";
  await ensureAdminAccess();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const summary = String(formData.get("summary") ?? "");
  const safetyTipsRaw = String(formData.get("safetyTips") ?? "");
  if (!id) return;
  const safetyTips = safetyTipsRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  await updateScamAlertContent({ id, title, summary, safetyTips });
  revalidatePath("/admin/scam-alerts");
  revalidatePath("/scam-alerts");
}

function riskTone(level: string): string {
  if (level === "critical") return "bg-rose-50 text-rose-700 border-rose-200";
  if (level === "high") return "bg-orange-50 text-orange-700 border-orange-200";
  if (level === "medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function statusTone(status: ScamAlertStatus): string {
  if (status === "published") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "archived") return "bg-slate-100 text-slate-600 border-slate-300";
  return "bg-sky-50 text-sky-700 border-sky-200";
}

export default async function AdminScamAlertsPage({ searchParams }: PageProps) {
  await ensureAdminAccess();
  const status = parseStatus((await searchParams).status);
  const alerts = await listScamAlertsForAdmin(status, 200);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-blue-700">Admin</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Scam Alerts Moderation</h1>
          <p className="mt-3 text-sm text-slate-600">Review generated alerts, edit content, and control publication state.</p>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2 text-sm">
          {(["all", "draft", "published", "archived"] as const).map((item) => (
            <Link
              key={item}
              href={item === "all" ? "/admin/scam-alerts" : `/admin/scam-alerts?status=${item}`}
              className={`rounded-full border px-3 py-1.5 ${status === item ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"}`}
            >
              {item}
            </Link>
          ))}
        </nav>

        <section className="mt-6 space-y-4">
          {alerts.map((alert) => (
            <article key={alert.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusTone(alert.status)}`}>
                  {alert.status.toUpperCase()}
                </span>
                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${riskTone(alert.riskLevel)}`}>
                  {alert.riskLevel.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500">{alert.scamType}</span>
                {alert.affectedBrand ? <span className="text-xs text-slate-500">Brand: {alert.affectedBrand}</span> : null}
              </div>

              <h2 className="mt-2 text-lg font-semibold">{alert.title}</h2>
              <p className="mt-2 text-sm text-slate-700">{alert.summary}</p>
              <p className="mt-2 text-xs text-slate-500">
                Evidence: {alert.evidenceCount} • Generated: {alert.generatedAt.toLocaleString("en")} • Updated: {alert.updatedAt.toLocaleString("en")}
              </p>

              <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">Review details</summary>
                <div className="mt-3 space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">Source summary</p>
                    <pre className="mt-1 overflow-auto rounded bg-white p-2 text-xs text-slate-700">
                      {JSON.stringify(alert.sourceSummaryJson ?? {}, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Example domains</p>
                    <pre className="mt-1 overflow-auto rounded bg-white p-2 text-xs text-slate-700">
                      {JSON.stringify(alert.exampleDomainsJson ?? [], null, 2)}
                    </pre>
                  </div>
                </div>
              </details>

              <div className="mt-4 flex flex-wrap gap-2">
                <form action={setAlertStatusAction}>
                  <input type="hidden" name="id" value={alert.id} />
                  <input type="hidden" name="status" value="published" />
                  <button className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    Publish
                  </button>
                </form>
                <form action={setAlertStatusAction}>
                  <input type="hidden" name="id" value={alert.id} />
                  <input type="hidden" name="status" value="draft" />
                  <button className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                    Move to draft
                  </button>
                </form>
                <form action={setAlertStatusAction}>
                  <input type="hidden" name="id" value={alert.id} />
                  <input type="hidden" name="status" value="archived" />
                  <button className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    Archive
                  </button>
                </form>
              </div>

              <form action={editAlertAction} className="mt-4 space-y-2 rounded-xl border border-slate-200 p-3">
                <input type="hidden" name="id" value={alert.id} />
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Title
                  <input
                    name="title"
                    defaultValue={alert.title}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Summary
                  <textarea
                    name="summary"
                    defaultValue={alert.summary}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Safety tips (one per line)
                  <textarea
                    name="safetyTips"
                    defaultValue={alert.safetyTips.join("\n")}
                    rows={4}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                  />
                </label>
                <button className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  Save edits
                </button>
              </form>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
