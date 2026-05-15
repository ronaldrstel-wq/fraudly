import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    path: "/sign-up",
    titleSegment: "Save your Fraudly scans",
    description:
      "Continue with Apple or Google to keep your scan history and sync access across devices."
  }),
  robots: privateRobots
};

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Legacy `/sign-up` URLs → unified `/sign-in` (same Clerk user, no separate social sign-up). */
export default async function SignUpRedirectPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") q.set(key, value);
    else if (Array.isArray(value) && value[0]) q.set(key, value[0]);
  }
  const suffix = q.toString();
  redirect(suffix ? `/sign-in?${suffix}` : "/sign-in");
}
