import type { Metadata } from "next";
import { EmbeddedSignUp } from "@/components/auth/EmbeddedSignUp";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  path: "/sign-up",
  titleSegment: "Create account",
  description: "Create a free Fraudly account to save scan history and run more website safety checks."
});

export default function SignUpPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-[#F9FAFB] px-4 py-12">
      <EmbeddedSignUp />
    </div>
  );
}
