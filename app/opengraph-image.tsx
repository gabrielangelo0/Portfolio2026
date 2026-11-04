import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile } from "@/lib/data";

/**
 * A imagem de prévia do link (LinkedIn, WhatsApp, Slack, X). Gerada pelo Next a
 * partir desta convenção de arquivo, que também injeta og:image com largura,
 * altura e tipo — sem isso o LinkedIn mostrava o card com o ícone de imagem
 * quebrada, porque a meta apontava para um /og.png que nunca existiu.
 *
 * 1200 × 630 é o formato que LinkedIn e X esperam para o card grande.
 */
// imagem gerada uma vez, no build — fica em inglês independente do idioma
// escolhido pelo visitante
export const alt = `${profile.name} — ${profile.role.en}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  // lida do disco em tempo de build: a imagem sai pré-gerada, sem depender de
  // rede nem de runtime na hora em que o LinkedIn vem buscar
  const photo = await readFile(join(process.cwd(), "public", "gabriel.jpg"));
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 88px",
          gap: 64,
          color: "#f5f5f7",
          backgroundColor: "#0b0a18",
          // as mesmas manchas da página, em gradiente: o gerador não faz blur
          backgroundImage:
            "radial-gradient(circle at 12% 18%, rgba(120, 60, 220, 0.75), transparent 48%), radial-gradient(circle at 88% 30%, rgba(58, 92, 255, 0.6), transparent 46%), radial-gradient(circle at 70% 100%, rgba(30, 190, 220, 0.45), transparent 50%), radial-gradient(circle at 0% 100%, rgba(255, 122, 92, 0.45), transparent 42%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoSrc}
          width={260}
          height={260}
          alt=""
          style={{
            borderRadius: 999,
            border: "3px solid rgba(255, 255, 255, 0.35)",
            boxShadow: "0 0 0 14px rgba(255, 255, 255, 0.06)",
            objectFit: "cover",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "rgba(245, 245, 247, 0.55)",
            }}
          >
            Portfolio
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.05,
              marginTop: 14,
            }}
          >
            {profile.name}
          </div>
          <div style={{ fontSize: 34, marginTop: 14, color: "rgba(245, 245, 247, 0.78)" }}>
            {profile.role.en}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 40,
              fontSize: 24,
              color: "rgba(245, 245, 247, 0.62)",
            }}
          >
            PontoGO · MeuProcesso · PeopleNity · Homefly
          </div>
          <div style={{ display: "flex", marginTop: 12, fontSize: 22, color: "#ff7a5c" }}>
            portfolio.devfly.net
          </div>
        </div>
      </div>
    ),
    size,
  );
}
