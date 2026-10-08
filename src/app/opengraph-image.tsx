import { ImageResponse } from "next/og";
import { TITRE_ACCUEIL } from "@/config/seo";
import { DECISION_MODELS } from "@/config/pedagogy/models";
import { ALL_SITUATIONS, SCENARIO_CHOICES } from "@/config/scenarios/registry";

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

/**
 * LES COULEURS DE LA MAISON, PAS CELLES DE TAILWIND.
 *
 * Cette image a porté l'amber brut (#d97706) et le gris d'usine (#020617),
 * puis l'or patiné de l'habillage d'avant. Une image de partage est le
 * premier contact qu'un lien crée, souvent le seul : elle prend donc le
 * marine et l'orange de l'arène, ceux du haut de l'accueil : l'orange ambré
 * #ff8a1f (6,5 pour 1 sur le marine) et non plus le saumon #ff9455, les
 * blancs cassés de l'information, le vert et le rouge francs des résultats,
 * et un encadré au filet orange plein plutôt qu'un voile orangé.
 */
const AMBRE = "#ff8a1f";
const FOND = "#0b2545";
const CARTE = "#13355f";
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
      <span style={{ fontSize: 18, letterSpacing: 2, color: "#c2bcb2", textTransform: "uppercase" }}>
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
          color: "#f1ede4",
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
          <span style={{ fontSize: 24, color: "#c2bcb2", marginTop: 28, lineHeight: 1.4 }}>
            {SCENARIO_CHOICES.length} secteurs, {ALL_SITUATIONS.length} situations, {DECISION_MODELS.length} modèles
            d&apos;analyse. Essai gratuit, sans compte élève.
          </span>
          <span style={{ fontSize: 26, fontWeight: 700, marginTop: "auto", color: "#f1ede4" }}>
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
                color: "#ff7070",
                border: "1px solid #ff7070",
                borderRadius: 999,
                padding: "6px 14px",
              }}
            >
              trésorerie sous tension
            </span>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
            <Tuile label="Chiffre d'affaires" value="346 920 €" color="#3ccf7e" />
            <Tuile label="Résultat net" value="+10 110 €" color="#3ccf7e" />
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
            <Tuile label="Trésorerie nette" value="−758 €" color="#ff7070" />
            <Tuile label="BFR" value="84 805 €" color="#f1ede4" />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 18,
              background: FOND,
              border: `1px solid ${BORDURE}`,
              borderLeft: `6px solid ${AMBRE}`,
              borderRadius: 14,
              padding: "16px 20px",
            }}
          >
            <span style={{ fontSize: 16, letterSpacing: 3, color: AMBRE, textTransform: "uppercase" }}>
              Alerte comptable
            </span>
            <span style={{ fontSize: 21, color: "#f1ede4", marginTop: 6, lineHeight: 1.35 }}>
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
