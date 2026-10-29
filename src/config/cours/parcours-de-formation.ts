import { blocOfficielDans, referentielDeCitation } from "../ateliers/referentiels";
import { CHAPITRES, PARCOURS } from "./registre";
import type { Chapitre } from "./types";

/**
 * LES PARCOURS DE FORMATION : UNE FORMATION QUI REGROUPE DES CHAPITRES EXISTANTS.
 *
 * Un chapitre n'a qu'un champ `parcours`, celui de sa discipline ou de la formation qui l'a fait
 * écrire (registre.ts). Le BUT n'en avait donc aucun : ses chapitres sont ceux de la comptabilité,
 * du contrôle de gestion, du point de vente ou de la relation client, écrits pour d'autres
 * parcours, et la classe d'un IUT ne pouvait choisir qu'un seul de ces parcours, qui ne lui ouvrait
 * qu'une part de son programme.
 *
 * UN PARCOURS DE FORMATION NE DUPLIQUE AUCUN CHAPITRE. Il les regroupe, et sa liste ne s'écrit pas :
 * elle se lit dans les blocs que les chapitres citent déjà (« BUT GEA · Concevoir des outils de
 * contrôle de gestion »), sur la règle de la couverture (config/couverture.ts, `blocsDuChapitre`) :
 * le préfixe nomme la formation, et le bloc doit désigner une entrée de son référentiel. Un chapitre
 * qui cite demain un bloc du BUT entre tout seul dans son parcours.
 *
 * LE CHAMP `parcours` NE CHANGE PAS. Une classe choisit un code de parcours (`cours_classes.parcours`,
 * offre Classe ou Programme) ; ce code peut désormais être celui d'un parcours de formation, et la
 * règle d'accès (services/cours.service.ts, `coursOuvert` ; services/chapitres-de-la-classe.ts)
 * ouvre un chapitre à la classe dont le parcours est le sien, ou un parcours de formation qui le
 * regroupe. Un cas dédié s'ouvre avec le chapitre qu'il reprend.
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

/** Le chapitre cite au moins un bloc de la formation, qui désigne une entrée de son référentiel. */
export function citeLaFormation(chapitre: Pick<Chapitre, "blocs">, formation: string): boolean {
  return chapitre.blocs.some((bloc) => {
    const cite = referentielDeCitation(bloc);
    return cite !== null && cite.code === formation && blocOfficielDans(bloc, cite.referentiel) !== null;
  });
}

/** Les codes des chapitres de chaque parcours de formation, dans l'ordre du registre. */
export const CHAPITRES_DES_PARCOURS_DE_FORMATION: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  PARCOURS_DE_FORMATION.map((p) => [p.code, CHAPITRES.filter((c) => citeLaFormation(c, p.formation)).map((c) => c.code)]),
);

export const parcoursDeFormationParCode = (code: string | null | undefined) => PARCOURS_DE_FORMATION.find((p) => p.code === code);

/** Les chapitres d'un parcours de formation, rangés par palier. */
export function chapitresDuParcoursDeFormation(code: string): Chapitre[] {
  const codes = new Set(CHAPITRES_DES_PARCOURS_DE_FORMATION[code] ?? []);
  return CHAPITRES.filter((c) => codes.has(c.code)).sort((a, b) => a.palier - b.palier);
}

/** Ce qu'il faut savoir d'un chapitre, ou d'un cas, pour dire quels parcours l'ouvrent. */
export type OuvrablePar = Pick<Chapitre, "parcours"> & { code?: string; reprend?: readonly string[] };

/**
 * LES PARCOURS QUI OUVRENT UN CHAPITRE : le sien, et chaque parcours de formation qui le regroupe.
 * Un cas dédié (une situation) s'ouvre avec les chapitres qu'il reprend.
 */
export function parcoursQuiOuvrent(chapitre: OuvrablePar): string[] {
  const codes = [chapitre.code, ...(chapitre.reprend ?? [])].filter((x): x is string => Boolean(x));
  const formations = PARCOURS_DE_FORMATION.filter((p) => codes.some((c) => CHAPITRES_DES_PARCOURS_DE_FORMATION[p.code]!.includes(c))).map((p) => p.code);
  return [chapitre.parcours, ...formations];
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
