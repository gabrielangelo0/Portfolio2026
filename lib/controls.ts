"use client";

/**
 * Estado de input compartilhado entre teclado, toque e o loop de física.
 * Fica fora do React de propósito: é lido a cada frame e não deve causar render.
 *
 * `moveX`/`moveY` são a direção desejada **no espaço da tela**, não no do carro:
 * empurrar para a direita significa "vá para a direita da tela", e o carro
 * esterça até se alinhar. Sem isso, dirigir na direção da câmera inverte os
 * comandos e o jogador se perde.
 */
export const input = {
  moveX: 0, // -1 esquerda da tela .. 1 direita
  moveY: 0, // -1 em direção ao observador .. 1 para o fundo
  throttle: 0, // pedal de acelerar (toque)
  reverse: 0, // pedal de ré (toque)
  brake: 0,
};

const AXES: Record<string, [keyof typeof input, number]> = {
  KeyW: ["moveY", 1],
  ArrowUp: ["moveY", 1],
  KeyS: ["moveY", -1],
  ArrowDown: ["moveY", -1],
  KeyA: ["moveX", -1],
  ArrowLeft: ["moveX", -1],
  KeyD: ["moveX", 1],
  ArrowRight: ["moveX", 1],
};

/** Teclas pressionadas agora — o vetor é recomposto a partir delas. */
const held = new Set<string>();

export function resetInput() {
  held.clear();
  input.moveX = 0;
  input.moveY = 0;
  input.throttle = 0;
  input.reverse = 0;
  input.brake = 0;
}

/** O toque escreve direto no vetor; o teclado, através deste recálculo. */
function syncKeyboardAxes() {
  let x = 0;
  let y = 0;
  for (const code of held) {
    const axis = AXES[code];
    if (!axis) continue;
    if (axis[0] === "moveX") x += axis[1];
    else y += axis[1];
  }
  input.moveX = Math.max(-1, Math.min(1, x));
  input.moveY = Math.max(-1, Math.min(1, y));
}

export function bindKeyboard() {
  const onDown = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      input.brake = 1;
      return;
    }
    if (!AXES[e.code]) return;
    held.add(e.code);
    syncKeyboardAxes();
  };

  const onUp = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      input.brake = 0;
      return;
    }
    if (!AXES[e.code]) return;
    held.delete(e.code);
    syncKeyboardAxes();
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
