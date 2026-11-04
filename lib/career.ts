/**
 * A trajetória do Gabriel virou uma pista: o jogador sai da largada, segue a
 * faixa de terra batida e cruza os marcos em ordem cronológica até a linha de
 * chegada, no alto da serra.
 *
 * A curva vive aqui, em JavaScript puro e sem three.js, porque três lugares
 * precisam dela e não podem discordar: a faixa desenhada no mundo 3D, o traçado
 * no minimapa e a regra que impede o cenário procedural de nascer em cima da
 * pista.
 */

/** Largura da faixa. Cabem dois carros lado a lado, com folga para errar. */
export const TRACK_WIDTH = 5;

/**
 * Eixo da pista, em pontos de controle (x, z). Sai da largada, contorna o vale
 * — passando entre as seções do portfólio, nunca por cima delas — e segue pelo
 * corredor oeste para subir a encosta até a chegada.
 */
const CONTROL: [number, number][] = [
  // Meia elipse em volta do vale (16 x 11.5, centrada em z = -5.5) e depois a
  // saída para oeste. O primeiro ponto é o próprio lugar onde o carro nasce, e
  // o formato foi escolhido com uma restrição dura: nenhum raio de curvatura
  // pode ser menor que a meia-largura da faixa, senão a fita se dobra sobre si
  // mesma na curva — foi o que aconteceu com o traçado anterior.
  [0, 6],
  [8, 4.5],
  [13.9, 0.3],
  [16, -5.5],
  [13.9, -11.3],
  [8, -15.5],
  [0, -17],
  // passa entre a seção Contact e a About, por dentro do anel de seções
  [-9, -16],
  [-14, -10],
  [-19, -7],
  // corredor entre Teaching e Contact, rumo à encosta
  [-25.3, -5.8],
  [-32, -5],
  [-40, -4.5],
  [-43.5, -4],
];

import type { Localized } from "./i18n";

export type Milestone = {
  /** Posição ao longo da pista, de 0 (largada) a 1 (chegada). */
  at: number;
  year: string;
  title: Localized;
  detail: Localized;
};

/**
 * Os cinco primeiros marcos vêm da própria apresentação que o Gabriel usa em
 * aula; os dois últimos, do trabalho que ele toca hoje.
 */
export const MILESTONES: Milestone[] = [
  {
    at: 0.11,
    year: "2012",
    title: { en: "First lines of code", pt: "Primeiras linhas de código" },
    detail: {
      en: "Java. Algorithms, objects, and the first real sense that software is built, not found.",
      pt: "Java. Algoritmos, objetos, e a primeira noção de verdade de que software se constrói, não se encontra.",
    },
  },
  {
    at: 0.23,
    year: "2015",
    title: { en: "The web calls", pt: "A web chama" },
    detail: {
      en: "PHP. Forms, databases, and pages that finally did something.",
      pt: "PHP. Formulários, banco de dados, e páginas que finalmente faziam alguma coisa.",
    },
  },
  {
    at: 0.36,
    year: "2020",
    title: { en: "Front end for real", pt: "Front end de verdade" },
    detail: {
      en: "HTML, CSS and JavaScript. The interface stops being a detail and becomes the craft.",
      pt: "HTML, CSS e JavaScript. A interface deixa de ser detalhe e vira o ofício.",
    },
  },
  {
    at: 0.48,
    year: "2021",
    title: { en: "Paid to code", pt: "Pago para programar" },
    detail: {
      en: "First job as a developer — production code, deadlines and code review.",
      pt: "Primeiro emprego como desenvolvedor — código em produção, prazo e code review.",
    },
  },
  {
    at: 0.6,
    year: "2024",
    title: { en: "Skin in the game", pt: "Com o próprio pescoço em jogo" },
    detail: {
      en: "Partner in a startup: building the product and carrying the outcome.",
      pt: "Sócio numa startup: construindo o produto e carregando o resultado.",
    },
  },
  {
    at: 0.72,
    year: "2025",
    title: { en: "Passing it on", pt: "Passando adiante" },
    detail: {
      en: "Full stack instructor at Digital College, teaching new cohorts to ship.",
      pt: "Instrutor full stack na Digital College, ensinando novas turmas a colocar no ar.",
    },
  },
];

