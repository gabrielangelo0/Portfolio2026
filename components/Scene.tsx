"use client";

import dynamic from "next/dynamic";
import { Overlay } from "./ui/Overlay";

// WebGL só existe no browser: o Canvas nunca deve ser renderizado no servidor.
const Experience = dynamic(() => import("./canvas/Experience"), {
  ssr: false,
  loading: () => <div className="boot">warming up the engine…</div>,
});

export function Scene() {
  return (
    <main className="stage">
      <Experience />
      <Overlay />
    </main>
  );
}
