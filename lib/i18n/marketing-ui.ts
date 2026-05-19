import type { MarketingUiExtension } from "@/lib/i18n/marketing-ui-types";
import { getCheckFlowMessages } from "@/lib/i18n/check-flow";
import { getRecentSearchesUi } from "@/lib/i18n/recent-searches-ui";
import { getResultFlowMessages } from "@/lib/i18n/result-flow";
import { marketingUiEs } from "@/lib/i18n/marketing-ui-es";
import { marketingUiPt } from "@/lib/i18n/marketing-ui-pt";
import type { Locale } from "@/lib/i18n/locales";

const en: MarketingUiExtension = {
  checkFlow: getCheckFlowMessages("en"),
  resultFlow: getResultFlowMessages("en"),
  common: { languageLabel: "Language" },
  scamAlertsPage: {
    filters: {
      allSeverities: "All severities",
      highRiskOnly: "High risk only",
      highRiskSub: "Uses aggregated alert score",
      malware: "Malware",
      phishing: "Phishing",
      severityTypeLabel: "Severity & type",
      exactTypeLabel: "Exact type:",
      anyType: "Any"
    },
    timeRange: {
      label: "Time range",
      today: "Today",
      todayHint: "Published since midnight UTC today",
      last24h: "Last 24h",
      last24hHint: "Rolling last 24 hours",
      last7d: "Last 7 days",
      last7dHint: "Rolling last seven days",
      allAlerts: "All alerts",
      allAlertsHint: "Every published alert in view",
      helper: "Default shows all published alerts in view. Narrow to Today (UTC) or shorter windows from the URL."
    },
    summary: {
      highScore: "High+ (score ≥ 75)",
      sortByScore: "Sorted by newest publication, then alert score",
      newTodayUtc: "Recently published (UTC)",
      totalPublished: "Total published",
      mostCommonType: "Most common type",
      showing: "Showing",
      zeroPublished: "0 published alerts",
      rangeSingle: "{current} of {total} published alerts",
      rangeSpan: "{start}–{end} of {total} published alerts"
    },
    empty: {
      zeroTitle: "No active scam alerts right now",
      zeroBody:
        "Fraudly continuously checks public threat feeds and recent scans. New alerts will appear here when there is enough evidence to publish them.",
      filteredTitle: "No alerts match this view",
      filteredBody:
        "Try a wider time range (for example “All alerts”) or a different severity filter. Totals above still reflect all published alerts that are currently in view.",
      viewAllTimeCta: "View all published alerts",
      checkWebsiteCta: "Check a website now"
    },
    card: {
      technicalMatchStrength: "Match strength",
      technicalSignals: "Corroborating signals",
      relatedAlertSameDomain: "Related alert · same domain",
      published: "Published",
      updated: "Updated",
      source: "Source",
      unknown: "Unknown",
      domainSr: "Domain:",
      severitySr: "Severity:",
      technicalDetails: "Technical details",
      readFullAlert: "Read full alert →",
      publishedExact: "Published (exact)",
      rawType: "Raw type",
      originalTitle: "Original title",
      domain: "Domain",
      url: "URL"
    },
    pagination: {
      prev: "Previous page",
      prevDisabled: "Previous",
      next: "Next page",
      nextDisabled: "Next",
      page: "Page"
    }
  },
  latestChecksPage: {
    trustScorePillLabel: "Trust Score",
    trustScoreOutOf100Aria: "{label}: {score} out of 100",
    dataConfidenceAria: "Data confidence",
    viewResultArrow: "View result →",
    emptyState:
      "No public checks published yet. As soon as privacy-safe summaries are available, they will appear here so you can see what others are looking up.",
    unavailableState: "Latest checks are temporarily unavailable. You can still check a website above.",
    ctaPrimary: "Run a website check",
    listAria: "Latest public fraud check summaries",
    entityFallback: "Checked item",
    entityLabels: {
      domain: "Domain / website",
      url: "URL",
      company: "Company / brand",
      crypto_wallet: "Crypto wallet",
      username: "Public username / handle"
    },
    pagination: {
      prev: "Previous page",
      prevDisabled: "Previous",
      next: "Next page",
      nextDisabled: "Next",
      page: "Page"
    }
  },
  homeSections: {
    trustActivity: {
      title: "Fraudly is helping users stay safer online",
      subtitle: "AI-assisted scans help identify suspicious websites, phishing attempts, and online scams.",
      footnote: "{count} public checks in the last 30 days — live from Fraudly’s privacy-safe feed.",
      stats: {
        websiteChecksLabel: "Website checks",
        websiteChecksHint: "Public checks in Fraudly’s latest feed.",
        websiteChecksFallback: "Growing",
        threatSignalsLabel: "Threat signals analyzed",
        threatSignalsHint: "Recent checks plus published scam alerts (last 30 days).",
        threatSignalsFallback: "Building",
        buildingHint: "Activity data is still building — check back soon.",
        aiLabel: "AI-assisted analysis",
        aiValue: "24/7",
        aiHint: "Always-on heuristics layered with public intelligence.",
        growingLabel: "Growing daily",
        growingValue: "New scans every day",
        growingValueActive: "Active today",
        growingHint: "Fresh public checks appear as people verify sites.",
        growingHintActive: "{count} public checks in the last 24 hours."
      }
    },
    whatWeCheck: {
      title: "What Fraudly analyzes",
      intro:
        "Fraudly combines trust signals, reputation data, and AI-assisted analysis to help detect suspicious websites.",
      cards: [
        { title: "Website reputation", body: "Public trust cues and review-style reputation signals when they are available—shown with clear limits." },
        { title: "SSL & security checks", body: "HTTPS availability, certificate context, and technical settings that matter for safe browsing." },
        { title: "Domain age & trust", body: "Registration timing and domain history cues that often differ between established and rushed scam sites." },
        { title: "Phishing indicators", body: "Language patterns, urgency tactics, and setup clues commonly seen on phishing and impersonation pages." },
        { title: "Scam reports", body: "Cross-checks against published scam alerts and public threat intelligence where matches exist." },
        { title: "AI risk patterns", body: "Heuristics that surface unusual combinations of signals—helpful when something feels off but is hard to name." }
      ]
    },
    featureCards: [
      { title: "Signals, not noise", description: "Reputation, scam feeds, SSL, domain story, and wording cues—rolled into one readable view." },
      { title: "Seconds, not guesswork", description: "Runs in the browser instantly. No install, no signup required for your first look." },
      { title: "Straight talk", description: "Plain-language guidance with honest limits—Fraudly augments your judgment; it doesn’t replace it." }
    ]
  },
  homeBelowFold: {
    trustSafety: {
      title: "Calm checks for real-life shopping moments",
      body: "Fraudly is a consumer website trust checker for social ads, marketplaces, impulse buys, and “is this URL safe?” seconds. You get structured signals—never shock-value scare copy.",
      bullets: [
        "Scam intelligence layered with reputation, SSL, and historical context",
        "Optional deep scans when you need richer technical + review insight",
        "Public “latest checks” plus threat alerts for wider awareness"
      ],
      featuresCta: "See features",
      learnCta: "Learn about online scams"
    },
    howItWorks: {
      title: "How the check works",
      steps: [
        "Paste a URL before you pay, log in, or tap a sketchy ad.",
        "Fraudly pulls security context, domain history, scam feeds, and reputation hints when they are reachable.",
        "You see a trust score, headline guidance, and expandable detail if you want receipts."
      ],
      footerPrefix: "Curious about the full pipeline? Read",
      footerLinkLabel: "how Fraudly works"
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        {
          question: "Is Fraudly a scam website checker?",
          answer:
            "Yes—Fraudly is built so consumers can sanity-check unfamiliar links. Each run blends scam intelligence feeds, HTTPS and domain cues, lightweight review probes, richer reputation enrichment when it succeeds, and optional AI narration so you aren’t guessing alone."
        },
        {
          question: "Can Fraudly tell me if a website is 100% safe?",
          answer:
            "No automated tool can guarantee safety. Fraudly highlights trustworthy vs. risky indicators in one snapshot—use it alongside common sense and official verification before you spend money or reveal sensitive info."
        },
        {
          question: "How is this different from a basic virus scanner?",
          answer:
            "Fraudly focuses on misleading websites: phishing setups, dubious shops, sloppy SSL posture, shady wording, impersonation cues, curated threat feeds—not just downloadable malware."
        },
        {
          question: "How much does the first check cost?",
          answer: "Your first browser check stays free without an account. Sign up when you’re ready for more scans, alerts, history, or deep analysis credits."
        }
      ]
    },
    testimonials: {
      title: "What people say",
      items: [
        { quote: "Luckily I didn’t buy this product — Fraudly showed me it was a risky site.", name: "Emma" },
        { quote: "I now check every Instagram ad with Fraudly before ordering.", name: "Noah" },
        { quote: "Saved me from buying from a shady sneaker store.", name: "Jason" },
        { quote: "Within seconds I knew that TikTok shop needed a second look.", name: "Mila" },
        { quote: "The ad looked legit. Fraudly showed the red flags clearly.", name: "Olivia" },
        { quote: "Great for double-checking social promos before I buy.", name: "Daan" }
      ]
    },
    bottomCta: {
      title: "Ready to check a link?",
      bodyPrefix: "Run a free scan and share a calm snapshot like",
      bodyLinkLabel: "/check/example.com",
      bodySuffix: "when someone asks, “Does this site look OK?”",
      button: "Check website"
    }
  },
  supportFaq: [
    {
      question: "What is Fraudly?",
      answer:
        "Fraudly helps users analyze websites for possible scam signals, phishing risks, suspicious behavior, and trust indicators using automated intelligence and AI-assisted analysis."
    },
    {
      question: "Does Fraudly guarantee a website is safe?",
      answer:
        "No. Fraudly provides automated informational analysis based on available public and technical signals. Results are not guarantees and users should always use their own judgment."
    },
    {
      question: "How does the trust score work?",
      answer:
        "Fraudly combines multiple technical and reputation-based indicators to generate a trust score that helps users better understand potential online risks."
    },
    {
      question: "Can Fraudly detect phishing websites?",
      answer: "Fraudly helps identify suspicious patterns commonly associated with phishing, impersonation, and scam websites."
    },
    {
      question: "Why can scores change over time?",
      answer: "Website risks and reputation signals can change quickly. Fraudly continuously analyzes new information and public intelligence sources."
    },
    {
      question: "Is Fraudly free to use?",
      answer: "Fraudly currently offers free website safety checks with additional features planned for future releases."
    },
    {
      question: "Does Fraudly store my scans publicly?",
      answer:
        "Some scans may appear anonymously in public activity feeds to improve platform intelligence and transparency. No personal data is intentionally displayed publicly."
    },
    {
      question: "How can I contact support?",
      answer: "You can contact us anytime at support@fraudly.app."
    }
  ],
  recentSearchesUi: getRecentSearchesUi("en")
};

