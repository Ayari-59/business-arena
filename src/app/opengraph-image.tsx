import { ImageResponse } from "next/og";
import { TITRE_ACCUEIL } from "@/config/seo";

/**
 * L'image d'un lien partagé : le tableau de bord de NOVA, celui de la page
 * d'accueil, avec son alerte de trésorerie. Un enseignant qui reçoit le lien
 * voit ce que ses élèves verront, pas un logo.
 *
 * Générée à la compilation par Next (ImageResponse), sans image externe.
 */

export const alt = TITRE_ACCUEIL;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const AMBRE = "#d97706";
const FOND = "#020617";
const CARTE = "#0f172a";
const BORDURE = "rgba(255,255,255,0.10)";

function Tuile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        background: FOND,
        border: `1px solid ${BORDURE}`,
        borderRadius: 14,
        padding: "18px 22px",
      }}
    >
      <span style={{ fontSize: 18, letterSpacing: 2, color: "#94a3b8", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: 34, fontWeight: 700, color, marginTop: 6 }}>{value}</span>
    </div>
  );
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: FOND,
          color: "#e2e8f0",
          padding: 56,
          fontFamily: "sans-serif",
        }}
      >
        {/* Colonne gauche : le propos */}
        <div style={{ display: "flex", flexDirection: "column", width: 520, paddingRight: 40 }}>
          <span style={{ fontSize: 20, letterSpacing: 6, color: AMBRE, textTransform: "uppercase" }}>
            Simulation · Apprentissage · Décision
          </span>
          <span style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, marginTop: 24 }}>
            Dirigez une entreprise.
          </span>
          <span style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, color: AMBRE }}>
            Apprenez à décider.
          </span>
          <span style={{ fontSize: 24, color: "#94a3b8", marginTop: 28, lineHeight: 1.4 }}>
            9 secteurs, 79 situations, 18 modèles d&apos;analyse. Gratuit, sans compte élève.
          </span>
          <span style={{ fontSize: 26, fontWeight: 700, marginTop: "auto", color: "#f8fafc" }}>
            business-arena.fr
          </span>
        </div>

        {/* Colonne droite : le tableau de bord NOVA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            background: CARTE,
            border: `1px solid ${BORDURE}`,
            borderRadius: 24,
            padding: 28,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 24, fontWeight: 700 }}>NOVA · Trimestre 4 / 6</span>
            <span
              style={{
                fontSize: 18,
                color: "#fca5a5",
                border: "1px solid rgba(248,113,113,0.5)",
                borderRadius: 999,
                padding: "6px 14px",
              }}
            >
              trésorerie sous tension
            </span>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
            <Tuile label="Chiffre d'affaires" value="346 920 €" color="#34d399" />
            <Tuile label="Résultat net" value="+10 110 €" color="#34d399" />
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
            <Tuile label="Trésorerie nette" value="−758 €" color="#fb7185" />
            <Tuile label="BFR" value="84 805 €" color="#f8fafc" />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 18,
              background: "rgba(217,119,6,0.10)",
              border: `1px solid rgba(217,119,6,0.35)`,
              borderRadius: 14,
              padding: "16px 20px",
            }}
          >
            <span style={{ fontSize: 16, letterSpacing: 3, color: AMBRE, textTransform: "uppercase" }}>
              Alerte comptable
            </span>
            <span style={{ fontSize: 21, color: "#e2e8f0", marginTop: 6, lineHeight: 1.35 }}>
              Votre entreprise gagne de l&apos;argent mais n&apos;en a plus en caisse. Identifiez les
              causes possibles.
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
