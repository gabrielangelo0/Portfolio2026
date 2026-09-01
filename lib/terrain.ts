/**
 * Relevo do vale. A mesma função alimenta a malha visível, o collider do chão e
 * o posicionamento de tudo que fica sobre ele — se cada um calculasse a altura
 * do seu jeito, as árvores flutuariam e o carro afundaria.
 */
import { ARENA } from "./world";

/**
 * Miolo plano. Precisa cobrir tudo que assenta em y = 0 — largada, seções,
 * rampas e caixas —, senão esses objetos flutuam ou afundam no relevo. A seção
 * mais distante chega a 32.6 do centro contando o raio do disco.
 */
export const FLAT_RADIUS = 33;
/** Altura da encosta na borda do vale, atingida exatamente em ARENA. */
export const RISE_HEIGHT = 4.5;
/**
 * Subdivisões da malha do chão (o grid tem RESOLUTION + 1 pontos por eixo).
 * Fina o bastante para a interpolação linear entre vértices não passar por cima
 * da faixa da pista, que é desenhada com a altura exata da função.
 */
export const RESOLUTION = 96;

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

export function terrainHeight(x: number, z: number) {
  const distance = Math.hypot(x, z);

  // encosta subindo do miolo até a borda: é a "subida da serra". Chega ao topo
  // exatamente em ARENA, onde ficam a cerca e o campo que segue para a serra.
  const slope = smoothstep(FLAT_RADIUS, ARENA, distance) * RISE_HEIGHT;

  // Ondulação suave, restrita à faixa entre o miolo plano e a borda: no miolo
  // ela afundaria as rampas e as caixas, e na borda descolaria a cerca e o
  // campo externo, que são planos. Fora dessa faixa o terreno é previsível.
  const relief =
    Math.sin(x * 0.075) * Math.cos(z * 0.065) * 0.85 + Math.sin((x + z) * 0.12) * 0.4;
  const reliefBand =
    smoothstep(FLAT_RADIUS, FLAT_RADIUS + 5, distance) *
    (1 - smoothstep(ARENA - 7, ARENA, distance));

  return slope + relief * reliefBand;
}
