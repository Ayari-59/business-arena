import { ImageResponse } from "next/og";
import { getPublicCompetition } from "@/services/competition.service";
import { accentConcours } from "@/config/concours-public";
import { NOM_DU_SITE } from "@/config/seo";

/**
 * L'aperçu de lien d'un concours : son nom en grand, sur le fond nuit du site,
 * avec l'accent choisi par l'organisateur et le code d'inscription. Généré à la
 * volée par Next (ImageResponse), sans image externe.
 */

export const alt = "Concours sur Business Arena";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FOND = "#020617";
const CARTE = "#0f172a";
const BORDURE = "rgba(255,255,255,0.10)";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const concours = await getPublicCompetition(code);
  const accent = accentConcours(concours?.accent);
  const nom = concours?.name ?? "Concours";
  const tagline = concours?.tagline ?? null;
  const label = concours?.organizerLabel ?? "Concours Business Arena";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: FOND,
          color: "#e2e8f0",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <span style={{ fontSize: 24, letterSpacing: 6, color: accent.doux, textTransform: "uppercase" }}>
          {label}
        </span>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 78, fontWeight: 800, lineHeight: 1.05, color: "#f8fafc" }}>{nom}</span>
          {tagline ? (
            <span style={{ fontSize: 32, color: "#94a3b8", marginTop: 24, lineHeight: 1.35 }}>
              {tagline.slice(0, 120)}
            </span>
          ) : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: "#f8fafc" }}>{NOM_DU_SITE} · business-arena.fr</span>
          {concours ? (
            <span
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 700,
                color: "#020617",
                background: accent.vif,
                borderRadius: 14,
                padding: "12px 26px",
              }}
            >
              Code {concours.joinCode}
            </span>
          ) : (
            <span
              style={{
                display: "flex",
                fontSize: 24,
                color: accent.doux,
                border: `1px solid ${BORDURE}`,
                background: CARTE,
                borderRadius: 14,
                padding: "12px 26px",
              }}
            >
              Simulation d&apos;entreprise
            </span>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
