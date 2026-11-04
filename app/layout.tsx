import type { Metadata, Viewport } from "next";
import { profile } from "@/lib/data";
import { LanguageProvider } from "@/components/ui/LanguageProvider";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import "./globals.css";

const SITE = "https://gabriel.devfly.net";
// metadata de SEO fica só em inglês — Google, LinkedIn e WhatsApp leem uma
// única versão, e trocar por cookie/middleware só pra isso não vale a pena
const TITLE = `${profile.name} | ${profile.role.en}`;
const DESCRIPTION = `Portfolio of ${profile.name}: SaaS platforms, mobile apps and automation — with a drivable version of the same story.`;

export const metadata: Metadata = {
  // Base das URLs absolutas: sem ela og:image sai relativa, e LinkedIn e
  // WhatsApp ignoram imagem que não venha com domínio completo.
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  // og:image não é declarada aqui — vem de app/opengraph-image.tsx, que o Next
  // transforma na meta com largura, altura e tipo corretos
  openGraph: {
    type: "website",
    url: SITE,
    siteName: profile.name,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
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
      <body>
        <LanguageProvider>
          <LanguageToggle />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
