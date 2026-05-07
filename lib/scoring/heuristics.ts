export const DOMAIN_RISKY_KEYWORDS = [
  "cheap",
  "free",
  "deal",
  "verify",
  "secure",
  "security",
  "login",
  "account",
  "wallet",
  "airdrop",
  "reward",
  "refund",
  "payment",
  "auth"
] as const;

export const PHISHING_LURE_WORDS = [
  "security",
  "secure",
  "verify",
  "login",
  "auth",
  "account",
  "check",
  "payment"
] as const;

export const SUSPICIOUS_LEXICAL_PATTERNS = [
  /paypal[-.]?(security|verify|login|account|check)/i,
  /secure[-.]?login/i,
  /verify[-.]?account/i,
  /claim[-.]?(reward|refund)/i,
  /wallet[-.]?connect/i,
  /crypto[-.]?airdrop/i,
  /account[-.]?check/i
] as const;

export const BRAND_RULES: Array<{ brand: string; officialDomains: string[] }> = [
  { brand: "paypal", officialDomains: ["paypal.com"] },
  { brand: "microsoft", officialDomains: ["microsoft.com"] },
  { brand: "google", officialDomains: ["google.com"] },
  { brand: "apple", officialDomains: ["apple.com"] },
  { brand: "amazon", officialDomains: ["amazon.com"] },
  { brand: "netflix", officialDomains: ["netflix.com"] },
  { brand: "meta", officialDomains: [] },
  { brand: "facebook", officialDomains: ["facebook.com"] },
  { brand: "instagram", officialDomains: ["instagram.com"] },
  { brand: "whatsapp", officialDomains: ["whatsapp.com"] },
  { brand: "binance", officialDomains: ["binance.com"] },
  { brand: "coinbase", officialDomains: ["coinbase.com"] },
  { brand: "metamask", officialDomains: [] },
  { brand: "stripe", officialDomains: ["stripe.com"] },
  { brand: "openai", officialDomains: ["openai.com"] },
  { brand: "github", officialDomains: ["github.com"] },
  { brand: "docusign", officialDomains: ["docusign.com"] },
  { brand: "dropbox", officialDomains: ["dropbox.com"] },
  { brand: "adobe", officialDomains: ["adobe.com"] }
];

export const TRUST_CEILINGS = {
  failedTls: 40,
  phishingLexical: 35,
  brandImpersonation: 25,
  lowConfidence: 84
} as const;
