/**
 * Seis coisas escondidas pela encosta. Existem por dois motivos: dão uma razão
 * para o visitante sair da pista e explorar a serra — que antes só tinha mata —
 * e enchem os setores do vale que ficavam vazios.
 *
 * Ficam entre o miolo plano e a borda (raio 36 a 40), longe da linha de chegada
 * e um em cada direção, para nenhum passeio esbarrar em dois de uma vez.
 *
 * A caçada não é guardada em lugar nenhum: recarregar a página repõe os seis.
 */

import type { Localized } from "./i18n";

export type SecretKind = "duck" | "ladybug" | "coffee" | "sign404" | "ufo" | "floppy";

export type Secret = {
  id: SecretKind;
  position: [number, number];
  title: Localized;
  message: Localized;
};

/** Distância em que o carro "acha" o segredo. */
export const SECRET_RADIUS = 7;

/** Eyebrow do aviso que aparece ao achar um segredo. */
export const SECRET_FOUND_EYEBROW: Localized = { en: "Secret found", pt: "Segredo encontrado" };

export const SECRETS: Secret[] = [
  {
    id: "duck",
    position: [26, -27],
    title: { en: "Rubber duck", pt: "Pato de borracha" },
    message: {
      en: "Rubber duck debugging. It listens better than most code reviewers.",
      pt: "Debugar com o pato de borracha. Ele escuta melhor que a maioria dos revisores de código.",
    },
  },
  {
    id: "ladybug",
    position: [27, 26],
    title: { en: "A wild bug", pt: "Um bug selvagem" },
    message: {
      en: "Reproducible on Tuesdays. Closed as works on my machine.",
      pt: "Reproduz nas terças. Fechado como 'funciona na minha máquina'.",
    },
  },
  {
    id: "coffee",
    position: [-3, 38],
    title: { en: "The real dependency", pt: "A dependência de verdade" },
    message: {
      en: "No mock available. Ships in every release since 2012.",
      pt: "Sem mock disponível. Vai em todo release desde 2012.",
    },
  },
  {
    id: "sign404",
    position: [-27, 26],
    title: { en: "404", pt: "404" },
    message: {
      en: "This sign could not be found. You found it anyway.",
      pt: "Esta placa não pôde ser encontrada. Mesmo assim, você a achou.",
    },
  },
  {
    id: "ufo",
    position: [2, -38],
    title: { en: "Unidentified", pt: "Não identificado" },
    message: {
      en: "Hovering since the last deploy. Nobody claims the pull request.",
      pt: "Pairando desde o último deploy. Ninguém assume o pull request.",
    },
  },
  {
    id: "floppy",
    position: [38, 3],
    title: { en: "Save file", pt: "Salvar arquivo" },
    message: {
      en: "Save early, save often. Ask your senior what this is.",
      pt: "Salve cedo, salve sempre. Pergunte ao seu sênior o que é isso.",
    },
  },
];
