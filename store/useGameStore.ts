import { create } from "zustand";

type GameState = {
  started: boolean;
  activeZone: string | null;
  openPanel: string | null;
  speed: number;
  start: () => void;
  setActiveZone: (id: string | null) => void;
  setOpenPanel: (id: string | null) => void;
  setSpeed: (v: number) => void;
  resetSignal: number;
  reset: () => void;
  /** Id da zona para onde o carro deve ser levado, com contador para repetir o mesmo destino. */
  teleport: { id: string; nonce: number } | null;
  goToZone: (id: string) => void;
};

export const useGameStore = create<GameState>((set) => ({
  started: false,
  activeZone: null,
  openPanel: null,
  speed: 0,
  resetSignal: 0,
  start: () => set({ started: true }),
  setActiveZone: (id) => set({ activeZone: id }),
  setOpenPanel: (id) => set({ openPanel: id }),
  setSpeed: (v) => set({ speed: v }),
  reset: () => set((s) => ({ resetSignal: s.resetSignal + 1 })),
  teleport: null,
  goToZone: (id) =>
    set((s) => ({
      started: true,
      teleport: { id, nonce: (s.teleport?.nonce ?? 0) + 1 },
    })),
}));
