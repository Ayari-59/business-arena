import { botDecisions, soldByProduct, type BotProfile } from "../../engine/bots";
import { soldUnits, type DecisionProviderContext } from "../../engine/simulation/runGame";
import type { EngineScenarioConfig, RoundDecisions } from "../../engine/types";
import { composerLeScenarioJoue, CORRECTIFS_DES_PARTIES_NOUVELLES } from "../scenarios/scenario-joue";

/**
 * L'ARÈNE DU COURS, TELLE QU'UNE PARTIE CRÉÉE AUJOURD'HUI LA JOUE.
 *
 * Chaque chiffre du cours vient d'une année de l'arène que le cours rejoue lui-même :
 * l'année du cours (cas.ts), ses rejeux (gestion-de-la-pme.ts, ressources-humaines.ts),
 * les trois années, la décision et la gamme. Ils posaient chacun leur scénario et leurs
 * décisions, et jouaient l'arène d'avant les correctifs des parties nouvelles : des
 * concurrents qui vendaient sous leur coût et faisaient défaillance, un parc qui comptait
 * deux fois la même machine, et une gestion équilibrée qui ne voyait pas ses ventes du
 * tour d'avant et préparait trop ou trop peu.
 *
 * Ils passent tous par ici. Le scénario se compose comme celui d'une partie
 * (`composerLeScenarioJoue`, avec `CORRECTIFS_DES_PARTIES_NOUVELLES`) : un correctif
 * ajouté aux parties nouvelles vaut aussi pour le cours. Trois entreprises au trimestre,
 * sans niveau ni monde variable : le scénario du registre, ses seuls correctifs en plus.
 * Les décisions sont celles de la gestion de chaque entreprise, qui lit ses ventes du tour
 * d'avant comme dans une partie (`lastSoldUnits`, `lastSoldByProduct`), à la manière du
 * lot de l'examen (pedagogy/examen/lot.ts).
 */

/** La graine du trimestre simulé : le même cas pour tous. */
export const GRAINE_DU_COURS = 20260101;

/** Le joueur et les deux premiers concurrents du scénario. */
const ENTREPRISES_DE_L_ANNEE = 3;

/** Le scénario du registre, joué sur `tours` trimestres avec les correctifs des parties nouvelles. */
export function scenarioDuCours(scenario: EngineScenarioConfig, tours: number): EngineScenarioConfig {
  return composerLeScenarioJoue({
    scenario,
    seed: GRAINE_DU_COURS,
    concurrents: ENTREPRISES_DE_L_ANNEE,
    roundsCount: tours,
    periodicity: "quarter",
    ...CORRECTIFS_DES_PARTIES_NOUVELLES,
  });
}

/** La décision d'une gestion au trimestre, qui lit ses ventes du trimestre d'avant. */
export function decisionDuCours(
  profil: BotProfile,
  scenario: EngineScenarioConfig,
  ctx: DecisionProviderContext,
): RoundDecisions {
  const avant = ctx.lastResult;
  return botDecisions(profil, {
    scenario,
    state: ctx.state,
    roundIndex: ctx.roundIndex,
    lastSoldUnits: avant ? soldUnits(avant) : undefined,
    lastSoldByProduct: avant ? soldByProduct(scenario, avant.market.bySegment) : undefined,
  });
}
