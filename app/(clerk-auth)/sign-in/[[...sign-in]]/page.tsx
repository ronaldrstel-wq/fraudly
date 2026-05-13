import type { Metadata } from "next";
import { EmbeddedSignIn } from "@/components/auth/EmbeddedSignIn";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  path: "/sign-in",
  titleSegment: "Sign in",
  description: "Sign in to your Fraudly account to save website checks, sync devices, and manage preferences."
});

export default function SignInPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-[#F9FAFB] px-4 py-12">
      <EmbeddedSignIn />
    </div>
  );
}
