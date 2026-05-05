import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * Reusable shell for consumer-focused SEO pages (guides, learn hub, future /learn/* articles).
 */
export function SeoConsumerLayout({
  children,
  mainClassName = ""
}: {
  children: ReactNode;
  mainClassName?: string;
}) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className={`mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:pt-14 md:pt-16 ${mainClassName}`}>
        <article itemScope itemType="https://schema.org/Article">{children}</article>
      </main>
      <SiteFooter />
    </div>
  );
}
