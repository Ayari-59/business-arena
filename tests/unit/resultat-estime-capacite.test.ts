import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  EncartResultatEstime,
  LigneEstimeeCompacte,
  resumeDeLEstimation,
} from "@/components/resultat-estime";
import { NOVA_GAMME_DEFINITION } from "@/config/scenarios/registry";
import { applyMarketScale } from "@/config/scenarios/market-scale";
import { estimerLeTour, expurgerLeScenario, repartitionDesVentes } from "@/engine/estimation";
import type { CompanyState, RoundDecisions } from "@/engine/types";

/**
 * LE CAS DES PHOTOS : UNE GAMME NOVA SOUS LA CAPACITÉ DES MACHINES, ET POURTANT UN MANQUE.
 *
 * Le propriétaire voyait, dans une partie NOVA en gamme, « Vous ne pourrez livrer que
 * 6 080 enceintes : 220 de vos ventes estimées manqueraient, faute de stock et de
 * capacité », pour 6 300 enceintes estimées sous un plafond affiché de 7 000. Ces 7 000
 * sont les machines à plein ; ce sont les heures qui manquent : 4 salariés × 540 h =
 * 2 160 h, et une NOVA Studio en demande 0,50 par enceinte. Les plans de 6 300 en
 * demandent 2 250 : le moteur réduit chaque plan du même facteur (0,96) et l'atelier
 * sort 6 048 enceintes. L'alerte le dit maintenant, avec la capacité du tour.
 */

const def = NOVA_GAMME_DEFINITION;
const v = def.vocabulary;
const scenario = applyMarketScale(def.scenario, 1 + def.bots.length);
// Tour 3, la Studio lancée (sa R&D couverte au tour 1).
const ouverture: CompanyState = {
  ...def.company("player", "NOVA", "human"),
  rdByProduct: { "nova-studio": { invested: 25_000, launched: true, launchRound: 2, techLevel: 0 } },
};
const dossier = {
  scenario: expurgerLeScenario(scenario),
  state: ouverture,
  roundIndex: 3,
  events: [],
  orderOffer: null,
  repartition: repartitionDesVentes(scenario, 3, null),
};
const plans = { "nova-go": 1_000, "nova-one": 2_900, "nova-studio": 2_400 };
const decisions: RoundDecisions = {
  price: 59,
  productionPlan: 6_300,
  marketingBudget: 6_000,
  qualityBudget: 0,
  maintenanceBudget: 4_000,
  products: {
    "nova-go": { price: 32, productionPlan: plans["nova-go"], marketingBudget: 1_500, qualityBudget: 0 },
    "nova-one": { price: 59, productionPlan: plans["nova-one"], marketingBudget: 3_000, qualityBudget: 0 },
    "nova-studio": { price: 129, productionPlan: plans["nova-studio"], marketingBudget: 1_500, qualityBudget: 0 },
  },
};
const lisible = (t: string) => t.replace(/[   ]/g, " ").replace(/&#x27;/g, "'");
const rendu = (noeud: Parameters<typeof renderToStaticMarkup>[0]) => lisible(renderToStaticMarkup(noeud));

describe("le cas des photos : la main-d'œuvre, pas les machines", () => {
  const estime = estimerLeTour(dossier, decisions, plans);

  it("les ventes estimées restent sous la capacité des machines, et pourtant il manque", () => {
    expect(estime.ventesEstimees).toBe(6_300);
    expect(estime.resultat.production.machineCapacity).toBe(7_000);
    expect(estime.ventesEstimees).toBeLessThan(estime.resultat.production.machineCapacity);
    expect(Math.round(estime.ventesLivrables)).toBe(6_048);
    expect(Math.round(estime.manquantes)).toBe(252);
  });

  it("aucune unité ne se perd entre la production et les clientèles", () => {
    // Le moteur ne perd rien à la répartition entre segments : livré = produit.
    expect(estime.ventesLivrables).toBeCloseTo(estime.resultat.production.produced, 6);
  });

  it("l'analyse nomme la main-d'œuvre et la capacité réelle du tour", () => {
    const m = estime.manque!;
    expect(m.limites.map((l) => l.cause)).toEqual(["main-d-oeuvre"]);
    expect(Math.round(m.capaciteDuTour!)).toBe(6_048);
    expect(m.plusLongueAProduire).toBe("NOVA Studio");
    expect(m.references.map((r) => [r.nom, Math.round(r.manquantes)])).toEqual([
      ["NOVA One", 116],
      ["NOVA Studio", 96],
      ["NOVA Go", 40],
    ]);
  });

  const ALERTE =
    "Vous ne pourrez livrer que 6 048 enceintes : 252 de vos ventes estimées manqueraient. " +
    "Ce tour, votre atelier peut produire environ 6 048 enceintes, pas 6 300 : vos 4 salariés n'ont pas assez d'heures. " +
    "Il manquerait 116 NOVA One, 96 NOVA Studio et 40 NOVA Go. " +
    "Pour livrer plus, baissez un plan de production, d'abord celui de NOVA Studio, la référence la plus longue à produire ; une embauche ne compterait qu'au tour suivant.";

  it("le cadran (ordinateur) dit la capacité, la cause, les références et quoi faire", () => {
    const html = rendu(createElement(EncartResultatEstime, { estime, vocabulary: v, secteur: def.sector }));
    const alerte = html.match(/<li data-alerte-du-manque=""[^>]*>[\s\S]*?<\/li>/)?.[0] ?? "";
    expect(alerte.replace(/<[^>]+>/g, "")).toBe(ALERTE);
    expect(html).not.toContain("faute de stock et de capacité");
  });

  it("le tiroir du téléphone dit la même alerte", () => {
    const resume = resumeDeLEstimation(estime, v.units, v.unit);
    expect(lisible(resume!.alerteDuManque!)).toBe(ALERTE);
    const html = rendu(createElement(LigneEstimeeCompacte, { estimation: resume }));
    expect(html).toContain(ALERTE);
  });

  it("des ventes estimées à la capacité du tour : plus d'alerte", () => {
    const f = 6_048 / 6_300;
    const ventes = Object.fromEntries(Object.entries(plans).map(([c, n]) => [c, Math.floor(n * f)]));
    const juste = estimerLeTour(dossier, decisions, ventes);
    expect(juste.manque).toBeNull();
    const html = rendu(createElement(EncartResultatEstime, { estime: juste, vocabulary: v, secteur: def.sector }));
    expect(html).not.toContain("data-alerte-du-manque");
  });
});
