/**
 * LES SURFACES DE LECTURE : CE QUI SE POSE SUR LE COCKPIT EN PAPIER (LOT 6A).
 *
 * Décision du propriétaire : l'écran de jeu bascule sur le marine profond — un
 * COCKPIT —, mais les zones de LECTURE restent claires, posées comme des
 * documents sur le bureau. « Pas 100 % sombre ni 100 % papier » : du contraste.
 * Les deux sols doivent se voir ENSEMBLE dans chaque fenêtre.
 *
 * LE CRITÈRE, écrit une fois : un bloc dont le contenu est D'ABORD DE LA PROSE
 * (plus de trois lignes de texte suivi — un courrier, une situation, un texte
 * pédagogique) est un DOCUMENT → papier. Un bloc de chiffres, de champs, de
 * leviers, de barres ou de lignes de classement est le COCKPIT → marine.
 *
 * Ce module est la liste explicite que le lot 6A exige, et une GARDE l'énumère
 * (`tests/architecture/surfaces-de-lecture.test.ts`). Le papier posé dans le
 * cockpit reprend la matière de `.papier` (globals.css) : UNE matière de
 * document, blanc, encre `#0e1a2b`, filet `#dbe2ee`, ombre courte, en-tête
 * marine — pas deux. Les composants marqués `papier` s'écrivent donc en jetons
 * `--encre`/`--papier`, jamais en `text-slate-*` (que l'inversion du thème
 * clair sous `.ardoise` retournerait en clair-sur-blanc, illisible).
 */

export type RoleDeSurface = "papier" | "cockpit";

export interface SurfaceDeLecture {
  /** Clé stable, pour la garde et les renvois. */
  readonly cle: string;
  /** Le rôle : document de lecture (papier) ou surface de pilotage (cockpit). */
  readonly role: RoleDeSurface;
  /** Le composant ou le bloc qui la porte (chemin relatif à `src/`). */
  readonly porte: string;
  /** Pourquoi ce rôle, au regard du critère prose/chiffres. */
  readonly raison: string;
}

/**
 * LES DOCUMENTS — PAPIER. De la prose d'abord : on les lit, on ne les pilote
 * pas. Le courrier est déjà un OBJET `.papier` aux couleurs écrites en dur
 * (gardé tel quel) ; les autres reprennent sa matière via la classe `.papier`.
 */
export const SURFACES_PAPIER: readonly SurfaceDeLecture[] = [
  {
    cle: "courrier-du-tour",
    role: "papier",
    porte: "components/courrier-du-tour.tsx",
    raison:
      "La lettre du tour est déjà un objet `.papier` (couleurs en dur) ; elle fixe la matière de référence.",
  },
  {
    cle: "situation-du-tour",
    role: "papier",
    porte: "components/situation-panel.tsx:SituationCard",
    raison: "La situation du tour est une mise en scène narrative — de la prose avant tout.",
  },
  {
    cle: "analyse-du-tour",
    role: "papier",
    porte: "components/situation-panel.tsx:AnalyseDuTour",
    raison: "L'analyse rendue par l'équipe est un texte suivi, posé pour la lecture et le débrief.",
  },
  {
    cle: "debrief-de-la-situation",
    role: "papier",
    porte: "components/situation-panel.tsx:SituationDebrief",
    raison: "Le débrief pédagogique explique le tour en prose : un document, pas un tableau.",
  },
  {
    cle: "note-du-tour-precedent",
    role: "papier",
    porte: "app/arena/[gameId]/page.tsx (note du tour précédent)",
    raison: "La note rappelle en toutes lettres ce qui s'est joué au tour d'avant.",
  },
  {
    cle: "mandat-de-lequipe",
    role: "papier",
    porte: "components/mandat-de-lequipe.tsx",
    raison: "Le mandat est la lettre de mission de l'équipe : un texte de cadrage.",
  },
  {
    cle: "aides-longues",
    role: "papier",
    porte: "components/repliable.tsx (aides repliables longues)",
    raison: "Une aide dépliée de plusieurs lignes est un texte d'accompagnement à lire.",
  },
  {
    cle: "textes-du-bilan",
    role: "papier",
    porte: "components/bilan-de-partie.tsx (textes)",
    raison:
      "Les textes du bilan de partie (axes, constats, leçons) sont de la prose d'enseignement.",
  },
] as const;

/**
 * LE COCKPIT — MARINE PROFOND. Des chiffres, des champs, des leviers, des
 * barres, des lignes de classement : on les pilote, on ne les lit pas comme un
 * texte. Ils prennent l'ardoise (jetons sombres) et le relief du lot 6A.
 */
export const SURFACES_COCKPIT: readonly SurfaceDeLecture[] = [
  {
    cle: "ardoise-des-chiffres",
    role: "cockpit",
    porte: "components/ardoise-repliee.tsx",
    raison: "Les quatre chiffres clés du tour : le tableau de bord, pas un texte.",
  },
  {
    cle: "feuille-de-decision",
    role: "cockpit",
    porte: "components/decision-form.tsx",
    raison: "Champs, leviers, budgets, résultat estimé : la feuille de pilotage.",
  },
  {
    cle: "bande-de-marche",
    role: "cockpit",
    porte: "components/bande-de-marche.tsx",
    raison: "Quatre à six faits chiffrés du tour avec leur écart : tabulaire, dense.",
  },
  {
    cle: "classement-des-equipes",
    role: "cockpit",
    porte: "components/classement.tsx",
    raison: "Des lignes de classement, des barres de comparaison : des chiffres.",
  },
  {
    cle: "tableau-de-bord-du-tour-clos",
    role: "cockpit",
    porte: "app/arena/[gameId]/page.tsx (tour clos)",
    raison: "Le compte du tour, ses jauges et ses courbes : du pilotage.",
  },
] as const;

export const SURFACES_DE_LECTURE: readonly SurfaceDeLecture[] = [
  ...SURFACES_PAPIER,
  ...SURFACES_COCKPIT,
];

export function estPapier(cle: string): boolean {
  return SURFACES_PAPIER.some((s) => s.cle === cle);
}

export function estCockpit(cle: string): boolean {
  return SURFACES_COCKPIT.some((s) => s.cle === cle);
}
