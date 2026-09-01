import type { Metadata, Viewport } from "next";
import { profile } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  title: `${profile.name} — 3D Portfolio`,
  description: `Interactive portfolio by ${profile.name}: drive through a 3D scene and explore the work.`,
};

export const viewport: Viewport = {
  themeColor: "#120f1f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
