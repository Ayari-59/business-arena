import { formationProposee } from "../formations";
import { PARCOURS } from "./parcours";

/**
 * LES PARCOURS QU'UNE CLASSE PEUT CHOISIR, SANS LES CHAPITRES (./parcours-de-formation.ts les
 * réexporte, et y garde ce qui lit les chapitres : la liste de chaque parcours de formation, les
 * parcours qui ouvrent un chapitre).
 *
 * Le devis (le diplôme ou le parcours, audit produit du 10 novembre 2026, P1-4) et l'administration
 * lisent ces noms sans charger le registre du cours. La règle des parcours de formation :
 * ./parcours-de-formation.ts.
 */

export interface ParcoursDeFormation {
  /** Le code que la classe enregistre : distinct de tout parcours du registre. */
  code: string;
  /** La formation (config/formations.ts) dont les blocs cités font la liste. */
  formation: string;
  titre: string;
  resume: string;
}

export const PARCOURS_DE_FORMATION: readonly ParcoursDeFormation[] = [
  {
    code: "but-gea",
    formation: "but-gea",
    titre: "BUT GEA · Gestion des entreprises et des administrations",
    resume:
      "Les chapitres qui travaillent une compétence du BUT GEA, d'où qu'ils viennent : la comptabilité, le contrôle de gestion, la paie, la finance et la comptabilité approfondie, sur les chiffres de la simulation du cours.",
  },
  {
    code: "but-tc",
    formation: "but-tc",
    titre: "BUT TC · Techniques de commercialisation",
    resume:
      "Les chapitres qui travaillent une compétence du BUT TC : vendre, piloter un espace de vente, conduire les actions marketing, manager la relation client, sur le marché et la boutique de la simulation du cours.",
  },
  {
    code: "but-gaco",
    formation: "but-gaco",
    titre: "BUT GACO · Gestion administrative et commerciale des organisations",
    resume:
      "Les chapitres qui travaillent une compétence du BUT GACO : le pilotage interne et celui des ressources humaines, la démarche marketing, le développement des affaires, sur les chiffres de la simulation du cours.",
  },
];

export const parcoursDeFormationParCode = (code: string | null | undefined) => PARCOURS_DE_FORMATION.find((p) => p.code === code);

/** La formation où mène un parcours, du registre ou de formation ; null pour un parcours de discipline. */
export function formationDuParcours(code: string | null | undefined): string | null {
  if (!code) return null;
  return PARCOURS.find((p) => p.code === code)?.formation ?? parcoursDeFormationParCode(code)?.formation ?? null;
}

/** Les parcours qu'une classe peut choisir : ceux du registre, puis les parcours de formation. */
export const PARCOURS_A_CHOISIR: readonly { code: string; titre: string; formation: boolean }[] = [
  ...PARCOURS.map((p) => ({ code: p.code as string, titre: p.titre, formation: false })),
  ...PARCOURS_DE_FORMATION.map((p) => ({ code: p.code, titre: `${p.titre} (parcours de formation)`, formation: true })),
];

/** Le titre d'un parcours que la classe a choisi, du registre ou de formation. */
export const titreDuParcours = (code: string | null | undefined) => PARCOURS_A_CHOISIR.find((p) => p.code === code)?.titre;

/** Le code est-il un parcours qu'une classe peut choisir ? */
export const parcoursAChoisir = (code: string | null | undefined): code is string => PARCOURS_A_CHOISIR.some((p) => p.code === code);

/**
 * LES PARCOURS QU'UNE CLASSE PEUT CHOISIR AUJOURD'HUI : sans ceux des formations retirées
 * (config/formations-proposees.ts). Une classe qui en a déjà un le garde : `titreDuParcours` et
 * l'accès aux chapitres lisent la liste entière.
 */
export const PARCOURS_PROPOSES_A_CHOISIR = PARCOURS_A_CHOISIR.filter((p) => {
  const formation = PARCOURS.find((x) => x.code === p.code)?.formation;
  return !formation || formationProposee(formation);
});

/** Le code est-il un parcours qu'une classe peut choisir aujourd'hui ? */
export const parcoursProposeAChoisir = (code: string | null | undefined): code is string =>
  PARCOURS_PROPOSES_A_CHOISIR.some((p) => p.code === code);
