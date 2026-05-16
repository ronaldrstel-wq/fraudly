import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SEO_DESCRIPTION } from "@/lib/seo-description";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = {
  description: SEO_DESCRIPTION.signIn,
  robots: privateRobots
};

/** `ClerkProvider` lives in root `app/layout.tsx` so all routes share Clerk client context. */
export default function ClerkAuthLayout({ children }: { children: ReactNode }) {
  return children;
}
