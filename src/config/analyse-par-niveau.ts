/**
 * LES QUESTIONS D'ANALYSE SONT PLUS SIMPLES AUX PREMIERS NIVEAUX.
 *
 * Le diagnostic et le choix du modèle posaient les mêmes questions à tous les
 * niveaux : quatre cases dont deux justes, quatre modèles dont un seul bon,
 * que l'élève découvre le jeu ou le pratique depuis six parties. Seule la
 * pénalité des indices variait. Un débutant devait donc distinguer un
 * « seuil de rentabilité » d'une « décomposition des écarts » sans savoir ce
 * que chacun veut dire.
 *
 * Deux profondeurs, d'après le niveau de la partie :
 *
 *  · DÉCOUVERTE (niveaux 1-2) — des questions plus courtes et plus faciles. Le
 *    diagnostic propose trois causes, dont une seule juste ; le choix du
 *    modèle propose trois modèles, les plus étrangers au problème d'abord, et
 *    chacun porte sa phrase d'objectif (« Savoir combien il faut vendre pour
 *    ne plus perdre d'argent ») : on reconnaît l'outil à ce qu'il sert, pas à
 *    son nom.
 *  · STANDARD (niveaux 3 à 6) — ce que jouaient tous les niveaux : quatre
 *    causes, quatre modèles, sans phrase d'aide, le piège plausible en tête.
 *
 * Aucune situation n'est réécrite : tout se tire des options et de la matrice
 * de pertinence que chaque situation porte déjà.
 *
 * CE QUI N'EST PAS FAIT, ET POURQUOI : durcir les niveaux 5-6. Sur les 137
 * situations, 128 n'ont que trois mauvais modèles à proposer au total ; un
 * cinquième choix, ou une cause plausible mais fausse, ne se tire d'aucune
 * donnée existante : il faut l'écrire, situation par situation.
 */

export type ProfondeurDAnalyse = "decouverte" | "standard";

/** Le niveau qu'on suppose quand on ne connaît pas la partie : celui d'avant, quatre cases. */
export const NIVEAU_STANDARD = 3;

export function profondeurDAnalyse(niveau: number): ProfondeurDAnalyse {
  return niveau <= 2 ? "decouverte" : "standard";
}

/** Combien de mauvaises réponses accompagnent le bon modèle. */
export function distracteursDuModele(niveau: number): number {
  return profondeurDAnalyse(niveau) === "decouverte" ? 2 : 3;
}

/** Au niveau Découverte, chaque modèle dit à quoi il sert. */
export function modeleAvecAide(niveau: number): boolean {
  return profondeurDAnalyse(niveau) === "decouverte";
}

/**
 * Les causes proposées pour ce niveau.
 *
 * Découverte : une cause juste et deux fausses, dans l'ordre d'écriture de la
 * situation. Une situation qui n'en a pas assez (une seule fausse, par
 * exemple) garde toutes ses options plutôt que de poser une question qui n'en
 * est plus une.
 *
 * LE SCORE SE CALCULE SUR CES MÊMES OPTIONS, et c'est ce qui rend le tri sûr :
 * une cause juste qu'on n'a pas proposée ne peut pas être « manquée ». Toute
 * lecture ou notation du diagnostic passe par ici.
 */
export function optionsDuDiagnostic<T extends { id: string; correct: boolean }>(
  options: readonly T[],
  niveau: number,
): T[] {
  if (profondeurDAnalyse(niveau) !== "decouverte") return [...options];
  const juste = options.find((o) => o.correct);
  const fausses = options.filter((o) => !o.correct).slice(0, 2);
  if (!juste || fausses.length < 2) return [...options];
  // L'ordre d'écriture est conservé : les options n'ont jamais été mélangées.
  const gardees = new Set([juste.id, ...fausses.map((o) => o.id)]);
  return options.filter((o) => gardees.has(o.id));
}
