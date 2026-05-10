import { Suspense } from "react";
import { NavbarShell } from "@/components/navbar/NavbarShell";

function NavbarFallback() {
  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-3 px-4 py-4">
        <div className="flex min-h-9 shrink-0 items-center gap-2" aria-hidden>
          <span className="h-9 w-[88px] animate-pulse rounded-xl bg-slate-100" />
          <span className="h-9 w-[98px] animate-pulse rounded-xl bg-slate-100" />
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
