/**
 * Plain-English summaries for trust/risk signals shown to consumers.
 */

const RULES: ReadonlyArray<{ pattern: RegExp; summary: string }> = [
  {
    pattern: /\b(tls valid|valid tls|https|ssl|certificate chain|secure connection|encrypt)/i,
    summary: "This website uses a valid secure connection."
  },
  {
    pattern: /\b(rdap|domain age|registered for|registration date|whois)/i,
    summary: "Domain registration details were checked."
  },
  {
    pattern: /\b(young domain|new domain|recently registered|recent registration|domain.*days? old)/i,
    summary: "This domain was registered recently."
  },
  {
    pattern: /\b(openphish|urlhaus|safe browsing|phishing feed|malware feed|police|government warning|scam list|intel feed)/i,
    summary: "This website appears in known scam or phishing reports."
  },
  {
    pattern: /\b(limited|no |missing|unavailable).*(review|reputation|rating)/i,
    summary: "We found limited public reputation data."
  },
  {
    pattern: /\b(review|trustpilot|google|rating|stars)/i,
    summary: "Public review data was found and used as supporting context."
  },
  {
    pattern: /\b(dmarc|spf|mx|email security|mail server)/i,
    summary: "Email settings for this domain were checked."
  },
  {
    pattern: /\b(redirect|cross.?domain)/i,
    summary: "This site redirects to another domain, which we also considered."
  },
  {
    pattern: /\b(subdomain|suspicious.*host)/i,
    summary: "The web address structure was checked for unusual patterns."
  },
  {
    pattern: /\b(contact|phone|address|company)/i,
    summary: "Business contact details on the site were reviewed."
  },
  {
    pattern: /\b(payment|checkout|shop|store|e-?commerce)/i,
    summary: "Shopping and checkout patterns on the site were reviewed."
  },
  {
    pattern: /\b(composite|feed hit|signal weight|impact score)/i,
    summary: "Several automated risk checks contributed to this result."
  }
];

const JARGON = /\b(tls|ssl|rdap|whois|dmarc|spf|mx|urlhaus|openphish|composite|parser|http\/\d|dns|ipv\d)\b/i;

export function consumerSignalSummary(title: string, description?: string): string {
  const blob = `${title} ${description ?? ""}`.trim();
  if (!blob) return "A trust or risk signal was noted in this scan.";

  for (const { pattern, summary } of RULES) {
    if (pattern.test(blob)) return summary;
  }

  const desc = description?.trim();
  if (desc && desc.length <= 160 && !JARGON.test(desc) && !/[{}[\]<>]/.test(desc)) return desc;

  const cleanTitle = title.trim();
  if (cleanTitle.length <= 120 && !JARGON.test(cleanTitle)) return cleanTitle;

  return "A trust or risk signal was noted in this scan.";
}
