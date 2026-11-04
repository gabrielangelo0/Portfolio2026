"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { audio } from "@/lib/audio";
import { carState } from "@/lib/carState";
import { terrainHeight } from "@/lib/terrain";
import { profile, projects } from "@/lib/data";
import type { Localized } from "@/lib/i18n";
import { SECRETS } from "@/lib/secrets";
import { useGameStore } from "@/store/useGameStore";
import { useLanguage } from "./LanguageProvider";
import { Minimap, WorldMap } from "./Minimap";
import { TouchControls } from "./TouchControls";

const UI: Record<string, Localized> = {
  interactivePortfolio: { en: "Interactive portfolio", pt: "Portfólio interativo" },
  soundOn: {
    en: "Sound on — you can mute it anytime. Six things are hidden out in the hills.",
    pt: "Som ligado — você pode silenciar quando quiser. Seis coisas estão escondidas pela serra.",
  },
  getInTheCar: { en: "Get in the car", pt: "Entrar no carro" },
  backToWritten: { en: "← Back to the written portfolio", pt: "← Voltar para a versão em página" },
  throttleReverse: { en: "throttle and reverse", pt: "acelerar e ré" },
  steer: { en: "steer", pt: "dirigir" },
  brake: { en: "brake", pt: "freio" },
  backToStart: { en: "back to start", pt: "voltar à largada" },
  map: { en: "map", pt: "mapa" },
  email: { en: "Email", pt: "E-mail" },
  unmute: { en: "Unmute", pt: "Reativar som" },
  mute: { en: "Mute", pt: "Silenciar" },
  sound: { en: "sound", pt: "som" },
  restart: { en: "Restart", pt: "Reiniciar" },
  viewMore: { en: "View more →", pt: "Ver mais →" },
  youMadeIt: { en: "You made it", pt: "Você chegou" },
  driveToCircle: {
    en: "Drive to one of the colored circles",
    pt: "Dirija até um dos círculos coloridos",
  },
  jumpStraightTo: { en: "Jump straight to", pt: "Ir direto para" },
  jumpToFinish: { en: "Jump to the finish line", pt: "Ir direto para a linha de chegada" },
  finishLine: { en: "Finish line", pt: "Linha de chegada" },
  clickToJump: { en: "click to jump", pt: "clique para ir até lá" },
  allSecretsFound: { en: "all secrets found", pt: "todos os segredos encontrados" },
  secretsFound: { en: "secrets found", pt: "segredos encontrados" },
  konamiTitle: { en: "Konami code", pt: "Código Konami" },
  konamiMessage: {
    en: "Thirty lives not included. The confetti is on the house.",
    pt: "Trinta vidas não inclusas. O confete é por nossa conta.",
  },
};

