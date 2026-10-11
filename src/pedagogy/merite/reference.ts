/**
 * LA MÉTHODE DE RÉFÉRENCE : l'étalon contre lequel on juge des décisions.
 *
 * Battre les bots ne dit pas qu'on a bien décidé : leur tempérament change
 * avec le marché. Il faut un étalon qui, lui, ne bouge pas, et qui soit
 * raisonnable sans être savant. C'est la GESTION NEUTRE DU SECTEUR, celle que
 * le formulaire propose au premier tour (`neutralDecisions`, profil
 * « balanced » des bots), tenue tour après tour :
 *
 *   · le prix de référence du marché (le segment dominant, ou le prix que le
 *     portefeuille d'adhérents juge normal) ;
 *   · un volume qui suit la demande : les ventes du tour précédent, +5 %,
 *     ajustées de la saison à venir, moins la moitié du stock, dans la
 *     capacité ; au premier tour, 65 % de la capacité ;
 *   · un marketing et une qualité au niveau du marché (la moitié de leur
 *     échelle dans le scénario), la maintenance de référence ;
 *   · et rien de ce que le niveau n'ouvre pas : un levier fermé au joueur est
 *     fermé à la méthode, au même défaut que celui que le formulaire envoie ;
 *     un investissement plafonné pour lui l'est pour elle.
 *
 * Elle ne lit ni les courriers, ni les études, et ne réagit à personne : elle
 * fait chaque tour la même chose raisonnable. C'est ce qui en fait un étalon :
 * sous un même marché, la différence entre le joueur et elle tient à leurs
 * décisions.
 */
import { aLaMesureDuNiveau, neutralDecisions } from "@/engine/bots";
import { bornerLInvestissement, plafondDInvestissement } from "@/engine/investment/plafond";
import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import type { DifficultyPreset } from "@/config/difficulty";

export const NOM_DE_LA_REFERENCE = "la gestion de référence";

/**
 * Les leviers qu'un niveau n'ouvre pas, ramenés à ce que le formulaire envoie
 * sans eux (`aLaMesureDuNiveau`, la règle des concurrents pilotés aussi) : la
 * qualité et l'entretien à leur valeur neutre, celle du champ caché, et rien des
 * autres. Puis la politique propre à la méthode : elle n'appelle jamais les
 * associés et ne distribue rien.
 */
export function selonLeNiveau(
  d: RoundDecisions,
  ouverts: DifficultyPreset["decisions"] | null,
): RoundDecisions {
  if (!ouverts) return d;
  const out = aLaMesureDuNiveau(d, ouverts);
  out.finance = ouverts.finance
    ? {
        newLoan: d.finance?.newLoan ?? 0,
        loanRepayment: d.finance?.loanRepayment ?? 0,
        capitalIncrease: 0,
        dividend: 0,
      }
    : { newLoan: 0, loanRepayment: 0, capitalIncrease: 0, dividend: 0 };
  return out;
}

/** La décision de la méthode de référence pour un tour. */
export function decisionDeReference(
  ctx: {
    scenario: EngineScenarioConfig;
    state: CompanyState;
    roundIndex: number;
    lastSoldUnits?: number;
    lastSoldByProduct?: Record<string, number>;
  },
  ouverts: DifficultyPreset["decisions"] | null,
): RoundDecisions {
  // Sans `humanAvgPrice` : la méthode ne réagit au prix de personne.
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
  // LE PLAFOND D'INVESTISSEMENT : la méthode n'achète pas plus de capacité que
  // le joueur ne le peut au même niveau (`engine/investment/plafond`).
  return bornerLInvestissement(decision, plafondDInvestissement(ctx.scenario, ctx.state, ouverts, decision.hr));
}
