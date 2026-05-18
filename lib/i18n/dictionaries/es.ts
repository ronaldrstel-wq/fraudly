import type { CoreDictionary } from "@/lib/i18n/dictionary-types";

export const es: CoreDictionary = {
  localeBanner: {
    dismiss: "Cerrar"
  },
  nav: {
    latestChecks: "Últimas comprobaciones",
    pulse: "Fraudly Pulse",
    scamAlerts: "Alertas de fraude",
    howItWorks: "Cómo funciona",
    features: "Funciones",
    learn: "Aprender",
    about: "Acerca de",
    scamHelp: "Ayuda ante estafas",
    support: "Soporte y FAQ"
  },
  auth: {
    login: "Iniciar sesión",
    signUp: "Crear cuenta"
  },
  footer: {
    tagline: "Fraudly te ayuda a revisar enlaces sospechosos antes de hacer clic.",
    features: "Funciones",
    support: "Soporte y FAQ",
    howItWorks: "Cómo funciona",
    learn: "Aprender",
    scamChecker: "Comprobador de estafas",
    latestChecks: "Últimas comprobaciones",
    pulse: "Fraudly Pulse",
    scamAlerts: "Alertas de fraude",
    scamHelp: "Ayuda ante estafas",
    privacy: "Privacidad",
    terms: "Términos",
    disclaimer: "Aviso legal",
    cookies: "Política de cookies",
    contact: "Contacto"
  },
  homepage: {
    heroBadge: "Comprobación de seguridad web y tienda",
    heroTitleLine1: "Míralo.",
    heroTitleLine2: "Compruébalo.",
    heroTitleLine3: "Confía.",
    heroSubtitle: "Comprueba si un sitio web o tienda online es seguro antes de comprar.",
    heroTrustFeatures: [
      "Detecta estafas y phishing",
      "Analiza confianza y reputación",
      "Revisa antigüedad del dominio y seguridad",
      "Análisis de riesgo asistido por IA"
    ],
    primaryCta: "Verificar sitio web",
    secondaryCta: "Cómo funciona Fraudly",
    heroSearchHelper: "Rápido. Privado. Seguro. Sin registro para tu primera comprobación.",
    trustHelperBelowSearch:
      "Sin instalación · Funciona al instante · Fraudly analiza sitios con inteligencia pública sobre estafas — no es asesoramiento legal.",
    howItWorksTitle: "Cómo funciona Fraudly",
    howItWorksSteps: [
      { title: "Enviar", body: "Pega la URL de una tienda, dominio o enlace sospechoso." },
      { title: "Analizar", body: "Revisamos SSL, señales del dominio, reputación y fuentes de estafas." },
      { title: "Revisión IA", body: "Los patrones se resumen en lenguaje claro." },
      { title: "Resultados", body: "Consulta señales de confianza antes de pagar o iniciar sesión." }
    ]
  },
  about: {
    badge: "Acerca de Fraudly",
    title: "Ayudamos a pausar antes de clics arriesgados",
    intro:
      "Fraudly ofrece una segunda opinión fundamentada sobre sitios desconocidos — antes de comprar, acceder al banco o compartir datos — con un lenguaje claro y señales comprensibles.",
    independentBadge: "Proyecto independiente",
    independentTitle: "Proyecto independiente",
    independentP1:
      "Fraudly es un proyecto independiente creado por Ronald, profesional tecnológico y Service Manager con experiencia en IA, servicios digitales y aplicaciones centradas en el usuario.",
    independentP2:
      "El proyecto prioriza usabilidad, transparencia, privacidad y decisiones más seguras en línea.",
    whyTitle: "Por qué existe Fraudly",
    whyBody:
      "Las estafas online evolucionan: tiendas falsas en anuncios, portales bancarios imitados, phishing por mensajes y mercados dudosos. La gente necesita un empujón fiable y detalle suficiente para actuar con criterio.",
    approachTitle: "Cómo abordamos la confianza",
    approachBody:
      "Combinamos señales de confianza con indicadores de estafa, SSL, WHOIS, feeds de inteligencia, pruebas ligeras y narración asistida por IA. La cobertura nunca es perfecta — verifica por tu cuenta cuando el riesgo sea alto.",
    pillars: [
      {
        title: "Para compradores prudentes",
        body: "Nos centramos en phishing, tiendas falsas y estafas en redes — donde se pierde dinero en minutos."
      },
      {
        title: "Señales que puedes revisar",
        body: "Cada comprobación muestra contexto técnico, de reputación e inteligencia cuando está disponible."
      },
      {
        title: "Rápido por diseño",
        body: "Sin instalaciones: pega una URL, lee el resumen y abre análisis profundos si los necesitas."
      }
    ],
    limitsTitle: "Límites honestos",
    limitsBody:
      "Fraudly no promete precisión perfecta. Trata cada resultado como contexto situacional y combínalo con tu banco, el comercio o personas de confianza.",
    ctaPrompt: "¿Tienes un enlace dudoso?",
    ctaButton: "Hacer una comprobación Fraudly"
  },
  support: {
    badge: "Soporte y FAQ",
    title: "¿En qué podemos ayudarte?",
    intro:
      "Respuestas sobre comprobaciones web, puntuaciones de confianza, cuentas e incidencias. Los resultados de escaneo y la evidencia técnica siguen en inglés por ahora.",
    emailCta: "Escribir a soporte",
    quickHelpTitle: "Ayuda rápida",
    faqTitle: "Preguntas frecuentes",
    stillNeedHelp: "¿Sigues necesitando ayuda?",
    stillNeedHelpBody: "Escríbenos con la URL que comprobaste y qué esperabas — leemos todos los mensajes.",
    ctaCheck: "Verificar sitio web"
  },
  scamHelp: {
    badge: "Ayuda ante estafas — solo informativo",
    title: "¿Te estafaron o no sabes qué hacer?",
    subtitle: "Encuentra organismos oficiales para denunciar y pasos prácticos para protegerte.",
    cta: "Comprobar un sitio sospechoso",
    ctaSection: "Comprueba un sitio antes de pagar",
    ctaButton: "Comprobar un sitio antes de pagar",
    chooseCountry: "Elige tu país",
    chooseCountryHint: "Selecciona tu país para ver organismos oficiales y siguientes pasos.",
    reportingForPrefix: "Opciones de denuncia para",
    privacyHint:
      "Usamos una señal de país respetuosa con la privacidad desde tu navegador o proveedor. Puedes cambiarla abajo.",
    detectedHint: "Sugerido para tu región según una pista aproximada — no tu ubicación exacta.",
    immediateActions: "Acciones inmediatas",
    moreGuidancePrefix: "Más orientación para"
  },
  scamAlerts: {
    eyebrow: "Inteligencia sobre estafas",
    title: "Alertas de fraude y phishing",
    intro:
      "Fraudly monitoriza inteligencia pública y señales de sitios sospechosos para mostrar amenazas emergentes en lenguaje claro.",
    chips: [
      "Amenazas detectadas recientemente",
      "Dominios de riesgo en tendencia",
      "Indicadores de phishing",
      "Registros sospechosos nuevos"
    ],
    chipHint: "Usa filtros para phishing, dominios en tendencia y resúmenes de alta confianza.",
    disclaimer:
      "Fraudly agrega inteligencia de terceros. Cada alerta invita a verificar — no es prueba por sí sola."
  },
  latestChecks: {
    overline: "Instantánea comunitaria · resúmenes anonimizados",
    title: "Últimas comprobaciones Fraudly",
    intro:
      "Comprobaciones públicas recientes en Fraudly. Este feed muestra qué están verificando las personas — sin cuentas ni historial privado.",
    footnote:
      "Las puntuaciones se generan automáticamente con confianza, reputación, comprobaciones técnicas, feeds de estafas y análisis asistido por IA.",
    resultsNote: "Los resultados individuales siguen en inglés."
  },
  meta: {
    home: {
      title: "¿Es seguro un sitio web o tienda online? | Fraudly",
      description:
        "Comprueba con Fraudly si un sitio o tienda online es seguro. Señales de estafa y detección de phishing antes de comprar."
    },
    about: {
      title: "Acerca de Fraudly — Confianza web y comprobador de estafas",
      description:
        "Descubre cómo Fraudly ayuda a evitar estafas, phishing y tiendas falsas con análisis claro de dominios y tiendas."
    },
    support: {
      title: "Soporte y FAQ — Ayuda con comprobaciones web",
      description:
        "Ayuda con comprobaciones de confianza, resultados del comprobador y detección de phishing — respuestas a preguntas frecuentes."
    },
    scamHelp: {
      title: "Ayuda ante estafas — Qué hacer si te estafaron",
      description:
        "¿Estafa online? Enlaces oficiales para denunciar y pasos prácticos. Fraudly es informativo, no es policía."
    },
    scamAlerts: {
      title: "Alertas de amenazas — Inteligencia de estafas y phishing",
      description:
        "Alertas públicas con contexto de phishing y avisos de tiendas falsas — inteligencia de monitoreo de Fraudly."
    },
    latestChecks: {
      title: "Últimas comprobaciones de confianza web",
      description:
        "Consulta comprobaciones públicas recientes y resultados del comprobador — señales de phishing y tiendas falsas en tiempo real."
    }
  }
};
