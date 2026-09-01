"use client";

import { useEffect, useState } from "react";
import { input } from "@/lib/controls";

type Action = "forward" | "backward" | "left" | "right";

const buttons: { action: Action; label: string; className: string }[] = [
  { action: "forward", label: "▲", className: "touch__up" },
  { action: "backward", label: "▼", className: "touch__down" },
  { action: "left", label: "◀", className: "touch__left" },
  { action: "right", label: "▶", className: "touch__right" },
];

export function TouchControls() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  if (!isTouch) return null;

  const press = (action: Action, value: number) => () => {
    input[action] = value;
  };

  return (
    <div className="touch">
      {buttons.map((button) => (
        <button
          key={button.action}
          className={`touch__btn ${button.className}`}
          onPointerDown={press(button.action, 1)}
          onPointerUp={press(button.action, 0)}
          onPointerLeave={press(button.action, 0)}
          onPointerCancel={press(button.action, 0)}
          aria-label={button.action}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}
