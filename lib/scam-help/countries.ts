import type { ScamHelpCountryCode } from "@/lib/scam-help/detect-country";

export type ReportingLink = {
  name: string;
  description: string;
  url?: string;
  type: "official" | "bank" | "advice";
};

export type ScamHelpFaq = {
  question: string;
  answer: string;
};

export type ScamHelpCountry = {
  code: ScamHelpCountryCode;
  slug: string;
  name: string;
  reportingLinks: ReportingLink[];
  /** Optional extended content for dedicated /scam-help/[slug] pages. */
  detail?: {
    title: string;
    description: string;
    intro: string;
    commonScams: string[];
    faqs: ScamHelpFaq[];
  };
};

export const SCAM_HELP_IMMEDIATE_ACTIONS = [
  "Contact your bank or payment provider immediately if money was sent or card details were shared.",
  "Block or freeze your card if payment details may have been compromised.",
  "Change passwords on accounts that may be affected—start with email and banking.",
  "Enable two-factor authentication on important accounts.",
  "Save screenshots, emails, URLs, order confirmations, and payment proof before pages disappear."
] as const;

export const SCAM_HELP_DISCLAIMER =
  "Fraudly is not a law enforcement agency. We provide informational guidance and links to official reporting organisations.";

const SHARED_COMMON_SCAMS = [
  "Fake webshops and copycat stores",
  "Delivery SMS and parcel phishing",
  "Marketplace payment scams",
  "Crypto and investment scams",
  "Bank phishing and impersonation",
  "Fake customer support"
] as const;

function bankLink(description: string): ReportingLink {
  return {
    name: "Your bank",
    description,
    type: "bank"
  };
}

