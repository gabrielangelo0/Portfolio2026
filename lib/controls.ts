"use client";

/**
 * Estado de input compartilhado entre teclado, touch e o loop de física.
 * Fica fora do React de propósito: é lido a cada frame e não deve causar render.
 */
export const input = {
  forward: 0,
  backward: 0,
  left: 0,
  right: 0,
  brake: 0,
};

const keyMap: Record<string, keyof typeof input> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "backward",
  ArrowDown: "backward",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "brake",
};

export function resetInput() {
  input.forward = 0;
  input.backward = 0;
  input.left = 0;
  input.right = 0;
  input.brake = 0;
}

export function bindKeyboard() {
  const onDown = (e: KeyboardEvent) => {
    const action = keyMap[e.code];
    if (!action) return;
    if (e.code === "Space") e.preventDefault();
    input[action] = 1;
  };
  const onUp = (e: KeyboardEvent) => {
    const action = keyMap[e.code];
    if (action) input[action] = 0;
  };
  const onBlur = () => resetInput();

  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  window.addEventListener("blur", onBlur);

  return () => {
    window.removeEventListener("keydown", onDown);
    window.removeEventListener("keyup", onUp);
    window.removeEventListener("blur", onBlur);
  };
}
