import type { CoreDictionary } from "@/lib/i18n/dictionary-types";

export const fr: CoreDictionary = {
  localeBanner: {
    dismiss: "Fermer"
  },
  nav: {
    latestChecks: "Derniers contrôles",
    pulse: "Fraudly Pulse",
    scamAlerts: "Alertes scam",
    howItWorks: "Comment ça marche",
    features: "Fonctionnalités",
    learn: "Apprendre",
    about: "À propos",
    scamHelp: "Aide scam",
    support: "Support & FAQ"
  },
  auth: {
    login: "Connexion",
    signUp: "Créer un compte"
  },
  footer: {
    tagline: "Fraudly vous aide à vérifier les liens suspects avant de cliquer.",
    features: "Fonctionnalités",
    support: "Support & FAQ",
    howItWorks: "Comment ça marche",
    learn: "Apprendre",
    blog: "Blog",
    intelligence: "Intelligence",
    scamChecker: "Vérificateur scam",
    websiteScamChecker: "Vérificateur site scam",
    checkIfWebsiteIsSafe: "Ce site est-il sûr ?",
    fakeWebshopCheck: "Fausse boutique en ligne",
    onlineScamDetector: "Détecteur de scam en ligne",
    latestChecks: "Derniers contrôles",
    pulse: "Fraudly Pulse",
    scamAlerts: "Alertes scam",
    scamHelp: "Aide scam",
    privacy: "Confidentialité",
    terms: "Conditions",
    disclaimer: "Avertissement",
    cookies: "Politique cookies",
    deleteAccount: "Supprimer le compte",
    contact: "Contact"
  },
  homepage: {
    heroBadge: "Contrôle sécurité site & boutique",
    heroTitleLine1: "Voyez.",
    heroTitleLine2: "Vérifiez.",
    heroTitleLine3: "Faites confiance.",
    heroSubtitle: "Vérifiez si un site ou une boutique en ligne est sûr avant d'acheter.",
    heroTrustFeatures: [
      "Détecter scams & phishing",
      "Analyser confiance & réputation",
      "Vérifier âge du domaine & sécurité",
      "Analyse de risque assistée par IA"
    ],
    primaryCta: "Vérifier un site",
    secondaryCta: "Comment fonctionne Fraudly",
    heroSearchHelper: "Rapide. Privé. Sécurisé. Pas de compte pour votre premier contrôle.",
    trustHelperBelowSearch:
      "Sans installation · Instantané · Fraudly analyse avec de l'intelligence scam publique — pas un conseil juridique.",
    howItWorksTitle: "Comment fonctionne Fraudly",
    howItWorksSteps: [
      { title: "Soumettre", body: "Collez l'URL d'une boutique, un domaine ou un lien suspect." },
      { title: "Analyser", body: "Nous vérifions SSL, signaux de domaine, réputation et flux scam." },
      { title: "Revue IA", body: "Les schémas sont résumés en langage clair." },
      { title: "Résultats", body: "Voyez les signaux de confiance avant de payer ou vous connecter." }
    ]
  },
  about: {
    badge: "À propos de Fraudly",
    title: "Aider à faire une pause avant les clics risqués",
    intro:
      "Fraudly offre aux consommateurs un second avis fondé sur des sites inconnus—avant achats, connexions bancaires ou partage de données—dans un langage calme et compréhensible.",
    independentBadge: "Projet néerlandais indépendant",
    independentTitle: "Projet indépendant",
    independentP1:
      "Fraudly est un projet indépendant créé par Ronald, professionnel de la tech et Service Manager aux Pays-Bas, avec expérience en IA, services numériques et applications centrées utilisateur.",
    independentP2:
      "Le projet met l'accent sur l'utilisabilité, la transparence, la vie privée et des décisions en ligne plus sûres.",
    whyTitle: "Pourquoi Fraudly existe",
    whyBody:
      "Les scams en ligne évoluent—fausses boutiques via pubs, clones bancaires, DM de phishing, marketplaces douteuses. Les gens ont besoin d'un coup de pouce fiable et de détails pour agir avec discernement.",
    approachTitle: "Notre approche de la confiance",
    approachBody:
      "Nous fusionnons signaux de confiance, indicateurs scam, SSL, WHOIS, flux d'intelligence, sondages de réputation légers, enrichissement quand possible et narration IA. La couverture n'est jamais parfaite—vérifiez vous-même si l'enjeu est élevé.",
    pillars: [
      {
        title: "Pour les acheteurs prudents",
        body: "Focus sur phishing, fausses boutiques et scams publicitaires—où l'argent part en minutes."
      },
      {
        title: "Signaux inspectables",
        body: "Chaque contrôle cite le contexte technique, réputation et intelligence disponible."
      },
      {
        title: "Rapide par design",
        body: "Pas d'installation—collez une URL, lisez le résumé, ouvrez des scans approfondis si besoin."
      }
    ],
    limitsTitle: "Limites honnêtes",
    limitsBody:
      "Fraudly ne promet pas une précision parfaite. Traitez chaque résultat comme une prise de conscience et combinez avec banque, émetteur ou personnes de confiance.",
    ctaPrompt: "Un lien douteux ?",
    ctaButton: "Lancer un contrôle Fraudly"
  },
  support: {
    badge: "Support & FAQ",
    title: "Comment pouvons-nous aider ?",
    intro:
      "Réponses sur les contrôles de sites, scores de confiance, comptes et signalement. Les résultats de scan et preuves techniques restent en anglais pour l'instant.",
    emailCta: "Contacter le support",
    quickHelpTitle: "Aide rapide",
    faqTitle: "Questions fréquentes",
    stillNeedHelp: "Encore besoin d'aide ?",
    stillNeedHelpBody: "Écrivez-nous avec l'URL vérifiée et ce que vous attendiez—nous lisons tout.",
    ctaCheck: "Vérifier un site"
  },
  scamHelp: {
    badge: "Aide scam — informatif uniquement",
    title: "Arnaqué ou pas sûr quoi faire ?",
    subtitle: "Trouvez les organismes officiels de signalement et des étapes pratiques pour vous protéger.",
    cta: "Vérifier un site suspect",
    ctaSection: "Vérifiez un site avant de payer",
    ctaButton: "Vérifier un site avant de payer",
    chooseCountry: "Choisissez votre pays",
    chooseCountryHint: "Sélectionnez votre pays ci-dessous pour voir les organismes officiels et les prochaines étapes.",
    reportingForPrefix: "Options de signalement pour",
    privacyHint:
      "Nous utilisons un signal pays respectueux de la vie privée depuis votre navigateur ou hébergeur. Vous pouvez le modifier ci-dessous.",
    detectedHint: "Suggéré pour votre région via une indication grossière—pas votre position précise.",
    immediateActions: "Actions immédiates",
    moreGuidancePrefix: "Plus d'aide pour"
  },
  scamAlerts: {
    eyebrow: "Intelligence scam",
    title: "Alertes scam & phishing",
    intro:
      "Fraudly surveille l'intelligence scam publique et les signaux de sites suspects pour faire émerger les menaces en langage clair.",
    chips: [
      "Menaces récemment détectées",
      "Domaines à risque tendance",
      "Indicateurs de phishing",
      "Nouvelles inscriptions suspectes"
    ],
    chipHint: "Utilisez les filtres pour le phishing, domaines tendance et résumés haute confiance.",
    disclaimer:
      "Fraudly agrège de l'intelligence tierce. Chaque alerte invite à vérifier—ce n'est pas une preuve en soi."
  },
  latestChecks: {
    overline: "Snapshot communauté · résumés anonymisés",
    title: "Derniers contrôles Fraudly",
    intro:
      "Contrôles publics récents via Fraudly. Ce flux montre ce que les gens vérifient—sans comptes ni historique privé.",
    footnote:
      "Les scores sont générés automatiquement avec confiance, réputation, contrôles techniques, flux scam et IA—pas un verdict absolu.",
    resultsNote: "Les résultats individuels restent en anglais."
  },
  deleteAccountPage: {
    badge: "Compte",
    title: "Supprimer votre compte Fraudly",
    intro:
      "Vous pouvez demander la suppression définitive de votre compte Fraudly et des données personnelles associées. Cette page explique comment—sans connexion.",
    howTitle: "Demander la suppression",
    howP1BeforeEmail: "Écrivez-nous à",
    howP1AfterEmail: "avec l’objet",
    howSubject: "Supprimer le compte",
    howP1AfterSubject: "Indiquez l’adresse e-mail utilisée pour Fraudly afin que nous trouvions votre compte.",
    howP2BeforeDays: "Nous traitons les demandes vérifiées sous",
    howP2Days: "30 jours",
    howP2AfterDays: "Nous pouvons vous contacter pour confirmer votre identité.",
    afterTitle: "Après la suppression",
    afterP1:
      "Une fois la demande traitée, nous supprimons ou anonymisons les données liées à votre compte (profil, historique privé), dans la limite de la loi.",
    afterP2:
      "Certaines données peuvent être conservées si la loi l’exige ou l’autorise—transactions, prévention de fraude, conformité, etc.",
    storesTitle: "Abonnements App Store",
    storesP1Before: "Supprimer votre compte Fraudly",
    storesP1Bold: "n’annule pas",
    storesP1After:
      "automatiquement un abonnement actif via l’App Store ou Google Play. Annulez dans les réglages Apple ou Google Play. Fraudly ne peut pas résilier la facturation des stores.",
    emailCta: "Demande par e-mail",
    privacyLink: "Politique de confidentialité",
    termsLink: "Conditions d’utilisation"
  },
  meta: {
    home: {
      title: "Un site ou une boutique est-il sûr ? | Fraudly",
      description:
        "Vérifiez avec Fraudly si un site ou une boutique en ligne est sûr. Contrôle boutique, signaux scam et détection phishing avant d'acheter."
    },
    about: {
      title: "À propos de Fraudly — Confiance site & anti-scam",
      description:
        "Découvrez comment Fraudly aide à éviter scams, phishing et fausses boutiques grâce à une analyse claire des domaines et magasins."
    },
    support: {
      title: "Support & FAQ — Aide contrôle de sites",
      description:
        "Aide sur les contrôles Fraudly, résultats scam checker et détection phishing—réponses aux questions de sécurité courantes."
    },
    scamHelp: {
      title: "Aide scam — Que faire si vous êtes arnaqué",
      description:
        "Arnaqué en ligne ? Liens officiels de signalement et étapes pratiques. Fraudly est informatif, pas une force de l'ordre."
    },
    scamAlerts: {
      title: "Alertes menaces — Intelligence scam & phishing",
      description:
        "Alertes scam publiques avec contexte phishing et avertissements fausses boutiques du monitoring Fraudly."
    },
    latestChecks: {
      title: "Derniers contrôles de confiance de sites",
      description:
        "Consultez les contrôles publics récents et résultats scam checker de Fraudly en résumés temps réel."
    },
    deleteAccount: {
      title: "Supprimer le compte | Fraudly",
      description:
        "Découvrez comment demander la suppression de votre compte Fraudly et des données personnelles associées."
    }
  }
};