function Intro() {
  const start = useGameStore((s) => s.start);
  const muted = useGameStore((s) => s.muted);
  const { t } = useLanguage();

  const enter = () => {
    // O áudio nunca pode impedir a entrada: a política de autoplay exige que o
    // contexto nasça dentro do gesto, mas se ele falhar o jogo segue mudo.
    try {
      audio.start();
      audio.setMuted(muted);
    } catch {
      // sem áudio nesta sessão
    }
    start();
  };

  return (
    <div className="intro">
      <div className="intro__card">
        <div className="intro__avatar">
          <Image
            src="/gabriel.jpg"
            alt={profile.name}
            width={440}
            height={440}
            sizes="64px"
            priority
          />
        </div>
        <p className="intro__eyebrow">{t(UI.interactivePortfolio)}</p>
        <h1 className="intro__name">{profile.name}</h1>
        <p className="intro__role">{t(profile.role)}</p>
        <p className="intro__tagline">{t(profile.tagline)}</p>
        <p className="intro__sound">{t(UI.soundOn)}</p>

        <button className="intro__button" onClick={enter} autoFocus>
          {t(UI.getInTheCar)}
        </button>

        {/* volta para a porta de entrada, que é a versão em página */}
        <a className="intro__alt" href="/">
          {t(UI.backToWritten)}
        </a>

        <ul className="intro__keys">
          <li>
            <kbd>W</kbd> <kbd>S</kbd> {t(UI.throttleReverse)}
          </li>
          <li>
            <kbd>A</kbd> <kbd>D</kbd> {t(UI.steer)}
          </li>
          <li>
            <kbd>Space</kbd> {t(UI.brake)}
          </li>
          <li>
            <kbd>R</kbd> {t(UI.backToStart)}
          </li>
          <li>
            <kbd>M</kbd> {t(UI.map)}
          </li>
        </ul>

        <ul className="intro__links">
          {profile.links.map((link) => (
            <li key={link.label}>
              <a href={link.url} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a href={`mailto:${profile.email}`}>{t(UI.email)}</a>
          </li>
        </ul>
      </div>
    </div>
  );
}

function Hud() {
  const speed = useGameStore((s) => s.speed);
  const reset = useGameStore((s) => s.reset);
  const muted = useGameStore((s) => s.muted);
  const toggleMuted = useGameStore((s) => s.toggleMuted);
  const { t } = useLanguage();
  const kmh = Math.round(speed * 6);

  return (
    <div className="hud">
      <div className="hud__speed">
        <span className="hud__value">{kmh}</span>
        <span className="hud__unit">km/h</span>
      </div>
      <div className="hud__actions">
        <button
          className="hud__reset"
          onClick={toggleMuted}
          aria-pressed={muted}
          title={t(muted ? UI.unmute : UI.mute)}
        >
          {muted ? "🔇" : "🔊"} {t(UI.sound)}
        </button>
        <button className="hud__reset" onClick={reset}>
          {t(UI.restart)} <kbd>R</kbd>
        </button>
      </div>
    </div>
  );
}

function ProjectPanel() {
  const activeZone = useGameStore((s) => s.activeZone);
  const project = projects.find((p) => p.id === activeZone);
  const { t } = useLanguage();

  return (
    <div className={`panel ${project ? "is-open" : ""}`} aria-hidden={!project}>
      {project && (
        <div className="panel__inner" style={{ ["--zone" as string]: project.color }}>
          <p className="panel__subtitle">{t(project.subtitle)}</p>
          <h2 className="panel__title">{t(project.title)}</h2>
          <p className="panel__description">{t(project.description)}</p>
          <ul className="panel__stack">
            {project.stack.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
          {project.id === "contact" ? (
            <div className="panel__contact">
              <a className="panel__link" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
              {profile.links.map((link) => (
                <a
                  key={link.label}
                  className="panel__link"
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label} →
                </a>
              ))}
            </div>
          ) : project.url ? (
            <a className="panel__link" href={project.url} target="_blank" rel="noreferrer">
              {t(UI.viewMore)}
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Compass() {
  const activeZone = useGameStore((s) => s.activeZone);
  const goToZone = useGameStore((s) => s.goToZone);
  const { t } = useLanguage();

  return (
    <nav className="compass">
      <span className="compass__hint">
        {t(activeZone ? UI.youMadeIt : UI.driveToCircle)}
      </span>
      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <button
              className={activeZone === p.id ? "is-active" : ""}
              onClick={() => goToZone(p.id)}
              title={`${t(UI.jumpStraightTo)} ${t(p.title)}`}
            >
              <i style={{ background: p.color }} />
              {t(p.title)}
            </button>
          </li>
        ))}
        <li>
          <button
            className="is-finish"
            onClick={() => goToZone("finish")}
            title={t(UI.jumpToFinish)}
          >
            <i className="compass__flag" />
            {t(UI.finishLine)}
          </button>
        </li>
      </ul>
      <span className="compass__note">{t(UI.clickToJump)}</span>
    </nav>
  );
}

/**
 * Placar da caçada. Só aparece depois do primeiro achado: quem não sabe que há
 * segredos não precisa ver um contador zerado estragando a surpresa.
 */
function SecretTally() {
  const found = useGameStore((s) => s.foundSecrets);
  const { t } = useLanguage();
  if (found.length === 0) return null;

  return (
    <div className={`tally ${found.length === SECRETS.length ? "is-complete" : ""}`}>
      <span className="tally__count">
        {found.length}/{SECRETS.length}
      </span>
      <span className="tally__label">
        {t(found.length === SECRETS.length ? UI.allSecretsFound : UI.secretsFound)}
      </span>
    </div>
  );
}

/** Aviso passageiro: segredo achado, código secreto digitado. */
function Toast() {
  const notice = useGameStore((s) => s.notice);
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (!notice) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 5200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!notice) return null;

  return (
    <div className={`toast ${visible ? "is-open" : ""}`}>
      <span className="toast__eyebrow">{t(notice.eyebrow)}</span>
      <strong className="toast__title">{t(notice.title)}</strong>
      <span className="toast__message">{t(notice.message)}</span>
    </div>
  );
}

/**
 * O código do Konami. As setas também dirigem, mas a sequência inteira é longa
 * demais para sair por acidente ao volante.
 */
const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];

function useKonami(onUnlock: () => void) {
  const progress = useRef(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === KONAMI[progress.current]) {
        progress.current += 1;
        if (progress.current === KONAMI.length) {
          progress.current = 0;
          onUnlock();
        }
        return;
      }
      // recomeça — mas uma tecla certa fora de hora já vale como novo começo
      progress.current = event.code === KONAMI[0] ? 1 : 0;
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onUnlock]);
}

export function Overlay() {
  const started = useGameStore((s) => s.started);
  const muted = useGameStore((s) => s.muted);
  const [mapOpen, setMapOpen] = useState(false);

  const onKonami = useCallback(() => {
    const { celebrate, notify } = useGameStore.getState();
    celebrate(carState.x, terrainHeight(carState.x, carState.z) + 4, carState.z);
    notify({
      eyebrow: { en: "↑ ↑ ↓ ↓ ← → ← → B A", pt: "↑ ↑ ↓ ↓ ← → ← → B A" },
      title: UI.konamiTitle,
      message: UI.konamiMessage,
    });
    try {
      audio.finish();
    } catch {
      // sem som, a festa é só visual
    }
  }, []);

  useKonami(onKonami);

  useEffect(() => {
    audio.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    // nada de trilha tocando com a aba em segundo plano
    const onVisibility = () => audio.setActive(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "KeyM") setMapOpen((open) => !open);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    // evita a página rolar quando o jogador usa as setas
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!started) return <Intro />;

  return (
    <>
      <Hud />
      <Compass />
      <ProjectPanel />
      <SecretTally />
      <Toast />
      <Minimap onExpand={() => setMapOpen(true)} />
      {mapOpen && <WorldMap onClose={() => setMapOpen(false)} />}
      <TouchControls />
    </>
  );
}
