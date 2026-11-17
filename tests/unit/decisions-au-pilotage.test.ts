import { describe, expect, it } from "vitest";
import {
  SEUIL_DE_SURPRODUCTION,
  lireLaDecisionDuTour,
  lireLesDecisions,
  reperesDesDecisions,
  type CadreDeLecture,
} from "../../src/config/decisions-au-pilotage";
import { DIFFICULTY_PRESETS } from "../../src/config/difficulty";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import type { RoundDecisions } from "../../src/engine/types";

/**
 * LES DÉCISIONS DES ÉQUIPES DANS LE PILOTAGE (chantier « décisions-prof »).
 *
 * Chaque repère a son test : il parle quand il le doit, et se tait sinon. Les
 * coûts viennent du scénario NOVA (matières 22 €, autres coûts variables 16 €,
 * soit 38 € l'enceinte au fournisseur standard, 34,70 € chez AsiaComponents).
 */

/** Les espaces insécables du format français, lus comme des espaces : le test se lit tel quel. */
const plat = <T,>(x: T): T => JSON.parse(JSON.stringify(x).replace(/[\u202f\u00a0]/g, " ")) as T;
const reperes = (d: RoundDecisions, s = NOVA) => plat(reperesDesDecisions(d, s));
const lire = (d: RoundDecisions, c: CadreDeLecture) => plat(lireLesDecisions(d, c));

const NOVA_DEF = SCENARIOS.find((d) => d.code === "nova")!;
const NOVA = NOVA_DEF.scenario;
const GAMME_DEF = SCENARIOS.find((d) => d.code === "nova-gamme")!;
const niveau = (n: number) => DIFFICULTY_PRESETS.find((p) => p.level === n)!.decisions;

const cadre = (n = 1, def = NOVA_DEF): CadreDeLecture => ({
  scenario: def.scenario,
  vocabulaire: def.vocabulary,
  drapeaux: niveau(n),
});

const BASE: RoundDecisions = {
  price: 59,
  productionPlan: 4000,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
  supplierChoice: "standard",
};

const estimee = (units: number, netIncome: number, netTreasury: number): RoundDecisions["salesEstimate"] => ({
  byProduct: { "nova-one": units },
  units,
  estimate: { revenue: units * 59, netIncome, netTreasury, deliverableUnits: units },
});

describe("les repères d'une décision", () => {
  it("une décision saine n'a aucun repère", () => {
    expect(reperes({ ...BASE, salesEstimate: estimee(3800, 12_000, 40_000) })).toEqual([]);
  });

  it("repère 1 : un prix sous le coût variable (matières au multiplicateur du fournisseur, plus les autres coûts)", () => {
    // 37 € < 38 € au fournisseur standard.
    expect(reperes({ ...BASE, price: 37 })).toEqual([
      "Prix sous le coût variable : chaque vente fait perdre de l'argent.",
    ]);
    // Chez AsiaComponents, 22 × 0,85 + 16 = 34,70 € : 37 € le couvre.
    expect(reperes({ ...BASE, price: 37, supplierChoice: "lowcost" })).toEqual([]);
    // Au coût exact, rien : on ne perd pas d'argent à la vente.
    expect(reperes({ ...BASE, price: 38 })).toEqual([]);
  });

  it("repère 1 en gamme : la référence vendue sous son coût est nommée", () => {
    const gamme: RoundDecisions = {
      ...BASE,
      products: {
        "nova-go": { price: 18, productionPlan: 1000, marketingBudget: 1000 },
        "nova-one": { price: 59, productionPlan: 2000, marketingBudget: 1000 },
        "nova-studio": { price: 120, productionPlan: 500, marketingBudget: 1000 },
      },
    };
    expect(reperes(gamme, GAMME_DEF.scenario)).toEqual([
      "Prix sous le coût variable pour NOVA Go : chaque vente fait perdre de l'argent.",
    ]);
  });

  it("repère 2 : un résultat estimé en perte, lu dans l'estimation du serveur", () => {
    expect(reperes({ ...BASE, salesEstimate: estimee(3800, -1234.5, 10_000) })).toEqual([
      "Résultat estimé en perte : −1 234,50 €.",
    ]);
  });

  it("repère 3 : une trésorerie estimée en découvert à la fin du tour", () => {
    expect(reperes({ ...BASE, salesEstimate: estimee(3800, 500, -8000) })).toEqual([
      "Trésorerie estimée en découvert à la fin du tour : −8 000,00 €.",
    ]);
  });

  it("repère 4 : une production très au-dessus des ventes estimées", () => {
    const ventes = 2000;
    const juste = Math.ceil(SEUIL_DE_SURPRODUCTION * ventes);
    expect(
      reperes({ ...BASE, productionPlan: juste, salesEstimate: estimee(ventes, 100, 100) }),
    ).toEqual(["Production très au-dessus des ventes estimées : 3 000 contre 2 000."]);
    expect(
      reperes({ ...BASE, productionPlan: juste - 1, salesEstimate: estimee(ventes, 100, 100) }),
    ).toEqual([]);
  });

  it("sans estimation, seuls les repères qui n'en dépendent pas parlent", () => {
    expect(reperes({ ...BASE, productionPlan: 99_999 })).toEqual([]);
  });
});

