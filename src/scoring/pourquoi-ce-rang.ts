/**
 * POURQUOI CE RANG (séance d'essai, P1-6 ; décision du propriétaire : on garde
 * les poids de l'IPG et on l'explique, d'abord).
 *
 * À l'essai, une équipe en perte de 78 850 € montait sur le podium, et la
 * gagnante n'avait changé que son prix : la classe ne pouvait pas comprendre
 * le classement sans le professeur. Le mur dit donc, sous chaque équipe, les
 * deux composantes de l'IPG qui ont le plus pesé sur SON rang : celles où son
 * score, pondéré par le poids de la composante, s'écarte le plus de la
 * moyenne de la classe. Une composante où toutes les équipes se valent ne
 * départage personne, même si son poids est lourd : elle n'explique aucun rang.
 *
 * Module pur : il lit les moyennes par composante que le classement garde
 * (`detail.dimensions`, `services/scoring.service.ts`) et les poids du
 * scénario (`scoringWeightsByName`), sans rien recalculer de l'indice.
 */

/** Chaque composante en mots simples, pour un élève de première. */
export const COMPOSANTE_EN_MOTS: Record<string, string> = {
  economic: "le résultat de l'activité",
  financial: "la progression du résultat",
  commercial: "les ventes",
  rse: "la responsabilité sociétale",
  pilotage: "le pilotage",
  decision_mastery: "les analyses de situations",
  // Les composantes des anciens tours, avant la version 3 de l'indice.
  operational: "la production",
  profitability: "la rentabilité",
  strategy: "la cohérence des choix",
};

export interface EquipeAExpliquer {
  teamId: string;
  defaillant: boolean;
  /** Moyenne de chaque composante sur les tours joués, 0 à 100. */
  dimensions: Record<string, number>;
}

export interface Raison {
  composante: string;
  /** Poids × écart à la moyenne de la classe, en points d'IPG. */
  ecart: number;
}

/** Les deux composantes qui ont le plus pesé sur le rang de chaque équipe. */
export function raisonsDuRang(
  equipes: readonly EquipeAExpliquer[],
  poids: Record<string, number>,
): Map<string, Raison[]> {
  const composantes = [
    ...new Set(equipes.flatMap((e) => Object.keys(e.dimensions))),
  ].filter((c) => (poids[c] ?? 0) > 0 && COMPOSANTE_EN_MOTS[c]);
  const moyenne = new Map(
    composantes.map((c) => {
      const notes = equipes.map((e) => e.dimensions[c]).filter((v): v is number => typeof v === "number");
      return [c, notes.length ? notes.reduce((s, v) => s + v, 0) / notes.length : 0];
    }),
  );
  const raisons = new Map<string, Raison[]>();
  for (const e of equipes) {
    const ecarts = composantes
      .filter((c) => typeof e.dimensions[c] === "number")
      .map((c) => ({ composante: c, ecart: (poids[c] ?? 0) * (e.dimensions[c]! - moyenne.get(c)!) }))
      // Moins d'un dixième de point d'IPG : la composante ne départage pas.
      .filter((r) => Math.abs(r.ecart) >= 0.1)
      .sort((a, b) => Math.abs(b.ecart) - Math.abs(a.ecart) || a.composante.localeCompare(b.composante))
      .slice(0, 2);
    raisons.set(e.teamId, ecarts);
  }
  return raisons;
}

/**
 * La phrase du mur : « Point fort : les ventes · point faible : les analyses
 * de situations ». Un point fort est une composante où l'équipe dépasse la
 * moyenne de la classe ; un point faible, une où elle est en dessous.
 */
export function phraseDuRang(raisons: readonly Raison[], defaillant: boolean): string {
  if (defaillant) return "À l'arrêt : cessation de paiements";
  if (raisons.length === 0) return "Dans la moyenne de la classe partout";
  const forts = raisons.filter((r) => r.ecart > 0).map((r) => COMPOSANTE_EN_MOTS[r.composante]!);
  const faibles = raisons.filter((r) => r.ecart < 0).map((r) => COMPOSANTE_EN_MOTS[r.composante]!);
  const morceaux: string[] = [];
  if (forts.length) morceaux.push(`${forts.length > 1 ? "points forts" : "point fort"} : ${forts.join(" et ")}`);
  if (faibles.length) morceaux.push(`${faibles.length > 1 ? "points faibles" : "point faible"} : ${faibles.join(" et ")}`);
  const phrase = morceaux.join(" · ");
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

/** Pour chaque équipe, la ligne qui dit pourquoi elle a ce rang. */
export function pourquoiCeRang(
  equipes: readonly EquipeAExpliquer[],
  poids: Record<string, number>,
): Map<string, string> {
  const raisons = raisonsDuRang(equipes, poids);
  return new Map(equipes.map((e) => [e.teamId, phraseDuRang(raisons.get(e.teamId) ?? [], e.defaillant)]));
}
