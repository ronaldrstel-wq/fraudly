/** English copy templates for programmatic `/domain/[domain]` SEO landing (long-tail queries). Not legal advice disclaimers elsewhere on page. */

export function domainLandingTitleSegment(hostname: string): string {
  return `Is ${hostname} legit? Trust check & scam signals`;
}

export function domainLandingMetaDescription(
  hostname: string,
  trustScore: number | null,
  summarySnippet: string
): string {
  const lead = `${hostname}: is it legit or a scam? Fraudly summarizes public scam intelligence, phishing-style signals, domain reputation cues, SSL, and a trust-oriented score—not a verdict, but fast context before you enter details or pay.`;
  const trust = trustScore === null ? "" : ` Trust-style reading about ${trustScore}/100.`;
  const clipped = summarySnippet.trim();
  const tail =
    clipped.length > 0 ? ` ${clipped.length > 120 ? `${clipped.slice(0, 117).trim()}…` : clipped}` : "";
  const combined = `${lead}${trust}${tail}`;
  return combined.length > 158 ? `${combined.slice(0, 155)}…` : combined;
}

export type DomainLandingFaqItem = {
  /** Display + schema question */
  question: string;
  /** Plain-language answer */
  answer: string;
};

/**
 * Editorial FAQs for schema + rendered content — variable per hostname, avoids thin duplicate boilerplate-only pages.
 */
export function domainLandingIntro(hostname: string): { lead: string; supporting: string } {
  const lead =
    `Shoppers often look up “${hostname} legit”, “${hostname} scam”, or whether a site is phishing before handing over passwords or payments. Fraudly summarizes what public scam feeds, phishing heuristics, SSL behavior, registration context, and model-friendly trust indicators say about ${hostname}—presented calmly so you can triage risk quickly, then drill into receipts if you choose.`;

  const supporting =
    `The answers below clarify how to read Fraudly’s signals. After that you’ll find the structured scan—risk scores, corroborating sources, expandable technical notes. Nothing here is legal advice, credit guidance, or a guarantee of safety—when in doubt pause the transaction and contact the brand via an official route you sourced separately.`;

  return { lead, supporting };
}

export function domainLandingFaq(hostname: string): DomainLandingFaqItem[] {
  return [
    {
      question: `Is ${hostname} legit?`,
      answer: `Fraudly doesn’t certify sites as “legit.” This page combines automated checks and public scam intelligence around ${hostname} into a readable snapshot. Higher trust-style readings mean fewer negative signals surfaced in Fraudly’s model—not proof the business is trustworthy. Always verify payment pages, refunds, reviews on independent channels, and official branding before sharing money or passwords.`
    },
    {
      question: `Is ${hostname} a scam?`,
      answer: `A single automated scan cannot prove fraud. Fraudly flags patterns often seen with phishing sites, dubious shops, malware distribution, or impersonation when matching data exists. Treat strong risk indicators as reasons to pause, use official contact methods, and double-check URLs—not as a courtroom conclusion about ${hostname}.`
    },
    {
      question: `Can I trust ${hostname} for online shopping or logins?`,
      answer: `Use this report as guardrails alongside your judgment: look for mismatched branding, unrealistic prices, urgency tactics, unfamiliar payment rails, broken policies, or requests to bypass normal checkout. Fraudly summarizes technical and feed-based context for ${hostname} so you can decide whether to investigate further—not whether to blindly trust checkout forms.`
    },
    {
      question: `How does Fraudly detect phishing-like behavior for ${hostname}?`,
      answer: `Fraudly layers SSL inspection, hostname and registration context, phishing and malware intel where available, and textual risk scoring from reachable content. Signals are probabilistic—attackers imitate trusted brands. When ${hostname} aligns with curated threat lists or heuristic risk patterns, that context appears in the breakdown below so you understand “why Fraudly surfaced concern.”`
    },
    {
      question: `What does Fraudly mean by a “trust-style score”?`,
      answer: `The score summarizes model-friendly trust indicators versus risk cues for ${hostname}. It is not a banking risk rating or endorsement. Threat overrides (for example Tier‑1 malware lists) may change how the headline reads even when ancillary metrics look middling—always review the explanatory sections underneath the headline.`
    },
    {
      question: `How often should I recheck ${hostname}?`,
      answer: `Websites and scam infrastructure change rapidly. Fraudly refreshes caches periodically—run a fresh check from the homepage before high-stakes actions. If fraud reports spike for looks-like domains nearby ${hostname}, re-verify you are still on the exact hostname you scanned.`
    }
  ];
}
