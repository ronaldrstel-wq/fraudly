import { Suspense } from "react";
import Link from "next/link";
import { NavbarShell } from "@/components/navbar/NavbarShell";
import { EN_MESSAGES } from "@/lib/messages.en";

function NavbarFallback() {
  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-3 px-4 py-4">
        <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2 md:gap-3">
          <Link href="/sign-in" className="fraudly-motion btn-primary px-3 sm:px-4">
            {EN_MESSAGES.auth.continueCta}
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={<NavbarFallback />}>
      <NavbarShell />
    </Suspense>
  );
}
