import type {
  DecisionField,
  QuizQuestionDef,
  SituationDef,
} from "./scenarios/situation-kit";

/**
 * LES QUESTIONS D'ANALYSE SUIVENT LE NIVEAU : D'ABORD UN CHOIX ENTRE DEUX.
 *
 * Le diagnostic et le choix du modèle posaient les mêmes questions à tous les
 * niveaux : quatre cases dont deux justes, quatre modèles dont un seul bon,
 * que l'élève découvre le jeu ou le pratique depuis six parties. Un débutant
 * devait distinguer un « seuil de rentabilité » d'une « décomposition des
 * écarts » sans savoir ce que chacun veut dire.
 *
 * Trois profondeurs, d'après le niveau de la partie :
 *
 *  · INTUITION (niveaux 1-2) — des CHOIX ENTRE DEUX, le plus court possible.
 *    Le diagnostic oppose une cause juste à une cause fausse ; le choix du
 *    modèle oppose le bon modèle à un modèle étranger au problème, chacun avec
 *    sa phrase d'objectif ; et, quand la situation désigne un levier, une
 *    question de sens : « augmenter ou diminuer le prix ? ». Trois touches, et
 *    l'on joue : c'est le geste que le joueur refera ensuite, dans la décision.
 *  · DÉCOUVERTE (niveau 3) — un cran plus loin : trois causes dont une seule
 *    juste, trois modèles dont les plus étrangers d'abord, chacun avec sa
 *    phrase d'objectif.
 *  · STANDARD (niveaux 4 à 6) — ce que jouaient tous les niveaux : quatre
 *    causes, quatre modèles, sans phrase d'aide, le piège plausible en tête.
 *
 * Aucune situation n'est réécrite : tout se tire des options, de la matrice de
 * pertinence et des leviers que chaque situation porte déjà.
 *
 * CE QUI N'EST PAS FAIT, ET POURQUOI : durcir les niveaux 5-6. Sur les 137
 * situations, 128 n'ont que trois mauvais modèles à proposer au total ; un
 * cinquième choix, ou une cause plausible mais fausse, ne se tire d'aucune
 * donnée existante : il faut l'écrire, situation par situation.
 */

export type ProfondeurDAnalyse = "intuition" | "decouverte" | "standard";

/**
 * Le niveau qu'on suppose quand on ne connaît pas la partie : le plus haut
 * palier, c'est-à-dire toutes les options, jamais une version abrégée.
 */
export const NIVEAU_STANDARD = 4;

export function profondeurDAnalyse(niveau: number): ProfondeurDAnalyse {
  if (niveau <= 2) return "intuition";
  if (niveau === 3) return "decouverte";
  return "standard";
}

/** Combien de mauvaises réponses accompagnent le bon modèle : un, deux ou trois. */
export function distracteursDuModele(niveau: number): number {
  const p = profondeurDAnalyse(niveau);
  return p === "intuition" ? 1 : p === "decouverte" ? 2 : 3;
}

/** Jusqu'au niveau 3, chaque modèle dit à quoi il sert. */
export function modeleAvecAide(niveau: number): boolean {
  return profondeurDAnalyse(niveau) !== "standard";
}

/** Un choix entre deux se coche d'un seul geste : une seule réponse, pas des cases. */
export function diagnosticAChoixUnique(niveau: number): boolean {
  return profondeurDAnalyse(niveau) === "intuition";
}

/**
 * Les causes proposées pour ce niveau.
 *
 * Intuition : une cause juste et une fausse. Découverte : une juste et deux
 * fausses. Dans l'ordre d'écriture de la situation. Une situation qui n'a pas
 * assez de fausses (une seule, par exemple) garde toutes ses options plutôt que
 * de poser une question qui n'en est plus une.
 *
 * LE SCORE SE CALCULE SUR CES MÊMES OPTIONS, et c'est ce qui rend le tri sûr :
 * une cause juste qu'on n'a pas proposée ne peut pas être « manquée ». Toute
 * lecture ou notation du diagnostic passe par ici.
 */
export function optionsDuDiagnostic<T extends { id: string; correct: boolean }>(
  options: readonly T[],
  niveau: number,
): T[] {
  const p = profondeurDAnalyse(niveau);
  if (p === "standard") return [...options];
  const nbFausses = p === "intuition" ? 1 : 2;
  const juste = options.find((o) => o.correct);
  const fausses = options.filter((o) => !o.correct).slice(0, nbFausses);
  if (!juste || fausses.length < nbFausses) return [...options];
  // L'ordre d'écriture est conservé : les options n'ont jamais été mélangées.
  const gardees = new Set([juste.id, ...fausses.map((o) => o.id)]);
  return options.filter((o) => gardees.has(o.id));
}

// ---------------------------------------------------------------------------
// La question du levier : « augmenter ou diminuer ? »
// ---------------------------------------------------------------------------

/** Comment on dit chaque levier, à l'infinitif et au complément : « du prix de vente ». */
const LEVIERS: Record<DecisionField, { objet: string; de: string }> = {
  price: { objet: "le prix de vente", de: "du prix de vente" },
  productionPlan: { objet: "la production", de: "de la production" },
  marketingBudget: { objet: "le budget marketing", de: "du budget marketing" },
  qualityBudget: { objet: "le budget qualité", de: "du budget qualité" },
  maintenanceBudget: { objet: "le budget maintenance", de: "du budget maintenance" },
};

/** Le préfixe des identifiants de ces questions : le panneau s'en sert pour les reconnaître. */
export const PREFIXE_QUESTION_LEVIER = "levier_";

/**
 * « Que faites-vous du prix ? — Augmenter / Diminuer ». Un choix entre deux, tiré
 * du premier levier de la situation qui a un sens (hausse ou baisse) : « revoir »
 * n'est pas une réponse binaire, et une situation qui n'a que des leviers à
 * revoir ne pose pas cette question (54 situations sur 137).
 *
 * La correction est la phrase d'explication que le levier porte déjà.
 */
export function questionDuLevier(def: SituationDef, niveau: number): QuizQuestionDef | null {
  if (profondeurDAnalyse(niveau) !== "intuition") return null;
  const levier = (def.decisionLevers ?? []).find((l) => l.direction !== "review");
  if (!levier) return null;
  const dit = LEVIERS[levier.field];
  return {
    id: `${PREFIXE_QUESTION_LEVIER}${levier.field}`,
    prompt: `Pour répondre à cette situation, que faites-vous ${dit.de} ?`,
    options: [
      { id: "up", label: `Augmenter ${dit.objet}` },
      { id: "down", label: `Diminuer ${dit.objet}` },
    ],
    correctOptionId: levier.direction,
    explain: levier.hint,
  };
}
