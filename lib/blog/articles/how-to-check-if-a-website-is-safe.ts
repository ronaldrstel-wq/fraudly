import { blogHero } from "@/lib/blog/hero-images";
import type { BlogArticleDefinition } from "@/lib/blog/types";

export const howToCheckIfAWebsiteIsSafe: BlogArticleDefinition = {
  slug: "how-to-check-if-a-website-is-safe",
  title: "How to Check If a Website Is Safe Before You Click or Pay",
  metaTitle: "How to Check If a Website Is Safe — Practical Verification Guide",
  metaDescription:
    "Learn how to check if a website is safe: HTTPS limits, domain age, phishing signs, reviews, trust signals, suspicious URLs, and what Fraudly analyzes for you.",
  targetKeyword: "how to check if a website is safe",
  category: "Fraud Prevention",
  excerpt:
    "HTTPS alone does not mean a site is trustworthy. This guide explains practical checks—technical, reputational, and behavioral—so you can decide whether to trust a link.",
  publishedAt: "2026-05-03T09:00:00.000Z",
  hero: blogHero(
    "how-to-check-if-a-website-is-safe",
    "Website safety shield illustration with verification checkmark on a cybersecurity gradient background"
  ),
  intro:
    "Whether you received a link by email, SMS, or search ad, the question is the same: is this website safe to use? Safety is not binary. A site can be technically sound yet fraudulent, or rough-looking yet legitimate. Effective verification combines quick human checks with structured signals—domain history, phishing patterns, reputation context, and how the page behaves. Below is a practical workflow you can use in under five minutes, plus what Fraudly’s [check if a website is safe](/check-if-website-is-safe) tooling adds when you need a second opinion.",
  relatedSlugs: [
    "how-to-detect-fake-webshops",
    "top-warning-signs-of-a-scam-website",
    "common-paypal-phishing-scams"
  ],
  sections: [
    {
      id: "https",
      title: "HTTPS vs real safety",
      blocks: [
        {
          type: "p",
          text: "HTTPS encrypts traffic between your browser and the server. That is important—it reduces simple eavesdropping—but it does not prove who owns the site. Attackers obtain certificates for phishing domains every day. Seeing a padlock should be baseline hygiene, not a green light to enter passwords or payment details."
        },
        {
          type: "p",
          text: "Check the full hostname carefully. Subdomains can mimic brands (`paypal.security-verify.example.com`). Certificate warnings should be an automatic stop. If a site handles payments or logins, HTTPS is necessary but never sufficient."
        }
      ]
    },
    {
      id: "domain-age",
      title: "Domain age and registration context",
      blocks: [
        {
          type: "p",
          text: "Recently registered domains are over-represented in short-lived scams, especially when paired with luxury goods, crypto giveaways, or account “verification” flows. Established businesses usually have continuity—older domains, consistent DNS, and stable hosting. New domains are not automatically malicious, but they warrant extra scrutiny when the offer is high risk."
        }
      ]
    },
    {
      id: "phishing",
      title: "Scam and phishing indicators",
      blocks: [
        {
          type: "p",
          text: "Phishing pages imitate banks, payment providers, delivery firms, and SaaS login screens. Warning signs include urgent language (“account suspended”), requests for unusual credentials (PIN + SMS code together), and branding that almost matches—but not quite—the real domain. Compare the link destination with official apps or bookmarked sites."
        },
        {
          type: "p",
          text: "For payment-brand targeting, read our guide on [common PayPal phishing scams](/intelligence/common-paypal-phishing-scams). Use Fraudly’s [phishing checker](/phishing-checker) when a message pressures you to act immediately."
        }
      ]
    },
    {
      id: "reviews",
      title: "Reviews and reputation",
      blocks: [
        {
          type: "p",
          text: "Search the domain plus words like scam, refund, or fake. Look for discussions on independent forums and consumer protection sites—not only testimonials hosted on the same domain. Be skeptical of perfect five-star clusters on young shops; see [how scammers fake Trustpilot reviews](/intelligence/how-scammers-fake-trustpilot-reviews) for manipulation patterns."
        }
      ]
    },
    {
      id: "trust-signals",
      title: "Trust signals that actually help",
      blocks: [
        {
          type: "ul",
          items: [
            "Consistent company identity across About, Terms, and footer",
            "Support email on the same domain (not only a web form)",
            "Realistic shipping and returns policies for the product category",
            "Payment processors you recognize, with checkout on expected domains",
            "Alignment between social profiles and the website brand"
          ]
        },
        {
          type: "p",
          text: "Trust signals can be forged, but absence of basic transparency is informative. Legitimate operators expect questions; scammers optimize for speed."
        }
      ]
    },
    {
      id: "urls",
      title: "Suspicious URLs and redirect chains",
      blocks: [
        {
          type: "p",
          text: "Hover links before clicking. URL shorteners, look-alike characters, and nested redirects obscure the final destination. On mobile, long-press to preview. If a marketing email links to one domain but checkout jumps to another without explanation, treat that as elevated risk."
        }
      ]
    },
    {
      id: "malware",
      title: "Malware and phishing warnings",
      blocks: [
        {
          type: "p",
          text: "Browsers and security tools sometimes block known malicious hosts. Heed warnings unless you have a specific, verified reason to proceed. Unexpected download prompts, fake update pop-ups, and “install this codec” messages are classic malware lures—close the tab and scan your device if you interacted."
        },
        {
          type: "p",
          text: "Public threat intelligence also feeds into automated checks. Fraudly surfaces scam and phishing context where available so you are not relying on appearance alone."
        }
      ]
    },
    {
      id: "workflow",
      title: "A five-minute safety workflow",
      blocks: [
        {
          type: "p",
          text: "When time is short, use a repeatable sequence: (1) inspect the URL character by character; (2) open the site in a private window without extensions that inject coupons; (3) search the domain plus scam or refund; (4) verify company details and payment method; (5) run an automated trust check and read the explanation, not only the score. Document the domain if you are buying on behalf of family or a small business—future you will appreciate the paper trail if something fails."
        },
        {
          type: "p",
          text: "High-value purchases deserve a cooling-off period. Sleep on it unless the transaction is truly time-sensitive through an official channel you initiated. Scammers depend on emotional speed; your advantage is patience."
        }
      ]
    },
    {
      id: "fraudly",
      title: "What Fraudly analyzes",
      blocks: [
        {
          type: "p",
          text: "Fraudly aggregates public trust and risk signals for a URL: technical checks, reputation hints, scam-feed matches, and consumer-readable explanations. It is designed for shoppers, professionals, and anyone vetting an unfamiliar link—not as legal advice or a guarantee, but as structured context before you pay or log in."
        },
        {
          type: "p",
          text: "Run a check from the [homepage](/#link-check), explore [latest public checks](/latest-checks), or open the dedicated [online scam detector](/online-scam-detector) landing page. Pair automated output with your own judgment and official channels for high-stakes decisions."
        },
        {
          type: "p",
          text: "If you operate an online store, buyers may check you the same way—transparency reduces friction. If you shop, the goal is simple: confirm the site matches who it claims to be before credentials or money leave your hands."
        }
      ]
    }
  ]
};
