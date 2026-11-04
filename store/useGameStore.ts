import { create } from "zustand";
import type { Localized } from "@/lib/i18n";
import { SECRET_FOUND_EYEBROW, SECRETS, type SecretKind } from "@/lib/secrets";

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
  muted: boolean;
  toggleMuted: () => void;
  /** Segredos já encontrados nesta visita — recarregar a página repõe todos. */
  foundSecrets: SecretKind[];
  findSecret: (id: SecretKind) => void;
  /** Aviso passageiro no canto — segredo achado, código secreto digitado. */
  notice: { eyebrow: Localized; title: Localized; message: Localized; nonce: number } | null;
  notify: (notice: { eyebrow: Localized; title: Localized; message: Localized }) => void;
  /** Pedido de confete em um ponto do mundo; o emissor é um só. */
  celebration: { x: number; y: number; z: number; nonce: number } | null;
  celebrate: (x: number, y: number, z: number) => void;
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
  muted: false,
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
  teleport: null,
  goToZone: (id) =>
    set((s) => ({
      started: true,
      teleport: { id, nonce: (s.teleport?.nonce ?? 0) + 1 },
    })),
  foundSecrets: [],
  findSecret: (id) =>
    set((s) => {
      if (s.foundSecrets.includes(id)) return s;
      const foundSecrets = [...s.foundSecrets, id];
      const secret = SECRETS.find((item) => item.id === id);
      return {
        foundSecrets,
        notice: secret
          ? {
              eyebrow: SECRET_FOUND_EYEBROW,
              title: secret.title,
              message: secret.message,
              nonce: (s.notice?.nonce ?? 0) + 1,
            }
          : s.notice,
      };
    }),
  notice: null,
  notify: (notice) =>
    set((s) => ({ notice: { ...notice, nonce: (s.notice?.nonce ?? 0) + 1 } })),
  celebration: null,
  celebrate: (x, y, z) =>
    set((s) => ({ celebration: { x, y, z, nonce: (s.celebration?.nonce ?? 0) + 1 } })),
}));
