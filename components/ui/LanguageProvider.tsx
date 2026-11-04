"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { detectLang, LANG_STORAGE_KEY, pick, type Lang, type Localized } from "@/lib/i18n";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: (value: Localized) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // nasce em inglês para o HTML do servidor bater com a primeira pintura do
  // cliente; o idioma de verdade (salvo ou do navegador) chega logo depois,
  // num efeito — a troca é só texto, não há flash de layout
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    } catch {
      // modo privado ou storage bloqueado — segue com a detecção do navegador
    }
    setLangState(saved === "pt" || saved === "en" ? saved : detectLang());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // a escolha só dura a sessão
    }
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === "en" ? "pt" : "en");
  }, [lang, setLang]);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, toggle, t: (v: Localized) => pick(v, lang) }),
    [lang, setLang, toggle],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
