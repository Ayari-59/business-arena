import type { CSSProperties, ReactNode } from "react";

/**
 * LE TRAIT DES ILLUSTRATIONS DE L'ARÈNE (lot 6B).
 *
 * Des formes géométriques plates, sans contour, des visages sans traits, et
 * une PALETTE FERMÉE : huit marines, le blanc cassé et son ombre, et une seule
 * teinte d'accent, celle de l'entreprise jouée (`--metier`). C'est elle qui
 * fait qu'une même scène prend la couleur de NOVA, de MAILLE ou de L'ESCALE
 * sans être redessinée.
 *
 * Ce qui n'entre jamais ici : l'orange (l'action), l'or (le verdict), le vert
 * et le rouge (les résultats), un texte ou une image matricielle. La garde
 * `tests/architecture/illustrations.test.ts` le vérifie sur le rendu.
 *
 * Les SVG vivent INLINE dans le DOM, et c'est voulu : un `<img src=…svg>` ne
 * lit pas les variables CSS de la page, la teinte du métier n'y entrerait pas.
 */
export const MARINE = {
  nuit: "#06152a",
  fond: "#0b2545",
  sol: "#0e2a4d",
  creux: "#102f55",
  mur: "#13355f",
  champ: "#1b416f",
  releve: "#234c80",
  filet: "#2d5385",
} as const;

/** Le blanc cassé et son ombre : la peau, le papier, la lumière. */
export const BLANC = "#f1ede4";
export const OMBRE = "#d9d2c3";

/** La teinte du métier, avec le repli de NOVA hors d'une partie. */
const TEINTE = "var(--metier, #9fabff)";
export const ACCENT: CSSProperties = { fill: TEINTE };
export const ACCENT_TRAIT: CSSProperties = { stroke: TEINTE };

/**
 * L'enveloppe commune. Décorative par défaut (`aria-hidden`) : le nom de
 * l'entreprise ou de l'expéditeur est écrit à côté. Avec un `titre`, elle
 * porte du sens et se lit comme une image.
 */
