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
      anyType: "Cualquiera"
    },
    timeRange: {
      label: "Periodo",
      today: "Hoy",
      todayHint: "Publicado desde medianoche UTC de hoy",
      last24h: "Últimas 24 h",
      last24hHint: "Ventana móvil de las últimas 24 horas",
      last7d: "Últimos 7 días",
      last7dHint: "Ventana móvil de los últimos siete días",
      allAlerts: "Todas las alertas",
      allAlertsHint: "Todas las alertas publicadas visibles",
      helper:
        "Por defecto se muestran todas las alertas publicadas. Restringe a Hoy (UTC) o ventanas más cortas desde la URL."
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
        "Fraudly monitoriza fuentes públicas de forma continua. Las nuevas alertas aparecerán aquí cuando haya pruebas suficientes.",
      filteredTitle: "Ninguna alerta coincide con esta vista",
      filteredBody:
        "Prueba un periodo más amplio (por ejemplo «Todas las alertas») u otro filtro de gravedad. Los totales siguen reflejando todas las alertas publicadas.",
      viewAllTimeCta: "Ver todas las alertas publicadas",
      checkWebsiteCta: "Comprobar un sitio ahora"
    },
    card: {
      technicalMatchStrength: "Fuerza de coincidencia",
      technicalSignals: "Señales de corroboración",
      relatedAlertSameDomain: "Alerta relacionada · mismo dominio",
      published: "Publicado",
      updated: "Actualizado",
      source: "Fuente",
      unknown: "Desconocido",
      domainSr: "Dominio:",
      severitySr: "Gravedad:",
      technicalDetails: "Detalles técnicos",
      readFullAlert: "Leer alerta completa →",
      publishedExact: "Publicado (exacto)",
      rawType: "Tipo bruto",
      originalTitle: "Título original",
      domain: "Dominio",
      url: "URL"
    },
    pagination: {
      prev: "Página anterior",
      prevDisabled: "Anterior",
      next: "Página siguiente",
      nextDisabled: "Siguiente",
      page: "Página"
    }
  },
  latestChecksPage: {
    ...marketingUiEn.latestChecksPage,
    trustScorePillLabel: "Puntuación de confianza",
    trustScoreOutOf100Aria: "{label}: {score} de 100",
    dataConfidenceAria: "Confianza de los datos",
    viewResultArrow: "Ver resultado →",
    emptyState:
      "Aún no hay comprobaciones públicas. Los resúmenes aparecerán aquí en cuanto estén disponibles de forma respetuosa con la privacidad.",
    unavailableState:
      "Las últimas comprobaciones no están disponibles temporalmente. Aún puedes comprobar un sitio arriba.",
    ctaPrimary: "Iniciar comprobación",
    listAria: "Últimos resúmenes públicos de comprobaciones",
    entityFallback: "Elemento verificado",
    entityLabels: {
      domain: "Dominio / sitio",
      url: "URL",
      company: "Empresa / marca",
      crypto_wallet: "Monedero cripto",
      username: "Usuario / identificador público"
    },
    pagination: {
      prev: "Página anterior",
      prevDisabled: "Anterior",
      next: "Página siguiente",
      nextDisabled: "Siguiente",
      page: "Página"
    }
  },
  homeSections: {
    trustActivity: {
      title: "Fraudly ayuda a los usuarios a estar más seguros en línea",
      subtitle: "Escaneos con IA para detectar sitios sospechosos, phishing y estafas.",
      footnote: "{count} comprobaciones públicas en los últimos 30 días — feed respetuoso con la privacidad.",
      stats: {
        websiteChecksLabel: "Comprobaciones de sitios",
        websiteChecksHint: "Comprobaciones públicas en el feed de Fraudly.",
        websiteChecksFallback: "En crecimiento",
        threatSignalsLabel: "Señales de amenaza analizadas",
        threatSignalsHint: "Comprobaciones recientes y alertas de fraude publicadas (30 días).",
        threatSignalsFallback: "En construcción",
        buildingHint: "Los datos de actividad aún se están generando — vuelve pronto.",
        aiLabel: "Análisis asistido por IA",
        aiValue: "24/7",
        aiHint: "Heurísticas continuas e inteligencia pública.",
        growingLabel: "Crecimiento diario",
        growingValue: "Nuevos escaneos cada día",
        growingValueActive: "Activo hoy",
        growingHint: "Aparecen comprobaciones públicas nuevas a medida que la gente verifica sitios.",
        growingHintActive: "{count} comprobaciones públicas en las últimas 24 horas."
      }
    },
    whatWeCheck: {
      title: "Qué analiza Fraudly",
      intro: "Fraudly combina señales de confianza, reputación y análisis con IA para detectar sitios sospechosos.",
      cards: [
        { title: "Reputación del sitio", body: "Señales públicas de confianza y reseñas — con límites claros." },
        { title: "SSL y seguridad", body: "HTTPS, certificados y ajustes técnicos importantes." },
        { title: "Antigüedad del dominio", body: "Historial de registro — a menudo distinto en estafas." },
        { title: "Indicadores de phishing", body: "Lenguaje, urgencia y patrones típicos de páginas engañosas." },
        { title: "Reportes de estafas", body: "Cruce con alertas publicadas e inteligencia pública." },
        { title: "Patrones de riesgo con IA", body: "Heurísticas para combinaciones inusuales de señales." }
      ]
    },
    featureCards: [
      { title: "Señales, no ruido", description: "Reputación, feeds de estafas, SSL y dominio — en una vista clara." },
      { title: "Segundos, no suposiciones", description: "En el navegador. Sin instalación para la primera comprobación." },
      { title: "Lenguaje claro", description: "Consejos honestos con límites transparentes." }
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
          answer:
            "Sí — para comprobar enlaces desconocidos con feeds de estafas, señales HTTPS/dominio y explicación con IA opcional."
        },
        {
          question: "¿Fraudly garantiza un 100 % de seguridad?",
          answer: "Ninguna herramienta puede hacerlo. Usa Fraudly con sentido común y verificación oficial."
        },
        {
          question: "¿En qué se diferencia de un antivirus?",
          answer: "Fraudly se centra en sitios engañosos: phishing, tiendas dudosas, SSL y feeds de estafas — no solo malware."
        },
        { question: "¿Cuánto cuesta la primera comprobación?", answer: "La primera comprobación en el navegador es gratis sin cuenta." }
      ]
    },
    testimonials: {
      title: "Lo que dicen los usuarios",
      items: [
        { quote: "Menos mal que no compré — Fraudly mostró que era un sitio arriesgado.", name: "Emma" },
        { quote: "Compruebo cada anuncio de Instagram con Fraudly.", name: "Noah" },
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
      button: "Comprobar sitio web"
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
      question: "¿Cómo contactar con soporte?",
      answer: "Escribe a support@fraudly.app."
    }
  ]
};