const nl: MarketingUiExtension = {
  checkFlow: getCheckFlowMessages("nl"),
  resultFlow: getResultFlowMessages("nl"),
  common: { languageLabel: "Taal" },
  scamAlertsPage: {
    filters: {
      allSeverities: "Alle niveaus",
      highRiskOnly: "Alleen hoog risico",
      highRiskSub: "Gebruikt geaggregeerde alertscore",
      malware: "Malware",
      phishing: "Phishing",
      severityTypeLabel: "Ernst & type",
      exactTypeLabel: "Exact type:",
      anyType: "Alle"
    },
    timeRange: {
      label: "Tijdsperiode",
      today: "Vandaag",
      todayHint: "Gepubliceerd sinds middernacht UTC vandaag",
      last24h: "Laatste 24 uur",
      last24hHint: "Rollend over de laatste 24 uur",
      last7d: "Laatste 7 dagen",
      last7dHint: "Rollend over de laatste zeven dagen",
      allAlerts: "Alle alerts",
      allAlertsHint: "Elke gepubliceerde alert in beeld",
      helper: "Standaard toont alle gepubliceerde alerts. Verfijn naar Vandaag (UTC) of kortere vensters via de URL."
    },
    summary: {
      highScore: "Hoog+ (score ≥ 75)",
      sortByScore: "Gesorteerd op nieuwste publicatie, dan alertscore",
      newTodayUtc: "Recent gepubliceerd (UTC)",
      totalPublished: "Totaal gepubliceerd",
      mostCommonType: "Meest voorkomend type",
      showing: "Weergave",
      zeroPublished: "0 gepubliceerde alerts",
      rangeSingle: "{current} van {total} gepubliceerde alerts",
      rangeSpan: "{start}–{end} van {total} gepubliceerde alerts"
    },
    empty: {
      zeroTitle: "Geen actieve scamalerts op dit moment",
      zeroBody:
        "Fraudly controleert continu openbare dreigingsfeeds en recente scans. Nieuwe alerts verschijnen hier zodra er genoeg bewijs is om ze te publiceren.",
      filteredTitle: "Geen alerts passen bij dit overzicht",
      filteredBody:
        "Probeer een bredere periode (bijv. “Alle alerts”) of een ander ernstfilter. Totalen hierboven blijven alle gepubliceerde alerts weergeven.",
      viewAllTimeCta: "Bekijk alle gepubliceerde alerts",
      checkWebsiteCta: "Controleer nu een website"
    },
    card: {
      technicalMatchStrength: "Matchsterkte",
      technicalSignals: "Ondersteunende signalen",
      relatedAlertSameDomain: "Gerelateerde melding · zelfde domein",
      published: "Gepubliceerd",
      updated: "Bijgewerkt",
      source: "Bron",
      unknown: "Onbekend",
      domainSr: "Domein:",
      severitySr: "Ernst:",
      technicalDetails: "Technische details",
      readFullAlert: "Volledige melding lezen →",
      publishedExact: "Gepubliceerd (exact)",
      rawType: "Ruwe type",
      originalTitle: "Originele titel",
      domain: "Domein",
      url: "URL"
    },
    pagination: {
      prev: "Vorige pagina",
      prevDisabled: "Vorige",
      next: "Volgende pagina",
      nextDisabled: "Volgende",
      page: "Pagina"
    }
  },
  latestChecksPage: {
    trustScorePillLabel: "Vertrouwensscore",
    trustScoreOutOf100Aria: "{label}: {score} van 100",
    dataConfidenceAria: "Datavertrouwen",
    viewResultArrow: "Bekijk resultaat →",
    emptyState:
      "Nog geen openbare checks gepubliceerd. Zodra privacyveilige samenvattingen beschikbaar zijn, verschijnen ze hier.",
    unavailableState: "Laatste checks zijn tijdelijk niet beschikbaar. Je kunt hierboven nog steeds een website controleren.",
    ctaPrimary: "Start een websitecheck",
    listAria: "Laatste openbare fraud-samenvattingen",
    entityFallback: "Gecontroleerd item",
    entityLabels: {
      domain: "Domein / website",
      url: "URL",
      company: "Bedrijf / merk",
      crypto_wallet: "Crypto-wallet",
      username: "Gebruikersnaam / handle"
    },
    pagination: {
      prev: "Vorige pagina",
      prevDisabled: "Vorige",
      next: "Volgende pagina",
      nextDisabled: "Volgende",
      page: "Pagina"
    }
  },
  homeSections: {
    trustActivity: {
      title: "Fraudly helpt gebruikers veiliger online blijven",
      subtitle: "AI-ondersteunde scans helpen verdachte websites, phishing en online scams te herkennen.",
      footnote: "{count} openbare checks in de laatste 30 dagen — live uit Fraudly’s privacyveilige feed.",
      stats: {
        websiteChecksLabel: "Websitechecks",
        websiteChecksHint: "Openbare checks in Fraudly’s laatste feed.",
        websiteChecksFallback: "Groeiend",
        threatSignalsLabel: "Dreigingssignalen geanalyseerd",
        threatSignalsHint: "Recente checks plus gepubliceerde scamalerts (30 dagen).",
        threatSignalsFallback: "Opbouwend",
        buildingHint: "Activiteitsdata wordt nog opgebouwd — kom later terug.",
        aiLabel: "AI-ondersteunde analyse",
        aiValue: "24/7",
        aiHint: "Altijd actieve heuristiek met openbare intelligence.",
        growingLabel: "Dagelijks groeiend",
        growingValue: "Nieuwe scans elke dag",
        growingValueActive: "Actief vandaag",
        growingHint: "Verse openbare checks verschijnen als mensen sites controleren.",
        growingHintActive: "{count} openbare checks in de laatste 24 uur."
      }
    },
    whatWeCheck: {
      title: "Wat Fraudly analyseert",
      intro: "Fraudly combineert vertrouwenssignalen, reputatie en AI-analyse om verdachte websites te detecteren.",
      cards: [
        { title: "Website-reputatie", body: "Openbare vertrouwens- en review-signalen waar beschikbaar — met duidelijke grenzen." },
        { title: "SSL & beveiliging", body: "HTTPS, certificaatcontext en technische instellingen die tellen voor veilig browsen." },
        { title: "Domeinleeftijd & vertrouwen", body: "Registratie-timing en domeingeschiedenis — vaak verschillend bij scams." },
        { title: "Phishing-indicatoren", body: "Taalpatronen, urgentie en opzet die vaak bij phishing en impersonatie horen." },
        { title: "Scammeldingen", body: "Afstemming met gepubliceerde scamalerts en openbare dreigingsinformatie." },
        { title: "AI-risicopatronen", body: "Heuristiek voor ongebruikelijke combinaties van signalen." }
      ]
    },
    featureCards: [
      { title: "Signalen, geen ruis", description: "Reputatie, scamfeeds, SSL, domeinverhaal en taal — in één leesbaar overzicht." },
      { title: "Seconden, geen giswerk", description: "Direct in de browser. Geen installatie, geen account voor je eerste check." },
      { title: "Eerlijke taal", description: "Duidelijke uitleg met eerlijke grenzen — Fraudly ondersteunt je oordeel." }
    ]
  },
  homeBelowFold: {
    trustSafety: {
      title: "Rustige checks voor echte koopmomenten",
      body: "Fraudly is een consumenten-checker voor social ads, marktplaatsen en “is deze URL veilig?”-momenten. Gestructureerde signalen — geen angstcopy.",
      bullets: [
        "Scam-intelligentie met reputatie, SSL en historische context",
        "Optionele diepe scans voor rijkere technische + review-inzichten",
        "Openbare “laatste checks” plus dreigingsalerts voor breder bewustzijn"
      ],
      featuresCta: "Bekijk functies",
      learnCta: "Leer over online scams"
    },
    howItWorks: {
      title: "Hoe de check werkt",
      steps: [
        "Plak een URL voordat je betaalt, inlogt of op een verdachte advertentie tikt.",
        "Fraudly haalt beveiligingscontext, domeingeschiedenis, scamfeeds en reputatie op waar mogelijk.",
        "Je ziet een vertrouwensscore, kopadvies en optioneel detail."
      ],
      footerPrefix: "Meer over het volledige proces? Lees",
      footerLinkLabel: "hoe Fraudly werkt"
    },
    faq: {
      title: "Veelgestelde vragen",
      items: en.homeBelowFold.faq.items.map((item, i) =>
        i === 0
          ? {
              question: "Is Fraudly een scam-websitechecker?",
              answer:
                "Ja — Fraudly helpt consumenten onbekende links te controleren met scamfeeds, HTTPS- en domeinsignalen, lichte review-probes en optionele AI-uitleg."
            }
          : i === 1
            ? {
                question: "Zegt Fraudly dat een site 100% veilig is?",
                answer:
                  "Geen enkele tool kan veiligheid garanderen. Gebruik Fraudly naast gezond verstand en officiële verificatie vóór je geld uitgeeft."
              }
            : i === 2
              ? {
                  question: "Hoe verschilt dit van een virusscanner?",
                  answer:
                    "Fraudly richt zich op misleidende websites: phishing, dubieuze shops, SSL-problemen en scamfeeds — niet alleen malware-downloads."
                }
              : {
                  question: "Wat kost de eerste check?",
                  answer: "Je eerste browsercheck is gratis zonder account. Registreer voor meer scans, alerts en geschiedenis."
                }
      )
    },
    testimonials: {
      title: "Wat mensen zeggen",
      items: [
        { quote: "Gelukkig heb ik dit product niet gekocht — Fraudly toonde een riskante site.", name: "Emma" },
        { quote: "Ik check elke Instagram-advertentie nu eerst met Fraudly.", name: "Noah" },
        { quote: "Heeft me gered van een dubieuze sneakerwinkel.", name: "Jason" },
        { quote: "Binnen seconden wist ik dat die TikTok-shop een tweede blik nodig had.", name: "Mila" },
        { quote: "De advertentie leek echt. Fraudly toonde de rode vlaggen.", name: "Olivia" },
        { quote: "Handig om social-promo’s te dubbelchecken vóór ik koop.", name: "Daan" }
      ]
    },
    bottomCta: {
      title: "Klaar om een link te checken?",
      bodyPrefix: "Doe een gratis scan en deel een rustig overzicht zoals",
      bodyLinkLabel: "/check/voorbeeld.nl",
      bodySuffix: "als iemand vraagt: “Lijkt deze site OK?”",
      button: "Website controleren"
    }
  },
  supportFaq: [
    {
      question: "Wat is Fraudly?",
      answer:
        "Fraudly helpt websites te analyseren op mogelijke scam-signalen, phishing, verdacht gedrag en vertrouwensindicatoren met geautomatiseerde en AI-ondersteunde analyse."
    },
    {
      question: "Garandeert Fraudly dat een website veilig is?",
      answer:
        "Nee. Fraudly biedt geautomatiseerde informatieve analyse op basis van beschikbare signalen. Resultaten zijn geen garanties."
    },
    {
      question: "Hoe werkt de vertrouwensscore?",
      answer: "Fraudly combineert technische en reputatie-indicatoren tot een score die online risico’s verduidelijkt."
    },
    {
      question: "Kan Fraudly phishing detecteren?",
      answer: "Fraudly helpt verdachte patronen te herkennen die vaak bij phishing, impersonatie en scams horen."
    },
    {
      question: "Waarom veranderen scores in de tijd?",
      answer: "Risico’s en reputatie kunnen snel veranderen. Fraudly analyseert continu nieuwe informatie."
    },
    {
      question: "Is Fraudly gratis?",
      answer: "Fraudly biedt nu gratis websitechecks; extra functies komen later."
    },
    {
      question: "Slaat Fraudly mijn scans openbaar op?",
      answer: "Sommige scans kunnen anoniem in openbare feeds verschijnen. Er wordt geen persoonsdata bewust getoond."
    },
    {
      question: "Hoe neem ik contact op met support?",
      answer: "Mail ons op support@fraudly.app."
    }
  ],
  recentSearchesUi: getRecentSearchesUi("nl")
};