export const SCAM_HELP_COUNTRIES: ScamHelpCountry[] = [
  {
    code: "NL",
    slug: "netherlands",
    name: "Netherlands",
    reportingLinks: [
      {
        name: "Politie — report crime online",
        description: "Official Dutch police portal for filing a report (aangifte) or reporting internet fraud.",
        url: "https://www.politie.nl/aangifte-of-melding-doen",
        type: "official"
      },
      {
        name: "Fraudehelpdesk",
        description: "National helpdesk for fraud victims with advice and reporting guidance.",
        url: "https://www.fraudehelpdesk.nl/",
        type: "advice"
      },
      {
        name: "ACM ConsuWijzer",
        description: "Consumer authority guidance on online shopping disputes and misleading practices.",
        url: "https://www.consuwijzer.nl/",
        type: "advice"
      },
      {
        name: "Meld Misdaad Anoniem",
        description: "Anonymous tip line when you have information about criminal activity.",
        url: "https://www.meldmisdaadanoniem.nl/",
        type: "official"
      },
      bankLink("Contact your bank via the official app or website—use the number on your card, not links in messages.")
    ],
    detail: {
      title: "Scam help in the Netherlands",
      description:
        "What to do if you were scammed in the Netherlands: report to Politie, Fraudehelpdesk, ACM ConsuWijzer, and your bank.",
      intro:
        "If you lost money or shared personal details in the Netherlands, act quickly. Contact your bank first, then use the official channels below.",
      commonScams: [...SHARED_COMMON_SCAMS, "iDEAL payment redirection scams", "Belastingdienst impersonation"],
      faqs: [
        {
          question: "Should I report a scam to the police in the Netherlands?",
          answer:
            "Yes, if you lost money or shared sensitive data. File via the official Politie portal and keep evidence such as URLs and payment references."
        },
        {
          question: "Can Fraudly recover my money?",
          answer: "No. Fraudly provides informational links only. Your bank and official channels handle recovery."
        },
        {
          question: "What is Fraudehelpdesk?",
          answer: "A Dutch organisation that helps fraud victims with guidance and next steps."
        }
      ]
    }
  },
  {
    code: "GB",
    slug: "united-kingdom",
    name: "United Kingdom",
    reportingLinks: [
      {
        name: "Action Fraud",
        description: "National reporting centre for fraud and cybercrime in England, Wales, and Northern Ireland.",
        url: "https://www.actionfraud.police.uk/",
        type: "official"
      },
      {
        name: "National Cyber Security Centre (NCSC)",
        description: "Official guidance on phishing scams and how to report suspicious messages.",
        url: "https://www.ncsc.gov.uk/collection/phishing-scams",
        type: "official"
      },
      {
        name: "Citizens Advice — scams",
        description: "Practical consumer advice on recognising scams and what to do if you are affected.",
        url: "https://www.citizensadvice.org.uk/consumer/scams/",
        type: "advice"
      },
      {
        name: "FCA ScamSmart",
        description: "Financial Conduct Authority warnings and tools for investment and pension scams.",
        url: "https://www.fca.org.uk/scamsmart",
        type: "advice"
      },
      bankLink("Contact your bank via the official app or website—never use phone numbers from unsolicited messages.")
    ],
    detail: {
      title: "Scam help in the United Kingdom",
      description: "UK scam reporting: Action Fraud, NCSC, Citizens Advice, FCA ScamSmart, and your bank.",
      intro: "Report fraud through Action Fraud and follow NCSC guidance for phishing. Always verify URLs yourself.",
      commonScams: [...SHARED_COMMON_SCAMS, "HMRC tax refund scams", "Royal Mail delivery fee texts"],
      faqs: [
        {
          question: "What is Action Fraud?",
          answer: "The UK national reporting centre for fraud and cybercrime. You receive a crime reference number."
        },
        {
          question: "Does Fraudly report scams for me?",
          answer: "No. Use the official organisations linked on this page."
        }
      ]
    }
  },
  {
    code: "DE",
    slug: "germany",
    name: "Germany",
    reportingLinks: [
      {
        name: "Polizei — online services",
        description: "German police portal for information and reporting options (varies by federal state).",
        url: "https://www.polizei.de/",
        type: "official"
      },
      {
        name: "Verbraucherzentrale",
        description: "Consumer advice on digital fraud, fake shops, and misleading online offers.",
        url: "https://www.verbraucherzentrale.de/wissen/digitale-welt",
        type: "advice"
      },
      {
        name: "BSI — Federal Office for Information Security",
        description: "Official cyber security advice for citizens and businesses in Germany.",
        url: "https://www.bsi.bund.de/",
        type: "official"
      },
      {
        name: "Watchlist Internet",
        description: "Reported scam sites and phishing (German-language resource).",
        url: "https://www.watchlist-internet.at/",
        type: "advice"
      },
      bankLink("Contact your bank via the official app or website listed on your card or contract.")
    ],
    detail: {
      title: "Scam help in Germany",
      description: "Germany scam reporting: Polizei, Verbraucherzentrale, BSI, and your bank.",
      intro: "Report cybercrime to the police and seek consumer advice from Verbraucherzentrale.",
      commonScams: [...SHARED_COMMON_SCAMS, "DHL and Hermes delivery phishing"],
      faqs: [
        {
          question: "Where do I report online fraud in Germany?",
          answer: "Report to the police (Polizei) and keep transaction records. Verbraucherzentrale offers consumer guidance."
        }
      ]
    }
  },
  {
    code: "US",
    slug: "united-states",
    name: "United States",
    reportingLinks: [
      {
        name: "FTC — Report Fraud",
        description: "Federal Trade Commission portal for reporting fraud, scams, and bad business practices.",
        url: "https://reportfraud.ftc.gov/",
        type: "official"
      },
      {
        name: "FBI IC3",
        description: "Internet Crime Complaint Center for online crime including fraud and phishing.",
        url: "https://www.ic3.gov/",
        type: "official"
      },
      {
        name: "CISA — phishing guidance",
        description: "Cybersecurity advice on avoiding phishing and social engineering.",
        url: "https://www.cisa.gov/news-events/news/avoiding-social-engineering-and-phishing-attacks",
        type: "official"
      },
      {
        name: "IdentityTheft.gov",
        description: "Federal resource for identity theft recovery plans and reporting steps.",
        url: "https://www.identitytheft.gov/",
        type: "official"
      },
      bankLink("Contact your bank or card issuer via the phone number on your card or their official mobile app.")
    ],
    detail: {
      title: "Scam help in the United States",
      description: "US scam reporting: FTC, FBI IC3, CISA, IdentityTheft.gov, and your bank.",
      intro: "Report fraud to the FTC and internet crime to the FBI IC3. For identity theft, use IdentityTheft.gov.",
      commonScams: [...SHARED_COMMON_SCAMS, "IRS impersonation", "Zelle and wire transfer fraud"],
      faqs: [
        {
          question: "Should I report to the FTC or FBI?",
          answer: "Consumer fraud to the FTC; internet crime to FBI IC3. Both may apply depending on the incident."
        }
      ]
    }
  },
  {
    code: "BE",
    slug: "belgium",
    name: "Belgium",
    reportingLinks: [
      {
        name: "Belgian Federal Police",
        description: "Official police information and reporting routes for crime and cyber incidents.",
        url: "https://www.police.be/",
        type: "official"
      },
      {
        name: "Safeonweb",
        description: "Belgian awareness centre with guidance on phishing, fraud, and online safety.",
        url: "https://www.safeonweb.be/",
        type: "advice"
      },
      {
        name: "FPS Economy — consumer topics",
        description: "Federal public service consumer information and complaint guidance.",
        url: "https://www.economie.fgov.be/",
        type: "advice"
      },
      bankLink("Contact your bank via the official app or website—do not use links from suspicious messages.")
    ]
  },
  {
    code: "FR",
    slug: "france",
    name: "France",
    reportingLinks: [
      {
        name: "Cybermalveillance.gouv.fr",
        description: "Government cybercrime assistance and reporting guidance for individuals.",
        url: "https://www.cybermalveillance.gouv.fr/",
        type: "official"
      },
      {
        name: "Police — online pre-complaint",
        description: "Official portal to file a pre-complaint (pré-plainte) online.",
        url: "https://www.pre-plaintes.enligne-interieur.gouv.fr/",
        type: "official"
      },
      {
        name: "Signal Conso",
        description: "Government consumer reporting for unfair commercial practices and scams.",
        url: "https://signal.conso.gouv.fr/",
        type: "advice"
      },
      bankLink("Contact your bank through its official app or website only.")
    ]
  },
  {
    code: "ES",
    slug: "spain",
    name: "Spain",
    reportingLinks: [
      {
        name: "National Police (Policía Nacional)",
        description: "Official police portal with information on reporting crime.",
        url: "https://www.policia.es/",
        type: "official"
      },
      {
        name: "INCIBE",
        description: "Spanish national cyber security institute—guidance and incident resources.",
        url: "https://www.incibe.es/",
        type: "official"
      },
      {
        name: "Office of Consumer Affairs",
        description: "Consumer information from the Ministry of Consumer Affairs.",
        url: "https://www.consumo.gob.es/",
        type: "advice"
      },
      bankLink("Contact your bank via the official app or website listed on your card.")
    ]
  },
  {
    code: "IT",
    slug: "italy",
    name: "Italy",
    reportingLinks: [
      {
        name: "Postal and Communications Police",
        description: "Commissariato di Polizia Postale e delle Comunicazioni—online fraud and cybercrime.",
        url: "https://www.commissariatodips.it/",
        type: "official"
      },
      {
        name: "Polizia di Stato",
        description: "National police portal for public safety information.",
        url: "https://www.poliziadistato.it/",
        type: "official"
      },
      {
        name: "Antitrust — consumer portal",
        description: "Consumer protection information from the Italian competition authority.",
        url: "https://www.antitrust.gov.it/",
        type: "advice"
      },
      bankLink("Contact your bank using only the official app or website from your contract or card.")
    ]
  },
  {
    code: "CA",
    slug: "canada",
    name: "Canada",
    reportingLinks: [
      {
        name: "Canadian Anti-Fraud Centre",
        description: "National centre to report fraud and learn about common scams.",
        url: "https://www.antifraudcentre-centreantifraude.ca/",
        type: "official"
      },
      {
        name: "RCMP — cybercrime",
        description: "Royal Canadian Mounted Police resources on fraud and cybercrime.",
        url: "https://www.rcmp-grc.gc.ca/",
        type: "official"
      },
      {
        name: "Get Cyber Safe",
        description: "Government of Canada public awareness on staying safe online.",
        url: "https://www.getcybersafe.gc.ca/",
        type: "advice"
      },
      bankLink("Contact your bank or credit union via their official app or website.")
    ]
  },
  {
    code: "AU",
    slug: "australia",
    name: "Australia",
    reportingLinks: [
      {
        name: "Scamwatch",
        description: "Australian Competition and Consumer Commission scam reporting and alerts.",
        url: "https://www.scamwatch.gov.au/",
        type: "official"
      },
      {
        name: "ReportCyber (ACSC)",
        description: "Australian Cyber Security Centre reporting for cybercrime.",
        url: "https://www.cyber.gov.au/report-a-cybercrime",
        type: "official"
      },
      {
        name: "IDCARE",
        description: "Not-for-profit support for Australians and New Zealanders facing identity and cyber issues.",
        url: "https://www.idcare.org/",
        type: "advice"
      },
      bankLink("Contact your bank via the official app or website—never use links in unexpected texts or emails.")
    ]
  }
];

export type ScamHelpCountrySummary = Pick<ScamHelpCountry, "code" | "slug" | "name" | "reportingLinks"> & {
  hasDetailPage: boolean;
};

export function getScamHelpCountryByCode(code: string): ScamHelpCountry | undefined {
  const normalized = code.toUpperCase();
  return SCAM_HELP_COUNTRIES.find((c) => c.code === normalized);
}

export function getScamHelpCountryBySlug(slug: string): ScamHelpCountry | undefined {
  return SCAM_HELP_COUNTRIES.find((c) => c.slug === slug);
}

/** @deprecated Use getScamHelpCountryBySlug */
export const getScamHelpCountry = getScamHelpCountryBySlug;

export const SCAM_HELP_COUNTRY_SLUGS = SCAM_HELP_COUNTRIES.filter((c) => c.detail).map((c) => c.slug);

export function scamHelpCountryPath(slug: string): string {
  return `/scam-help/${slug}`;
}

export function toCountrySummary(country: ScamHelpCountry): ScamHelpCountrySummary {
  return {
    code: country.code,
    slug: country.slug,
    name: country.name,
    reportingLinks: country.reportingLinks,
    hasDetailPage: Boolean(country.detail)
  };
}
