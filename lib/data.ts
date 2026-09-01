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
  tagline: "Drive around the portfolio — WASD or the arrow keys.",
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
    id: "about",
    title: "About me",
    subtitle: "Who's driving",
    description:
      "Full stack developer focused on fast, well-crafted web products. I work from API design to the interface, with a soft spot for animation and 3D on the web.",
    stack: ["TypeScript", "React", "Node.js"],
    color: "#ff6b4a",
    position: [0, 0, -22],
  },
  {
    id: "experience",
    title: "Experience",
    subtitle: "Where I've been",
    description:
      "Years building production applications: real-time dashboards, hairy integrations, and small teams shipping fast without breaking things.",
    stack: ["Next.js", "PostgreSQL", "AWS"],
    color: "#4ac8ff",
    position: [24, 0, -10],
  },
  {
    id: "web3d",
    title: "Web 3D",
    subtitle: "Three.js / R3F",
    description:
      "Interactive experiences with React Three Fiber: physics, shaders, and scenes tuned to hold 60fps even on modest machines.",
    stack: ["Three.js", "R3F", "Rapier"],
    url: "https://threejs.org",
    color: "#b04aff",
    position: [22, 0, 18],
  },
  {
    id: "open-source",
    title: "Open Source",
    subtitle: "Published work",
    description:
      "Libraries and tools released to the community — build utilities, UI components, and CI automation.",
    stack: ["Vite", "GitHub Actions", "pnpm"],
    url: "https://github.com",
    color: "#4affa1",
    position: [-6, 0, 26],
  },
  {
    id: "contact",
    title: "Contact",
    subtitle: "Let's talk",
    description:
      "Open to freelance work, collaborations, and conversations about web performance. Drop by and send me a message.",
    stack: ["Email", "LinkedIn", "GitHub"],
    color: "#ffd24a",
    position: [-26, 0, 4],
  },
];
