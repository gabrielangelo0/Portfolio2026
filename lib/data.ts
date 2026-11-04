import type { Localized } from "./i18n";

export type Vec3 = [number, number, number];

export type Project = {
  id: string;
  title: Localized;
  subtitle: Localized;
  description: Localized;
  stack: string[];
  url?: string;
  color: string;
  position: Vec3;
};

export const profile = {
  name: "Gabriel Angelo",
  role: { en: "Software Engineer · SaaS & Automation", pt: "Engenheiro de Software · SaaS & Automação" },
  tagline: {
    en: "Drive around the portfolio — WASD or the arrow keys.",
    pt: "Dirija pelo portfólio — WASD ou as setas.",
  },
  email: "gabrielangelolira@gmail.com",
  links: [
    { label: "GitHub", url: "https://github.com/gabrielangelo0" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/gabriel-angelo0/" },
  ],
};

/**
 * Ferramentas do dia a dia, agrupadas por frente de trabalho. A versão em
 * página mostra a lista inteira; o mundo 3D só cabe três ou quatro por seção.
 * Só o nome do grupo é traduzido — tecnologia é nome próprio.
 */
export const stack: { group: Localized; items: string[] }[] = [
  {
    group: { en: "Languages", pt: "Linguagens" },
    items: ["TypeScript", "JavaScript", "Go", "PHP", "Java"],
  },
  {
    group: { en: "Web", pt: "Web" },
    items: ["React", "Next.js", "Node.js", "HeroUI", "Three.js"],
  },
  { group: { en: "Mobile", pt: "Mobile" }, items: ["React Native", "Expo"] },
  {
    group: { en: "Data", pt: "Dados" },
    items: ["PostgreSQL", "Redis", "Supabase", "Firebase"],
  },
  {
    group: { en: "Infra & automation", pt: "Infra e automação" },
    items: ["Docker", "n8n", "WhatsApp API", "REST integrations"],
  },
];

export type ProductLink = {
  label: string;
  url: string;
  kind: "site" | "app" | "play" | "appstore" | "repo";
};

export type Shot = {
  src: string;
  alt: Localized;
  /** Legenda curta sobre a imagem, tipo "antes" / "depois" de um redesign. */
  caption?: Localized;
  /** A imagem é a captura de tela crua, sem moldura de aparelho — a galeria desenha uma. */
  frame?: boolean;
};

export type Product = {
  id: string;
  name: string;
  /** O que eu fiz nele, não o que o produto faz. */
  role: Localized;
  summary: Localized;
  stack: string[];
  accent: string;
  links: ProductLink[];
  /** Galeria, para o que não tem página pública para onde apontar. */
  shots?: Shot[];
};

const BEFORE: Localized = { en: "Before", pt: "Antes" };
const AFTER: Localized = { en: "After", pt: "Depois" };

/**
 * Os sistemas em si, com para onde ir vê-los. É o que separa um portfólio de um
 * currículo: aqui o nome do produto é um link, não uma linha numa lista.
 *
 * Sem link público e sem galeria, o cartão aparece sem botão — melhor não ter
 * para onde ir do que mandar o visitante para o lugar errado.
 */
export const products: Product[] = [
  {
    id: "pontogo",
    name: "PontoGO",
    role: {
      en: "Back end, integrations and the employee app",
      pt: "Back end, integrações e o app do colaborador",
    },
    summary: {
      en: "Time and attendance for Brazilian companies: employees clock in from their phones, including offline, request adjustments, attach supporting documents and monitor their hour balance in real time.",
      pt: "Ponto e jornada para empresas brasileiras: o colaborador registra o ponto pelo celular — inclusive offline —, solicita ajustes, anexa documentos e acompanha o banco de horas em tempo real.",
    },
    stack: ["Go", "React Native", "PostgreSQL", "Docker"],
    accent: "#4ac8ff",
    links: [
      { label: "pontogo.com.br", url: "https://pontogo.com.br/", kind: "site" },
      {
        label: "Google Play",
        url: "https://play.google.com/store/apps/details?id=br.com.pontogo.colaborador",
        kind: "play",
      },
    ],
    shots: [
      {
        src: "/shots/pontogo/before-login.png",
        alt: {
          en: "PontoGO login screen before the redesign",
          pt: "Tela de login do PontoGO antes do redesign",
        },
        caption: BEFORE,
      },
      {
        src: "/shots/pontogo/before-home.png",
        alt: {
          en: "PontoGO home screen before the redesign",
          pt: "Tela inicial do PontoGO antes do redesign",
        },
        caption: BEFORE,
      },
      {
        src: "/shots/pontogo/login.png",
        alt: {
          en: "PontoGO login screen after the redesign",
          pt: "Tela de login do PontoGO depois do redesign",
        },
        caption: AFTER,
        frame: true,
      },
      {
        src: "/shots/pontogo/home.png",
        alt: {
          en: "PontoGO home screen after the redesign",
          pt: "Tela inicial do PontoGO depois do redesign",
        },
        caption: AFTER,
        frame: true,
      },
      {
        src: "/shots/pontogo/home-confirm.png",
        alt: { en: "PontoGO clock-in confirmation", pt: "Confirmação de registro de ponto" },
        caption: AFTER,
        frame: true,
      },
      {
        src: "/shots/pontogo/requests.png",
        alt: {
          en: "PontoGO time adjustment requests",
          pt: "Solicitações de ajuste de ponto",
        },
        caption: AFTER,
        frame: true,
      },
      {
        src: "/shots/pontogo/menu.png",
        alt: { en: "PontoGO profile and settings menu", pt: "Menu de perfil e configurações" },
        caption: AFTER,
        frame: true,
      },
    ],
  },
  {
    id: "meuprocesso",
    name: "MeuProcesso",
    role: { en: "Product engineering", pt: "Engenharia de produto" },
    summary: {
      en: "A portal where lawyers publish case updates once and clients track everything in a single place, eliminating constant WhatsApp follow-ups for case status.",
      pt: "Um portal onde o advogado publica a atualização do processo uma única vez e o cliente acompanha tudo em um só lugar, eliminando o acompanhamento constante por WhatsApp.",
    },
    stack: ["Next.js", "Node.js", "PostgreSQL"],
    accent: "#b04aff",
    links: [
      { label: "meuprocessoapp.com.br", url: "https://meuprocessoapp.com.br/", kind: "site" },
    ],
  },
  {
    id: "peoplenity",
    name: "PeopleNity",
    role: {
      en: "Micro-services and white-label infrastructure",
      pt: "Microsserviços e infraestrutura white-label",
    },
    summary: {
      en: "gRPC between internal services, REST at the edge, and one deploy that serves several brands from the same codebase.",
      pt: "gRPC entre os serviços internos, REST na borda, e um único deploy que atende várias marcas a partir do mesmo código.",
    },
    stack: ["Go", "gRPC", "Docker"],
    accent: "#4affa1",
    links: [
      { label: "peoplenity.com.br", url: "https://peoplenity.com.br/", kind: "site" },
      { label: "app.peoplenity.com", url: "https://app.peoplenity.com/", kind: "app" },
    ],
  },
  {
    id: "homefly",
    name: "Homefly",
    role: { en: "Product engineering", pt: "Engenharia de produto" },
    summary: {
      en: "Product engineering on the platform and its surrounding integrations.",
      pt: "Engenharia de produto na plataforma e nas integrações relacionadas a ela.",
    },
    stack: ["TypeScript", "Node.js"],
    accent: "#ffd24a",
    links: [],
    shots: [
      {
        src: "/shots/homefly/login.jpg",
        alt: { en: "Homefly login screen", pt: "Tela de login do Homefly" },
        frame: true,
      },
      {
        src: "/shots/homefly/dashboard.jpg",
        alt: { en: "Homefly sales dashboard", pt: "Painel de vendas do Homefly" },
        frame: true,
      },
      {
        src: "/shots/homefly/login-dark.jpg",
        alt: {
          en: "Homefly login screen in dark mode",
          pt: "Tela de login do Homefly em modo escuro",
        },
        frame: true,
      },
    ],
  },
  {
    id: "plannea",
    name: "Plannea CRM",
    role: { en: "Founder engineer — the whole stack", pt: "Founder engineer — a stack inteira" },
    summary: {
      en: "A platform for Brazilian accounting firms: a Go and PostgreSQL API behind a Next.js front end, integrated with government web services to turn filings and legal notices into trackable work for the team.",
      pt: "Uma plataforma para escritórios de contabilidade brasileiros: uma API em Go e PostgreSQL atrás de um front end em Next.js, integrada aos web services do governo, transformando guias e intimações em tarefas rastreáveis pela equipe.",
    },
    stack: ["Go", "PostgreSQL", "Next.js", "SEFAZ integrations"],
    accent: "#ff6b4a",
    links: [],
  },
  {
    id: "vertexa",
    name: "Vertexa",
    role: {
      en: "Founder engineer — the whole platform",
      pt: "Founder engineer — a plataforma inteira",
    },
    summary: {
      en: "A multi-tenant SaaS for course platforms, developed after an off-the-shelf solution no longer met my requirements. Go microservices behind a single gateway — catalog, enrollments, media and notifications — with Next.js applications for the student area and the course administration panel, video transcoding and signed playback through Mux, and identity management via Zitadel. It currently powers Devfly, my own programming course.",
      pt: "Um SaaS multi-tenant para plataformas de curso, desenvolvido depois que uma solução pronta deixou de atender às minhas necessidades. Microsserviços em Go atrás de um único gateway — catálogo, matrículas, mídia e notificações — com aplicações em Next.js para a área do aluno e o painel administrativo do curso, transcodificação e playback assinado de vídeo via Mux, e gestão de identidade via Zitadel. Atualmente, sustenta a Devfly, meu próprio curso de programação.",
    },
    stack: ["Go", "Next.js", "gRPC", "Zitadel", "Mux", "Terraform"],
    accent: "#5b8cff",
    links: [
      { label: "curso.devfly.net", url: "https://curso.devfly.net/", kind: "site" },
      { label: "members.devfly.net", url: "https://members.devfly.net/", kind: "app" },
    ],
  },
  {
    id: "lepus",
    name: "Lepus",
    role: { en: "Solo project", pt: "Projeto solo" },
    summary: {
      en: "A running app in React Native and Expo: background GPS, route drawing, pace and elevation splits, offline-first storage, and points, levels and achievements on top.",
      pt: "Um app de corrida em React Native e Expo: GPS em segundo plano, desenho da rota, ritmo e elevação por trecho, armazenamento offline-first, e pontos, níveis e conquistas por cima.",
    },
    stack: ["React Native", "Expo", "Supabase"],
    accent: "#ff4a8d",
    links: [],
  },
];

/**
 * As zonas ficam distribuídas em um anel ao redor do ponto de partida (0,0),
 * de forma que qualquer direção que o jogador escolha leve a algum conteúdo.
 * O anel tem raio 26: com o disco de 4.2 de raio, a borda mais distante chega a
 * 30.2 e continua dentro do miolo plano do terreno (FLAT_RADIUS = 33).
 */
export const projects: Project[] = [
  {
    id: "about",
    title: { en: "About me", pt: "Sobre mim" },
    subtitle: { en: "Who's driving", pt: "Quem está dirigindo" },
    description: {
      en: "Brazilian software engineer specializing in SaaS platforms, mobile applications and automation for teams delivering under tight deadlines. I work end to end — database and API architecture, the interface people actually rely on, and the integrations between them.",
      pt: "Engenheiro de software brasileiro, especializado em plataformas SaaS, aplicativos móveis e automação para equipes que entregam sob prazos apertados. Atuo de ponta a ponta — arquitetura de banco de dados e API, a interface que as pessoas efetivamente utilizam, e as integrações entre elas.",
    },
    stack: ["TypeScript", "Go", "Node.js", "React"],
    color: "#ff6b4a",
    position: [0, 0, -26],
  },
  {
    id: "experience",
    title: { en: "Experience", pt: "Experiência" },
    subtitle: { en: "Where I build", pt: "Onde eu construo" },
    description: {
      en: "Three years as part of PontoGO's core engineering team, alongside product work on PeopleNity, Homefly and MeuProcesso: scalable back ends and third-party integrations with zero tolerance for failure. Currently a Full Stack Developer at RT Data Consultoria.",
      pt: "Três anos na engenharia do PontoGO, somados a trabalho de produto no PeopleNity, Homefly e MeuProcesso: back ends escaláveis e integrações com terceiros sem margem para falha. Atualmente, Desenvolvedor Full Stack na RT Data Consultoria.",
    },
    stack: ["Next.js", "PostgreSQL", "Redis", "Docker"],
    url: "https://www.linkedin.com/in/gabriel-angelo0/",
    color: "#4ac8ff",
    position: [20.4, 0, -16.2],
  },
  {
    id: "saas",
    title: { en: "SaaS Platforms", pt: "Plataformas SaaS" },
    subtitle: { en: "Products in production", pt: "Produtos em produção" },
    description: {
      en: "Plannea CRM, a platform for Brazilian accounting firms: a Go and PostgreSQL API behind a Next.js front end, integrated with government web services and tax data providers to turn filings and legal notices into trackable work for the team.",
      pt: "Plannea CRM, uma plataforma para escritórios de contabilidade brasileiros: uma API em Go e PostgreSQL atrás de um front end em Next.js, integrada aos web services do governo e a provedores de dados fiscais, transformando guias e intimações em tarefas rastreáveis pela equipe.",
    },
    stack: ["Go", "PostgreSQL", "Next.js", "REST integrations"],
    color: "#b04aff",
    position: [25.4, 0, 5.8],
  },
  {
    id: "automation",
    title: { en: "Automation & AI", pt: "Automação & IA" },
    subtitle: { en: "Work that runs itself", pt: "Trabalho que roda sozinho" },
    description: {
      en: "WhatsApp integrations, n8n workflows and AI-assisted routines that eliminate manual steps from back-office operations — document intake, notifications, and data retrieved from systems with no native integration between them.",
      pt: "Integrações com WhatsApp, fluxos em n8n e rotinas com IA que eliminam etapas manuais da operação de back-office — recebimento de documentos, notificações e dados obtidos de sistemas sem integração nativa entre si.",
    },
    stack: ["n8n", "WhatsApp API", "Node.js", "Supabase"],
    color: "#ffd24a",
    position: [11.3, 0, 23.4],
  },
  {
    id: "mobile",
    title: { en: "Mobile", pt: "Mobile" },
    subtitle: { en: "React Native", pt: "React Native" },
    description: {
      en: "Lepus, a running app built with React Native and Expo: background GPS tracking, route drawing, pace and elevation splits, offline-first storage, and a points system with levels, goals and achievements.",
      pt: "Lepus, um app de corrida feito com React Native e Expo: rastreamento de GPS em segundo plano, desenho da rota, ritmo e elevação por trecho, armazenamento offline-first, e um sistema de pontos com níveis, metas e conquistas.",
    },
    stack: ["React Native", "Expo", "Supabase", "Native maps"],
    color: "#4affa1",
    position: [-11.3, 0, 23.4],
  },
  {
    id: "teaching",
    title: { en: "Teaching & Open Source", pt: "Ensino & Open Source" },
    subtitle: { en: "Passing it on", pt: "Passando adiante" },
    description: {
      en: "Instructor at Digital College, teaching full-stack development to new cohorts, and founder of Devfly, my own programming course. Most of the course material and starter projects are public — 86 repositories, from a first login screen to complete APIs.",
      pt: "Instrutor na Digital College, ensinando desenvolvimento full stack para novas turmas, e fundador da Devfly, meu próprio curso de programação. A maior parte do material do curso e dos projetos de partida é pública — 86 repositórios, de uma primeira tela de login a APIs completas.",
    },
    stack: ["Mentoring", "Code review", "Open source"],
    url: "https://github.com/gabrielangelo0",
    color: "#ff4a8d",
    position: [-25.4, 0, 5.8],
  },
  {
    id: "contact",
    title: { en: "Contact", pt: "Contato" },
    subtitle: { en: "Let's talk", pt: "Vamos conversar" },
    description: {
      en: "Open to product engineering roles, consulting engagements, and conversations about SaaS architecture, integrations and web performance. Email is the fastest way to reach me; LinkedIn is also available.",
      pt: "Aberto a oportunidades de engenharia de produto, projetos de consultoria e conversas sobre arquitetura SaaS, integrações e performance web. E-mail é o meio mais rápido de me encontrar; o LinkedIn também é uma opção.",
    },
    stack: ["Email", "LinkedIn", "GitHub"],
    color: "#7c6bff",
    position: [-20.4, 0, -16.2],
  },
];
