import type { Metadata, Viewport } from "next";
import { profile } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role}`,
  description: `Portfolio of ${profile.name}: SaaS platforms, mobile apps and automation — with a drivable version of the same story.`,
};

export const viewport: Viewport = {
  themeColor: "#0b0a18",
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
