import type { Metadata } from "next";
import { EmbeddedSignIn } from "@/components/auth/EmbeddedSignIn";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    path: "/sign-in",
    titleSegment: "Save your Fraudly scans",
    description:
      "Continue with Apple or Google to keep your scan history and sync access across devices. Sign-in is identity only — not App Store or Google Play purchase."
  }),
  robots: privateRobots
};

export default function SignInPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-[#F9FAFB] px-4 py-12">
      <EmbeddedSignIn />
    </div>
  );
}
