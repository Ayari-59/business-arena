/**
 * LES TEMPS DU TOUR, CHACUN SA COULEUR.
 *
 * Sur téléphone, le tour est une suite d'écrans : résultats du tour passé, briefing,
 * analyse, courrier, décisions. Sans repère, on ne sait plus à quel temps on est — le
 * même fond, la même barre, les mêmes cartes. Chaque temps a donc un nom et une teinte,
 * repris à trois endroits : le segment de la barre du haut, le sous-titre de la partie,
 * et l'amorce de la carte. Les classes sont écrites en toutes lettres : Tailwind ne
 * sait pas lire une classe fabriquée par morceaux.
 */
export type PhaseDuTour = "resultats" | "briefing" | "analyse" | "courrier" | "decision";

export interface TeinteDePhase {
  libelle: string;
  /** Le texte (amorce de carte, sous-titre). */
  texte: string;
  /** Le fond plein (segment de la barre, point). */
  fond: string;
  /** Le fond teinté, discret : la pastille qui porte le nom du temps. */
  teinte: string;
}

export const PHASES: Record<PhaseDuTour, TeinteDePhase> = {
  resultats: { libelle: "Résultats", texte: "text-emerald-300", fond: "bg-emerald-400", teinte: "bg-emerald-400/15" },
  briefing: { libelle: "Briefing", texte: "text-sky-300", fond: "bg-sky-400", teinte: "bg-sky-400/15" },
  analyse: { libelle: "Analyse", texte: "text-violet-300", fond: "bg-violet-400", teinte: "bg-violet-400/15" },
  courrier: { libelle: "Courrier", texte: "text-teal-300", fond: "bg-teal-400", teinte: "bg-teal-400/15" },
  decision: { libelle: "Décision", texte: "text-amber-300", fond: "bg-amber-400", teinte: "bg-amber-400/15" },
};
