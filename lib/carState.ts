"use client";

/**
 * Pose do carro publicada a cada frame para quem desenha fora do Canvas (o
 * minimapa). Fica fora do React de propósito: passar por estado faria o
 * overlay renderizar 60 vezes por segundo.
 */
export const carState = {
  x: 0,
  z: 0,
  yaw: 0,
  speed: 0,
};
