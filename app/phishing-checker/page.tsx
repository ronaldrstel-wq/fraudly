import { SeoToolPage } from "@/components/SeoToolPage";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { phishingCheckerLanding } from "@/lib/tool-landings";

export const metadata = buildPageMetadata({
  path: "/phishing-checker",
  titleSegment: "Phishing Checker",
  description:
    "Check suspicious links for phishing-style red flags with Fraudly—useful before you log in, download files, or enter personal details."
});

export default function PhishingCheckerPage() {
  return <SeoToolPage {...phishingCheckerLanding} />;
}
