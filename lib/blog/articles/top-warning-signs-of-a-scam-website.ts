import { blogHero } from "@/lib/blog/hero-images";
import type { BlogArticleDefinition } from "@/lib/blog/types";

export const topWarningSignsOfAScamWebsite: BlogArticleDefinition = {
  slug: "top-warning-signs-of-a-scam-website",
  title: "Top Warning Signs of a Scam Website",
  metaTitle: "Scam Website Warning Signs — Red Flags Checklist",
  metaDescription:
    "Spot scam website warning signs: new domains, extreme discounts, bad grammar, missing company details, fake urgency, stolen images, risky payments, and redirect traps.",
  targetKeyword: "scam website warning signs",
  category: "Scam Intelligence",
  excerpt:
    "Use this checklist of scam website red flags before you pay or log in—from domain age and discount traps to suspicious checkout flows and redirect scams.",
  publishedAt: "2026-05-09T09:00:00.000Z",
  hero: blogHero(
    "top-warning-signs-of-a-scam-website",
    "Illustration of a scam website warning hub with sponsored ad discount lure, risky domain URL, and red-flag checklist"
  ),
  intro:
    "Scam websites evolve, but the same warning signs appear repeatedly. None of these signals is definitive alone—a small business can have typos; a new domain can be legitimate. Risk rises when multiple red flags cluster, especially before high-value purchases or credential entry. Use this checklist during your next unfamiliar link, then confirm with Fraudly’s [online scam detector](/online-scam-detector) and public [latest checks](/latest-checks) feed.",
  relatedSlugs: [
    "how-to-detect-fake-webshops",
    "how-to-check-if-a-website-is-safe",
    "common-paypal-phishing-scams"
  ],
  sections: [
    {
      id: "new-domain",
      title: "New domain with high-pressure offers",
      blocks: [
        {
          type: "p",
          text: "Domains registered recently and promoted aggressively often belong to short-lived fraud campaigns. Pair domain youth with unrealistic merchandise, limited-time banners, and no verifiable corporate history. Established brands rarely need to scream urgency on every page."
        }
      ]
    },
    {
      id: "discounts",
      title: "Extreme discounts",
      blocks: [
        {
          type: "p",
          text: "If everything is 80% off in-demand inventory, ask who funds the margin. Scam sites optimize for conversion, not repeat customers. Compare SKUs with official manufacturers and authorized resellers."
        }
      ]
    },
    {
      id: "grammar",
      title: "Bad grammar and sloppy localization",
      blocks: [
        {
          type: "p",
          text: "Professional retailers proofread core pages. Scam templates rotate languages awkwardly—mixed US/UK spelling, broken product titles, policy pages that reference the wrong brand. One typo is noise; pervasive errors plus payment pressure are a pattern."
        }
      ]
    },
    {
      id: "company",
      title: "No company details",
      blocks: [
        {
          type: "p",
          text: "Missing registered name, VAT ID, or reachable support on-domain suggests the operator does not want accountability. Footer addresses that trace to unrelated businesses or virtual offices without disclosure are common in fraud storefronts."
        }
      ]
    },
    {
      id: "urgency",
      title: "Fake urgency and scarcity",
      blocks: [
        {
          type: "p",
          text: "Countdown timers that reset on refresh, stock counters that never move, and pop-ups claiming “someone just bought” are psychological tools. They are not evidence of demand. Slow decisions beat fast regrets."
        }
      ]
    },
    {
      id: "images",
      title: "Copied product images",
      blocks: [
        {
          type: "p",
          text: "Reverse-image search can reveal photos stolen from major retailers or influencers. Scam catalogs mix mismatched brands, impossible bundles, and watermarked images cropped oddly. Authentic sellers usually show consistent photography style."
        }
      ]
    },
    {
      id: "crypto",
      title: "Crypto and irreversible payment fraud",
      blocks: [
        {
          type: "p",
          text: "Consumer goods scams increasingly demand cryptocurrency, wire transfer, or voucher codes. Any routine ecommerce checkout that refuses reversible card payment for in-stock items is suspect. “PayPal Friends & Family for protection” is a known social-engineering myth."
        }
      ]
    },
    {
      id: "checkout",
      title: "Suspicious checkout flows",
      blocks: [
        {
          type: "p",
          text: "Watch for checkout on a different domain, missing PCI cues you expect from your region, or forms asking for unusual data (full card PIN, photo of card). Legitimate processors keep card entry on recognized domains or embedded frames from known providers."
        }
      ]
    },
    {
      id: "cluster",
      title: "When red flags cluster",
      blocks: [
        {
          type: "p",
          text: "Risk scoring is about combinations. A new domain alone might be a startup; a new domain plus wire-only payment plus stolen images plus fake urgency is a different story. Mentally assign weight: payment irreversibility and credential harvesting are highest severity; cosmetic grammar issues are supporting signals."
        },
        {
          type: "p",
          text: "Teach family members who shop via social ads to pause and send you the link—social engineering targets less technical households with the same templates."
        }
      ]
    },
    {
      id: "redirects",
      title: "Redirect scams",
      blocks: [
        {
          type: "p",
          text: "Malvertising and compromised sites redirect through multiple hops before landing on a phishing or fake shop page. If the URL bar changes repeatedly or parameters look obfuscated, stop. Open retailers via bookmarks instead."
        },
        {
          type: "p",
          text: "Deep-dive guides: [how to check if a website is safe](/intelligence/how-to-check-if-a-website-is-safe), [how to detect fake webshops](/intelligence/how-to-detect-fake-webshops), and [PayPal phishing scams](/intelligence/common-paypal-phishing-scams). Run a URL through the [free checker](/#link-check) and monitor [scam alerts](/scam-alerts) for emerging campaigns."
        }
      ]
    },
    {
      id: "checklist",
      title: "Quick checklist before checkout",
      blocks: [
        {
          type: "ol",
          items: [
            "Domain matches the brand you intend, verified outside the ad link",
            "Company identity and support channels exist on-domain",
            "Payment method offers meaningful buyer protection",
            "Independent reviews mention real product experiences",
            "Automated trust check shows no severe scam-feed or phishing context",
            "You can explain the purchase to a friend in two sentences without urgency"
          ]
        },
        {
          type: "p",
          text: "If you fail more than one item, choose an alternative retailer. The best deal is the one that does not require recovering your money later."
        }
      ]
    }
  ]
};
