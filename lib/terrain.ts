/**
 * Relevo do vale. A mesma função alimenta a malha visível, o collider de
 * heightfield e o posicionamento de tudo que fica sobre o chão — se cada um
 * calculasse a altura do seu jeito, as árvores flutuariam e o carro afundaria.
 */
import { ARENA } from "./world";

/** Miolo plano: é onde ficam a largada, as seções e as rampas. */
export const FLAT_RADIUS = 28;
/** Altura da encosta na borda do vale. */
export const RISE_HEIGHT = 6;
/** Subdivisões do heightfield (o grid tem RESOLUTION + 1 pontos por eixo). */
export const RESOLUTION = 64;

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

export function terrainHeight(x: number, z: number) {
  const distance = Math.hypot(x, z);

  // encosta subindo do miolo até a borda: é a "subida da serra"
  const slope = smoothstep(FLAT_RADIUS, ARENA * 1.02, distance) * RISE_HEIGHT;

  // ondulação suave, que só entra depois que o terreno começa a subir
  const relief =
    Math.sin(x * 0.075) * Math.cos(z * 0.065) * 0.85 + Math.sin((x + z) * 0.12) * 0.4;

  return slope + relief * smoothstep(FLAT_RADIUS * 0.6, FLAT_RADIUS, distance);
}
