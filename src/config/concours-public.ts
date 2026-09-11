/**
 * Page publique d'annonce d'un concours (/concours/[code]).
 *
 * L'organisateur ne choisit pas une couleur libre mais une teinte dans une
 * palette curatée : la page reste sur l'identité « Nuit & Laiton » du site et
 * on n'injecte jamais une valeur CSS arbitraire venue d'un formulaire. Chaque
 * accent est un hex qui tient sur le fond nuit (contraste vérifié) et sert au
 * titre, aux bordures et au bouton d'inscription, y compris sur l'image de
 * partage (Open Graph).
 */

export interface AccentConcours {
  cle: string;
  nom: string;
  /** Teinte vive, pour un titre ou un bouton sur fond sombre. */
  vif: string;
  /** Teinte plus douce, pour un texte d'accent sur fond sombre. */
  doux: string;
}

export const ACCENTS_CONCOURS: AccentConcours[] = [
  { cle: "laiton", nom: "Laiton", vif: "#f59e0b", doux: "#fcd34d" },
  { cle: "emeraude", nom: "Émeraude", vif: "#10b981", doux: "#6ee7b7" },
  { cle: "azur", nom: "Azur", vif: "#3b82f6", doux: "#93c5fd" },
  { cle: "rubis", nom: "Rubis", vif: "#f43f5e", doux: "#fda4af" },
  { cle: "violet", nom: "Améthyste", vif: "#a855f7", doux: "#d8b4fe" },
];

export const ACCENT_PAR_DEFAUT = "laiton";

/** L'accent choisi, ou le laiton par défaut si la clé est inconnue ou nulle. */
export function accentConcours(cle: string | null | undefined): AccentConcours {
  return ACCENTS_CONCOURS.find((a) => a.cle === cle) ?? ACCENTS_CONCOURS[0]!;
}

/** Bornes de saisie des champs libres de la page publique. */
export const TAGLINE_MAX = 120;
export const DESCRIPTION_MAX = 2000;
export const ORGANIZER_LABEL_MAX = 80;