describe("la lecture d'une décision", () => {
  it("la ligne repliée porte prix, volume, fournisseur et marketing, avec les mots du secteur", () => {
    const { principales } = lire(BASE, cadre(1));
    expect(principales).toEqual([
      { libelle: "Prix de vente", valeur: "59,00 €" },
      { libelle: "Plan de production", valeur: "4 000 enceintes" },
      { libelle: "Choix du fournisseur", valeur: "Fournisseur standard" },
      { libelle: "Budget marketing", valeur: "6 000,00 €" },
    ]);
  });

  it("« Voir tout » ne montre que les leviers que le niveau ouvre", () => {
    const simple = lire(BASE, cadre(1)).autres.map((l) => l.libelle);
    const complet = lire(
      { ...BASE, finance: { newLoan: 20_000, loanRepayment: 0, capitalIncrease: 0, dividend: 0 }, insurance: "basic" },
      cadre(6),
    );
    expect(simple).not.toContain("Nouvel emprunt");
    expect(complet.autres).toContainEqual({ libelle: "Nouvel emprunt", valeur: "20 000,00 €" });
    expect(complet.autres).toContainEqual({ libelle: "Couverture d'assurance", valeur: "Basique" });
    expect(complet.autres.length).toBeGreaterThan(simple.length);
  });

  it("en gamme, prix, volume et fournisseur se lisent référence par référence", () => {
    const { principales } = lire(
      {
        ...BASE,
        products: {
          "nova-go": { price: 29, productionPlan: 1000, marketingBudget: 1000, supplierChoice: "lowcost" },
        },
      },
      cadre(1, GAMME_DEF),
    );
    expect(principales).toContainEqual({ libelle: "Prix de vente · NOVA Go", valeur: "29,00 €" });
    expect(principales).toContainEqual({ libelle: "Plan de production · NOVA Go", valeur: "1 000 enceintes" });
    expect(principales).toContainEqual({ libelle: "Choix du fournisseur · NOVA Go", valeur: "AsiaComponents" });
  });

  it("une équipe sans ligne n'a aucune décision ; un brouillon se lit marqué", () => {
    expect(lireLaDecisionDuTour(undefined, cadre()).etat).toBe("aucune");
    expect(lireLaDecisionDuTour({ status: "validated", payload: BASE }, cadre()).etat).toBe("validee");
    const brouillon = lireLaDecisionDuTour({ status: "draft", payload: { ...BASE, price: 30 } }, cadre());
    expect(brouillon.etat).toBe("brouillon");
    expect(brouillon.reperes).toHaveLength(1);
  });
});
