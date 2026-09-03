import { neutralDecisions } from "@/engine/bots";
import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";

/**
 * Ce que le formulaire PROPOSE à une équipe pour un tour : la référence à
 * laquelle on compare ce qu'elle valide, pour savoir si elle a décidé.
 *
 * Au tour 1, le point de départ du secteur ; ensuite, les décisions du tour
 * précédent. Calculé ici, et une seule fois, parce que le serveur doit
 * refaire exactement le calcul du formulaire : une valeur proposée que le
 * serveur ne reconnaîtrait pas passerait pour une décision.
 */

/**
 * Le formulaire n'accepte pas n'importe quel nombre : ses champs avancent par
 * pas de 1, le prix par pas de 0,1. Une valeur proposée décimale rendrait le
 * tour insoumettable : le navigateur refuse la validation sans message, et
 * l'élève clique sans que rien ne se passe. Une valeur proposée doit être
 * soumettable telle quelle.
 */
export function auPas(d: RoundDecisions): RoundDecisions {
  return {
    ...d,
    price: Math.round(d.price * 10) / 10,
    productionPlan: Math.round(d.productionPlan),
    marketingBudget: Math.round(d.marketingBudget),
    qualityBudget: Math.round(d.qualityBudget),
    maintenanceBudget: Math.round(d.maintenanceBudget),
  };
}

/** Le point de départ du secteur, servi quand il n'y a rien à reconduire. */
export function startingDecisionsFor(
  snapshot: EngineScenarioConfig,
  state: CompanyState | undefined,
  roundIndex: number,
): RoundDecisions {
  // Sans état persisté il n'y a pas de capacité à viser : on s'en tient alors
  // au prix de référence du secteur, jamais à celui d'un autre.
  if (!state) {
    const main = [...snapshot.market.segments].sort((a, b) => b.size - a.size)[0];
    return auPas({
      price: main?.refPrice ?? 50,
      productionPlan: 0,
      marketingBudget: 0.5 * snapshot.marketing.scale,
      qualityBudget: 0.5 * snapshot.production.qualityScale,
      maintenanceBudget: snapshot.production.maintenanceReference,
    });
  }
  return auPas(neutralDecisions({ scenario: snapshot, state, roundIndex }));
}

/** Les valeurs proposées pour ce tour : le tour précédent, sinon le départ. */
export function proposedDecisionsFor(args: {
  snapshot: EngineScenarioConfig;
  state: CompanyState | undefined;
  roundIndex: number;
  previousPayload: RoundDecisions | null | undefined;
}): RoundDecisions {
  return args.previousPayload
    ? auPas(args.previousPayload)
    : startingDecisionsFor(args.snapshot, args.state, args.roundIndex);
}
