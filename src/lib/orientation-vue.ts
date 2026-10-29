import type { Recommandation, Semestre, VueDOrientation } from "@/config/orientation";

/**
 * Lire une recommandation dans la vue préparée par le serveur (`vueDOrientation`).
 *
 * Ce module est sûr pour le navigateur : il n'importe que des types. Le
 * formulaire d'orientation l'utilise à la place de `recommander`, qui tire les
 * ateliers et les scénarios, corrigés compris.
 */
export function cleDeRecommandation(d: { diplome: string; semestre: Semestre; objectif: string }): string {
  return `${d.diplome}|${d.semestre}|${d.objectif}`;
}

export function lireLaRecommandation(
  vue: VueDOrientation,
  demande: { diplome: string; semestre: Semestre; objectif: string },
): Recommandation | null {
  // Comme `recommander` : un diplôme inconnu se lit comme « autre », un objectif
  // inconnu comme le premier de la liste.
  const diplome = vue.diplomes.some((d) => d.code === demande.diplome) ? demande.diplome : "autre";
  const objectif = vue.objectifs.some((o) => o.code === demande.objectif)
    ? demande.objectif
    : (vue.objectifs[0]?.code ?? demande.objectif);
  const r = vue.recommandations[cleDeRecommandation({ diplome, semestre: demande.semestre, objectif })];
  if (!r) return null;
  return { ...r, pourquoi: r.pourquoi.map((i) => vue.phrases[i]!) };
}
