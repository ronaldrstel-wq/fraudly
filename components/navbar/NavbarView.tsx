"use client";

import Image from "next/image";
import Link from "next/link";
import { AuthMenuDynamic } from "@/components/navbar/AuthMenuDynamic";
import { MAIN_NAV_LINKS } from "@/components/navbar/mainNavLinks";

export function NavbarView() {
  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="mr-2 inline-flex shrink-0 items-center opacity-90 transition-opacity hover:opacity-100">
          <Image
            src="/logo.png"
            alt="Fraudly — scam and fraud checker"
            width={120}
            height={40}
            sizes="120px"
            className="h-8 w-auto object-contain md:h-9"
          />
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-7 text-sm font-medium text-slate-600 md:flex">
          {MAIN_NAV_LINKS.map((link) =>
            link.href.startsWith("/") ? (
              <Link key={link.label} href={link.href} className="fraudly-nav-link">
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className="fraudly-nav-link">
                {link.label}
              </a>
            )
          )}
        </div>

        <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2 md:gap-3">
          <AuthMenuDynamic />
        </div>
      </div>
    </nav>
  );
}
