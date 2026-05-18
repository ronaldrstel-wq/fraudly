import type { MarketingUiExtension } from "@/lib/i18n/marketing-ui-types";
import { marketingUiEn } from "@/lib/i18n/marketing-ui-en";

export const marketingUiPt: MarketingUiExtension = {
  ...marketingUiEn,
  common: { languageLabel: "Idioma" },
  scamAlertsPage: {
    ...marketingUiEn.scamAlertsPage,
    filters: {
      allSeverities: "Todos os níveis",
      highRiskOnly: "Só alto risco",
      highRiskSub: "Usa la pontuação de alerta agregada",
      malware: "Malware",
      phishing: "Phishing",
      severityTypeLabel: "Gravedad y tipo",
      exactTypeLabel: "Tipo exacto:",
      anyType: "Todos"
    },
    timeRange: {
      label: "Período",
      today: "Hoje",
      todayHint: "Publicado desde medianoche UTC hoy",
      last24h: "Últimas 24 h",
      last24hHint: "Janela móvel de 24 horas",
      last7d: "Últimos 7 días",
      last7dHint: "Janela móvel de siete días",
      allAlerts: "Todos Alerts",
      allAlertsHint: "Cada alerta publicada visible",
      helper: "Standard zeigt alle veröffentlichten Alerts. Enger über URL auf Hoje (UTC) oder kürzere Fenster."
    },
    summary: {
      ...marketingUiEn.scamAlertsPage.summary,
      highScore: "Alto+ (pontuação ≥ 75)",
      sortByScore: "Ordenado por publicação recente e pontuação",
      newTodayUtc: "Publicado recentemente (UTC)",
      totalPublished: "Total publicado",
      mostCommonType: "Tipo mais comum",
      showing: "A mostrar",
      zeroPublished: "0 alertas publicadas",
      rangeSingle: "{current} de {total} alertas publicadas",
      rangeSpan: "{start}–{end} de {total} alertas publicadas"
    },
    empty: {
      zeroTitle: "No hay alertas de fraude activas ahora",
      zeroBody:
        "Fraudly monitoriza fuentes públicas de forma continua. Nuevas alertas aparecerán aquí con pruebas suficientes.",
      filteredTitle: "Nenhum alerta coincide con esta vista",
      filteredBody: "Versuchen Sie einen breiteren Período (z. B. „Todos Alerts“) oder einen anderen Filter.",
      viewAllTimeCta: "Todos veröffentlichten Alerts anzeigen",
      checkWebsiteCta: "Verificar um site agora"
    },
    card: { technicalMatchStrength: "Fuerza de coincidencia", technicalSignals: "Señales de corroboración" },
    pagination: { prev: "Página anterior", prevDisabled: "Anterior", next: "Página siguiente", nextDisabled: "Seguinte", page: "Página" }
  },
  latestChecksPage: {
    ...marketingUiEn.latestChecksPage,
    trustScorePillLabel: "Pontuação de confianza",
    viewResultArrow: "Ver resultado →",
    emptyState: "Aún no hay verificações públicas. Los resúmenes aparecerán aquí quando estén disponibles.",
    unavailableState: "Las últimas verificações no están disponibles temporalmente. Aún puedes verificar un site arriba.",
    ctaPrimary: "Iniciar verificação",
    listAria: "Últimos resúmenes públicos de verificações",
    entityFallback: "Elemento verificado",
    entityLabels: {
      domain: "Dominio / site",
      url: "URL",
      company: "Empresa / marca",
      crypto_wallet: "Monedero cripto",
      username: "Nombre de usuario / handle"
    },
    pagination: { prev: "Página anterior", prevDisabled: "Anterior", next: "Página siguiente", nextDisabled: "Seguinte", page: "Página" }
  },
  homeSections: {
    trustActivity: {
      title: "Fraudly ayuda a los utilizadores a estar más seguros en línea",
      subtitle: "Verificações con IA para detectar sites sospechosos, phishing y fraudes.",
      footnote: "{count} verificações públicas en 30 días — feed respetuoso con la privacidad.",
      stats: {
        websiteChecksLabel: "Verificações de sites",
        websiteChecksHint: "Verificações públicas en el feed de Fraudly.",
        websiteChecksFallback: "A crescer",
        threatSignalsLabel: "Señales de amenaza analizadas",
        threatSignalsHint: "Verificações recientes + alertas de fraude (30 días).",
        threatSignalsFallback: "Em construção",
        buildingHint: "Los datos de actividad aún se están generando.",
        aiLabel: "Análisis asistido por IA",
        aiValue: "24/7",
        aiHint: "Heurísticas continuas + inteligencia pública.",
        growingLabel: "Crecimiento diario",
        growingValue: "Nuevos verificações cada día",
        growingValueActive: "Hoje aktiv",
        growingHint: "Nuevas verificações públicas aparecen continuamente.",
        growingHintActive: "{count} verificações públicas en las últimas 24 h."
      }
    },
    whatWeCheck: {
      title: "O que o Fraudly analisa",
      intro: "Fraudly combina señales de confianza, reputación y análisis con IA para detectar sites sospechosos.",
      cards: [
        { title: "Reputación del site", body: "Señales públicas de confianza y reseñas — con límites claros." },
        { title: "SSL y seguridad", body: "HTTPS, certificados y ajustes técnicos importantes." },
        { title: "Idade do domínio", body: "Historial de registro — a menudo distinto en fraudes." },
        { title: "Indicadores de phishing", body: "Idioma, Dringlichkeit und typische Phishing-Muster." },
        { title: "Reportes de fraudes", body: "Cruce con alertas publicadas e inteligencia pública." },
        { title: "Padrões de risco com IA", body: "Heurísticas para combinaciones inusuales de señales." }
      ]
    },
    featureCards: [
      { title: "Sinais, não ruído", description: "Reputación, feeds de fraudes, SSL y dominio — en una vista clara." },
      { title: "Segundos, não suposições", description: "En el navegador. Sin instalación para la primera verificação." },
      { title: "Klare Idioma", description: "Conselhos honestos con límites transparentes." }
    ]
  },
  homeBelowFold: {
    trustSafety: {
      title: "Verificações tranquilas para as suas compras",
      body: "Fraudly es un verificador de confianza para anúncios sociales, marketplaces y «¿esta URL es segura?» — señales estructuradas, sin alaras minhasmo.",
      bullets: [
        "Inteligencia de fraudes + reputación, SSL y contexto histórico",
        "Verificações profundos opcionales para más detalle técnico",
        "«Últimas verificações» públicas y alertas de amenazas"
      ],
      featuresCta: "Ver funcionalidades",
      learnCta: "Aprender sobre fraudes online"
    },
    howItWorks: {
      title: "Cómo funciona la verificação",
      steps: [
        "Cole um URL antes de pagar, iniciar sesión o pulsar un anúncio dudoso.",
        "Fraudly obtiene contexto de seguridad, historial, feeds de fraudes y reputación.",
        "Vê uma pontuação, un resumo y detalles opcionales."
      ],
      footerPrefix: "O processo completo? Leia",
      footerLinkLabel: "como o Fraudly funciona"
    },
    faq: {
      title: "Perguntas frequentes",
      items: [
        {
          question: "¿Fraudly es un verificador de fraudes?",
          answer: "Sí — para comprobar enlaces desconocidos con feeds de fraudes, señales HTTPS/dominio y explicación con IA opcional."
        },
        {
          question: "O Fraudly garante 100% de segurança?",
          answer: "Ninguna herramienta puede hacerlo. Usa Fraudly con sentido común y verificación oficial."
        },
        {
          question: "Diferença para um antivírus?",
          answer: "Fraudly se centra en sites engañosos: phishing, tiendas dudosas, SSL, feeds de fraudes — no solo malware."
        },
        { question: "¿Coste de la primera verificação?", answer: "La primera verificação en el navegador es gratis sin cuenta." }
      ]
    },
    testimonials: {
      title: "Lo que dicen los utilizadores",
      items: [
        { quote: "Gut, dass ich nicht gekauft habe — Fraudly zeigte eine riskante Página.", name: "Emma" },
        { quote: "Verifico cada anúncio de Instagram con Fraudly.", name: "Noah" },
        { quote: "Me evitó una tienda de zapatillas dudosa.", name: "Jason" },
        { quote: "En segundos supe que esa tienda de TikTok merecía una segunda mirada.", name: "Mila" },
        { quote: "El anúncio parecía legítimo. Fraudly mostró las señales de alerta.", name: "Olivia" },
        { quote: "Ideal para rever promoções sociais antes de comprar.", name: "Daan" }
      ]
    },
    bottomCta: {
      title: "Pronto para verificar um link?",
      bodyPrefix: "Faça uma verificação grátis e partilhe um resumo como",
      bodyLinkLabel: "/check/exemplo.pt",
      bodySuffix: "quando lhe perguntam: «Este site parece seguro?»",
      button: "Verificar site"
    }
  },
  supportFaq: [
    {
      question: "O que é o Fraudly?",
      answer:
        "O Fraudly analisa sites para detetar sinais de fraude, phishing e indicadores de confiança com análise automatizada e assistida por IA."
    },
    {
      question: "O Fraudly garante segurança?",
      answer: "Não. Os resultados são informativos, não garantias. Use sempre o seu próprio critério."
    },
    {
      question: "Como funciona a pontuação de confiança?",
      answer: "Combina indicadores técnicos e de reputação numa pontuação clara."
    },
    {
      question: "Deteta phishing?",
      answer: "O Fraudly ajuda a detetar padrões típicos de phishing e fraude."
    },
    {
      question: "Porque é que as pontuações mudam?",
      answer: "Os riscos e a reputação mudam rapidamente. O Fraudly analisa informação nova de forma contínua."
    },
    {
      question: "O Fraudly é gratuito?",
      answer: "Verificações gratuitas por agora; mais funcionalidades chegarão."
    },
    {
      question: "As minhas verificações são públicas?",
      answer: "Algumas verificações podem aparecer anonimamente em feeds públicos. Não mostramos dados pessoais de propósito."
    },
    {
      question: "Contactar suporte?",
      answer: "Escreva para support@fraudly.app."
    }
  ]
};
