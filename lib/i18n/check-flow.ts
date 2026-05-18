import type { Locale } from "@/lib/i18n/locales";

/** Homepage scanner + check gate copy (merged into locale dictionary). */
export type CheckFlowMessages = {
  check: {
    urlPlaceholder: string;
    urlFieldLabel: string;
    missingUrl: string;
    invalidWebsiteInput: string;
  };
  scanProgress: {
    complete: string;
    stoppedSignIn: string;
    stoppedLimit: string;
    stoppedInvalidResponse: string;
    failedGeneric: string;
    failedNetwork: string;
    rotating: readonly string[];
  };
  auth: {
    loginCta: string;
    loginForUrlCheck: string;
    loginForAnotherCheck: string;
  };
  freemium: {
    createFreeAccount: string;
    promptTitle: string;
    promptBody: string;
    afterResultBanner: string;
  };
  rateLimit: {
    generic: string;
  };
};

export const checkFlowEn: CheckFlowMessages = {
  check: {
    urlPlaceholder: "Paste a website URL (e.g. example.com)",
    urlFieldLabel: "Website URL",
    missingUrl: "Enter a website URL to check.",
    invalidWebsiteInput: "Enter a valid website URL (for example example.com or https://example.com/shop)."
  },
  scanProgress: {
    complete: "Analysis complete",
    stoppedSignIn: "Sign in to continue",
    stoppedLimit: "Free check limit reached",
    stoppedInvalidResponse: "Could not read the response",
    failedGeneric: "Check failed — try again",
    failedNetwork: "Network error — try again",
    rotating: [
      "Checking SSL certificate...",
      "Analyzing domain reputation...",
      "Cross-checking scam feeds...",
      "Inspecting trust signals...",
      "Generating trust assessment..."
    ]
  },
  auth: {
    loginCta: "Log in",
    loginForUrlCheck: "Log in to run a URL check.",
    loginForAnotherCheck: "Your first free check is complete. Create a free account or log in to check another website."
  },
  freemium: {
    createFreeAccount: "Create free account",
    promptTitle: "Create a free account to check more websites",
    promptBody:
      "Your first website check is free and gives you the full breakdown. Want to check another website? Create a free account—or log in if you already have one.",
    afterResultBanner: "Want to check another website? Create a free account."
  },
  rateLimit: {
    generic: "Too many checks right now. Please wait a moment and try again."
  }
};

const checkFlowNl: CheckFlowMessages = {
  check: {
    urlPlaceholder: "Plak een website-URL (bijv. voorbeeld.nl)",
    urlFieldLabel: "Website-URL",
    missingUrl: "Voer een website-URL in om te controleren.",
    invalidWebsiteInput: "Voer een geldige website-URL in (bijvoorbeeld voorbeeld.nl of https://voorbeeld.nl/shop)."
  },
  scanProgress: {
    complete: "Analyse voltooid",
    stoppedSignIn: "Log in om door te gaan",
    stoppedLimit: "Gratis checklimiet bereikt",
    stoppedInvalidResponse: "Kon het antwoord niet lezen",
    failedGeneric: "Check mislukt — probeer opnieuw",
    failedNetwork: "Netwerkfout — probeer opnieuw",
    rotating: [
      "SSL-certificaat controleren...",
      "Domeinreputatie analyseren...",
      "Scamfeeds vergelijken...",
      "Vertrouwenssignalen bekijken...",
      "Vertrouwensbeoordeling opstellen..."
    ]
  },
  auth: {
    loginCta: "Inloggen",
    loginForUrlCheck: "Log in om een URL te controleren.",
    loginForAnotherCheck:
      "Je eerste gratis check is gebruikt. Maak een gratis account aan of log in om nog een website te controleren."
  },
  freemium: {
    createFreeAccount: "Gratis account aanmaken",
    promptTitle: "Maak een gratis account om meer websites te controleren",
    promptBody:
      "Je eerste websitecheck is gratis en geeft je het volledige overzicht. Nog een site controleren? Maak een gratis account aan—of log in als je er al een hebt.",
    afterResultBanner: "Nog een website controleren? Maak een gratis account aan."
  },
  rateLimit: {
    generic: "Te veel checks op dit moment. Wacht even en probeer het opnieuw."
  }
};

