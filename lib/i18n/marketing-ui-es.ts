import type { MarketingUiExtension } from "@/lib/i18n/marketing-ui-types";
import { marketingUiEn } from "@/lib/i18n/marketing-ui-en";

export const marketingUiEs: MarketingUiExtension = {
  ...marketingUiEn,
  common: { languageLabel: "Idioma" },
  scamAlertsPage: {
    ...marketingUiEn.scamAlertsPage,
    filters: {
      allSeverities: "Todos los niveles",
      highRiskOnly: "Solo alto riesgo",
      highRiskSub: "Usa la puntuación de alerta agregada",
      malware: "Malware",
      phishing: "Phishing",
      severityTypeLabel: "Gravedad y tipo",
      exactTypeLabel: "Tipo exacto:",
      anyType: "Todos"
    },
    timeRange: {
      label: "Periodo",
      today: "Hoy",
      todayHint: "Publicado desde medianoche UTC hoy",
      last24h: "Últimas 24 h",
      last24hHint: "Ventana móvil de 24 horas",
      last7d: "Últimos 7 días",
      last7dHint: "Ventana móvil de siete días",
      allAlerts: "Todos Alerts",
      allAlertsHint: "Cada alerta publicada visible",
      helper: "Standard zeigt alle veröffentlichten Alerts. Enger über URL auf Hoy (UTC) oder kürzere Fenster."
    },
    summary: {
      ...marketingUiEn.scamAlertsPage.summary,
      highScore: "Alto+ (puntuación ≥ 75)",
      sortByScore: "Ordenado por publicación reciente y puntuación",
      newTodayUtc: "Publicado recientemente (UTC)",
      totalPublished: "Total publicado",
      mostCommonType: "Tipo más común",
      showing: "Mostrando",
      zeroPublished: "0 alertas publicadas",
      rangeSingle: "{current} de {total} alertas publicadas",
      rangeSpan: "{start}–{end} de {total} alertas publicadas"
    },
    empty: {
      zeroTitle: "No hay alertas de fraude activas ahora",
      zeroBody:
        "Fraudly monitoriza fuentes públicas de forma continua. Nuevas alertas aparecerán aquí con pruebas suficientes.",
      filteredTitle: "Ninguna alerta coincide con esta vista",
      filteredBody: "Versuchen Sie einen breiteren Periodo (z. B. „Todos Alerts“) oder einen anderen Filter.",
      viewAllTimeCta: "Todos veröffentlichten Alerts anzeigen",
      checkWebsiteCta: "Verificar un sitio ahora"
    },
    card: { technicalMatchStrength: "Fuerza de coincidencia", technicalSignals: "Señales de corroboración" },
    pagination: { prev: "Página anterior", prevDisabled: "Anterior", next: "Página siguiente", nextDisabled: "Siguiente", page: "Página" }
  },
  latestChecksPage: {
    ...marketingUiEn.latestChecksPage,
    trustScorePillLabel: "Puntuación de confianza",
    viewResultArrow: "Ver resultado →",
    emptyState: "Aún no hay comprobaciones públicas. Los resúmenes aparecerán aquí cuando estén disponibles.",
    unavailableState: "Las últimas comprobaciones no están disponibles temporalmente. Aún puedes verificar un sitio arriba.",
    ctaPrimary: "Iniciar comprobación",
    listAria: "Últimos resúmenes públicos de comprobaciones",
    entityFallback: "Elemento verificado",
    entityLabels: {
      domain: "Dominio / sitio",
      url: "URL",
      company: "Empresa / marca",
      crypto_wallet: "Monedero cripto",
      username: "Nombre de usuario / handle"
    },
    pagination: { prev: "Página anterior", prevDisabled: "Anterior", next: "Página siguiente", nextDisabled: "Siguiente", page: "Página" }
  },
  homeSections: {
    trustActivity: {
      title: "Fraudly ayuda a los usuarios a estar más seguros en línea",
      subtitle: "Escaneos con IA para detectar sitios sospechosos, phishing y estafas.",
      footnote: "{count} comprobaciones públicas en 30 días — feed respetuoso con la privacidad.",
      stats: {
        websiteChecksLabel: "Comprobaciones de sitios",
        websiteChecksHint: "Comprobaciones públicas en el feed de Fraudly.",
        websiteChecksFallback: "En crecimiento",
        threatSignalsLabel: "Señales de amenaza analizadas",
        threatSignalsHint: "Comprobaciones recientes + alertas de fraude (30 días).",
        threatSignalsFallback: "En construcción",
        buildingHint: "Los datos de actividad aún se están generando.",
        aiLabel: "Análisis asistido por IA",
        aiValue: "24/7",
        aiHint: "Heurísticas continuas + inteligencia pública.",
        growingLabel: "Crecimiento diario",
        growingValue: "Nuevos escaneos cada día",
        growingValueActive: "Hoy aktiv",
        growingHint: "Nuevas comprobaciones públicas aparecen continuamente.",
        growingHintActive: "{count} comprobaciones públicas en las últimas 24 h."
      }
    },
    whatWeCheck: {
      title: "Qué analiza Fraudly",
      intro: "Fraudly combina señales de confianza, reputación y análisis con IA para detectar sitios sospechosos.",
      cards: [
        { title: "Reputación del sitio", body: "Señales públicas de confianza y reseñas — con límites claros." },
        { title: "SSL y seguridad", body: "HTTPS, certificados y ajustes técnicos importantes." },
        { title: "Antigüedad del dominio", body: "Historial de registro — a menudo distinto en estafas." },
        { title: "Indicadores de phishing", body: "Idioma, Dringlichkeit und typische Phishing-Muster." },
        { title: "Reportes de estafas", body: "Cruce con alertas publicadas e inteligencia pública." },
        { title: "Patrones de riesgo con IA", body: "Heurísticas para combinaciones inusuales de señales." }
      ]
    },
    featureCards: [
      { title: "Señales, no ruido", description: "Reputación, feeds de estafas, SSL y dominio — en una vista clara." },
      { title: "Segundos, no suposiciones", description: "En el navegador. Sin instalación para la primera comprobación." },
      { title: "Klare Idioma", description: "Consejos honestos con límites transparentes." }
    ]
  },
  homeBelowFold: {
    trustSafety: {
      title: "Comprobaciones tranquilas para tus compras",
      body: "Fraudly es un verificador de confianza para anuncios sociales, marketplaces y «¿esta URL es segura?» — señales estructuradas, sin alarmismo.",
      bullets: [
        "Inteligencia de estafas + reputación, SSL y contexto histórico",
        "Escaneos profundos opcionales para más detalle técnico",
        "«Últimas comprobaciones» públicas y alertas de amenazas"
      ],
      featuresCta: "Ver funciones",
      learnCta: "Aprender sobre estafas online"
    },
    howItWorks: {
      title: "Cómo funciona la comprobación",
      steps: [
        "Pega una URL antes de pagar, iniciar sesión o pulsar un anuncio dudoso.",
        "Fraudly obtiene contexto de seguridad, historial, feeds de estafas y reputación.",
        "Ves una puntuación, un resumen y detalles opcionales."
      ],
      footerPrefix: "¿El proceso completo? Lee",
      footerLinkLabel: "cómo funciona Fraudly"
    },
    faq: {
      title: "Preguntas frecuentes",
      items: [
        {
          question: "¿Fraudly es un verificador de estafas?",
          answer: "Sí — para comprobar enlaces desconocidos con feeds de estafas, señales HTTPS/dominio y explicación con IA opcional."
        },
        {
          question: "¿Fraudly garantiza un 100 % de seguridad?",
          answer: "Ninguna herramienta puede hacerlo. Usa Fraudly con sentido común y verificación oficial."
        },
        {
          question: "¿Diferencia con un antivirus?",
          answer: "Fraudly se centra en sitios engañosos: phishing, tiendas dudosas, SSL, feeds de estafas — no solo malware."
        },
        { question: "¿Coste de la primera comprobación?", answer: "La primera comprobación en el navegador es gratis sin cuenta." }
      ]
    },
    testimonials: {
      title: "Lo que dicen los usuarios",
      items: [
        { quote: "Gut, dass ich nicht gekauft habe — Fraudly zeigte eine riskante Página.", name: "Emma" },
        { quote: "Verifico cada anuncio de Instagram con Fraudly.", name: "Noah" },
        { quote: "Me evitó una tienda de zapatillas dudosa.", name: "Jason" },
        { quote: "En segundos supe que esa tienda de TikTok merecía una segunda mirada.", name: "Mila" },
        { quote: "El anuncio parecía legítimo. Fraudly mostró las señales de alerta.", name: "Olivia" },
        { quote: "Ideal para revisar promociones sociales antes de comprar.", name: "Daan" }
      ]
    },
    bottomCta: {
      title: "¿Listo para comprobar un enlace?",
      bodyPrefix: "Haz un escaneo gratis y comparte un resumen como",
      bodyLinkLabel: "/check/ejemplo.es",
      bodySuffix: "cuando te preguntan: «¿Este sitio parece bien?»",
      button: "Verificar sitio web"
    }
  },
  supportFaq: [
    {
      question: "¿Qué es Fraudly?",
      answer:
        "Fraudly analiza sitios para detectar señales de estafa, phishing e indicadores de confianza con análisis automatizado y asistido por IA."
    },
    {
      question: "¿Fraudly garantiza la seguridad?",
      answer: "No. Los resultados son informativos, no garantías. Usa siempre tu propio criterio."
    },
    {
      question: "¿Cómo funciona la puntuación de confianza?",
      answer: "Combina indicadores técnicos y de reputación en una puntuación clara."
    },
    {
      question: "¿Detecta phishing?",
      answer: "Fraudly ayuda a detectar patrones típicos de phishing y estafa."
    },
    {
      question: "¿Por qué cambian las puntuaciones?",
      answer: "Los riesgos y la reputación cambian rápido. Fraudly analiza información nueva de forma continua."
    },
    {
      question: "¿Fraudly es gratuito?",
      answer: "Comprobaciones gratuitas por ahora; más funciones llegarán."
    },
    {
      question: "¿Mis escaneos son públicos?",
      answer: "Algunos escaneos pueden aparecer de forma anónima en feeds públicos. No mostramos datos personales a propósito."
    },
    {
      question: "¿Contactar soporte?",
      answer: "Escribe a support@fraudly.app."
    }
  ]
};
