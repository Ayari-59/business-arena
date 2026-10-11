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
 *     fermé à la méthode, au même défaut que celui que le formulaire envoie.
 *
 * Elle ne lit ni les courriers, ni les études, et ne réagit à personne : elle
 * fait chaque tour la même chose raisonnable. C'est ce qui en fait un étalon :
 * sous un même marché, la différence entre le joueur et elle tient à leurs
 * décisions.
 */
import { neutralDecisions } from "@/engine/bots";
import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import type { DifficultyPreset } from "@/config/difficulty";

export const NOM_DE_LA_REFERENCE = "la gestion de référence";

/** Les leviers qu'un niveau n'ouvre pas, ramenés à ce que le formulaire envoie sans eux. */
export function selonLeNiveau(
  d: RoundDecisions,
  ouverts: DifficultyPreset["decisions"] | null,
): RoundDecisions {
  if (!ouverts) return d;
  const out: RoundDecisions = { ...d };
  if (!ouverts.quality) out.qualityBudget = 0;
  if (!ouverts.maintenance) out.maintenanceBudget = 0;
  if (!ouverts.hr) delete out.hr;
  if (!ouverts.insurance) out.insurance = false;
  if (!ouverts.investment) delete out.investment;
  if (!ouverts.rse) delete out.rse;
  if (!ouverts.rd) delete out.rdBudget;
  if (!ouverts.creances) delete out.treasury;
  else if (!ouverts.placement && out.treasury) out.treasury = { ...out.treasury, placement: 0 };
  out.finance = ouverts.finance
    ? {
        newLoan: d.finance?.newLoan ?? 0,
        loanRepayment: d.finance?.loanRepayment ?? 0,
        capitalIncrease: 0,
        dividend: 0,
      }
    : { newLoan: 0, loanRepayment: 0, capitalIncrease: 0, dividend: 0 };
  if (out.products) {
    out.products = Object.fromEntries(
      Object.entries(out.products).map(([code, p]) => {
        const q = { ...p };
        if (!ouverts.quality) q.qualityBudget = 0;
        if (!ouverts.rd) delete q.rdBudget;
        return [code, q];
      }),
    );
  }
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
  return selonLeNiveau(
    neutralDecisions({
      scenario: ctx.scenario,
      state: ctx.state,
      roundIndex: ctx.roundIndex,
      lastSoldUnits: ctx.lastSoldUnits,
      lastSoldByProduct: ctx.lastSoldByProduct,
    }),
    ouverts,
  );
}
