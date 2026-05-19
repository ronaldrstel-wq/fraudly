"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const ClerkAppProvider = dynamic(
  () => import("@/components/providers/ClerkAppProvider").then((m) => ({ default: m.ClerkAppProvider })),
  { ssr: false }
);

/** Defers Clerk client bundle until after hydration to reduce homepage TBT. */
export function ClerkAppProviderLazy({ children }: { children: ReactNode }) {
  return <ClerkAppProvider>{children}</ClerkAppProvider>;
}