export function Dessin({
  largeur,
  hauteur,
  titre,
  className,
  cadrage = "xMidYMid meet",
  children,
}: {
  largeur: number;
  hauteur: number;
  titre?: string;
  className?: string;
  cadrage?: string;
  children: ReactNode;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${largeur} ${hauteur}`}
      preserveAspectRatio={cadrage}
      className={className}
      focusable="false"
      {...(titre ? { role: "img", "aria-label": titre } : { "aria-hidden": true })}
    >
      {children}
    </svg>
  );
}

/* -------------------------------------------------------------------------
 * LES SILHOUETTES DES SCÈNES. Une tête ronde sans traits, un cou, un buste aux
 * épaules arrondies : toutes les scènes les dessinent de la même main, ce qui
 * tient le trait d'une image à l'autre. La coiffure dit l'âge et la personne ;
 * son côté dit où elle regarde.
 * ---------------------------------------------------------------------- */

export type Coiffure = "courte" | "carre" | "queue" | "chignon" | "boucles" | "rase" | "aucune";

/** Le buste : `x` au centre, `y` au haut des épaules, jusqu'à `bas`. */
export function Buste({
  x,
  y,
  bas,
  largeur = 30,
  couleur,
  style,
}: {
  x: number;
  y: number;
  bas: number;
  largeur?: number;
  couleur?: string;
  style?: CSSProperties;
}) {
  const g = x - largeur / 2;
  const d = x + largeur / 2;
  return (
    <path
      d={`M${g - 4} ${bas}L${g} ${y + 8}Q${g + 1} ${y} ${g + 8} ${y}L${d - 8} ${y}Q${d - 1} ${y} ${d} ${y + 8}L${d + 4} ${bas}Z`}
      fill={couleur}
      style={style}
    />
  );
}

/**
 * La tête, posée sur les épaules d'un buste dont le haut est à `y`. `sens`
 * vaut 1 si la personne regarde vers la droite, -1 vers la gauche : la
 * coiffure se porte du côté de la nuque.
 */
export function Tete({
  x,
  y,
  coiffure,
  sens = 1,
  peau = BLANC,
  cheveux = MARINE.nuit,
}: {
  x: number;
  y: number;
  coiffure: Coiffure;
  sens?: 1 | -1;
  peau?: string;
  cheveux?: string;
}) {
  const cy = y - 13;
  const n = -sens; // le côté de la nuque
  return (
    <g>
      {coiffure === "queue" ? (
        <path
          d={`M${x + n * 8} ${cy - 8}Q${x + n * 22} ${cy - 4} ${x + n * 17} ${cy + 16}Q${x + n * 13} ${cy + 6} ${x + n * 6} ${cy + 2}Z`}
          fill={cheveux}
        />
      ) : null}
      {coiffure === "carre" ? (
        <path
          d={`M${x - 14} ${cy + 8}Q${x - 16} ${cy - 15} ${x} ${cy - 14}Q${x + 16} ${cy - 15} ${x + 14} ${cy + 8}Z`}
          fill={cheveux}
        />
      ) : null}
      <rect x={x - 4} y={y - 4} width={8} height={6} fill={OMBRE} />
      <circle cx={x} cy={cy} r={12} fill={peau} />
      {coiffure === "courte" || coiffure === "queue" || coiffure === "chignon" ? (
        <path
          d={`M${x + n * 12.5} ${cy + 4}C${x + n * 14} ${cy - 16} ${x - n * 14} ${cy - 16} ${x - n * 12.5} ${cy - 2}C${x - n * 8} ${cy - 6} ${x - n * 2} ${cy - 6} ${x + n * 4} ${cy - 3}C${x + n * 8} ${cy - 1} ${x + n * 11} ${cy + 1} ${x + n * 12.5} ${cy + 4}Z`}
          fill={cheveux}
        />
      ) : null}
      {coiffure === "carre" ? (
        <path
          d={`M${x - 12} ${cy - 1}C${x - 12} ${cy - 15} ${x + 12} ${cy - 15} ${x + 12} ${cy - 1}C${x + 6} ${cy - 7} ${x - 6} ${cy - 7} ${x - 12} ${cy - 1}Z`}
          fill={cheveux}
        />
      ) : null}
      {coiffure === "chignon" ? (
        <circle cx={x + n * 3} cy={cy - 13} r={5.5} fill={cheveux} />
      ) : null}
      {coiffure === "boucles" ? (
        <g fill={cheveux}>
          <circle cx={x - 8} cy={cy - 7} r={6} />
          <circle cx={x} cy={cy - 10} r={6.5} />
          <circle cx={x + 8} cy={cy - 7} r={6} />
          <circle cx={x + n * 11} cy={cy - 1} r={4.5} />
        </g>
      ) : null}
      {coiffure === "rase" ? (
        <path
          d={`M${x - 12} ${cy - 1}C${x - 12} ${cy - 14} ${x + 12} ${cy - 14} ${x + 12} ${cy - 1}C${x + 7} ${cy - 9} ${x - 7} ${cy - 9} ${x - 12} ${cy - 1}Z`}
          fill={cheveux}
          opacity={0.75}
        />
      ) : null}
    </g>
  );
}

/**
 * Le fond commun des scènes : un mur, un sol, et la nuit en dessous. Ils
 * débordent largement du cadre de 480 : posée en `meet` dans un bandeau plus
 * large que 16:9, la scène se prolonge du même mur et du même sol au lieu de
 * flotter dans un rectangle.
 */
export function Piece({ sol = 196 }: { sol?: number }) {
  return (
    <>
      <rect x={-1000} width={2480} height={270} fill={MARINE.fond} />
      <rect x={-1000} width={2480} height={sol} fill={MARINE.mur} />
      <rect x={-1000} y={sol} width={2480} height={270 - sol} fill={MARINE.sol} />
    </>
  );
}

/** Une ombre portée au sol, sous un meuble ou une personne. */
export function OmbreAuSol({
  x,
  y,
  rx,
  ry = 6,
}: {
  x: number;
  y: number;
  rx: number;
  ry?: number;
}) {
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={MARINE.nuit} opacity={0.6} />;
}
