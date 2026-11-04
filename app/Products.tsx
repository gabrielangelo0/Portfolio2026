"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { products, type Product } from "@/lib/data";

/** Ícone curto por tipo de link, para o botão dizer para onde vai sem legenda. */
const KIND_LABEL: Record<string, string> = {
  site: "Visit",
  app: "Open app",
  play: "Google Play",
  appstore: "App Store",
  repo: "Code",
};

/**
 * Esquenta o cache do navegador para essas URLs sem renderizar nada — só
 * dispara o download. Repetir a mesma URL não custa nada, o browser dedup.
 */
function preload(srcs: string[]) {
  srcs.forEach((src) => {
    const img = new window.Image();
    img.src = src;
  });
}

/**
 * Galeria em tela cheia. Existe para o que não tem página pública: sem lugar
 * para mandar o visitante, as imagens do próprio sistema são a prova.
 */
function Gallery({ product, onClose }: { product: Product; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
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

  // a galeria inteira já começa a baixar no momento em que abre — a hora de
  // trocar de imagem, ela quase sempre já está no cache do navegador
  useEffect(() => {
    preload(shots.map((item) => item.src));
  }, [shots]);

  if (shots.length === 0) return null;

  const shot = shots[index];
  const isLoaded = loaded[shot.src] ?? false;

  const image = (
    <Image
      key={shot.src}
      src={shot.src}
      alt={shot.alt}
      width={1200}
      height={900}
      sizes="(max-width: 820px) 92vw, 760px"
      loading="eager"
      unoptimized
      onLoad={() => setLoaded((prev) => (prev[shot.src] ? prev : { ...prev, [shot.src]: true }))}
      style={{ opacity: isLoaded ? 1 : 0 }}
    />
  );

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
          {!isLoaded ? <span className="lightbox__spinner" aria-hidden /> : null}
          {shot.caption ? <span className="lightbox__caption">{shot.caption}</span> : null}
          {/* eager: a galeria só monta quando alguém abre, e o lazy padrão
              deixava o palco preto esperando um observador que nunca dispara.
              shot.frame marca captura crua, sem moldura — a própria captura
              das telas "antes" já trazia o aparelho embutido na imagem. */}
          {shot.frame ? (
            <div className="lightbox__device">
              <span className="lightbox__device-notch" />
              <span className="lightbox__device-btn lightbox__device-btn--mute" />
              <span className="lightbox__device-btn lightbox__device-btn--vol-up" />
              <span className="lightbox__device-btn lightbox__device-btn--vol-down" />
              <span className="lightbox__device-btn lightbox__device-btn--power" />
              {image}
            </div>
          ) : (
            image
          )}
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
                <button
                  className="card__cta is-ghost"
                  onClick={() => setOpen(product)}
                  onMouseEnter={() => preload(product.shots!.map((item) => item.src))}
                  onFocus={() => preload(product.shots!.map((item) => item.src))}
                >
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
