import type { Metadata, Viewport } from "next";
import { profile } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  title: `${profile.name} — Portfólio 3D`,
  description: `Portfólio interativo de ${profile.name}: dirija por uma cena 3D e explore os projetos.`,
};

export const viewport: Viewport = {
  themeColor: "#120f1f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
