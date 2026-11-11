import { referentielDeCitation } from "../ateliers/referentiels";
import { blocsDuChapitre } from "../couverture";
import { formationParCode } from "../formations";
import { formationDuParcours } from "./parcours-a-choisir";
import type { Chapitre } from "./types";

/**
 * LES COMPÉTENCES QU'UN CHAPITRE ANNONCE : CELLES DU DIPLÔME D'OÙ L'ON VIENT (demande du propriétaire,
 * novembre 2026).
 *
 * « Quand je demande un cours de DCG ou de BTS, je ne voudrais voir que les compétences liées à ce
 * cours, pas tous les référentiels que le cours puisse toucher. » Un chapitre de comptabilité
 * approfondie cite le DCG, le BUT GEA et deux processus du BTS CG ; sa page les annonçait tous sous
 * « Compétences du référentiel », et l'étudiant de DCG lisait ceux d'un BTS qu'il ne prépare pas.
 *
 * LA PAGE CONNAÎT LE DIPLÔME AINSI, DANS CET ORDRE (règle du propriétaire) :
 *   1. l'élève d'une classe : la formation où mène le parcours de sa classe (registre.ts, champ
 *      `formation`, ou un parcours de formation, parcours-de-formation.ts) ;
 *   2. l'adresse, `?diplome=<code>` : les liens de /cours?diplome= et de /parcours/<formation> le
 *      portent, et les liens du chapitre le gardent ;
 *   3. sinon, le chapitre lui-même : la formation de son parcours, et pour un parcours de discipline
 *      (la comptabilité générale, le contrôle de gestion), qui n'en suit aucune, le référentiel du
 *      premier bloc qu'il cite. C'est le cas du lien direct et du moteur de recherche.
 *
 * Une source ne compte que si le chapitre cite au moins un bloc de sa formation : une classe de BTS MCO
 * qui ouvre un chapitre sans bloc du BTS MCO (sous Campus, tout est ouvert), ou une adresse qui nomme un
 * diplôme inconnu, passe la main à la suivante plutôt que d'afficher une liste vide.
 *
 * CE QUI S'AFFICHE : les seules entrées officielles de ce diplôme (config/couverture.ts,
 * `blocsDuChapitre`), sous un titre qui le nomme, « Compétences du référentiel · DCG ». Les entrées
 * officielles ne portent pas le préfixe du diplôme (« UE10 · Comptabilité approfondie ») : le titre
 * le dit pour elles.
 *
 * La décision se prend au serveur (app/cours/[chapitre]/page.tsx) : le guide ne reçoit que les blocs à
 * afficher (pedagogy/cours/chapitre-servi.ts).
 */

/** D'où la page tient le diplôme : la classe de l'élève, l'adresse, ou le chapitre lui-même. */
export type SourceDuDiplome = "classe" | "adresse" | "chapitre";

export interface CompetencesAffichees {
  /** Le code de la formation retenue (config/formations.ts) ; null si le chapitre ne cite aucun bloc. */
  formation: string | null;
  /** Le titre de la section : « Compétences du référentiel · DCG ». */
  libelle: string;
  /** Les entrées officielles du référentiel de cette formation que le chapitre fait travailler. */
  blocs: string[];
  source: SourceDuDiplome | null;
}

export interface ContexteDuChapitre {
  /** Le parcours de la classe de l'élève (`cours_classes.parcours`) ; absent hors d'une classe. */
  classe?: string | null;
  /** Le diplôme demandé par l'adresse (`?diplome=`), tel quel. */
  demande?: string | null;
}

const TITRE = "Compétences du référentiel";

/** La formation où mène un parcours (sa définition, sans les chapitres : ./parcours-a-choisir.ts). */
export { formationDuParcours };

/** Le diplôme demandé par l'adresse, s'il en est un : une formation du registre, sinon null. */
export function diplomeDeLAdresse(demande: unknown): string | null {
  return typeof demande === "string" && formationParCode(demande) ? demande : null;
}

export function competencesAffichees(
  chapitre: Pick<Chapitre, "blocs" | "parcours">,
  { classe, demande }: ContexteDuChapitre = {},
): CompetencesAffichees {
  const premierCite = chapitre.blocs.map((b) => referentielDeCitation(b)?.code).find((f) => f && blocsDuChapitre(chapitre, f).length > 0);
  const candidats: [SourceDuDiplome, string | null | undefined][] = [
    ["classe", formationDuParcours(classe)],
    ["adresse", diplomeDeLAdresse(demande)],
    ["chapitre", formationDuParcours(chapitre.parcours)],
    ["chapitre", premierCite],
  ];
  for (const [source, formation] of candidats) {
    if (!formation) continue;
    const blocs = blocsDuChapitre(chapitre, formation);
    if (blocs.length === 0) continue;
    const sigle = formationParCode(formation)?.sigle ?? formation;
    return { formation, libelle: `${TITRE} · ${sigle}`, blocs, source };
  }
  return { formation: null, libelle: TITRE, blocs: [], source: null };
}
