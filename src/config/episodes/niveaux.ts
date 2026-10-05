/**
 * LES NIVEAUX DE DIFFICULTÉ D'UN ÉPISODE.
 *
 * Un niveau change ce que le manager sait et voit, jamais le trimestre
 * lui-même : le modèle, le hasard et le jugement du bilan sont les mêmes à
 * tous les niveaux. Une décision bonne en Découverte l'est en Expert, et les
 * scores restent comparables d'un niveau à l'autre ; on note seulement le
 * niveau joué.
 *
 * Les leviers sont communs aux trente épisodes :
 *   · le temps d'enquête de la première décision ;
 *   · le conseil d'un proche (les sources de nature « aide ») ;
 *   · le nombre de vérifications aux décisions suivantes ;
 *   · le retour immédiat : ce qu'un choix a changé par rapport à ne rien changer ;
 *   · les imprévus, signalés comme tels ou mêlés au reste ;
 *   · des repères de méthode à chaque temps de la décision.
 */
import type { Episode, Etape, Source } from "./types";

export type CodeNiveau = "decouverte" | "standard" | "expert";

export type TempsDeDecision = "signal" | "enquete" | "diagnostic" | "reevaluation" | "decision";

export interface Niveau {
  code: CodeNiveau;
  nom: string;
  /** Une phrase pour le choix du niveau. */
  resume: string;
  /** Ce qui change par rapport au niveau Standard, pour le choix du niveau. */
  details: readonly string[];
  /**
   * Le temps d'enquête de la première décision : `null` garde celui de
   * l'épisode ; sinon, ce qu'on accorde au-delà des jours sans perte.
   */
  joursAuDelaDuGratuit: number | null;
  /** Le conseil d'un proche est-il proposé ? */
  conseil: boolean;
  /** Le nombre de vérifications permises à partir de la deuxième décision ; `null` : toutes. */
  verificationsParDecision: number | null;
  /** Montrer, après chaque décision, ce qu'elle a changé par rapport à ne rien changer. */
  retourImmediat: boolean;
  /** Signaler les imprévus comme tels, à part des suites de vos décisions. */
  imprevusSignales: boolean;
  /** Afficher un repère de méthode à chaque temps de la décision. */
  reperes: boolean;
}

export const NIVEAUX: readonly Niveau[] = [
  {
    code: "decouverte",
    nom: "Découverte",
    resume:
      "Pour un premier épisode : des repères de méthode, et l'effet de chaque choix tout de suite.",
    details: [
      "Un repère de méthode à chaque étape de la décision",
      "Après chaque décision, ce qu'elle a changé par rapport à ne rien changer",
    ],
    joursAuDelaDuGratuit: null,
    conseil: true,
    verificationsParDecision: null,
    retourImmediat: true,
    imprevusSignales: true,
    reperes: true,
  },
  {
    code: "standard",
    nom: "Standard",
    resume:
      "L'épisode tel qu'il est conçu : à vous de chercher l'information et de lire les signaux.",
    details: [
      "Cinq jours pour enquêter avant la première décision",
      "Le conseil d'un proche, et toutes les vérifications ensuite",
      "Les imprévus signalés à part de vos décisions",
    ],
    joursAuDelaDuGratuit: null,
    conseil: true,
    verificationsParDecision: null,
    retourImmediat: false,
    imprevusSignales: true,
    reperes: false,
  },
  {
    code: "expert",
    nom: "Expert",
    resume: "Comme au bureau un mauvais mois : peu de temps, personne à qui demander, et du bruit.",
    details: [
      "Une demi-journée d'enquête seulement au-delà de ce qui est sans perte",
      "Pas de conseil, et une seule vérification par décision ensuite",
      "Les imprévus mêlés au reste : à vous de séparer la chance de vos choix",
    ],
    joursAuDelaDuGratuit: 0.5,
    conseil: false,
    verificationsParDecision: 1,
    retourImmediat: false,
    imprevusSignales: false,
    reperes: false,
  },
];

export const NIVEAU_PAR_DEFAUT: CodeNiveau = "standard";

export const niveauParCode = (code: string | null | undefined): Niveau =>
  NIVEAUX.find((n) => n.code === code) ?? NIVEAUX.find((n) => n.code === NIVEAU_PAR_DEFAUT)!;

/** Le temps d'enquête de la première décision, à ce niveau ; jamais plus que celui de l'épisode. */
export function budgetDEnquete(
  niveau: Niveau,
  ep: Pick<Episode, "enquete">,
  etape: Pick<Etape, "budget">,
): number | undefined {
  if (etape.budget == null || niveau.joursAuDelaDuGratuit == null) return etape.budget;
  return Math.min(etape.budget, ep.enquete.joursSansPerte + niveau.joursAuDelaDuGratuit);
}

/** Les sources qu'on propose à ce niveau : sans le conseil d'un proche quand il n'y en a pas. */
export const sourcesProposees = (
  niveau: Niveau,
  etape: Pick<Etape, "sources">,
): readonly Source[] =>
  niveau.conseil ? etape.sources : etape.sources.filter((s) => s.nature !== "aide");

/**
 * Peut-on encore vérifier quelque chose à cette décision ? La première se
 * règle par le temps d'enquête ; les suivantes, par le nombre de vérifications.
 */
export function verificationPossible(niveau: Niveau, decision: number, dejaVues: number): boolean {
  if (decision === 0 || niveau.verificationsParDecision == null) return true;
  return dejaVues < niveau.verificationsParDecision;
}

/** Les repères de méthode du niveau Découverte : génériques, ils ne trahissent aucune réponse. */
export const REPERES: Record<TempsDeDecision, string> = {
  signal:
    "Repérez ce qui a vraiment changé, et qui le dit. Une alerte bruyante n'est pas forcément la plus grave.",
  enquete:
    "Une vérification qui explique les chiffres vaut mieux que trois qui les confirment. Au-delà des jours sans perte, l'attente coûte.",
  diagnostic:
    "Le problème principal est celui qui, une fois réglé, fait le plus bouger le résultat, pas le plus visible.",
  reevaluation:
    "Changer d'avis devant un fait nouveau n'est pas une faiblesse. Le garder parce qu'il est confirmé non plus.",
  decision:
    "Méfiez-vous de l'option qui soulage tout de suite : demandez-vous ce qu'elle coûtera dans trois semaines, et dans le pire des cas.",
};
