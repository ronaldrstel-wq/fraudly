/** Shared internal destinations for blog articles (crawlable anchors). */
export const BLOG_INTERNAL = {
  intelligenceIndex: { href: "/intelligence", label: "Fraudly Intelligence" },
  latestChecks: { href: "/latest-checks", label: "Latest website checks" },
  scamAlerts: { href: "/scam-alerts", label: "Scam alerts" },
  websiteScamChecker: { href: "/website-scam-checker", label: "Website scam checker" },
  checkIfSafe: { href: "/check-if-website-is-safe", label: "Check if a website is safe" },
  fakeWebshopCheck: { href: "/fake-webshop-check", label: "Fake webshop check" },
  onlineScamDetector: { href: "/online-scam-detector", label: "Online scam detector" },
  phishingChecker: { href: "/phishing-checker", label: "Phishing checker" },
  homepageChecker: { href: "/#link-check", label: "Free website checker" }
} as const;
