"use client";

import { useEffect } from "react";

/**
 * Os dois efeitos da página em texto, num componente só. Não renderiza nada:
 * observa o que já está no HTML, para a página continuar sendo server component
 * e chegar completa a quem lê sem JavaScript.
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
