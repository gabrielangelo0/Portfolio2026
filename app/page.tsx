import type { Metadata } from "next";
import { profile } from "@/lib/data";
import { HomeContent } from "./HomeContent";

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role.en}`,
  description:
    "SaaS platforms, mobile apps and automation. The same portfolio as the 3D version, in plain text.",
};

/**
 * A porta de entrada do portfólio: página, sem carro e sem WebGL. Fica só com a
 * metadata — que precisa de server component — e empurra o corpo de verdade
 * para `HomeContent`, que é client component e lê o idioma escolhido.
 */
export default function HomePage() {
  return <HomeContent />;
}