/** O que está escrito na chegada, no alto da serra. */
export const FINISH = {
  year: { en: "Today", pt: "Hoje" },
  title: { en: "Still driving", pt: "Ainda dirigindo" },
  detail: {
    en: "SaaS, mobile and automation in production — PontoGO, PeopleNity, Homefly and MeuProcesso.",
    pt: "SaaS, mobile e automação em produção — PontoGO, PeopleNity, Homefly e MeuProcesso.",
  },
};

// ---------------------------------------------------------------- a curva

/** Catmull-Rom uniforme (tensão 1/2), o mesmo spline do three.js. */
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

export type TrackSample = { x: number; z: number; distance: number };

/**
 * Eixo amostrado com a distância acumulada em cada ponto. É calculado uma vez,
 * na carga do módulo: a pista não muda em tempo de execução.
 */
export const TRACK: TrackSample[] = (() => {
  const points = CONTROL;
  const samples: TrackSample[] = [];
  const perSegment = 24;

  for (let i = 0; i < points.length - 1; i++) {
    // as pontas repetem o próprio ponto, senão o spline não sabe de onde vem
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? points[i + 1];

    const last = i === points.length - 2;
    for (let s = 0; s < perSegment + (last ? 1 : 0); s++) {
      const t = s / perSegment;
      samples.push({
        x: catmullRom(p0[0], p1[0], p2[0], p3[0], t),
        z: catmullRom(p0[1], p1[1], p2[1], p3[1], t),
        distance: 0,
      });
    }
  }

  for (let i = 1; i < samples.length; i++) {
    samples[i].distance =
      samples[i - 1].distance + Math.hypot(samples[i].x - samples[i - 1].x, samples[i].z - samples[i - 1].z);
  }

  return samples;
})();

export const TRACK_LENGTH = TRACK[TRACK.length - 1].distance;

/**
 * Ponto e direção da pista a uma fração `u` do percurso — medida em distância
 * percorrida, não no parâmetro do spline, para os marcos ficarem espaçados como
 * o olho espera.
 */
export function trackPointAt(u: number) {
  const target = Math.min(Math.max(u, 0), 1) * TRACK_LENGTH;

  let i = 1;
  while (i < TRACK.length - 1 && TRACK[i].distance < target) i++;

  const a = TRACK[i - 1];
  const b = TRACK[i];
  const span = b.distance - a.distance || 1;
  const k = (target - a.distance) / span;

  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dz) || 1;

  return {
    x: a.x + dx * k,
    z: a.z + dz * k,
    /** direção unitária da pista, no plano */
    dx: dx / length,
    dz: dz / length,
  };
}

/** Direção da pista na largada: é para onde o carro tem que nascer apontado. */
export const START_HEADING = (() => {
  const start = trackPointAt(0);
  return Math.atan2(start.dx, start.dz);
})();

/** Comprimento do maior segmento amostrado, para o corte rápido abaixo. */
const LONGEST_SEGMENT = TRACK.reduce(
  (longest, sample, i) =>
    i === 0 ? longest : Math.max(longest, sample.distance - TRACK[i - 1].distance),
  0,
);

/**
 * Distância de um ponto qualquer ao eixo da pista. É chamada dezenas de milhares
 * de vezes ao semear o cenário, então o laço descarta o segmento por uma
 * comparação de quadrados antes de fazer a projeção.
 */
export function distanceToTrack(x: number, z: number) {
  let best = Infinity;
  let cutoff = Infinity;

  for (let i = 1; i < TRACK.length; i++) {
    const a = TRACK[i - 1];
    const ax = x - a.x;
    const az = z - a.z;
    const toStart = ax * ax + az * az;
    if (toStart > cutoff) continue;

    const b = TRACK[i];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const lengthSq = dx * dx + dz * dz || 1;

    // projeção do ponto no segmento, presa entre as duas pontas
    const t = Math.min(Math.max((ax * dx + az * dz) / lengthSq, 0), 1);
    const distance = Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t));
    if (distance < best) {
      best = distance;
      // nenhum segmento cuja ponta esteja além disto pode melhorar o resultado
      const reach = best + LONGEST_SEGMENT;
      cutoff = reach * reach;
    }
  }

  return best;
}
