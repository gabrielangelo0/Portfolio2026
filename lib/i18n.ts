export type Lang = "en" | "pt";

/** Um texto com as duas versões lado a lado, para nunca ficar uma sem a outra. */
export type Localized = { en: string; pt: string };

export function pick(value: Localized, lang: Lang): string {
  return value[lang];
}

export const LANG_STORAGE_KEY = "portfolio:lang";

/** Lê o idioma do navegador uma vez, no cliente — no servidor cai para inglês. */
export function detectLang(): Lang {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.toLowerCase().startsWith("pt") ? "pt" : "en";
}
