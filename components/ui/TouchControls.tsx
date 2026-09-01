"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { input } from "@/lib/controls";

const DEAD_ZONE = 0.12;

/** A captura falha para ponteiros que o navegador não conhece; o controle segue válido. */
function capturePointer(element: Element, pointerId: number) {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // sem captura o controle ainda responde enquanto o dedo estiver sobre ele
  }
}

const KNOB_TRAVEL = 0.62; // fração do raio que o polegar percorre

/**
 * Volante analógico: o esterço é proporcional ao quanto o polegar se afasta do
 * centro, e não 0 ou 1 como nos botões que havia aqui antes. `input.left` e
 * `input.right` aceitam frações — a física já usa a diferença entre os dois.
 */
function SteeringStick() {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);

  const applySteer = useCallback((value: number) => {
    const steer = Math.abs(value) < DEAD_ZONE ? 0 : value;
    input.right = Math.max(0, steer);
    input.left = Math.max(0, -steer);

    if (knob.current) {
      const travel = steer * KNOB_TRAVEL * 100;
      knob.current.style.transform = `translate(calc(-50% + ${travel}%), -50%)`;
    }
  }, []);

  const track = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const element = base.current;
      if (!element || activePointer.current !== event.pointerId) return;

      const rect = element.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const offset = (event.clientX - center) / (rect.width / 2);
      applySteer(Math.max(-1, Math.min(1, offset)));
    },
    [applySteer],
  );

  const start = (event: React.PointerEvent<HTMLDivElement>) => {
    activePointer.current = event.pointerId;
    // sem a captura, arrastar para fora do círculo "solta" o volante
    capturePointer(event.currentTarget, event.pointerId);
    track(event);
  };

  const end = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    applySteer(0);
  };

  useEffect(() => () => applySteer(0), [applySteer]);

  return (
    <div
      ref={base}
      className="stick"
      onPointerDown={start}
      onPointerMove={track}
      onPointerUp={end}
      onPointerCancel={end}
      role="slider"
      aria-label="Volante"
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={0}
    >
      <span className="stick__hint stick__hint--left">◀</span>
      <span className="stick__hint stick__hint--right">▶</span>
      <div ref={knob} className="stick__knob" />
    </div>
  );
}

type PedalProps = {
  action: "forward" | "backward";
  label: string;
  hint: string;
  className: string;
};

function Pedal({ action, label, hint, className }: PedalProps) {
  const press = (value: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (value) capturePointer(event.currentTarget, event.pointerId);
    input[action] = value;
  };

  return (
    <button
      className={`pedal ${className}`}
      onPointerDown={press(1)}
      onPointerUp={press(0)}
      onPointerCancel={press(0)}
      onContextMenu={(event) => event.preventDefault()}
      aria-label={hint}
    >
      <span className="pedal__label">{label}</span>
      <span className="pedal__hint">{hint}</span>
    </button>
  );
}

export function TouchControls() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  if (!isTouch) return null;

  return (
    <>
      <SteeringStick />
      <div className="pedals">
        <Pedal action="backward" label="R" hint="Ré" className="pedal--reverse" />
        <Pedal action="forward" label="▲" hint="Acelerar" className="pedal--throttle" />
      </div>
    </>
  );
}
