import type { Metadata } from "next";
import { EmbeddedSignUp } from "@/components/auth/EmbeddedSignUp";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    path: "/sign-up",
    titleSegment: SEO_TITLE.signUp,
    description: SEO_DESCRIPTION.signUp,
    robots: privateRobots
  }),
  robots: privateRobots
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-[#F9FAFB] px-4 py-12">
      <EmbeddedSignUp />
    </div>
  );
}
