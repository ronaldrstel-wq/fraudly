import type { Dictionary } from "@/lib/i18n/dictionary-types";

export const de: Dictionary = {
  localeBanner: {
    dismiss: "Schließen"
  },
  nav: {
    latestChecks: "Neueste Checks",
    pulse: "Fraudly Pulse",
    scamAlerts: "Scam-Alerts",
    howItWorks: "So funktioniert's",
    features: "Funktionen",
    learn: "Lernen",
    about: "Über uns",
    scamHelp: "Scam-Hilfe",
    support: "Support & FAQ"
  },
  auth: {
    login: "Anmelden",
    signUp: "Registrieren"
  },
  footer: {
    tagline: "Fraudly hilft dir, verdächtige Links zu prüfen, bevor du klickst.",
    features: "Funktionen",
    support: "Support & FAQ",
    howItWorks: "So funktioniert's",
    learn: "Lernen",
    scamChecker: "Scam-Checker",
    latestChecks: "Neueste Checks",
    pulse: "Fraudly Pulse",
    scamAlerts: "Scam-Alerts",
    scamHelp: "Scam-Hilfe",
    privacy: "Datenschutz",
    terms: "AGB",
    disclaimer: "Haftungsausschluss",
    cookies: "Cookie-Richtlinie",
    contact: "Kontakt"
  },
  homepage: {
    heroBadge: "Website- & Shop-Sicherheitscheck",
    heroTitleLine1: "Sieh es.",
    heroTitleLine2: "Prüf es.",
    heroTitleLine3: "Vertrau ihm.",
    heroSubtitle: "Prüfe, ob eine Website oder ein Onlineshop sicher ist, bevor du kaufst.",
    heroTrustFeatures: [
      "Scams & Phishing erkennen",
      "Vertrauen & Reputation analysieren",
      "Domain-Alter & Sicherheit prüfen",
      "KI-gestützte Risikoanalyse"
    ],
    primaryCta: "Website prüfen",
    secondaryCta: "So funktioniert Fraudly",
    heroSearchHelper: "Schnell. Privat. Sicher. Kein Konto für den ersten Check nötig.",
    trustHelperBelowSearch:
      "Keine Installation · Sofort nutzbar · Fraudly nutzt öffentliche Scam-Intelligence — keine Rechtsberatung.",
    howItWorksTitle: "So funktioniert Fraudly",
    howItWorksSteps: [
      { title: "Eingeben", body: "Shop-URL, Domain oder verdächtigen Link einfügen." },
      { title: "Analysieren", body: "SSL, Domain-Signale, Reputation und Scam-Feeds prüfen." },
      { title: "KI-Review", body: "Muster werden verständlich zusammengefasst." },
      { title: "Ergebnis", body: "Vertrauenssignale sehen, bevor du zahlst oder dich anmeldest." }
    ]
  },
  about: {
    badge: "Über Fraudly",
    title: "Hilft, vor riskanten Klicks innezuhalten",
    intro:
      "Fraudly gibt Verbrauchern eine fundierte Zweitmeinung zu unbekannten Websites—vor Käufen, Bank-Logins oder dem Teilen persönlicher Daten—in klarer Sprache.",
    independentBadge: "Unabhängiges niederländisches Projekt",
    independentTitle: "Unabhängiges Projekt",
    independentP1:
      "Fraudly ist ein unabhängiges Projekt von Ronald, einem niederländischen Technology Professional und Service Manager mit Erfahrung in KI, digitalen Services und nutzerzentrierten Anwendungen.",
    independentP2:
      "Der Fokus liegt auf Nutzbarkeit, Transparenz, Datenschutz und sichereren Online-Entscheidungen.",
    whyTitle: "Warum es Fraudly gibt",
    whyBody:
      "Online-Scams entwickeln sich schnell—Fake-Shops per Werbung, Bank-Klone, Phishing-DMs und dubiose Marktplätze. Menschen brauchen einen verlässlichen Impuls und genug Detail, um klug zu handeln.",
    approachTitle: "Unser Vertrauensansatz",
    approachBody:
      "Wir verbinden Vertrauenssignale mit Scam-Indikatoren, SSL, WHOIS, Intelligence-Feeds, leichte Review-Sondierungen, Reputationsanreicherung wo möglich und KI-Zusammenfassungen. Abdeckung ist nie perfekt—prüfe selbst bei hohem Einsatz.",
    pillars: [
      {
        title: "Für kritische Käufer",
        body: "Fokus auf Phishing, Fake-Shops und Social-Ad-Scams—wo Geld in Minuten verloren geht."
      },
      {
        title: "Nachvollziehbare Signale",
        body: "Jeder Check zeigt technischen, Reputations- und Intelligence-Kontext, soweit verfügbar."
      },
      {
        title: "Schnell gemacht",
        body: "Keine Installation—URL einfügen, Ergebnis lesen, optional tiefere Scans öffnen."
      }
    ],
    limitsTitle: "Ehrliche Grenzen",
    limitsBody:
      "Fraudly verspricht keine perfekte Genauigkeit. Behandle jedes Ergebnis als situatives Bewusstsein und kombiniere mit Bank, Aussteller oder vertrauten Personen.",
    ctaPrompt: "Ein verdächtiger Link?",
    ctaButton: "Fraudly-Check starten"
  },
  support: {
    badge: "Support & FAQ",
    title: "Wie können wir helfen?",
    intro:
      "Antworten zu Website-Checks, Trust Scores, Konten und Problemmeldungen. Scan-Ergebnisse und technische Belege bleiben vorerst auf Englisch.",
    emailCta: "Support per E-Mail",
    quickHelpTitle: "Schnelle Hilfe",
    faqTitle: "Häufig gestellte Fragen",
    stillNeedHelp: "Noch Hilfe nötig?",
    stillNeedHelpBody: "Schreib uns mit der geprüften URL und deiner Erwartung—wir lesen jede Nachricht.",
    ctaCheck: "Website prüfen"
  },
  scamHelp: {
    badge: "Scam-Hilfe — nur informativ",
    title: "Betrüger oder unsicher, was zu tun ist?",
    subtitle: "Offizielle Meldestellen und praktische Schritte zum Schutz finden.",
    cta: "Verdächtige Website prüfen",
    ctaSection: "Website prüfen, bevor du zahlst",
    chooseCountry: "Land wählen",
    chooseCountryHint: "Wähle unten dein Land für offizielle Meldeorganisationen und nächste Schritte.",
    reportingForPrefix: "Meldeoptionen für",
    privacyHint:
      "Wir nutzen ein datenschutzfreundliches Land-Signal von Browser oder Host. Du kannst es unten ändern.",
    detectedHint: "Vorgeschlagen für deine Region per grober Hint—nicht dein genauer Standort.",
    immediateActions: "Sofortmaßnahmen",
    moreGuidancePrefix: "Mehr Hilfe für"
  },
  scamAlerts: {
    eyebrow: "Scam-Intelligence",
    title: "Scam- & Phishing-Alerts",
    intro:
      "Fraudly überwacht öffentliche Scam-Intelligence und verdächtige Website-Signale, um neue Bedrohungen verständlich zu zeigen.",
    chips: [
      "Kürzlich erkannte Bedrohungen",
      "Trending Risiko-Domains",
      "Phishing-Indikatoren",
      "Neue verdächtige Registrierungen"
    ],
    chipHint: "Filter für Phishing-Alerts, Trending-Domains und High-Confidence-Zusammenfassungen nutzen.",
    disclaimer:
      "Fraudly bündelt Dritt-Intelligence. Jede Alert ist Anlass zur Prüfung—kein Beweis für sich."
  },
  latestChecks: {
    overline: "Community-Snapshot · anonymisierte Zusammenfassungen",
    title: "Neueste Fraudly-Checks",
    intro:
      "Aktuelle öffentliche Website-Checks über Fraudly. Dieser Feed zeigt, was Nutzer gerade prüfen—ohne Konten oder private Historie.",
    footnote:
      "Scores werden automatisch aus Vertrauen, Reputation, technischen Checks, Scam-Feeds und KI erzeugt—kein absolutes Urteil.",
    resultsNote: "Einzelne Check-Ergebnisse bleiben auf Englisch."
  },
  meta: {
    home: {
      title: "Ist eine Website oder ein Shop sicher? | Fraudly",
      description:
        "Prüfe mit Fraudly, ob Website oder Onlineshop sicher ist. Shop-Check, Scam-Signale und Phishing-Erkennung vor dem Kauf."
    },
    about: {
      title: "Über Fraudly — Website-Vertrauen & Scam-Checker",
      description:
        "Erfahre, wie Fraudly Scams, Phishing und Fake-Shops mit klarer Domain- und Shop-Analyse hilft zu vermeiden."
    },
    support: {
      title: "Support & FAQ — Hilfe zu Website-Checks",
      description:
        "Hilfe zu Fraudly Website-Checks, Scam-Checker-Ergebnissen und Phishing-Erkennung—häufige Sicherheitsfragen."
    },
    scamHelp: {
      title: "Scam-Hilfe — Was tun nach Betrug",
      description:
        "Online betrogen? Offizielle Meldelinks und praktische Schritte. Fraudly ist informativ, keine Polizei."
    },
    scamAlerts: {
      title: "Bedrohungs-Alerts — Scam- & Phishing-Intelligence",
      description:
        "Öffentliche Scam-Alerts mit Phishing-Kontext und Fake-Shop-Warnungen aus Fraudlys Monitoring."
    },
    latestChecks: {
      title: "Neueste Website-Vertrauenschecks",
      description:
        "Sieh aktuelle öffentliche Website-Checks und Scam-Checker-Ergebnisse von Fraudly in Echtzeit-Zusammenfassungen."
    }
  }
};
