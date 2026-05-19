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
      highRiskSub: "Usa a pontuação de alerta agregada",
      malware: "Malware",
      phishing: "Phishing",
      severityTypeLabel: "Gravidade e tipo",
      exactTypeLabel: "Tipo exato:",
      anyType: "Qualquer"
    },
    timeRange: {
      label: "Período",
      today: "Hoje",
      todayHint: "Publicado desde a meia-noite UTC de hoje",
      last24h: "Últimas 24 h",
      last24hHint: "Janela móvel das últimas 24 horas",
      last7d: "Últimos 7 dias",
      last7dHint: "Janela móvel dos últimos sete dias",
      allAlerts: "Todos os alertas",
      allAlertsHint: "Todos os alertas publicados visíveis",
      helper:
        "Por defeito são mostrados todos os alertas publicados. Restringe a Hoje (UTC) ou janelas mais curtas através do URL."
    },
    summary: {
      ...marketingUiEn.scamAlertsPage.summary,
      highScore: "Alto+ (pontuação ≥ 75)",
      sortByScore: "Ordenado por publicação recente e pontuação",
      newTodayUtc: "Publicado recentemente (UTC)",
      totalPublished: "Total publicado",
      mostCommonType: "Tipo mais comum",
      showing: "A mostrar",
      zeroPublished: "0 alertas publicados",
      rangeSingle: "{current} de {total} alertas publicados",
      rangeSpan: "{start}–{end} de {total} alertas publicados"
    },
    empty: {
      zeroTitle: "Não há alertas de fraude ativos agora",
      zeroBody:
        "O Fraudly monitoriza fontes públicas de forma contínua. Novos alertas aparecerão aqui quando houver provas suficientes.",
      filteredTitle: "Nenhum alerta corresponde a esta vista",
      filteredBody:
        "Experimente um período mais amplo (por exemplo «Todos os alertas») ou outro filtro de gravidade. Os totais acima refletem todos os alertas publicados.",
      viewAllTimeCta: "Ver todos os alertas publicados",
      checkWebsiteCta: "Verificar um site agora"
    },
    card: {
      technicalMatchStrength: "Força de correspondência",
      technicalSignals: "Sinais de corroboração",
      relatedAlertSameDomain: "Alerta relacionado · mesmo domínio",
      published: "Publicado",
      updated: "Atualizado",
      source: "Fonte",
      unknown: "Desconhecido",
      domainSr: "Domínio:",
      severitySr: "Gravidade:",
      technicalDetails: "Detalhes técnicos",
      readFullAlert: "Ler alerta completo →",
      publishedExact: "Publicado (exato)",
      rawType: "Tipo bruto",
      originalTitle: "Título original",
      domain: "Domínio",
      url: "URL"
    },
    pagination: {
      prev: "Página anterior",
      prevDisabled: "Anterior",
      next: "Página seguinte",
      nextDisabled: "Seguinte",
      page: "Página"
    }
  },
  latestChecksPage: {
    ...marketingUiEn.latestChecksPage,
    trustScorePillLabel: "Pontuação de confiança",
    trustScoreOutOf100Aria: "{label}: {score} de 100",
    dataConfidenceAria: "Confiança dos dados",
    viewResultArrow: "Ver resultado →",
    emptyState:
      "Ainda não há verificações públicas. Os resumos aparecerão aqui assim que estiverem disponíveis de forma respeitosa com a privacidade.",
    unavailableState:
      "As últimas verificações estão temporariamente indisponíveis. Ainda pode verificar um site acima.",
    ctaPrimary: "Iniciar verificação",
    listAria: "Últimos resumos públicos de verificações",
    entityFallback: "Item verificado",
    entityLabels: {
      domain: "Domínio / site",
      url: "URL",
      company: "Empresa / marca",
      crypto_wallet: "Carteira cripto",
      username: "Utilizador / identificador público"
    },
    pagination: {
      prev: "Página anterior",
      prevDisabled: "Anterior",
      next: "Página seguinte",
      nextDisabled: "Seguinte",
      page: "Página"
    }
  },
  homeSections: {
    trustActivity: {
      title: "O Fraudly ajuda os utilizadores a estar mais seguros online",
      subtitle: "Verificações com IA para detetar sites suspeitos, phishing e fraudes.",
      footnote: "{count} verificações públicas nos últimos 30 dias — feed respeitoso com a privacidade.",
      stats: {
        websiteChecksLabel: "Verificações de sites",
        websiteChecksHint: "Verificações públicas no feed do Fraudly.",
        websiteChecksFallback: "A crescer",
        threatSignalsLabel: "Sinais de ameaça analisados",
        threatSignalsHint: "Verificações recentes e alertas de fraude publicados (30 dias).",
        threatSignalsFallback: "Em construção",
        buildingHint: "Os dados de atividade ainda estão a ser gerados — volte em breve.",
        aiLabel: "Análise assistida por IA",
        aiValue: "24/7",
        aiHint: "Heurísticas contínuas e inteligência pública.",
        growingLabel: "Crescimento diário",
        growingValue: "Novas verificações todos os dias",
        growingValueActive: "Ativo hoje",
        growingHint: "Novas verificações públicas aparecem à medida que as pessoas verificam sites.",
        growingHintActive: "{count} verificações públicas nas últimas 24 horas."
      }
    },
    whatWeCheck: {
      title: "O que o Fraudly analisa",
      intro: "O Fraudly combina sinais de confiança, reputação e análise com IA para detetar sites suspeitos.",
      cards: [
        { title: "Reputação do site", body: "Sinais públicos de confiança e avaliações — com limites claros." },
        { title: "SSL e segurança", body: "HTTPS, certificados e definições técnicas importantes." },
        { title: "Idade do domínio", body: "Histórico de registo — muitas vezes diferente em fraudes." },
        { title: "Indicadores de phishing", body: "Linguagem, urgência e padrões típicos de páginas enganadoras." },
        { title: "Relatórios de fraudes", body: "Cruzamento com alertas publicados e inteligência pública." },
        { title: "Padrões de risco com IA", body: "Heurísticas para combinações invulgares de sinais." }
      ]
    },
    featureCards: [
      { title: "Sinais, não ruído", description: "Reputação, feeds de fraudes, SSL e domínio — numa vista clara." },
      { title: "Segundos, não suposições", description: "No navegador. Sem instalação para a primeira verificação." },
      { title: "Linguagem clara", description: "Conselhos honestos com limites transparentes." }
    ]
  },
  homeBelowFold: {
    trustSafety: {
      title: "Verificações tranquilas para as suas compras",
      body: "O Fraudly é um verificador de confiança para anúncios sociais, marketplaces e «este URL é seguro?» — sinais estruturados, sem alarmismo.",
      bullets: [
        "Inteligência de fraudes + reputação, SSL e contexto histórico",
        "Verificações profundas opcionais para mais detalhe técnico",
        "«Últimas verificações» públicas e alertas de ameaças"
      ],
      featuresCta: "Ver funcionalidades",
      learnCta: "Aprender sobre fraudes online"
    },
    howItWorks: {
      title: "Como funciona a verificação",
      steps: [
        "Cole um URL antes de pagar, iniciar sessão ou clicar num anúncio duvidoso.",
        "O Fraudly obtém contexto de segurança, histórico, feeds de fraudes e reputação.",
        "Vê uma pontuação, um resumo e detalhes opcionais."
      ],
      footerPrefix: "O processo completo? Leia",
      footerLinkLabel: "como o Fraudly funciona"
    },
    faq: {
      title: "Perguntas frequentes",
      items: [
        {
          question: "O Fraudly é um verificador de fraudes?",
          answer:
            "Sim — para verificar links desconhecidos com feeds de fraudes, sinais HTTPS/domínio e explicação com IA opcional."
        },
        {
          question: "O Fraudly garante 100% de segurança?",
          answer: "Nenhuma ferramenta pode fazê-lo. Use o Fraudly com bom senso e verificação oficial."
        },
        {
          question: "Qual é a diferença para um antivírus?",
          answer: "O Fraudly foca-se em sites enganadores: phishing, lojas duvidosas, SSL e feeds de fraudes — não só malware."
        },
        { question: "Quanto custa a primeira verificação?", answer: "A primeira verificação no navegador é gratuita sem conta." }
      ]
    },
    testimonials: {
      title: "O que dizem os utilizadores",
      items: [
        { quote: "Ainda bem que não comprei — o Fraudly mostrou que era um site arriscado.", name: "Emma" },
        { quote: "Verifico cada anúncio do Instagram com o Fraudly.", name: "Noah" },
        { quote: "Evitou-me uma loja de ténis duvidosa.", name: "Jason" },
        { quote: "Em segundos soube que aquela loja TikTok merecia uma segunda olhadela.", name: "Mila" },
        { quote: "O anúncio parecia legítimo. O Fraudly mostrou os sinais de alerta.", name: "Olivia" },
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
      question: "Como contactar o suporte?",
      answer: "Escreva para support@fraudly.app."
    }
  ]
};
