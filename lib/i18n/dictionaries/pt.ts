import type { CoreDictionary } from "@/lib/i18n/dictionary-types";

export const pt: CoreDictionary = {
  localeBanner: {
    dismiss: "Fechar"
  },
  nav: {
    latestChecks: "Últimas verificações",
    pulse: "Fraudly Pulse",
    scamAlerts: "Alertas de fraude",
    howItWorks: "Como funciona",
    features: "Funcionalidades",
    learn: "Aprender",
    about: "Sobre",
    scamHelp: "Ajuda contra fraudes",
    support: "Suporte e FAQ"
  },
  auth: {
    login: "Entrar",
    signUp: "Criar conta"
  },
  footer: {
    tagline: "O Fraudly ajuda você a revisar links suspeitos antes de clicar.",
    features: "Funcionalidades",
    support: "Suporte e FAQ",
    howItWorks: "Como funciona",
    learn: "Aprender",
    scamChecker: "Verificador de fraudes",
    latestChecks: "Últimas verificações",
    pulse: "Fraudly Pulse",
    scamAlerts: "Alertas de fraude",
    scamHelp: "Ajuda contra fraudes",
    privacy: "Privacidade",
    terms: "Termos",
    disclaimer: "Aviso legal",
    cookies: "Política de cookies",
    contact: "Contacto"
  },
  homepage: {
    heroBadge: "Verificação de segurança de site e loja",
    heroTitleLine1: "Veja.",
    heroTitleLine2: "Verifique.",
    heroTitleLine3: "Confie.",
    heroSubtitle: "Verifique se um site ou loja online é seguro antes de comprar.",
    heroTrustFeatures: [
      "Deteta fraudes e phishing",
      "Analisa confiança e reputação",
      "Verifica idade do domínio e segurança",
      "Análise de risco com IA"
    ],
    primaryCta: "Verificar site",
    secondaryCta: "Como o Fraudly funciona",
    heroSearchHelper: "Rápido. Privado. Seguro. Sem registo para a primeira verificação.",
    trustHelperBelowSearch:
      "Sem instalação · Funciona de imediato · O Fraudly analisa sites com inteligência pública sobre fraudes — não é aconselhamento jurídico.",
    howItWorksTitle: "Como o Fraudly funciona",
    howItWorksSteps: [
      { title: "Enviar", body: "Cole o URL de uma loja, domínio ou link suspeito." },
      { title: "Analisar", body: "Verificamos SSL, sinais do domínio, reputação e feeds de fraudes." },
      { title: "Revisão IA", body: "Os padrões são resumidos em linguagem clara." },
      { title: "Resultados", body: "Veja sinais de confiança antes de pagar ou iniciar sessão." }
    ]
  },
  about: {
    badge: "Sobre o Fraudly",
    title: "Ajudamos a pausar antes de cliques arriscados",
    intro:
      "O Fraudly oferece uma segunda opinião fundamentada sobre sites desconhecidos — antes de comprar, aceder ao banco ou partilhar dados — com linguagem clara e sinais compreensíveis.",
    independentBadge: "Projeto independente",
    independentTitle: "Projeto independente",
    independentP1:
      "O Fraudly é um projeto independente criado por Ronald, profissional de tecnologia e Service Manager com experiência em IA, serviços digitais e aplicações centradas no utilizador.",
    independentP2:
      "O projeto prioriza usabilidade, transparência, privacidade e decisões mais seguras online.",
    whyTitle: "Porque o Fraudly existe",
    whyBody:
      "As fraudes online evoluem: lojas falsas em anúncios, portais bancários falsos, phishing por mensagens e marketplaces duvidosos. As pessoas precisam de um empurrão fiável e detalhe suficiente para agir com critério.",
    approachTitle: "Como abordamos a confiança",
    approachBody:
      "Combinamos sinais de confiança com indicadores de fraude, SSL, WHOIS, feeds de inteligência e narração assistida por IA. A cobertura nunca é perfeita — verifique por si quando o risco for alto.",
    pillars: [
      {
        title: "Para compradores prudentes",
        body: "Focamo-nos em phishing, lojas falsas e fraudes em redes — onde se perde dinheiro em minutos."
      },
      {
        title: "Sinais que pode rever",
        body: "Cada verificação mostra contexto técnico, de reputação e inteligência quando disponível."
      },
      {
        title: "Rápido por desenho",
        body: "Sem instalações: cole um URL, leia o resumo e abra análises profundas se precisar."
      }
    ],
    limitsTitle: "Limites honestos",
    limitsBody:
      "O Fraudly não promete precisão perfeita. Trate cada resultado como contexto situacional e combine com o banco, o comerciante ou pessoas de confiança.",
    ctaPrompt: "Tem um link duvidoso?",
    ctaButton: "Fazer uma verificação Fraudly"
  },
  support: {
    badge: "Suporte e FAQ",
    title: "Como podemos ajudar?",
    intro:
      "Respostas sobre verificações web, pontuações de confiança, contas e problemas. Os resultados de scan e a evidência técnica permanecem em inglês por agora.",
    emailCta: "Email ao suporte",
    quickHelpTitle: "Ajuda rápida",
    faqTitle: "Perguntas frequentes",
    stillNeedHelp: "Ainda precisa de ajuda?",
    stillNeedHelpBody: "Envie-nos o URL que verificou e o que esperava — lemos todas as mensagens.",
    ctaCheck: "Verificar site"
  },
  scamHelp: {
    badge: "Ajuda contra fraudes — apenas informativo",
    title: "Foi enganado ou não sabe o que fazer?",
    subtitle: "Encontre organismos oficiais para denunciar e passos práticos para se proteger.",
    cta: "Verificar um site suspeito",
    ctaSection: "Verifique um site antes de pagar",
    ctaButton: "Verificar um site antes de pagar",
    chooseCountry: "Escolha o seu país",
    chooseCountryHint: "Selecione o país para ver organismos oficiais e próximos passos.",
    reportingForPrefix: "Opções de denúncia para",
    privacyHint:
      "Usamos um sinal de país respeitador da privacidade do navegador ou alojamento. Pode alterá-lo abaixo.",
    detectedHint: "Sugerido para a sua região com base numa pista aproximada — não a sua localização exata.",
    immediateActions: "Ações imediatas",
    moreGuidancePrefix: "Mais orientação para"
  },
  scamAlerts: {
    eyebrow: "Inteligência sobre fraudes",
    title: "Alertas de fraude e phishing",
    intro:
      "O Fraudly monitoriza inteligência pública e sinais de sites suspeitos para mostrar ameaças emergentes em linguagem clara.",
    chips: [
      "Ameaças detetadas recentemente",
      "Domínios de risco em tendência",
      "Indicadores de phishing",
      "Registos suspeitos novos"
    ],
    chipHint: "Use filtros para phishing, domínios em tendência e resumos de alta confiança.",
    disclaimer:
      "O Fraudly agrega inteligência de terceiros. Cada alerta convida a verificar — não é prova por si só."
  },
  latestChecks: {
    overline: "Instantâneo da comunidade · resumos anonimizados",
    title: "Últimas verificações Fraudly",
    intro:
      "Verificações públicas recentes no Fraudly. Este feed mostra o que as pessoas estão a verificar — sem contas nem histórico privado.",
    footnote:
      "As pontuações são geradas automaticamente com confiança, reputação, verificações técnicas, feeds de fraudes e análise com IA.",
    resultsNote: "Os resultados individuais permanecem em inglês."
  },
  meta: {
    home: {
      title: "Um site ou loja online é seguro? | Fraudly",
      description:
        "Verifique com o Fraudly se um site ou loja online é seguro. Sinais de fraude e deteção de phishing antes de comprar."
    },
    about: {
      title: "Sobre o Fraudly — Confiança web e verificador de fraudes",
      description:
        "Saiba como o Fraudly ajuda a evitar fraudes, phishing e lojas falsas com análise clara de domínios e lojas."
    },
    support: {
      title: "Suporte e FAQ — Ajuda com verificações web",
      description:
        "Ajuda com verificações de confiança, resultados do verificador e deteção de phishing — respostas frequentes."
    },
    scamHelp: {
      title: "Ajuda contra fraudes — O que fazer se foi enganado",
      description:
        "Fraude online? Ligações oficiais para denunciar e passos práticos. O Fraudly é informativo, não é polícia."
    },
    scamAlerts: {
      title: "Alertas de ameaças — Inteligência de fraudes e phishing",
      description:
        "Alertas públicas com contexto de phishing e avisos de lojas falsas — inteligência de monitorização do Fraudly."
    },
    latestChecks: {
      title: "Últimas verificações de confiança web",
      description:
        "Veja verificações públicas recentes e resultados do verificador — sinais de phishing e lojas falsas em tempo real."
    }
  }
};
