import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = {
  robots: privateRobots
};

/** `ClerkProvider` lives in root `app/layout.tsx` so all routes share Clerk client context. */
export default function ClerkAuthLayout({ children }: { children: ReactNode }) {
  return children;
}
