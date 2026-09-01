"use client";

import { useEffect, useState } from "react";
import { audio } from "@/lib/audio";
import { profile, projects } from "@/lib/data";
import { useGameStore } from "@/store/useGameStore";
import { Minimap, WorldMap } from "./Minimap";
import { TouchControls } from "./TouchControls";

function Intro() {
  const start = useGameStore((s) => s.start);
  const muted = useGameStore((s) => s.muted);

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
        <p className="intro__eyebrow">Interactive portfolio</p>
        <h1 className="intro__name">{profile.name}</h1>
        <p className="intro__role">{profile.role}</p>
        <p className="intro__tagline">{profile.tagline}</p>
        <p className="intro__sound">Sound on — you can mute it anytime.</p>

        <button className="intro__button" onClick={enter} autoFocus>
          Get in the car
        </button>

        <ul className="intro__keys">
          <li>
            <kbd>W</kbd> <kbd>S</kbd> throttle and reverse
          </li>
          <li>
            <kbd>A</kbd> <kbd>D</kbd> steer
          </li>
          <li>
            <kbd>Space</kbd> brake
          </li>
          <li>
            <kbd>R</kbd> back to start
          </li>
          <li>
            <kbd>M</kbd> map
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
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? "🔇" : "🔊"} sound
        </button>
        <button className="hud__reset" onClick={reset}>
          Restart <kbd>R</kbd>
        </button>
      </div>
    </div>
  );
}

function ProjectPanel() {
  const activeZone = useGameStore((s) => s.activeZone);
  const project = projects.find((p) => p.id === activeZone);

  return (
    <div className={`panel ${project ? "is-open" : ""}`} aria-hidden={!project}>
      {project && (
        <div className="panel__inner" style={{ ["--zone" as string]: project.color }}>
          <p className="panel__subtitle">{project.subtitle}</p>
          <h2 className="panel__title">{project.title}</h2>
          <p className="panel__description">{project.description}</p>
          <ul className="panel__stack">
            {project.stack.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
          {project.id === "contato" ? (
            <a className="panel__link" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          ) : project.url ? (
            <a className="panel__link" href={project.url} target="_blank" rel="noreferrer">
              Ver mais →
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

  return (
    <nav className="compass">
      <span className="compass__hint">
        {activeZone ? "You made it" : "Drive to one of the colored circles"}
      </span>
      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <button
              className={activeZone === p.id ? "is-active" : ""}
              onClick={() => goToZone(p.id)}
              title={`Jump straight to ${p.title}`}
            >
              <i style={{ background: p.color }} />
              {p.title}
            </button>
          </li>
        ))}
      </ul>
      <span className="compass__note">click to jump</span>
    </nav>
  );
}

export function Overlay() {
  const started = useGameStore((s) => s.started);
  const muted = useGameStore((s) => s.muted);
  const [mapOpen, setMapOpen] = useState(false);

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
      <Minimap onExpand={() => setMapOpen(true)} />
      {mapOpen && <WorldMap onClose={() => setMapOpen(false)} />}
      <TouchControls />
    </>
  );
}
