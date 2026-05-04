import { SeoToolPage } from "@/components/SeoToolPage";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { cryptoScamCheckerLanding } from "@/lib/tool-landings";

export const metadata = buildPageMetadata({
  path: "/crypto-scam-checker",
  titleSegment: "Crypto Scam Checker",
  description:
    "Review suspicious crypto-related websites with Fraudly for common scam patterns. Informational only—not investment or financial advice."
});

export default function CryptoScamCheckerPage() {
  return <SeoToolPage {...cryptoScamCheckerLanding} />;
}
