import { describe, expect, it } from "vitest";
import { scenarioByCode } from "@/config/scenarios/registry";
import {
  applyPeriodicity,
  applyPeriodicityToCompany,
  PERIODICITY_DAYS,
  type Periodicity,
} from "@/config/scenarios/periodicity";

/**
 * QUAND L'UNITÉ VENDUE EST UNE PÉRIODE.
 *
 * Le redimensionnement laissait le bloc d'abonnement intact : au mois, une
 * salle gardait quinze pour cent d'attrition PAR MOIS là où le scénario les
 * avait calibrés par trimestre, encaissait un abonnement trimestriel tous les
 * mois, et voyait sa surface d'accueil divisée par trois. Rien ne le disait, et
 * le secteur était pourtant proposé au mois dans l'écran de création.
 *
 * Ces trois invariants sont ce qui rend un scénario par abonnement jouable à
 * n'importe quelle durée de tour. Ils ne se vérifient pas à la lecture : une
 * seule des quatre grandeurs oubliée, et l'un d'eux tombe.
 */
const PERIODES: Periodicity[] = ["month", "quarter", "year"];
const parAn = (tauxParTour: number, jours: number) => 1 - (1 - tauxParTour) ** (360 / jours);

describe("un scénario par abonnement se joue à toutes les durées de tour", () => {
  const definition = scenarioByCode("fitness");
  const base = definition.scenario;

  it("le seuil de rentabilité en adhérents ne dépend pas de la durée du tour", () => {
    const seuils = PERIODES.map((p) => {
      const s = applyPeriodicity(base, p);
      const marge =
        s.subscription!.refPrice -
        (s.product.materialCostPerUnit + s.product.otherVariableCostPerUnit);
      return Math.round(s.fixedCostsPerRound / marge);
    });
    expect(new Set(seuils).size, `seuils différents : ${seuils.join(", ")}`).toBe(1);
  });

  it("la capacité d'accueil en adhérents ne dépend pas de la durée du tour", () => {
    const capacites = PERIODES.map((p) => {
      const s = applyPeriodicity(base, p);
      const c = applyPeriodicityToCompany(
        definition.company("t", "T", "human"),
        p,
        { abonnement: true },
      );
      const encadrement = (c.headcount * c.hoursPerEmployee) / s.product.hoursPerUnit;
      return [c.machineCapacity, Math.round(encadrement)];
    });
    expect(new Set(capacites.map((c) => c[0])).size, "places").toBe(1);
    expect(new Set(capacites.map((c) => c[1])).size, "encadrement").toBe(1);
  });

  it("l'attrition annualisée ne dépend pas de la durée du tour", () => {
    const annuelles = PERIODES.map((p) =>
      Number(
        parAn(applyPeriodicity(base, p).subscription!.baseChurnRate, PERIODICITY_DAYS[p]).toFixed(6),
      ),
    );
    expect(new Set(annuelles).size, `attritions annuelles : ${annuelles.join(", ")}`).toBe(1);
  });

  it("quinze pour cent par trimestre font 5,27 % par mois, et non cinq", () => {
    // La composition porte sur ce qui RESTE, pas sur ce qui part : diviser par
    // trois serait faux, et c'est l'erreur naturelle.
    const mois = applyPeriodicity(base, "month").subscription!;
    expect(base.subscription!.baseChurnRate).toBe(0.15);
    expect(Number(mois.baseChurnRate.toFixed(4))).toBe(0.0527);
    expect(Number(mois.refPrice.toFixed(2))).toBe(35);
  });

  it("un secteur sans abonnement garde le redimensionnement d'origine", () => {
    // La règle nouvelle ne doit toucher que les scénarios dont l'unité est une
    // période : ailleurs, un prix reste un prix et une capacité un flux.
    const nova = scenarioByCode("nova").scenario;
    const mois = applyPeriodicity(nova, "month");
    expect(mois.market.segments[0]!.refPrice).toBe(nova.market.segments[0]!.refPrice);
    expect(mois.product.materialCostPerUnit).toBe(nova.product.materialCostPerUnit);
    expect(Math.round(mois.fixedCostsPerRound)).toBe(Math.round(nova.fixedCostsPerRound / 3));
  });
});
