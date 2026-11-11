/**
 * LE RÉFÉRENTIEL : dix compétences de décision.
 *
 * Une compétence n'est gardée que si les épisodes peuvent l'observer :
 * soit une trace de la partie la mesure directement (les sources consultées,
 * le diagnostic, sa réévaluation, les réflexes, la prévision), soit elle est
 * la compétence principale d'au moins cinq décisions, dans plusieurs épisodes.
 * On observe des décisions, jamais une personne : aucune compétence ne parle de
 * personnalité, de style ou de potentiel.
 *
 * UN MODULE LÉGER, HORS DES ÉPISODES (audit du 10 novembre 2026, P1-1) : le menu du site,
 * composant client, en cite le nombre. Les épisodes eux-mêmes ne partent plus au navigateur
 * (tests/architecture/corriges-hors-du-navigateur.test.ts) ; ce qui ne dit rien d'eux, le nom
 * des compétences et ce qu'elles mesurent, vit donc ici. Ce que chaque décision observe
 * (`ETIQUETTES`) reste avec les épisodes, dans config/episodes/competences.ts.
 */

export type CodeCompetence = "R1" | "R2" | "R3" | "R4" | "R5" | "R6" | "R7" | "R8" | "R9" | "R10";

/** Les traces : ce qu'une partie mesure directement, par une règle écrite. */
export type CodeTrace = "information" | "diagnostic" | "revision" | "reflexes" | "calibrage";

export interface Competence {
  code: CodeCompetence;
  nom: string;
  definition: string;
  /** Ce qu'on voit faire, dans les choix de la partie. */
  comportement: string;
  /** La trace qui la mesure directement, s'il y en a une. */
  trace: CodeTrace | null;
  /** Peut-elle recevoir un score ? Non quand rien ne la mesure assez souvent. */
  score: boolean;
  /** Ce que la mesure ne dit pas, à écrire à côté de chaque score. */
  limite: string;
}

export const COMPETENCES: readonly Competence[] = [
  {
    code: "R1",
    nom: "S'informer avant d'agir",
    definition: "Aller chercher l'information qui explique la situation avant de trancher.",
    comportement:
      "Consulte les sources décisives, évite le bruit, n'attend pas au-delà du raisonnable.",
    trace: "information",
    score: true,
    limite: "Consulter une information n'est pas s'en servir. En Expert, l'accès est limité.",
  },
  {
    code: "R2",
    nom: "Diagnostiquer la cause",
    definition: "Distinguer la cause du symptôme.",
    comportement: "Retient le bon problème principal, traite la cause plutôt que l'effet.",
    trace: "diagnostic",
    score: true,
    limite: "Un diagnostic à quatre choix se devine une fois sur quatre.",
  },
  {
    code: "R3",
    nom: "Réviser son jugement",
    definition: "Changer d'avis quand un fait le contredit, le garder quand il le confirme.",
    comportement: "Corrige un diagnostic faux, maintient un diagnostic juste.",
    trace: "revision",
    score: true,
    limite: "Seul un diagnostic d'abord faux met vraiment la révision à l'épreuve.",
  },
  {
    code: "R4",
    nom: "Éviter la réponse réflexe",
    definition:
      "Ne pas répondre à la pression par le geste attendu : la remise, les heures supplémentaires, la sanction.",
    comportement: "Choisit rarement les options réflexes.",
    trace: "reflexes",
    score: true,
    limite: "Les listes de réflexes sont écrites par les auteurs des épisodes.",
  },
  {
    code: "R5",
    nom: "Arbitrer sous incertitude",
    definition:
      "Choisir entre des options qui ont chacune un coût, en pesant la moyenne et le pire cas.",
    comportement:
      "Choisit l'option de meilleure espérance, ou une option plus sûre à un coût modéré.",
    trace: null,
    score: true,
    limite: "Dépend du calibrage des modèles des épisodes.",
  },
  {
    code: "R6",
    nom: "Anticiper les effets différés",
    definition: "Voir ce qu'une décision déclenche dans trois semaines.",
    comportement:
      "Choisit l'option dont le bénéfice vient plus tard plutôt que le soulagement immédiat.",
    trace: null,
    score: true,
    limite: "Se confond parfois avec l'arbitrage.",
  },
  {
    code: "R7",
    nom: "Calibrer ses prévisions",
    definition: "Estimer juste, et savoir à quel point on est sûr.",
    comportement: "Prévision proche du réel, confiance en rapport avec la justesse.",
    trace: "calibrage",
    score: false,
    limite: "Une seule prévision par partie, sur des échelles différentes : pas encore de score.",
  },
  {
    code: "R8",
    nom: "Préserver la capacité de l'équipe",
    definition: "Retirer du travail plutôt qu'en demander plus, déléguer, protéger la charge.",
    comportement:
      "Évite les heures supplémentaires et la pression, répartit, délègue avec un cadre.",
    trace: null,
    score: true,
    limite: "Proche de l'engagement des personnes dans plusieurs décisions.",
  },
  {
    code: "R9",
    nom: "Engager les personnes",
    definition: "Traiter un cas individuel ou faire adhérer un groupe sans imposer ni céder.",
    comportement: "Reçoit, écoute, confie une mission, associe aux décisions.",
    trace: null,
    score: true,
    limite: "Observée par des choix, pas par la conduite d'un entretien.",
  },
  {
    code: "R10",
    nom: "Piloter par les faits, et les dire",
    definition: "Mesurer ce qui compte et dire tôt ce que les chiffres montrent.",
    comportement: "Choisit le bon indicateur, refuse de maquiller, annonce le dépassement.",
    trace: null,
    score: true,
    limite: "Regroupe deux idées, mesurer et communiquer, qui pourraient diverger.",
  },
];

export const competenceParCode = (code: CodeCompetence): Competence =>
  COMPETENCES.find((c) => c.code === code)!;
