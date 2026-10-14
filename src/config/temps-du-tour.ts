/**
 * LES SIX TEMPS D'UN TOUR, NOMMÉS UNE FOIS.
 *
 * C'est l'enchaînement qui distingue ce produit d'un jeu d'entreprise : on ne
 * décide pas d'abord, on lit une situation, on la diagnostique, on choisit le
 * modèle d'analyse qui convient, ET ENSUITE on décide. Le résultat tombe, le
 * débriefing dit ce qu'il fallait voir.
 *
 * Le guide décrit chacun de ces temps en détail, mais il les découpe autrement
 * — ses cinq étapes numérotées rangent le diagnostic et le choix du modèle
 * dans le même QCM, et glissent les indices entre les deux. C'est juste pour
 * qui apprend à jouer ; ce n'est pas ce qu'il faut dire à qui découvre le
 * produit, qui a besoin de la CHAÎNE, pas du mode d'emploi. D'où ce registre,
 * qui nomme les temps sans renuméroter le guide.
 *
 * Les intitulés ne sont pas inventés pour la vitrine : chacun reprend le
 * vocabulaire que l'arène emploie déjà, et une garde le vérifie
 * (tests/architecture/temps-du-tour.test.ts).
 */

export interface TempsDuTour {
  /** Le mot, celui qu'on lit sur la page. */
  nom: string;
  /** Ce qui se passe à ce moment-là, en une phrase. */
  quoi: string;
}

export const TEMPS_DU_TOUR: readonly TempsDuTour[] = [
  {
    nom: "Situation",
    quoi: "Un problème d'entreprise, jamais un énoncé d'exercice.",
  },
  {
    nom: "Diagnostic",
    quoi: "Les causes plausibles, cochées avant toute décision.",
  },
  {
    nom: "Modèle",
    quoi: "Quel modèle d'analyse mobiliser : un modèle trompeur ne rapporte presque rien.",
  },
  {
    nom: "Décision",
    quoi: "Prix, production, budgets, et ce que le niveau de difficulté ouvre en plus.",
  },
  {
    nom: "Résultat",
    quoi: "Ce que le marché en a fait, jusqu'à la trésorerie nette.",
  },
  {
    nom: "Débriefing",
    quoi: "La correction expliquée, et les fiches notions qui se déverrouillent.",
  },
];
