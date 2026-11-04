export type Vec3 = [number, number, number];

export type Project = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  stack: string[];
  url?: string;
  color: string;
  position: Vec3;
};

export const profile = {
  name: "Gabriel Angelo",
  role: "Software Engineer · SaaS & Automation",
  tagline: "Drive around the portfolio — WASD or the arrow keys.",
  email: "gabrielangelolira@gmail.com",
  links: [
    { label: "GitHub", url: "https://github.com/gabrielangelo0" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/gabriel-angelo0/" },
  ],
};

/**
 * Ferramentas do dia a dia, agrupadas por frente de trabalho. A versão em
 * página mostra a lista inteira; o mundo 3D só cabe três ou quatro por seção.
 */
export const stack: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["TypeScript", "JavaScript", "Go", "PHP", "Java"] },
  { group: "Web", items: ["React", "Next.js", "Node.js", "HeroUI", "Three.js"] },
  { group: "Mobile", items: ["React Native", "Expo"] },
  { group: "Data", items: ["PostgreSQL", "Redis", "Supabase", "Firebase"] },
  { group: "Infra & automation", items: ["Docker", "n8n", "WhatsApp API", "REST integrations"] },
];

export type ProductLink = {
  label: string;
  url: string;
  kind: "site" | "play" | "appstore" | "repo";
};

export type Product = {
  id: string;
  name: string;
  /** O que eu fiz nele, não o que o produto faz. */
  role: string;
  summary: string;
  stack: string[];
  accent: string;
  links: ProductLink[];
  /** Galeria, para o que não tem página pública para onde apontar. */
  shots?: { src: string; alt: string }[];
};

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
    role: "Back end, integrations and the employee app",
    summary:
      "Time and attendance for Brazilian companies: employees clock in from the phone — offline too — request adjustments, attach documents and follow their hour balance in real time.",
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
  },
  {
    id: "meuprocesso",
    name: "MeuProcesso",
    role: "Product engineering",
    summary:
      "A portal where lawyers publish case updates once and the client follows everything in one place, instead of answering \"any news?\" over WhatsApp all day.",
    stack: ["Next.js", "Node.js", "PostgreSQL"],
    accent: "#b04aff",
    links: [
      { label: "meuprocessoapp.com.br", url: "https://meuprocessoapp.com.br/", kind: "site" },
    ],
  },
  {
    id: "peoplenity",
    name: "PeopleNity",
    role: "Micro-services and white-label infrastructure",
    summary:
      "gRPC between internal services, REST at the edge, and one deploy that serves several brands from the same codebase.",
    stack: ["Go", "gRPC", "Docker"],
    accent: "#4affa1",
    links: [],
  },
  {
    id: "homefly",
    name: "Homefly",
    role: "Product engineering",
    summary: "Product work on the platform and the integrations around it.",
    stack: ["TypeScript", "Node.js"],
    accent: "#ffd24a",
    links: [],
    shots: [
      { src: "/shots/homefly/login.jpg", alt: "Homefly login screen" },
      { src: "/shots/homefly/dashboard.jpg", alt: "Homefly sales dashboard" },
      { src: "/shots/homefly/login-dark.jpg", alt: "Homefly login screen in dark mode" },
    ],
  },
  {
    id: "plannea",
    name: "Plannea CRM",
    role: "Founder engineer — the whole stack",
    summary:
      "A platform for Brazilian accounting firms. A Go and PostgreSQL API behind a Next.js front end, talking to government web services: filings and legal notices arrive as work a team can actually track.",
    stack: ["Go", "PostgreSQL", "Next.js", "SEFAZ integrations"],
    accent: "#ff6b4a",
    links: [],
  },
  {
    id: "lepus",
    name: "Lepus",
    role: "Solo project",
    summary:
      "A running app in React Native and Expo: background GPS, route drawing, pace and elevation splits, offline-first storage, and points, levels and achievements on top.",
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
    title: "About me",
    subtitle: "Who's driving",
    description:
      "Software engineer from Brazil, building SaaS platforms, mobile apps and automation for teams that ship on tight deadlines. I work end to end — database and API design, the interface people actually use, and the integrations in between.",
    stack: ["TypeScript", "Go", "Node.js", "React"],
    color: "#ff6b4a",
    position: [0, 0, -26],
  },
  {
    id: "experience",
    title: "Experience",
    subtitle: "Where I build",
    description:
      "Product work across PontoGO, PeopleNity, Homefly and MeuProcesso: scalable back ends, third-party integrations that are not allowed to fail, and small teams moving fast without breaking what is already in production.",
    stack: ["Next.js", "PostgreSQL", "Redis", "Docker"],
    url: "https://www.linkedin.com/in/gabriel-angelo0/",
    color: "#4ac8ff",
    position: [20.4, 0, -16.2],
  },
  {
    id: "saas",
    title: "SaaS Platforms",
    subtitle: "Products in production",
    description:
      "Plannea CRM, a platform for Brazilian accounting firms: a Go and PostgreSQL API behind a Next.js front end. It talks to government web services and tax data providers, turning filings and legal notices into work a team can track.",
    stack: ["Go", "PostgreSQL", "Next.js", "REST integrations"],
    color: "#b04aff",
    position: [25.4, 0, 5.8],
  },
  {
    id: "automation",
    title: "Automation & AI",
    subtitle: "Work that runs itself",
    description:
      "WhatsApp integrations, n8n workflows and AI-assisted routines that take manual steps out of back-office operations — document intake, notifications, and data pulled from systems that were never meant to talk to each other.",
    stack: ["n8n", "WhatsApp API", "Node.js", "Supabase"],
    color: "#ffd24a",
    position: [11.3, 0, 23.4],
  },
  {
    id: "mobile",
    title: "Mobile",
    subtitle: "React Native",
    description:
      "Lepus, a running app built with React Native and Expo: background GPS tracking, route drawing, pace and elevation splits, offline-first storage, and a points system with levels, goals and achievements.",
    stack: ["React Native", "Expo", "Supabase", "Native maps"],
    color: "#4affa1",
    position: [-11.3, 0, 23.4],
  },
  {
    id: "teaching",
    title: "Teaching & Open Source",
    subtitle: "Passing it on",
    description:
      "Instructor at Digital College, teaching full stack development to new cohorts. Most of the course material and project starters are public — 86 repositories, from a first login screen to complete APIs.",
    stack: ["Mentoring", "Code review", "Open source"],
    url: "https://github.com/gabrielangelo0",
    color: "#ff4a8d",
    position: [-25.4, 0, 5.8],
  },
  {
    id: "contact",
    title: "Contact",
    subtitle: "Let's talk",
    description:
      "Open to product work, consulting, and conversations about SaaS architecture, integrations and web performance. Email is the fastest way to reach me — LinkedIn works too.",
    stack: ["Email", "LinkedIn", "GitHub"],
    color: "#7c6bff",
    position: [-20.4, 0, -16.2],
  },
];
