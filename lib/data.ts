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
  role: "Full Stack Developer",
  tagline: "Dirija pelo portfólio — WASD ou setas para mover.",
  email: "gabrielangelolira@gmail.com",
  links: [
    { label: "GitHub", url: "https://github.com" },
    { label: "LinkedIn", url: "https://linkedin.com" },
  ],
};

/**
 * As zonas ficam distribuídas em um anel ao redor do ponto de partida (0,0),
 * de forma que qualquer direção que o jogador escolha leve a algum conteúdo.
 */
export const projects: Project[] = [
  {
    id: "sobre",
    title: "Sobre mim",
    subtitle: "Quem dirige esse carro",
    description:
      "Desenvolvedor full stack com foco em produtos web performáticos. Trabalho do design de API até a interface, com carinho especial por animação e 3D na web.",
    stack: ["TypeScript", "React", "Node.js"],
    color: "#ff6b4a",
    position: [0, 0, -22],
  },
  {
    id: "experiencia",
    title: "Experiência",
    subtitle: "Onde já passei",
    description:
      "Anos construindo aplicações de produção: dashboards em tempo real, integrações complexas e times pequenos entregando rápido sem quebrar nada.",
    stack: ["Next.js", "PostgreSQL", "AWS"],
    color: "#4ac8ff",
    position: [24, 0, -10],
  },
  {
    id: "projeto-3d",
    title: "Web 3D",
    subtitle: "Three.js / R3F",
    description:
      "Experiências interativas com React Three Fiber: física, shaders e cenas otimizadas rodando a 60fps até em máquinas modestas.",
    stack: ["Three.js", "R3F", "Rapier"],
    url: "https://threejs.org",
    color: "#b04aff",
    position: [22, 0, 18],
  },
  {
    id: "open-source",
    title: "Open Source",
    subtitle: "Código aberto",
    description:
      "Bibliotecas e ferramentas publicadas para a comunidade — utilitários de build, componentes de UI e automações de CI.",
    stack: ["Vite", "GitHub Actions", "pnpm"],
    url: "https://github.com",
    color: "#4affa1",
    position: [-6, 0, 26],
  },
  {
    id: "contato",
    title: "Contato",
    subtitle: "Vamos conversar",
    description:
      "Aberto a freelas, colaborações e conversas sobre performance web. Passe por aqui e me mande uma mensagem.",
    stack: ["E-mail", "LinkedIn", "GitHub"],
    color: "#ffd24a",
    position: [-26, 0, 4],
  },
];
