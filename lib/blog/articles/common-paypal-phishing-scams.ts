import { blogHero } from "@/lib/blog/hero-images";
import type { BlogArticleDefinition } from "@/lib/blog/types";

export const commonPaypalPhishingScams: BlogArticleDefinition = {
  slug: "common-paypal-phishing-scams",
  title: "Common PayPal Phishing Scams and How to Avoid Them",
  metaTitle: "PayPal Phishing Scams — Warning Signs & How to Stay Safe",
  metaDescription:
    "Understand PayPal phishing scams: fake login pages, email and SMS lures, urgent verification traps, credential theft, and how to verify suspicious sites with Fraudly.",
  targetKeyword: "PayPal phishing scams",
  category: "Threat Awareness",
  excerpt:
    "PayPal remains one of the most impersonated brands online. Learn how modern phishing campaigns work and how to verify links before you sign in.",
  publishedAt: "2026-05-05T09:00:00.000Z",
  hero: blogHero(
    "common-paypal-phishing-scams",
    "Email and payment phishing awareness illustration with envelope icon on a blue cybersecurity background"
  ),
  intro:
    "PayPal phishing scams succeed because they hijack trust in a familiar brand. Attackers copy login layouts, reference recent transactions you may or may not recognize, and create urgency so you act before thinking. The goal is usually credential theft—username, password, and sometimes payment instruments or two-factor codes. This article explains the most common variants, how to spot them, and how to verify suspicious websites with Fraudly before you enter any details.",
  relatedSlugs: [
    "how-to-check-if-a-website-is-safe",
    "top-warning-signs-of-a-scam-website",
    "how-to-detect-fake-webshops"
  ],
  sections: [
    {
      id: "fake-login",
      title: "Fake PayPal login pages",
      blocks: [
        {
          type: "p",
          text: "Fake login pages mirror PayPal’s design closely. They may be hosted on compromised WordPress sites, newly registered domains, or cloud storage pages wrapped in redirects. The tell is almost always the URL: only `paypal.com` and documented regional subdomains are legitimate for account access. Anything like `paypal-secure-login.net` or `paypa1-verify.shop` is fraudulent."
        },
        {
          type: "p",
          text: "Never authenticate through links in unsolicited messages. Open the PayPal app or type the address yourself. If you already submitted credentials on a suspicious page, change your password from a clean device and review account activity immediately."
        }
      ]
    },
    {
      id: "email",
      title: "Email phishing",
      blocks: [
        {
          type: "p",
          text: "Email lures often claim unauthorized transactions, shipping confirmations for items you did not buy, or policy violations. They include branded headers and footer boilerplate copied from real messages. Check the sender domain—not just the display name—and inspect link destinations before clicking."
        },
        {
          type: "ul",
          items: [
            "Generic greetings (“Dear Customer”) alongside urgent threats",
            "Attachments you did not request (invoices, HTML files)",
            "Buttons that link to domains unrelated to PayPal",
            "Spelling errors in security-critical instructions"
          ]
        }
      ]
    },
    {
      id: "sms",
      title: "SMS phishing (smishing)",
      blocks: [
        {
          type: "p",
          text: "Text messages compress decision time: “Payment of €482 pending—tap to cancel.” Mobile screens hide full URLs, making smishing especially effective. Do not tap; open PayPal independently. Report smishing to your carrier and national fraud reporting channels where available."
        }
      ]
    },
    {
      id: "urgent",
      title: "Urgent verification scams",
      blocks: [
        {
          type: "p",
          text: "“Verify within 24 hours or your account will be limited” is a pressure script designed to bypass skepticism. Real account issues are visible inside the official app without secret links. Scammers also ask for photos of ID cards, cards, or SMS codes—legitimate providers do not request full card images by email."
        }
      ]
    },
    {
      id: "credentials",
      title: "How scammers steal credentials",
      blocks: [
        {
          type: "p",
          text: "Classic phishing captures email and password on a fake form. Advanced flows add fake 2FA prompts, reverse-proxy kits that relay your real OTP to the attacker session, or follow-up calls pretending to be fraud departments. Once inside, criminals send money, buy goods, or harvest stored payment methods."
        },
        {
          type: "p",
          text: "Marketplace scams sometimes combine PayPal branding with fake buyer/seller messages—always confirm payment status inside PayPal itself, not via screenshots sent in chat."
        }
      ]
    },
    {
      id: "warnings",
      title: "Warning signs to remember",
      blocks: [
        {
          type: "ul",
          items: [
            "Links that do not resolve to an official PayPal domain",
            "Requests for passwords, PINs, or authenticator codes by message",
            "Threats of instant closure unless you act immediately",
            "Payments to personal accounts for “buyer protection” myths",
            "Checkout pages that mention PayPal but redirect elsewhere"
          ]
        }
      ]
    },
    {
      id: "marketplace",
      title: "Marketplace and invoice variants",
      blocks: [
        {
          type: "p",
          text: "Beyond login pages, criminals send fake invoices and shipping labels through marketplaces and classifieds sites. The message claims a buyer paid via PayPal and includes a link to “claim” funds. The link leads to a fake form requesting card details or an “upgrade” fee. Real PayPal transactions appear in your account when you log in directly—never through a third-party link sent in chat."
        },
        {
          type: "p",
          text: "Another variant impersonates merchant services, threatening to hold payouts until you “re-verify” business details. Small sellers under time pressure are frequent targets. Keep a written checklist: log in via the app, compare transaction IDs, and call support using the number on PayPal’s official site—not a number in the email."
        }
      ]
    },
    {
      id: "recovery",
      title: "If you already clicked",
      blocks: [
        {
          type: "p",
          text: "Change your password immediately from a device you trust, enable strong two-factor authentication, and review connected email accounts. Check for auto-forwarding rules attackers add to hide password resets. Notify your bank if you entered card data. Report phishing to PayPal through official reporting forms and to national cybercrime portals where you live."
        },
        {
          type: "p",
          text: "Screenshot the phishing URL and message for reports, but do not revisit the page unnecessarily. Sharing indicators helps platforms block campaigns faster."
        }
      ]
    },
    {
      id: "verify",
      title: "How to verify suspicious websites",
      blocks: [
        {
          type: "p",
          text: "Copy the link target (long-press or “copy link address”) and paste it into Fraudly’s [free checker](/#link-check). Review trust and phishing context, then compare with official channels. Explore related examples on [latest checks](/latest-checks) to see how impersonation domains appear in public scans."
        },
        {
          type: "p",
          text: "For general verification habits—HTTPS limits, reputation, malware warnings—read [how to check if a website is safe](/intelligence/how-to-check-if-a-website-is-safe). For storefront fraud that mentions PayPal at checkout, see [how to detect fake webshops](/intelligence/how-to-detect-fake-webshops)."
        },
        {
          type: "p",
          text: "Stay informed via [scam alerts](/scam-alerts) when new PayPal-themed campaigns spike. Fraudly is informational, not affiliated with PayPal—but it helps you decide whether a URL deserves your credentials."
        }
      ]
    }
  ]
};
