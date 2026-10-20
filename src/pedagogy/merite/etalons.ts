/**
 * LES ÉTALONS : contre qui des décisions sont rejouées.
 *
 * Deux usages, deux étalons, et c'est la décision du propriétaire :
 *
 *   · LE BILAN DES PARTIES (« mérite ou chance ») juge contre UN BON GESTIONNAIRE
 *     (`reference.ts`) : il joue le marché de la partie avec ce que le joueur
 *     voyait, puis ses décisions sont rejouées telles quelles, comme celles du
 *     joueur ;
 *   · L'EXAMEN INDIVIDUEL note contre LA GESTION NEUTRE DU SECTEUR, l'étalon que
 *     sa grille publiée nomme (config/examen/grille.ts) : une note d'accréditation
 *     ne change pas d'étalon sans une nouvelle version de grille.
 *
 * Le moteur de rejeu est le même (`rejouer`), et la mise en forme de l'étalon
 * aussi (`partieFigee`) : il décide sur le marché joué, puis ses décisions sont
 * rejouées telles quelles sous les autres, comme celles du candidat.
 */
import { neutralDecisions } from "@/engine/bots";
import { bornerLInvestissement, plafondDInvestissement } from "@/engine/investment/plafond";
import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import type { DifficultyPreset } from "@/config/difficulty";
import { partieFigee, rejouer, type IssueDuRejeu, type PartieARejouer } from "./rejeu";
import { partieDeLaReference, selonLeNiveau } from "./reference";
import { GRAINES_DU_MERITE } from "./verdict";

export type Etalon = "gestion-neutre" | "gestion-neutre-gelee" | "bon-gestionnaire";

/**
 * LA GESTION NEUTRE DU SECTEUR, tour par tour : `neutralDecisions`, profil
 * « balanced » des bots, tenue à chaque tour. Le formulaire en part, mais
 * propose la qualité que dit le scénario (`qualiteProposee`, engine/types.ts) :
 * l'étalon, lui, garde la sienne.
 * Le prix de référence du marché, un volume qui suit les ventes du tour passé et
 * la saison, un marketing et une qualité au niveau du marché, la maintenance de
 * référence ; rien de ce que le niveau n'ouvre pas, et l'investissement plafonné
 * comme celui du joueur. Elle ne réagit à personne.
 *
 * C'est, à l'identique, la « méthode de référence » d'avant le lot « mérite
 * durci » : l'examen la garde, et la garde de `tests/unit/examen-gestion-neutre`
 * le vérifie au centime de note sur des copies témoins.
 */
export function decisionDeLaGestionNeutre(
  ctx: {
    scenario: EngineScenarioConfig;
    state: CompanyState;
    roundIndex: number;
    lastSoldUnits?: number;
    lastSoldByProduct?: Record<string, number>;
  },
  ouverts: DifficultyPreset["decisions"] | null,
): RoundDecisions {
  // Sans `humanAvgPrice` : la gestion neutre ne réagit au prix de personne.
  const decision = selonLeNiveau(
    neutralDecisions({
      scenario: ctx.scenario,
      state: ctx.state,
      roundIndex: ctx.roundIndex,
      lastSoldUnits: ctx.lastSoldUnits,
      lastSoldByProduct: ctx.lastSoldByProduct,
    }),
    ouverts,
  );
  return bornerLInvestissement(decision, plafondDInvestissement(ctx.scenario, ctx.state, ouverts, decision.hr));
}

/**
 * Les rejeux de l'étalon sous les marchés possibles, dans l'ordre des graines.
 *
 * DEUX ÉTALONS SUR TROIS SONT GELÉS, et c'est la règle : chacun décide sur le
 * marché joué, puis ses décisions sont rejouées TELLES QUELLES sous les autres,
 * exactement comme celles du candidat (`partieFigee`). Un étalon qui redéciderait
 * sous chacun des marchés se réadapterait là où le candidat ne le peut pas, et
 * la note mesurerait cette asymétrie autant que les décisions.
 *
 *   · gestion-neutre-gelee : la gestion neutre, décidée sur le marché joué puis
 *     gelée. C'est l'étalon des grilles publiées depuis leur version 2 ;
 *   · bon-gestionnaire : la référence du bilan des parties, gelée de même ;
 *   · gestion-neutre : LA GESTION NEUTRE QUI REDÉCIDE sous chaque marché, tour
 *     par tour. C'est l'asymétrie ci-dessus, et c'est l'étalon que les grilles
 *     publiées nommaient jusqu'à leur version 1. Il reste ici parce qu'un
 *     examen garde une COPIE de sa grille à sa création : une copie notée sous
 *     une grille version 1 doit se renoter contre l'étalon de cette version-là,
 *     et pas contre un autre (règle 1 de config/examen/grille.ts). Aucune
 *     grille publiée ne le nomme plus.
 */
export function rejeuxDeLEtalon(
  partie: PartieARejouer,
  ouverts: DifficultyPreset["decisions"] | null,
  etalon: Etalon,
  graines: readonly number[] = GRAINES_DU_MERITE,
): IssueDuRejeu[] {
  if (etalon === "gestion-neutre") {
    const methode = { type: "methode" as const, decider: (c: Parameters<typeof decisionDeLaGestionNeutre>[0]) => decisionDeLaGestionNeutre(c, ouverts) };
    return graines.map((g) => rejouer(partie, g, methode));
  }
  const laPartie =
    etalon === "gestion-neutre-gelee"
      ? partieFigee(partie, (c) => decisionDeLaGestionNeutre(c, ouverts))
      : partieDeLaReference(partie, ouverts);
  return graines.map((g) => rejouer(laPartie, g));
}