const checkFlowDe: CheckFlowMessages = {
  check: {
    urlPlaceholder: "Website-URL einfügen (z. B. beispiel.de)",
    urlFieldLabel: "Website-URL",
    missingUrl: "Bitte eine Website-URL eingeben.",
    invalidWebsiteInput: "Bitte eine gültige Website-URL eingeben (z. B. beispiel.de oder https://beispiel.de/shop)."
  },
  scanProgress: {
    complete: "Analyse abgeschlossen",
    stoppedSignIn: "Zum Fortfahren anmelden",
    stoppedLimit: "Limit für kostenlose Checks erreicht",
    stoppedInvalidResponse: "Antwort konnte nicht gelesen werden",
    failedGeneric: "Check fehlgeschlagen — erneut versuchen",
    failedNetwork: "Netzwerkfehler — erneut versuchen",
    rotating: [
      "SSL-Zertifikat wird geprüft...",
      "Domain-Reputation wird analysiert...",
      "Scam-Feeds werden abgeglichen...",
      "Vertrauenssignale werden geprüft...",
      "Vertrauensbewertung wird erstellt..."
    ]
  },
  auth: {
    loginCta: "Anmelden",
    loginForUrlCheck: "Melden Sie sich an, um eine URL zu prüfen.",
    loginForAnotherCheck:
      "Ihr erster kostenloser Check ist verbraucht. Erstellen Sie ein kostenloses Konto oder melden Sie sich an, um eine weitere Website zu prüfen."
  },
  freemium: {
    createFreeAccount: "Kostenloses Konto erstellen",
    promptTitle: "Kostenloses Konto erstellen, um mehr Websites zu prüfen",
    promptBody:
      "Ihr erster Website-Check ist kostenlos und zeigt die vollständige Auswertung. Noch eine Website prüfen? Erstellen Sie ein kostenloses Konto — oder melden Sie sich an.",
    afterResultBanner: "Noch eine Website prüfen? Erstellen Sie ein kostenloses Konto."
  },
  rateLimit: {
    generic: "Zu viele Checks gerade. Bitte kurz warten und erneut versuchen."
  }
};

const checkFlowFr: CheckFlowMessages = {
  check: {
    urlPlaceholder: "Collez l’URL du site (ex. exemple.fr)",
    urlFieldLabel: "URL du site",
    missingUrl: "Saisissez une URL de site à vérifier.",
    invalidWebsiteInput: "Saisissez une URL valide (par ex. exemple.fr ou https://exemple.fr/boutique)."
  },
  scanProgress: {
    complete: "Analyse terminée",
    stoppedSignIn: "Connectez-vous pour continuer",
    stoppedLimit: "Limite de vérifications gratuites atteinte",
    stoppedInvalidResponse: "Impossible de lire la réponse",
    failedGeneric: "Échec de la vérification — réessayez",
    failedNetwork: "Erreur réseau — réessayez",
    rotating: [
      "Vérification du certificat SSL...",
      "Analyse de la réputation du domaine...",
      "Recoupement des flux d’arnaques...",
      "Examen des signaux de confiance...",
      "Évaluation de confiance en cours..."
    ]
  },
  auth: {
    loginCta: "Se connecter",
    loginForUrlCheck: "Connectez-vous pour vérifier une URL.",
    loginForAnotherCheck:
      "Votre première vérification gratuite est utilisée. Créez un compte gratuit ou connectez-vous pour vérifier un autre site."
  },
  freemium: {
    createFreeAccount: "Créer un compte gratuit",
    promptTitle: "Créez un compte gratuit pour vérifier plus de sites",
    promptBody:
      "Votre première vérification est gratuite et donne le détail complet. Un autre site ? Créez un compte gratuit — ou connectez-vous.",
    afterResultBanner: "Vérifier un autre site ? Créez un compte gratuit."
  },
  rateLimit: {
    generic: "Trop de vérifications pour le moment. Patientez un instant et réessayez."
  }
};

