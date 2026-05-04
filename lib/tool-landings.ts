import type { SeoToolPageProps } from "@/components/SeoToolPage";

const crossTool = [
  { href: "/scam-checker", label: "Scam checker" },
  { href: "/phishing-checker", label: "Phishing checker" },
  { href: "/email-scam-checker", label: "Email scam checker" },
  { href: "/fake-website-checker", label: "Fake website checker" },
  { href: "/crypto-scam-checker", label: "Crypto scam checker" }
] as const;

function related(excludeHref: string): SeoToolPageProps["relatedLinks"] {
  const others = crossTool.filter((l) => l.href !== excludeHref);
  return [
    { href: "/", label: "Home" },
    { href: "/how-it-works", label: "How it works" },
    ...others,
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/cookies", label: "Cookie Policy" }
  ];
}

export const scamCheckerLanding: SeoToolPageProps = {
  h1: "Online scam checker for suspicious websites and links",
  intro:
    "Scam websites often look legitimate at first glance. Fraudly helps you quickly review a URL for common fraud signals—strange domains, thin contact details, pressure tactics, and mismatched branding—before you click, log in, or pay.",
  bullets: [
    "Paste a link you received by SMS, email, or social media",
    "Get a structured risk-style summary with plain-language explanations",
    "Use the results alongside your own judgment—Fraudly is informational, not a guarantee"
  ],
  relatedLinks: related("/scam-checker")
};

export const phishingCheckerLanding: SeoToolPageProps = {
  h1: "Phishing checker for fake login pages and impostor sites",
  intro:
    "Phishing sites try to steal passwords, 2FA codes, or payment details by impersonating banks, delivery companies, or well-known brands. Fraudly can help you sanity-check a suspicious link before you enter credentials or download anything.",
  bullets: [
    "Useful when a message urges you to “verify” or “confirm” urgently",
    "Helps spot mismatches between the visible brand and the underlying domain",
    "Not a substitute for device security updates or official support channels"
  ],
  relatedLinks: related("/phishing-checker")
};

export const emailScamCheckerLanding: SeoToolPageProps = {
  h1: "Email scam checker: validate links before you trust them",
  intro:
    "Many scams start in the inbox: fake invoices, “security alerts”, or shipping notices with malicious links. If you can extract the website URL, Fraudly can help you assess the destination page—not the email headers—so you can decide whether it is safe to proceed.",
  bullets: [
    "Copy the link target (long-press or “copy link”) rather than tapping through blindly",
    "Compare the domain to what you expect from the real company",
    "When in doubt, open the official app or site directly instead of using email links"
  ],
  relatedLinks: related("/email-scam-checker")
};

export const fakeWebsiteCheckerLanding: SeoToolPageProps = {
  h1: "Fake website checker for dubious shops and copycat stores",
  intro:
    "Counterfeit stores often steal product photos, mimic real brands, and hide behind new domains. Fraudly reviews public trust signals and common scam patterns to help you decide whether a shop deserves your payment details.",
  bullets: [
    "Check unknown webshops before you enter card details",
    "Look for transparency issues like missing policies or inconsistent addresses",
    "Pair automated checks with quick searches for independent reviews"
  ],
  relatedLinks: related("/fake-website-checker")
};

export const cryptoScamCheckerLanding: SeoToolPageProps = {
  h1: "Crypto scam checker for risky sites and “guaranteed return” pages",
  intro:
    "Crypto scams frequently use fake exchanges, wallet drainers, and investment pages promising unrealistic returns. Fraudly can help you review a website URL for red flags—but never treat any tool as financial advice or a promise of safety.",
  bullets: [
    "Be especially cautious of sites that push you to connect a wallet quickly",
    "Treat “guaranteed profits” and anonymous teams as major warning signs",
    "Verify projects through multiple independent sources, not a single link"
  ],
  relatedLinks: related("/crypto-scam-checker")
};
