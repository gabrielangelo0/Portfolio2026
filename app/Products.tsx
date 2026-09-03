"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { products, type Product } from "@/lib/data";

/** Ícone curto por tipo de link, para o botão dizer para onde vai sem legenda. */
const KIND_LABEL: Record<string, string> = {
  site: "Visit",
  play: "Google Play",
  appstore: "App Store",
  repo: "Code",
};

/**
 * Galeria em tela cheia. Existe para o que não tem página pública: sem lugar
 * para mandar o visitante, as imagens do próprio sistema são a prova.
 */
function Gallery({ product, onClose }: { product: Product; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const shots = product.shots ?? [];

  const move = useCallback(
    (step: number) => setIndex((current) => (current + step + shots.length) % shots.length),
    [shots.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, onClose]);

  if (shots.length === 0) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal aria-label={`${product.name} screenshots`}>
      <button className="lightbox__backdrop" onClick={onClose} aria-label="Close" />

      <div className="lightbox__panel glass">
        <header className="lightbox__head">
          <div>
            <h3>{product.name}</h3>
            <p>{product.role}</p>
          </div>
          <button className="lightbox__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="lightbox__stage">
          {/* eager: a galeria só monta quando alguém abre, e o lazy padrão
              deixava o palco preto esperando um observador que nunca dispara */}
          <Image
            key={shots[index].src}
            src={shots[index].src}
            alt={shots[index].alt}
            width={1200}
            height={900}
            sizes="(max-width: 820px) 92vw, 760px"
            loading="eager"
          />
        </div>

        {shots.length > 1 ? (
          <footer className="lightbox__foot">
            <button onClick={() => move(-1)} aria-label="Previous screenshot">
              ←
            </button>
            <span>
              {index + 1} / {shots.length}
            </span>
            <button onClick={() => move(1)} aria-label="Next screenshot">
              →
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export function Products() {
  const [open, setOpen] = useState<Product | null>(null);

  // com a galeria aberta, o fundo não pode rolar por baixo
  useEffect(() => {
    if (!open) return;
    const reader = document.querySelector<HTMLElement>(".reader");
    const previous = reader?.style.overflow;
    if (reader) reader.style.overflow = "hidden";
    return () => {
      if (reader) reader.style.overflow = previous ?? "";
    };
  }, [open]);

  return (
    <>
      <div className="reader__cards">
        {products.map((product, index) => (
          <article
            key={product.id}
            className="card glass"
            data-reveal
            style={{
              ["--zone" as string]: product.accent,
              ["--delay" as string]: `${index * 0.06}s`,
            }}
          >
            <p className="card__badge">{product.role}</p>
            <h3 className="card__title">{product.name}</h3>
            <p className="card__description">{product.summary}</p>

            <ul className="card__stack">
              {product.stack.map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>

            <div className="card__links">
              {product.links.map((link) => (
                <a
                  key={link.url}
                  className="card__cta"
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {KIND_LABEL[link.kind] ?? "Open"} ↗
                </a>
              ))}

              {product.shots?.length ? (
                <button className="card__cta is-ghost" onClick={() => setOpen(product)}>
                  Screenshots
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {open ? <Gallery product={open} onClose={() => setOpen(null)} /> : null}
    </>
  );
}
