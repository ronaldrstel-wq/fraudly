import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { AdminToolsClient } from "@/components/admin/AdminToolsClient";
import { getAdminIdentityOrNull, getCurrentUserIsAdmin } from "@/lib/auth/admin";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { privateRobots } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...buildPageMetadata({
    path: "/admin",
    titleSegment: SEO_TITLE.admin,
    description: SEO_DESCRIPTION.admin,
    robots: privateRobots
  }),
  robots: privateRobots
};

async function ensureAdminAccess() {
  const identity = await getAdminIdentityOrNull();
  if (!identity) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent("/admin")}`);
  }
  const isAdmin = await getCurrentUserIsAdmin();
  if (!isAdmin) notFound();
}

export default async function AdminToolsPage() {
  await ensureAdminAccess();
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-blue-700">Admin</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Admin tools</h1>
          <p className="mt-3 text-sm text-slate-600">
            Manage scan quality and visibility with auditable actions. Raw scan evidence remains unchanged.
          </p>
        </header>
        <AdminToolsClient />
      </main>
      <SiteFooter />
    </div>
  );
}
