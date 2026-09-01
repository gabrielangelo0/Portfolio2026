"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { carState } from "@/lib/carState";
import { projects } from "@/lib/data";
import {
  ARENA,
  CRATE_STACKS,
  HOUSES,
  LAKE,
  RAMPS,
  START_PAD,
  ZONE_RADIUS,
  generateScenery,
} from "@/lib/world";
import { useGameStore } from "@/store/useGameStore";

const RADIUS_METERS = 34; // quanto do mundo cabe no minimapa
const SIZE = 170; // lado do canvas, em CSS pixels

/**
 * Minimapa no estilo GTA: o carro fica fixo no centro apontando para cima e o
 * mundo gira em volta. Quem está fora do alcance vira um blip preso na borda,
 * com a seta indicando a direção.
 */
export function Minimap({ onExpand }: { onExpand: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scenery = useMemo(() => generateScenery(), []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const half = SIZE / 2;
      const scale = half / RADIUS_METERS;

      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.save();

      // recorte circular
      ctx.beginPath();
      ctx.arc(half, half, half - 1, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = "#4a7636";
      ctx.fillRect(0, 0, SIZE, SIZE);

      ctx.translate(half, half);
      // -yaw: o mundo gira ao contrário do carro, que fica apontando para cima
      ctx.rotate(-carState.yaw);
      ctx.translate(-carState.x * scale, carState.z * scale);
      // eixo Z do mundo cresce "para baixo" no mapa
      ctx.scale(1, -1);

      const world = (x: number, z: number): [number, number] => [x * scale, z * scale];

      // fora dos limites
      ctx.fillStyle = "#3c6a35";
      ctx.fillRect(-ARENA * scale - 400, -ARENA * scale - 400, 800 + ARENA * 2 * scale, 400);
      ctx.fillRect(-ARENA * scale - 400, ARENA * scale, 800 + ARENA * 2 * scale, 400);
      ctx.fillRect(-ARENA * scale - 400, -ARENA * scale, 400, ARENA * 2 * scale);
      ctx.fillRect(ARENA * scale, -ARENA * scale, 400, ARENA * 2 * scale);

      ctx.strokeStyle = "#c2a878";
      ctx.lineWidth = 2;
      ctx.strokeRect(-ARENA * scale, -ARENA * scale, ARENA * 2 * scale, ARENA * 2 * scale);

      // grade
      ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
      ctx.lineWidth = 1;
      for (let i = -ARENA; i <= ARENA; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i * scale, -ARENA * scale);
        ctx.lineTo(i * scale, ARENA * scale);
        ctx.moveTo(-ARENA * scale, i * scale);
        ctx.lineTo(ARENA * scale, i * scale);
        ctx.stroke();
      }

      // largada
      ctx.fillStyle = "rgba(169, 133, 90, 0.85)";
      ctx.beginPath();
      ctx.arc(...world(START_PAD.x, START_PAD.z), START_PAD.radius * scale, 0, Math.PI * 2);
      ctx.fill();

      // rampas
      ctx.fillStyle = "rgba(169, 133, 90, 0.7)";
      for (const ramp of RAMPS) {
        ctx.save();
        ctx.translate(...world(ramp.position[0], ramp.position[2]));
        ctx.rotate(-ramp.rotation);
        ctx.fillRect(
          (-ramp.size[0] / 2) * scale,
          (-ramp.size[1] / 2) * scale,
          ramp.size[0] * scale,
          ramp.size[1] * scale,
        );
        ctx.restore();
      }

      // caixas
      ctx.fillStyle = "#c08b4e";
      for (const [x, , z] of CRATE_STACKS) {
        const [px, pz] = world(x, z);
        ctx.fillRect(px - 4, pz - 4, 8, 8);
      }

      // mata e pedras, como pontinhos de referência
      const SCENERY_COLOR: Record<string, string> = {
        pine: "rgba(44, 92, 55, 0.95)",
        broadleaf: "rgba(75, 140, 60, 0.95)",
        bush: "rgba(90, 150, 70, 0.8)",
        rock: "rgba(140, 138, 132, 0.9)",
      };
      for (const item of scenery) {
        const [px, pz] = world(item.position[0], item.position[2]);
        ctx.fillStyle = SCENERY_COLOR[item.kind];
        ctx.beginPath();
        ctx.arc(px, pz, item.kind === "bush" || item.kind === "rock" ? 1.8 : 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // casario
      ctx.fillStyle = "#c9b79a";
      for (const house of HOUSES) {
        const [px, pz] = world(house.position[0], house.position[2]);
        ctx.fillRect(px - 3, pz - 3, 6, 6);
      }

      // zonas
      for (const project of projects) {
        const [px, pz] = world(project.position[0], project.position[2]);
        ctx.fillStyle = project.color;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(px, pz, ZONE_RADIUS * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(px, pz, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // blips das zonas distantes, presos na borda
      for (const project of projects) {
        const dx = project.position[0] - carState.x;
        const dz = project.position[2] - carState.z;
        const distance = Math.hypot(dx, dz);
        if (distance <= RADIUS_METERS) continue;

        const angle = Math.atan2(dx, dz) - carState.yaw;
        const edge = half - 10;
        const bx = half + Math.sin(angle) * edge;
        const by = half - Math.cos(angle) * edge;

        ctx.fillStyle = project.color;
        ctx.beginPath();
        ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // carro no centro
      ctx.save();
      ctx.translate(half, half);
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(6, 7);
      ctx.lineTo(0, 3.5);
      ctx.lineTo(-6, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
    [scenery],
  );

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;

    const ctx = element.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    element.width = SIZE * dpr;
    element.height = SIZE * dpr;
    ctx.scale(dpr, dpr);

    let frame = 0;
    const loop = () => {
      draw(ctx);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [draw]);

  return (
    <button className="minimap" onClick={onExpand} title="Abrir o mapa (M)">
      <canvas ref={canvas} style={{ width: SIZE, height: SIZE }} />
      <span className="minimap__badge">Mapa · M</span>
    </button>
  );
}

/** Mapa aberto: o mundo inteiro, com os nomes, e cada seção é clicável. */
export function WorldMap({ onClose }: { onClose: () => void }) {
  const goToZone = useGameStore((s) => s.goToZone);
  const activeZone = useGameStore((s) => s.activeZone);
  const [pose, setPose] = useState({ x: carState.x, z: carState.z, yaw: carState.yaw });

  useEffect(() => {
    const id = window.setInterval(
      () => setPose({ x: carState.x, z: carState.z, yaw: carState.yaw }),
      120,
    );
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Escape" || event.code === "KeyM") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // do mundo (-ARENA..ARENA) para porcentagem da tela
  const toPercent = (value: number) => ((value + ARENA) / (ARENA * 2)) * 100;

  return (
    <div className="worldmap" onClick={onClose}>
      <div className="worldmap__panel" onClick={(event) => event.stopPropagation()}>
        <header className="worldmap__header">
          <h2>Mapa</h2>
          <button className="worldmap__close" onClick={onClose} aria-label="Fechar o mapa">
            ✕
          </button>
        </header>

        <div className="worldmap__grid">
          <div
            className="worldmap__start"
            style={{ left: `${toPercent(START_PAD.x)}%`, top: `${toPercent(START_PAD.z)}%` }}
          >
            largada
          </div>

          {projects.map((project) => (
            <button
              key={project.id}
              className={`worldmap__zone ${activeZone === project.id ? "is-active" : ""}`}
              style={{
                left: `${toPercent(project.position[0])}%`,
                top: `${toPercent(project.position[2])}%`,
                ["--zone" as string]: project.color,
              }}
              onClick={() => {
                goToZone(project.id);
                onClose();
              }}
            >
              <i />
              {project.title}
            </button>
          ))}

          <div
            className="worldmap__car"
            style={{
              left: `${toPercent(pose.x)}%`,
              top: `${toPercent(pose.z)}%`,
              // no mapa aberto o +Z do mundo aponta para baixo, daí o π
              transform: `translate(-50%, -50%) rotate(${Math.PI - pose.yaw}rad)`,
            }}
          />
        </div>

        <p className="worldmap__hint">
          Clique em uma seção para ir direto até ela · <kbd>M</kbd> ou <kbd>Esc</kbd> fecha
        </p>
      </div>
    </div>
  );
}
