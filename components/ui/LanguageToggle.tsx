"use client";

import { useLanguage } from "./LanguageProvider";

/** Pílula fixa, presente nas duas versões do portfólio (página e carro). */
export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="lang-toggle" role="group" aria-label="Language / Idioma">
      <button
        type="button"
        className={lang === "pt" ? "is-active" : ""}
        aria-pressed={lang === "pt"}
        onClick={() => setLang("pt")}
      >
        PT
      </button>
      <button
        type="button"
        className={lang === "en" ? "is-active" : ""}
        aria-pressed={lang === "en"}
        onClick={() => setLang("en")}
      >
        EN
      </button>
    </div>
  );
}