// DE and FR: provide full translations (abbreviated structure same as nl)
const de: MarketingUiExtension = {
  ...nl,
  resultFlow: getResultFlowMessages("de"),
  recentSearchesUi: getRecentSearchesUi("de"),
  common: { languageLabel: "Sprache" },
  scamAlertsPage: {
    ...nl.scamAlertsPage,
    filters: {
      allSeverities: "Alle Stufen",
      highRiskOnly: "Nur hohes Risiko",
      highRiskSub: "Nutzt aggregierten Alert-Score",
      malware: "Malware",
      phishing: "Phishing",
      severityTypeLabel: "Schwere & Typ",
      exactTypeLabel: "Exakter Typ:",
      anyType: "Alle"
    },
    timeRange: {
      label: "Zeitraum",
      today: "Heute",
      todayHint: "Veröffentlicht seit Mitternacht UTC heute",
      last24h: "Letzte 24 Std.",
      last24hHint: "Rollierend letzte 24 Stunden",
      last7d: "Letzte 7 Tage",
      last7dHint: "Rollierend letzte sieben Tage",
      allAlerts: "Alle Alerts",
      allAlertsHint: "Jeder veröffentlichte Alert in der Ansicht",
      helper: "Standard zeigt alle veröffentlichten Alerts. Enger über URL auf Heute (UTC) oder kürzere Fenster."
    },
    summary: {
      highScore: "Hoch+ (Score ≥ 75)",
      sortByScore: "Sortiert nach Veröffentlichung, dann Alert-Score",
      newTodayUtc: "Kürzlich veröffentlicht (UTC)",
      totalPublished: "Gesamt veröffentlicht",
      mostCommonType: "Häufigster Typ",
      showing: "Anzeige",
      zeroPublished: "0 veröffentlichte Alerts",
      rangeSingle: "{current} von {total} veröffentlichten Alerts",
      rangeSpan: "{start}–{end} von {total} veröffentlichten Alerts"
    },
    empty: {
      zeroTitle: "Derzeit keine aktiven Scam-Alerts",
      zeroBody:
        "Fraudly prüft kontinuierlich öffentliche Feeds und Scans. Neue Alerts erscheinen hier bei ausreichenden Belegen.",
      filteredTitle: "Keine Alerts passen zu dieser Ansicht",
      filteredBody: "Versuchen Sie einen breiteren Zeitraum (z. B. „Alle Alerts“) oder einen anderen Filter.",
      viewAllTimeCta: "Alle veröffentlichten Alerts anzeigen",
      checkWebsiteCta: "Jetzt Website prüfen"
    },
    card: {
      technicalMatchStrength: "Match-Stärke",
      technicalSignals: "Bestätigende Signale",
      relatedAlertSameDomain: "Verwandte Meldung · gleiche Domain",
      published: "Veröffentlicht",
      updated: "Aktualisiert",
      source: "Quelle",
      unknown: "Unbekannt",
      domainSr: "Domain:",
      severitySr: "Schweregrad:",
      technicalDetails: "Technische Details",
      readFullAlert: "Vollständige Meldung lesen →",
      publishedExact: "Veröffentlicht (exakt)",
      rawType: "Roh-Typ",
      originalTitle: "Originaltitel",
      domain: "Domain",
      url: "URL"
    },
    pagination: { prev: "Vorherige Seite", prevDisabled: "Zurück", next: "Nächste Seite", nextDisabled: "Weiter", page: "Seite" }
  },
  latestChecksPage: {
    ...nl.latestChecksPage,
    trustScorePillLabel: "Vertrauenswert",
    trustScoreOutOf100Aria: "{label}: {score} von 100",
    dataConfidenceAria: "Datenvertrauen",
    viewResultArrow: "Ergebnis ansehen →",
    emptyState: "Noch keine öffentlichen Checks veröffentlicht. Sobald Datenschutz-sichere Zusammenfassungen verfügbar sind, erscheinen sie hier.",
    unavailableState: "Neueste Checks vorübergehend nicht verfügbar. Sie können oben weiter eine Website prüfen.",
    ctaPrimary: "Website-Check starten",
    listAria: "Neueste öffentliche Fraud-Zusammenfassungen",
    entityFallback: "Geprüftes Element",
    entityLabels: {
      domain: "Domain / Website",
      url: "URL",
      company: "Unternehmen / Marke",
      crypto_wallet: "Krypto-Wallet",
      username: "Benutzername / Handle"
    },
    pagination: { prev: "Vorherige Seite", prevDisabled: "Zurück", next: "Nächste Seite", nextDisabled: "Weiter", page: "Seite" }
  },
  homeSections: {
    trustActivity: {
      title: "Fraudly hilft Nutzern, online sicherer zu bleiben",
      subtitle: "KI-gestützte Scans erkennen verdächtige Websites, Phishing und Online-Betrug.",
      footnote: "{count} öffentliche Checks in den letzten 30 Tagen — live aus Fraudlys datenschutzfreundlichem Feed.",
      stats: {
        websiteChecksLabel: "Website-Checks",
        websiteChecksHint: "Öffentliche Checks im neuesten Fraudly-Feed.",
        websiteChecksFallback: "Wächst",
        threatSignalsLabel: "Bedrohungssignale analysiert",
        threatSignalsHint: "Aktuelle Checks plus Scam-Alerts (30 Tage).",
        threatSignalsFallback: "Im Aufbau",
        buildingHint: "Aktivitätsdaten werden noch aufgebaut.",
        aiLabel: "KI-gestützte Analyse",
        aiValue: "24/7",
        aiHint: "Dauerhafte Heuristiken mit öffentlicher Intelligence.",
        growingLabel: "Täglich wachsend",
        growingValue: "Neue Scans jeden Tag",
        growingValueActive: "Heute aktiv",
        growingHint: "Frische öffentliche Checks erscheinen laufend.",
        growingHintActive: "{count} öffentliche Checks in den letzten 24 Stunden."
      }
    },
    whatWeCheck: {
      title: "Was Fraudly analysiert",
      intro: "Fraudly kombiniert Vertrauenssignale, Reputation und KI-Analyse für verdächtige Websites.",
      cards: [
        { title: "Website-Reputation", body: "Öffentliche Vertrauens- und Review-Signale — mit klaren Grenzen." },
        { title: "SSL & Sicherheit", body: "HTTPS, Zertifikatskontext und relevante technische Einstellungen." },
        { title: "Domain-Alter & Vertrauen", body: "Registrierung und Historie — oft unterschiedlich bei Scams." },
        { title: "Phishing-Indikatoren", body: "Sprache, Dringlichkeit und typische Phishing-Muster." },
        { title: "Scam-Meldungen", body: "Abgleich mit veröffentlichten Scam-Alerts und Threat Intelligence." },
        { title: "KI-Risikomuster", body: "Heuristiken für ungewöhnliche Signalkombinationen." }
      ]
    },
    featureCards: [
      { title: "Signale statt Rauschen", description: "Reputation, Scam-Feeds, SSL und Domain — in einer lesbaren Ansicht." },
      { title: "Sekunden statt Raten", description: "Sofort im Browser. Keine Installation für den ersten Check." },
      { title: "Klare Sprache", description: "Verständliche Hinweise mit ehrlichen Grenzen." }
    ]
  },
  homeBelowFold: {
    trustSafety: {
      title: "Ruhige Checks für echte Einkaufsmomente",
      body: "Fraudly ist ein Verbraucher-Trust-Checker für Social Ads, Marktplätze und „Ist diese URL sicher?“ — strukturierte Signale ohne Angstcopy.",
      bullets: [
        "Scam-Intelligence mit Reputation, SSL und historischem Kontext",
        "Optionale Deep Scans für mehr technische Einblicke",
        "Öffentliche „neueste Checks“ plus Threat Alerts"
      ],
      featuresCta: "Funktionen ansehen",
      learnCta: "Über Online-Betrug lernen"
    },
    howItWorks: {
      title: "So funktioniert der Check",
      steps: [
        "URL einfügen, bevor Sie zahlen, sich anmelden oder auf eine verdächtige Anzeige tippen.",
        "Fraudly holt Sicherheitskontext, Domain-Historie, Scam-Feeds und Reputation.",
        "Sie sehen Trust-Score, Kurzfassung und optional Details."
      ],
      footerPrefix: "Mehr zum Ablauf? Lesen Sie",
      footerLinkLabel: "wie Fraudly funktioniert"
    },
    faq: {
      title: "Häufig gestellte Fragen",
      items: [
        {
          question: "Ist Fraudly ein Scam-Website-Checker?",
          answer: "Ja — Fraudly hilft, unbekannte Links mit Scam-Feeds, HTTPS-/Domain-Signalen und optionaler KI-Erklärung zu prüfen."
        },
        {
          question: "Garantiert Fraudly 100 % Sicherheit?",
          answer: "Kein Tool kann das. Nutzen Sie Fraudly zusätzlich zu gesundem Menschenverstand und offizieller Verifikation."
        },
        {
          question: "Unterschied zu einem Virenscanner?",
          answer: "Fraudly fokussiert irreführende Websites: Phishing, dubiose Shops, SSL und Scam-Feeds — nicht nur Malware-Downloads."
        },
        { question: "Was kostet der erste Check?", answer: "Der erste Browser-Check ist kostenlos ohne Konto." }
      ]
    },
    testimonials: {
      title: "Was Nutzer sagen",
      items: [
        { quote: "Gut, dass ich nicht gekauft habe — Fraudly zeigte eine riskante Seite.", name: "Emma" },
        { quote: "Ich prüfe jetzt jede Instagram-Anzeige mit Fraudly.", name: "Noah" },
        { quote: "Hat mich vor einem zwielichtigen Sneaker-Shop bewahrt.", name: "Jason" },
        { quote: "In Sekunden wusste ich: dieser TikTok-Shop braucht einen zweiten Blick.", name: "Mila" },
        { quote: "Die Anzeige wirkte echt. Fraudly zeigte die roten Flaggen.", name: "Olivia" },
        { quote: "Praktisch für Social-Promos vor dem Kauf.", name: "Daan" }
      ]
    },
    bottomCta: {
      title: "Bereit, einen Link zu prüfen?",
      bodyPrefix: "Kostenlosen Scan starten und ein ruhiges Ergebnis teilen wie",
      bodyLinkLabel: "/check/beispiel.de",
      bodySuffix: "wenn jemand fragt: „Sieht die Seite OK aus?“",
      button: "Website prüfen"
    }
  },
  supportFaq: nl.supportFaq.map((item, i) => {
    const deItems = [
      ["Was ist Fraudly?", "Fraudly analysiert Websites auf Scam-Signale, Phishing und Vertrauensindikatoren mit automatisierter und KI-gestützter Analyse."],
      ["Garantiert Fraudly Sicherheit?", "Nein. Ergebnisse sind informative Einschätzungen, keine Garantien."],
      ["Wie funktioniert der Trust-Score?", "Fraudly kombiniert technische und Reputations-Indikatoren zu einem verständlichen Score."],
      ["Erkennt Fraudly Phishing?", "Fraudly hilft, typische Phishing- und Betrugs-Muster zu erkennen."],
      ["Warum ändern sich Scores?", "Risiken und Reputation können sich schnell ändern."],
      ["Ist Fraudly kostenlos?", "Aktuell kostenlose Website-Checks; weitere Funktionen folgen."],
      ["Werden Scans öffentlich gespeichert?", "Einige Scans können anonym in öffentlichen Feeds erscheinen."],
      ["Support kontaktieren?", "E-Mail an support@fraudly.app."]
    ] as const;
    return { question: deItems[i][0], answer: deItems[i][1] };
  })
};

