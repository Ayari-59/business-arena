import { blocOfficielDans, referentielDeCitation } from "../ateliers/referentiels";
import { CHAPITRES } from "./registre";
import { PARCOURS_DE_FORMATION } from "./parcours-a-choisir";
import type { Chapitre } from "./types";

// Les parcours qu'une classe peut choisir, sans les chapitres : ./parcours-a-choisir.ts.
export {
  PARCOURS_A_CHOISIR,
  PARCOURS_DE_FORMATION,
  PARCOURS_PROPOSES_A_CHOISIR,
  parcoursAChoisir,
  parcoursDeFormationParCode,
  parcoursProposeAChoisir,
  titreDuParcours,
  type ParcoursDeFormation,
} from "./parcours-a-choisir";

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
