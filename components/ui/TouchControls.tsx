"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { input } from "@/lib/controls";
import type { Localized } from "@/lib/i18n";
import { useLanguage } from "./LanguageProvider";

const DEAD_ZONE = 0.12;

const STEERING_LABEL: Localized = { en: "Steering", pt: "Direção" };
const REVERSE_HINT: Localized = { en: "Reverse", pt: "Ré" };
const THROTTLE_HINT: Localized = { en: "Throttle", pt: "Acelerar" };

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
 * centro. Só horizontal — a tração vem dos pedais.
 */
function SteeringStick() {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);
  const { t } = useLanguage();

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
      aria-label={t(STEERING_LABEL)}
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
  hint: Localized;
  className: string;
};

function Pedal({ action, label, hint, className }: PedalProps) {
  const { t } = useLanguage();
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
      aria-label={t(hint)}
    >
      <span className="pedal__label">{label}</span>
      <span className="pedal__hint">{t(hint)}</span>
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
        <Pedal action="reverse" label="R" hint={REVERSE_HINT} className="pedal--reverse" />
        <Pedal action="throttle" label="▲" hint={THROTTLE_HINT} className="pedal--throttle" />
      </div>
    </>
  );
}
