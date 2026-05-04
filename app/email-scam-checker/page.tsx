import { SeoToolPage } from "@/components/SeoToolPage";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { emailScamCheckerLanding } from "@/lib/tool-landings";

export const metadata = buildPageMetadata({
  path: "/email-scam-checker",
  titleSegment: "Email Scam Checker",
  description:
    "Validate suspicious URLs from emails with Fraudly’s checker—get quick context before you follow links from invoices, alerts, or “too good to be true” offers."
});

export default function EmailScamCheckerPage() {
  return <SeoToolPage {...emailScamCheckerLanding} />;
}
