/**
 * Geometria estática do mundo. Fica aqui, e não dentro do componente, porque o
 * minimapa desenha exatamente os mesmos objetos — duplicar as posições faria o
 * mapa mentir assim que o cenário mudasse.
 */
import { projects } from "./data";

export const ARENA = 46; // meia-largura do mundo jogável
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

export type SceneryItem = {
  kind: "tree" | "rock";
  position: [number, number, number];
  scale: number;
};

export function generateScenery(): SceneryItem[] {
  const random = mulberry32(20260901);
  const items: SceneryItem[] = [];

  let guard = 0;
  while (items.length < 46 && guard < 900) {
    guard++;
    const x = (random() - 0.5) * ARENA * 1.85;
    const z = (random() - 0.5) * ARENA * 1.85;

    // nunca em cima da largada nem dentro das zonas de projeto
    if (Math.hypot(x, z - START_PAD.z) < 12) continue;
    if (projects.some((p) => Math.hypot(x - p.position[0], z - p.position[2]) < 8)) continue;
    if (items.some((it) => Math.hypot(x - it.position[0], z - it.position[2]) < 4)) continue;

    const kind = random() > 0.35 ? "tree" : "rock";
    items.push({
      kind,
      position: [x, 0, z],
      scale: kind === "tree" ? 0.7 + random() * 0.6 : 0.7 + random() * 1.1,
    });
  }

  return items;
}
