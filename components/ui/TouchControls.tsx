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
 * Volante analógico: o polegar escolhe o lado **da tela** para onde ir e o carro
 * esterça até se alinhar. Só horizontal — a tração vem dos pedais.
 */
function SteeringStick() {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);

  const applyDirection = useCallback((x: number) => {
    const value = Math.abs(x) < DEAD_ZONE ? 0 : Math.max(-1, Math.min(1, x));
    input.moveX = value;

    if (knob.current) {
      const travel = value * KNOB_TRAVEL * 100;
      knob.current.style.transform = `translate(calc(-50% + ${travel}%), -50%)`;
    }
  }, []);

  const track = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const element = base.current;
      if (!element || activePointer.current !== event.pointerId) return;

      const rect = element.getBoundingClientRect();
      const radius = rect.width / 2;
      applyDirection((event.clientX - (rect.left + radius)) / radius);
    },
    [applyDirection],
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
    applyDirection(0);
  };

  useEffect(() => () => applyDirection(0), [applyDirection]);

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
  action: "throttle" | "reverse";
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
        <Pedal action="reverse" label="R" hint="Ré" className="pedal--reverse" />
        <Pedal action="throttle" label="▲" hint="Acelerar" className="pedal--throttle" />
      </div>
    </>
  );
}