const fr: MarketingUiExtension = {
  ...nl,
  resultFlow: getResultFlowMessages("fr"),
  recentSearchesUi: getRecentSearchesUi("fr"),
  common: { languageLabel: "Langue" },
  scamAlertsPage: {
    ...nl.scamAlertsPage,
    filters: {
      allSeverities: "Tous les niveaux",
      highRiskOnly: "Risque élevé uniquement",
      highRiskSub: "Utilise le score d’alerte agrégé",
      malware: "Malware",
      phishing: "Phishing",
      severityTypeLabel: "Gravité et type",
      exactTypeLabel: "Type exact :",
      anyType: "Tous"
    },
    timeRange: {
      label: "Période",
      today: "Aujourd’hui",
      todayHint: "Publié depuis minuit UTC aujourd’hui",
      last24h: "24 dernières h",
      last24hHint: "Fenêtre glissante 24 h",
      last7d: "7 derniers jours",
      last7dHint: "Fenêtre glissante sept jours",
      allAlerts: "Toutes les alertes",
      allAlertsHint: "Chaque alerte publiée visible",
      helper: "Par défaut, toutes les alertes publiées. Affinez via l’URL (Aujourd’hui UTC, etc.)."
    },
    summary: {
      highScore: "Élevé+ (score ≥ 75)",
      sortByScore: "Tri par publication récente, puis score",
      newTodayUtc: "Récemment publié (UTC)",
      totalPublished: "Total publié",
      mostCommonType: "Type le plus fréquent",
      showing: "Affichage",
      zeroPublished: "0 alertes publiées",
      rangeSingle: "{current} sur {total} alertes publiées",
      rangeSpan: "{start}–{end} sur {total} alertes publiées"
    },
    empty: {
      zeroTitle: "Aucune alerte scam active pour l’instant",
      zeroBody: "Fraudly surveille en continu les flux publics. De nouvelles alertes apparaîtront ici avec assez de preuves.",
      filteredTitle: "Aucune alerte ne correspond à cette vue",
      filteredBody: "Essayez une période plus large (ex. « Toutes les alertes ») ou un autre filtre.",
      viewAllTimeCta: "Voir toutes les alertes publiées",
      checkWebsiteCta: "Vérifier un site maintenant"
    },
    card: {
      technicalMatchStrength: "Force de correspondance",
      technicalSignals: "Signaux corroborants",
      relatedAlertSameDomain: "Alerte liée · même domaine",
      published: "Publié",
      updated: "Mis à jour",
      source: "Source",
      unknown: "Inconnu",
      domainSr: "Domaine :",
      severitySr: "Gravité :",
      technicalDetails: "Détails techniques",
      readFullAlert: "Lire l’alerte complète →",
      publishedExact: "Publié (exact)",
      rawType: "Type brut",
      originalTitle: "Titre original",
      domain: "Domaine",
      url: "URL"
    },
    pagination: { prev: "Page précédente", prevDisabled: "Précédent", next: "Page suivante", nextDisabled: "Suivant", page: "Page" }
  },
  latestChecksPage: {
    ...nl.latestChecksPage,
    trustScorePillLabel: "Score de confiance",
    trustScoreOutOf100Aria: "{label} : {score} sur 100",
    dataConfidenceAria: "Confiance des données",
    viewResultArrow: "Voir le résultat →",
    emptyState: "Aucun contrôle public publié pour l’instant. Les résumés apparaîtront ici dès qu’ils seront disponibles.",
    unavailableState: "Derniers contrôles temporairement indisponibles. Vous pouvez encore vérifier un site ci-dessus.",
    ctaPrimary: "Lancer un contrôle",
    listAria: "Derniers résumés publics de fraud checks",
    entityFallback: "Élément vérifié",
    entityLabels: {
      domain: "Domaine / site",
      url: "URL",
      company: "Entreprise / marque",
      crypto_wallet: "Portefeuille crypto",
      username: "Nom d’utilisateur / handle"
    },
    pagination: { prev: "Page précédente", prevDisabled: "Précédent", next: "Page suivante", nextDisabled: "Suivant", page: "Page" }
  },
  homeSections: {
    trustActivity: {
      title: "Fraudly aide les utilisateurs à rester plus sûrs en ligne",
      subtitle: "Des scans assistés par IA pour repérer sites suspects, phishing et arnaques.",
      footnote: "{count} contrôles publics sur 30 jours — flux respectueux de la vie privée.",
      stats: {
        websiteChecksLabel: "Contrôles de sites",
        websiteChecksHint: "Contrôles publics dans le flux Fraudly.",
        websiteChecksFallback: "En croissance",
        threatSignalsLabel: "Signaux de menace analysés",
        threatSignalsHint: "Contrôles récents + alertes scam (30 jours).",
        threatSignalsFallback: "En construction",
        buildingHint: "Les données d’activité se construisent encore.",
        aiLabel: "Analyse assistée par IA",
        aiValue: "24/7",
        aiHint: "Heuristiques continues + renseignement public.",
        growingLabel: "Croissance quotidienne",
        growingValue: "Nouveaux scans chaque jour",
        growingValueActive: "Actif aujourd’hui",
        growingHint: "De nouveaux contrôles publics apparaissent en continu.",
        growingHintActive: "{count} contrôles publics sur les dernières 24 h."
      }
    },
    whatWeCheck: {
      title: "Ce que Fraudly analyse",
      intro: "Fraudly combine signaux de confiance, réputation et analyse IA pour détecter les sites suspects.",
      cards: [
        { title: "Réputation du site", body: "Signaux publics de confiance et d’avis — avec limites claires." },
        { title: "SSL et sécurité", body: "HTTPS, certificats et réglages techniques importants." },
        { title: "Âge du domaine", body: "Historique d’enregistrement — souvent différent sur les arnaques." },
        { title: "Indicateurs de phishing", body: "Langage, urgence et schémas typiques d’usurpation." },
        { title: "Signalements scam", body: "Recoupement avec alertes publiées et renseignement public." },
        { title: "Modèles de risque IA", body: "Heuristiques pour combinaisons de signaux inhabituelles." }
      ]
    },
    featureCards: [
      { title: "Des signaux, pas du bruit", description: "Réputation, flux scam, SSL et domaine — en une vue lisible." },
      { title: "Des secondes, pas du hasard", description: "Dans le navigateur. Pas d’installation pour le premier contrôle." },
      { title: "Langage clair", description: "Conseils honnêtes avec limites transparentes." }
    ]
  },
  homeBelowFold: {
    trustSafety: {
      title: "Des contrôles calmes pour vos achats",
      body: "Fraudly est un vérificateur de confiance pour pubs sociales, marketplaces et « cette URL est-elle sûre ? » — des signaux structurés, sans peur.",
      bullets: [
        "Intelligence scam + réputation, SSL et contexte historique",
        "Scans approfondis optionnels pour plus de détail technique",
        "« Derniers contrôles » publics et alertes menaces"
      ],
      featuresCta: "Voir les fonctionnalités",
      learnCta: "En savoir plus sur les arnaques"
    },
    howItWorks: {
      title: "Comment fonctionne le contrôle",
      steps: [
        "Collez une URL avant de payer, vous connecter ou cliquer une pub douteuse.",
        "Fraudly récupère contexte sécurité, historique, flux scam et réputation.",
        "Vous voyez un score, un résumé et des détails optionnels."
      ],
      footerPrefix: "Le pipeline complet ? Lisez",
      footerLinkLabel: "comment Fraudly fonctionne"
    },
    faq: {
      title: "Questions fréquentes",
      items: [
        { question: "Fraudly est-il un vérificateur d’arnaques ?", answer: "Oui — pour contrôler des liens inconnus avec flux scam, signaux HTTPS/domaine et explication IA optionnelle." },
        { question: "Fraudly garantit-il 100 % de sécurité ?", answer: "Aucun outil ne le peut. Utilisez Fraudly avec le bon sens et une vérification officielle." },
        { question: "Différence avec un antivirus ?", answer: "Fraudly cible les sites trompeurs : phishing, boutiques douteuses, SSL, flux scam — pas seulement les malwares." },
        { question: "Coût du premier contrôle ?", answer: "Le premier contrôle navigateur est gratuit sans compte." }
      ]
    },
    testimonials: {
      title: "Ce qu’en disent les utilisateurs",
      items: [
        { quote: "Heureusement je n’ai pas acheté — Fraudly a montré un site risqué.", name: "Emma" },
        { quote: "Je vérifie chaque pub Instagram avec Fraudly.", name: "Noah" },
        { quote: "M’a évité une boutique sneakers douteuse.", name: "Jason" },
        { quote: "En secondes j’ai su que ce shop TikTok méritait un second regard.", name: "Mila" },
        { quote: "La pub semblait légitime. Fraudly a montré les signaux d’alerte.", name: "Olivia" },
        { quote: "Idéal pour revérifier les promos sociales.", name: "Daan" }
      ]
    },
    bottomCta: {
      title: "Prêt à vérifier un lien ?",
      bodyPrefix: "Lancez un scan gratuit et partagez un résumé comme",
      bodyLinkLabel: "/check/exemple.fr",
      bodySuffix: "quand on vous demande : « Ce site a l’air OK ? »",
      button: "Vérifier un site"
    }
  },
  supportFaq: [
    { question: "Qu’est-ce que Fraudly ?", answer: "Fraudly analyse les sites pour repérer signaux d’arnaque, phishing et indicateurs de confiance." },
    { question: "Fraudly garantit-il la sécurité ?", answer: "Non. Les résultats sont informatifs, pas des garanties." },
    { question: "Comment fonctionne le score de confiance ?", answer: "Combinaison d’indicateurs techniques et de réputation." },
    { question: "Détecte-t-il le phishing ?", answer: "Fraudly aide à repérer des schémas typiques de phishing et d’arnaque." },
    { question: "Pourquoi les scores changent-ils ?", answer: "Les risques et la réputation évoluent vite." },
    { question: "Fraudly est-il gratuit ?", answer: "Contrôles gratuits pour l’instant ; d’autres fonctions suivront." },
    { question: "Mes scans sont-ils publics ?", answer: "Certains scans peuvent apparaître anonymement dans des flux publics." },
    { question: "Contacter le support ?", answer: "Écrivez à support@fraudly.app." }
  ]
};

const byLocale: Record<Locale, MarketingUiExtension> = {
  en,
  nl,
  de,
  fr,
  es: {
    ...marketingUiEs,
    checkFlow: getCheckFlowMessages("es"),
    resultFlow: getResultFlowMessages("es"),
    recentSearchesUi: getRecentSearchesUi("es")
  },
  pt: {
    ...marketingUiPt,
    checkFlow: getCheckFlowMessages("pt"),
    resultFlow: getResultFlowMessages("pt"),
    recentSearchesUi: getRecentSearchesUi("pt")
  }
};

export function getMarketingUi(locale: Locale): MarketingUiExtension {
  return byLocale[locale] ?? en;
}
