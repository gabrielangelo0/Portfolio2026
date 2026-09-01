/**
 * Geometria estática do mundo. Fica aqui, e não dentro do componente, porque o
 * minimapa desenha exatamente os mesmos objetos — duplicar as posições faria o
 * mapa mentir assim que o cenário mudasse.
 */
import { projects } from "./data";

export const ARENA = 46; // meia-largura do vale jogável
export const START_PAD = { x: 0, z: 6, radius: 7 };
export const ZONE_RADIUS = 4.2;

export type Ramp = { position: [number, number, number]; rotation: number; size: [number, number] };

export const RAMPS: Ramp[] = [
  { position: [-14, 0, -6], rotation: 0.6, size: [6, 7] },
  { position: [12, 0, 4], rotation: -2.2, size: [6, 7] },
];

export const CRATE_STACKS: [number, number, number][] = [
  [8, 0, -16],
  [-16, 0, 14],
];

/** PRNG determinístico: mesma cena no servidor, no cliente e no mapa. */
export function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Espaço ocupado que nada mais pode invadir (largada, zonas, rampas, vila). */
function isBlocked(x: number, z: number, margin: number, extra: [number, number, number][] = []) {
  if (Math.hypot(x - START_PAD.x, z - START_PAD.z) < START_PAD.radius + margin) return true;
  if (projects.some((p) => Math.hypot(x - p.position[0], z - p.position[2]) < 8 + margin)) {
    return true;
  }
  if (RAMPS.some((r) => Math.hypot(x - r.position[0], z - r.position[2]) < 7 + margin)) return true;
  if (CRATE_STACKS.some(([cx, , cz]) => Math.hypot(x - cx, z - cz) < 4 + margin)) return true;
  return extra.some(([ex, , ez]) => Math.hypot(x - ex, z - ez) < 7 + margin);
}

// ---------------------------------------------------------------- vilarejo

export type House = {
  position: [number, number, number];
  rotation: number;
  width: number;
  depth: number;
  height: number;
  wall: string;
  roof: string;
};

const WALLS = ["#f3ede1", "#e8dcc8", "#dfd3bd", "#f0e4d4"];
const ROOFS = ["#a4483c", "#8c4436", "#b35a43", "#7d5140"];

/** Casario espalhado em dois núcleos, longe das zonas e da pista. */
export const HOUSES: House[] = (() => {
  const random = mulberry32(77123);
  const clusters: [number, number][] = [
    [-30, -26],
    [30, 26],
    [-33, 22],
  ];
  const houses: House[] = [];

  for (const [cx, cz] of clusters) {
    const count = 4 + Math.floor(random() * 2);
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const distance = 3 + random() * 8;
      const x = cx + Math.cos(angle) * distance;
      const z = cz + Math.sin(angle) * distance;
      if (isBlocked(x, z, 2)) continue;
      if (houses.some((h) => Math.hypot(x - h.position[0], z - h.position[2]) < 6)) continue;

      houses.push({
        position: [x, 0, z],
        rotation: random() * Math.PI * 2,
        width: 3.4 + random() * 1.6,
        depth: 3 + random() * 1.4,
        height: 2.2 + random() * 0.9,
        wall: WALLS[Math.floor(random() * WALLS.length)],
        roof: ROOFS[Math.floor(random() * ROOFS.length)],
      });
    }
  }

  return houses;
})();

// ---------------------------------------------------------------- vegetação

export type SceneryItem = {
  kind: "pine" | "broadleaf" | "rock" | "bush";
  position: [number, number, number];
  scale: number;
  rotation: number;
  tint: number; // 0..1, varia o verde para a mata não ficar chapada
};

export function generateScenery(): SceneryItem[] {
  const random = mulberry32(20260901);
  const items: SceneryItem[] = [];
  const houseSpots = HOUSES.map((h) => h.position);

  let guard = 0;
  while (items.length < 190 && guard < 6000) {
    guard++;
    const x = (random() - 0.5) * ARENA * 1.96;
    const z = (random() - 0.5) * ARENA * 1.96;

    // A mata fecha nas beiradas e rareia no miolo: o centro do vale precisa
    // ficar livre para dirigir, ou o carro passa o tempo todo desviando.
    const edge = Math.max(Math.abs(x), Math.abs(z)) / ARENA;
    if (random() > 0.02 + Math.pow(edge, 3) * 2.2) continue;

    if (isBlocked(x, z, 3, houseSpots)) continue;
    if (items.some((it) => Math.hypot(x - it.position[0], z - it.position[2]) < 3.2)) continue;

    const roll = random();
    const kind: SceneryItem["kind"] =
      roll > 0.62 ? "pine" : roll > 0.3 ? "broadleaf" : roll > 0.12 ? "bush" : "rock";

    items.push({
      kind,
      position: [x, 0, z],
      scale:
        kind === "pine"
          ? 0.7 + random() * 0.7
          : kind === "broadleaf"
            ? 0.6 + random() * 0.5
            : kind === "bush"
              ? 0.4 + random() * 0.3
              : 0.5 + random() * 0.7,
      rotation: random() * Math.PI * 2,
      tint: random(),
    });
  }

  return items;
}

// ---------------------------------------------------------------- serra

export type Mountain = {
  position: [number, number, number];
  radius: number;
  height: number;
  rotation: number;
  ring: number; // 0 = perto, 2 = horizonte
};

/** Anéis de montanhas fora do vale: moldura da paisagem, sem colisão. */
export const MOUNTAINS: Mountain[] = (() => {
  const random = mulberry32(31337);
  const peaks: Mountain[] = [];

  // Alturas contidas de propósito: com picos altos demais a serra come o céu
  // inteiro no enquadramento da câmera do jogo.
  const rings = [
    { distance: ARENA + 38, count: 26, radius: 18, height: 15, ring: 0 },
    { distance: ARENA + 76, count: 22, radius: 28, height: 32, ring: 1 },
    { distance: ARENA + 132, count: 18, radius: 42, height: 58, ring: 2 },
  ];

  for (const { distance, count, radius, height, ring } of rings) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + random() * 0.18;
      const spread = distance + (random() - 0.5) * 26;
      peaks.push({
        position: [Math.cos(angle) * spread, 0, Math.sin(angle) * spread],
        radius: radius * (0.7 + random() * 0.6),
        height: height * (0.65 + random() * 0.7),
        rotation: random() * Math.PI,
        ring,
      });
    }
  }

  return peaks;
})();

/** Lago no sopé da serra, fora da área jogável. */
export const LAKE = { x: -ARENA - 24, z: 30, radius: 22 };
