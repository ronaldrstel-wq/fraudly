import type { Metadata } from "next";
import { EmbeddedSignIn } from "@/components/auth/EmbeddedSignIn";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    path: "/sign-in",
    titleSegment: SEO_TITLE.signIn,
    description: SEO_DESCRIPTION.signIn,
    robots: privateRobots
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