const checkFlowEs: CheckFlowMessages = {
  check: {
    urlPlaceholder: "Pega la URL del sitio (p. ej. ejemplo.es)",
    urlFieldLabel: "URL del sitio",
    missingUrl: "Introduce una URL para comprobar.",
    invalidWebsiteInput: "Introduce una URL válida (por ejemplo ejemplo.es o https://ejemplo.es/tienda)."
  },
  scanProgress: {
    complete: "Análisis completado",
    stoppedSignIn: "Inicia sesión para continuar",
    stoppedLimit: "Límite de comprobaciones gratuitas alcanzado",
    stoppedInvalidResponse: "No se pudo leer la respuesta",
    failedGeneric: "Error en la comprobación — inténtalo de nuevo",
    failedNetwork: "Error de red — inténtalo de nuevo",
    rotating: [
      "Comprobando certificado SSL...",
      "Analizando reputación del dominio...",
      "Cruzando feeds de estafas...",
      "Revisando señales de confianza...",
      "Generando evaluación de confianza..."
    ]
  },
  auth: {
    loginCta: "Iniciar sesión",
    loginForUrlCheck: "Inicia sesión para comprobar una URL.",
    loginForAnotherCheck:
      "Tu primera comprobación gratuita ya se usó. Crea una cuenta gratuita o inicia sesión para comprobar otro sitio."
  },
  freemium: {
    createFreeAccount: "Crear cuenta gratuita",
    promptTitle: "Crea una cuenta gratuita para comprobar más sitios",
    promptBody:
      "Tu primera comprobación es gratuita y muestra el desglose completo. ¿Otro sitio? Crea una cuenta gratuita o inicia sesión.",
    afterResultBanner: "¿Comprobar otro sitio? Crea una cuenta gratuita."
  },
  rateLimit: {
    generic: "Demasiadas comprobaciones ahora. Espera un momento e inténtalo de nuevo."
  }
};

const checkFlowPt: CheckFlowMessages = {
  check: {
    urlPlaceholder: "Cole o URL do site (ex. exemplo.pt)",
    urlFieldLabel: "URL do site",
    missingUrl: "Introduza um URL de site para verificar.",
    invalidWebsiteInput: "Introduza um URL válido (por exemplo exemplo.pt ou https://exemplo.pt/loja)."
  },
  scanProgress: {
    complete: "Análise concluída",
    stoppedSignIn: "Inicie sessão para continuar",
    stoppedLimit: "Limite de verificações gratuitas atingido",
    stoppedInvalidResponse: "Não foi possível ler a resposta",
    failedGeneric: "Verificação falhou — tente novamente",
    failedNetwork: "Erro de rede — tente novamente",
    rotating: [
      "A verificar certificado SSL...",
      "A analisar reputação do domínio...",
      "A cruzar feeds de burlas...",
      "A inspecionar sinais de confiança...",
      "A gerar avaliação de confiança..."
    ]
  },
  auth: {
    loginCta: "Iniciar sessão",
    loginForUrlCheck: "Inicie sessão para verificar um URL.",
    loginForAnotherCheck:
      "A sua primeira verificação gratuita foi usada. Crie uma conta gratuita ou inicie sessão para verificar outro site."
  },
  freemium: {
    createFreeAccount: "Criar conta gratuita",
    promptTitle: "Crie uma conta gratuita para verificar mais sites",
    promptBody:
      "A primeira verificação é gratuita e mostra o detalhe completo. Outro site? Crie uma conta gratuita — ou inicie sessão.",
    afterResultBanner: "Verificar outro site? Crie uma conta gratuita."
  },
  rateLimit: {
    generic: "Demasiadas verificações agora. Aguarde um momento e tente novamente."
  }
};

const byLocale: Record<Locale, CheckFlowMessages> = {
  en: checkFlowEn,
  nl: checkFlowNl,
  de: checkFlowDe,
  fr: checkFlowFr,
  es: checkFlowEs,
  pt: checkFlowPt
};

export function getCheckFlowMessages(locale: Locale): CheckFlowMessages {
  return byLocale[locale] ?? checkFlowEn;
}
