"use client";

import { useEffect, useState } from "react";

/**
 * Máquina de escrever do hero. Escreve, segura, apaga e passa para a próxima —
 * um `setTimeout` encadeado em vez de um intervalo fixo, porque cada etapa tem
 * ritmo próprio e um intervalo só faria tudo no mesmo compasso.
 */
export function Typewriter({ phrases }: { phrases: string[] }) {
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(phrases[0]);
      return;
    }

    const phrase = phrases[index % phrases.length];
    let delay = erasing ? 34 : 62;

    if (!erasing && text === phrase) delay = 1700;
    if (erasing && text === "") delay = 220;

    const timer = window.setTimeout(() => {
      if (!erasing && text === phrase) return setErasing(true);
      if (erasing && text === "") {
        setErasing(false);
        return setIndex((current) => current + 1);
      }
      setText(erasing ? phrase.slice(0, text.length - 1) : phrase.slice(0, text.length + 1));
    }, delay);

    return () => window.clearTimeout(timer);
  }, [text, index, erasing, phrases]);

  return (
    <span className="typewriter">
      {text}
      <span className="typewriter__caret" aria-hidden />
    </span>
  );
}

/**
 * Entrada por rolagem e o foco de luz dos cartões. Não renderiza nada: observa o
 * que já está no HTML, para a página continuar sendo server component e chegar
 * completa a quem lê sem JavaScript.
 */
export function Effects() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".card"));
    const cleanups: (() => void)[] = [];

    if (reduced) {
      // sem movimento: tudo entra de uma vez e nada segue o cursor
      targets.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    // ---- entrada por rolagem
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    targets.forEach((element) => observer.observe(element));
    cleanups.push(() => observer.disconnect());

    // o que já está na primeira tela entra sem esperar rolagem nenhuma
    const raf = requestAnimationFrame(() => {
      targets.forEach((element) => {
        if (element.getBoundingClientRect().top < window.innerHeight) {
          element.classList.add("is-visible");
        }
      });
    });
    cleanups.push(() => cancelAnimationFrame(raf));

    // ---- foco de luz seguindo o cursor, em coordenadas relativas ao cartão
    for (const card of cards) {
      const onMove = (event: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        card.style.setProperty("--my", `${event.clientY - rect.top}px`);
      };
      card.addEventListener("pointermove", onMove);
      cleanups.push(() => card.removeEventListener("pointermove", onMove));
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
