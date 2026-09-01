/**
 * Seis coisas escondidas pela encosta. Existem por dois motivos: dão uma razão
 * para o visitante sair da pista e explorar a serra — que antes só tinha mata —
 * e enchem os setores do vale que ficavam vazios.
 *
 * Ficam entre o miolo plano e a borda (raio 36 a 40), longe da linha de chegada
 * e um em cada direção, para nenhum passeio esbarrar em dois de uma vez.
 */

export type SecretKind = "duck" | "ladybug" | "coffee" | "sign404" | "ufo" | "floppy";

export type Secret = {
  id: SecretKind;
  position: [number, number];
  title: string;
  message: string;
};

/** Distância em que o carro "acha" o segredo. */
export const SECRET_RADIUS = 7;

export const SECRETS: Secret[] = [
  {
    id: "duck",
    position: [26, -27],
    title: "Rubber duck",
    message: "Rubber duck debugging. It listens better than most code reviewers.",
  },
  {
    id: "ladybug",
    position: [27, 26],
    title: "A wild bug",
    message: "Reproducible on Tuesdays. Closed as works on my machine.",
  },
  {
    id: "coffee",
    position: [-3, 38],
    title: "The real dependency",
    message: "No mock available. Ships in every release since 2012.",
  },
  {
    id: "sign404",
    position: [-27, 26],
    title: "404",
    message: "This sign could not be found. You found it anyway.",
  },
  {
    id: "ufo",
    position: [2, -38],
    title: "Unidentified",
    message: "Hovering since the last deploy. Nobody claims the pull request.",
  },
  {
    id: "floppy",
    position: [38, 3],
    title: "Save file",
    message: "Save early, save often. Ask your senior what this is.",
  },
];

const KEY = "portfolio-secrets";

/** Lê os segredos já encontrados. Sem localStorage disponível, começa do zero. */
export function loadSecrets(): SecretKind[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is SecretKind =>
      SECRETS.some((secret) => secret.id === id),
    );
  } catch {
    return [];
  }
}

export function saveSecrets(found: SecretKind[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(found));
  } catch {
    // navegação privada, cota cheia — a caçada só não sobrevive ao reload
  }
}
