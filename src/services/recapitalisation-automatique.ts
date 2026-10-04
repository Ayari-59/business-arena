import type { CompanyRoundResult, RoundDecisions, SimulationOutput } from "@/engine/types";

/**
 * LES ASSOCIÉS RECAPITALISENT D'OFFICE, AUX NIVEAUX SANS FINANCEMENT.
 *
 * Les niveaux 1 et 2 ferment la décision de financement : pas d'emprunt, pas
 * d'augmentation de capital à saisir. Une crise de trésorerie y réclamait
 * pourtant l'un ou l'autre pour valider le tour — le joueur restait devant un
 * bouton grisé qui exigeait ce que l'écran n'offrait pas, puis, deux tours de
 * crise plus tard, devant une entreprise gelée. La partie ne se jouait plus.
 * (Visible le jour où le niveau 1 est devenu le niveau de départ.)
 *
 * La règle, pour ces niveaux : quand le tour s'achève en cessation de paiements,
 * les associés apportent ce qu'il faut pour ramener la caisse à zéro, dans la
 * limite de leur enveloppe totale. Le tour est REJOUÉ avec cet apport — pas
 * corrigé après coup : intérêts, impôts, situation nette et découvert se
 * recalculent d'un seul tenant, et le compteur de crise retombe à zéro.
 *
 * Seul le capital est mobilisé, jamais l'emprunt : un prêt ouvre un échéancier de
 * remboursements que ces niveaux ne montrent pas. Une fois l'enveloppe épuisée,
 * plus rien n'est possible : la crise suit son cours, avec son compte à rebours.
 *
 * Le moteur n'est pas touché : il se contente de recevoir une décision de capital,
 * comme si le joueur l'avait prise. Deux simulations au plus par essai, trois essais.
 */

/** Rejouer plus de trois fois ne ramènerait rien : l'enveloppe est alors épuisée. */
export const ESSAIS_MAX = 3;

/** Ce qu'il faut apporter pour que la caisse de cette équipe remonte à zéro. Zéro hors crise. */
export function apportPourRemonterLaCaisse(result: CompanyRoundResult): number {
  if (!result.treasury?.crisis) return 0;
  // L'enveloppe est épuisée : la demande a été écrêtée, ajouter n'y changerait rien.
  if (result.capital && result.capital.applied + 0.5 < result.capital.requested) return 0;
  return Math.max(0, Math.ceil(-result.functionalBalance.netTreasury));
}

export type Recapitalisation = {
  sortie: SimulationOutput;
  /** Les décisions finales, apports compris : ce que le tour a réellement joué. */
  decisions: Record<string, RoundDecisions>;
  /** Ce que les associés ont apporté d'office, par équipe (absent : rien). */
  apports: Record<string, number>;
};

/**
 * Simule le tour ; si une équipe désignée finit en crise, le rejoue avec l'apport
 * qui la sort de là. `simuler` reçoit les décisions et rend la sortie du moteur —
 * le service y met le moteur, un test y met ce qu'il veut.
 */
export function recapitaliserSiBesoin(args: {
  /** Les équipes concernées : celles dont le niveau n'ouvre pas le financement. */
  equipes: readonly string[];
  decisions: Record<string, RoundDecisions>;
  simuler: (decisions: Record<string, RoundDecisions>) => SimulationOutput;
}): Recapitalisation {
  let decisions = args.decisions;
  let sortie = args.simuler(decisions);
  const apports: Record<string, number> = {};

  for (let essai = 0; essai < ESSAIS_MAX; essai += 1) {
    const besoins = args.equipes
      .map((id) => [id, sortie.results[id] ? apportPourRemonterLaCaisse(sortie.results[id]!) : 0] as const)
      .filter(([, montant]) => montant > 0);
    if (besoins.length === 0) break;

    decisions = { ...decisions };
    for (const [id, montant] of besoins) {
      const d = decisions[id]!;
      decisions[id] = {
        ...d,
        finance: { ...d.finance, capitalIncrease: (d.finance?.capitalIncrease ?? 0) + montant },
      };
      apports[id] = (apports[id] ?? 0) + montant;
    }
    sortie = args.simuler(decisions);
  }
  return { sortie, decisions, apports };
}
