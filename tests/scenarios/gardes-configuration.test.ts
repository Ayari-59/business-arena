import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { toGamme } from "../../src/engine/gamme";

/**
 * LA CONFIGURATION DOIT RACONTER LE MÊME MÉTIER QUE LES ÉNONCÉS.
 *
 * STRUCTURE. Les salaires de l'effectif de départ sont compris dans les charges
 * de structure décaissées. Cinq scénarios laissaient, une fois ces salaires
 * payés, une structure hors salaires invraisemblable : 3 600 € par trimestre
 * pour le dépôt, les véhicules et l'assurance décennale d'une entreprise de
 * bâtiment, 7 000 € pour un entrepôt d'e-commerce, 12 000 € pour les murs d'un
 * 70 couverts. Les seuils cités étaient exacts, posés sur des structures trop
 * légères. La règle : au moins un cinquième de la structure décaissée va aux
 * murs, à l'énergie et aux assurances.
 *
 * BILAN.
 * Le diagnostic de cohérence a trouvé, dans huit configurations, des dettes
 * fournisseurs d'ouverture sans rapport avec le délai fournisseur que les
 * énoncés citent : 20 000 € chez MAILLE & CO pour un façonnier réglé à 45
 * jours (77 000 € attendus), 88 000 € chez ROUTE & CIE pour du gazole à 15
 * jours (21 000 € attendus). Le bilan restait équilibré, la situation
 * « bénéficiaire et à découvert » raisonnait sur un délai que le bilan ne
 * portait pas, et rien ne le signalait.
 *
 * La règle : les dettes fournisseurs d'ouverture valent les achats d'un tour
 * de croisière (capacité × utilisation cible × coût matière) portés au délai
 * fournisseur, à ± 50 %. Un bilan SANS dette fournisseur est une reprise à
 * comptes soldés : c'est un choix d'énoncé (NOVA), pas une incohérence.
 */

/** Achats d'un tour de croisière, réglés au délai du scénario. */
function dettesAttendues(d: (typeof SCENARIOS)[number]): number {
  const s = d.scenario;
  const c = d.company("garde", "garde", "human");
  const gamme = toGamme(s);
  const matiere = gamme.reduce((t, p) => t + p.materialCostPerUnit, 0) / gamme.length;
  const achats = c.machineCapacity * s.scoring.benchmarks.utilizationTarget * matiere;
  return achats * Math.min(1, s.finance.supplierPaymentDelayDays / s.roundDays);
}

describe("structure décaissée", () => {
  it("les salaires inclus laissent au moins un cinquième de la structure aux murs, à l'énergie et aux assurances", () => {
    const ecarts: string[] = [];
    for (const d of SCENARIOS) {
      const s = d.scenario;
      const salaires = s.hr ? s.hr.salaryPerEmployeePerRound * s.hr.includedHeadcount : 0;
      const reste = s.fixedCostsPerRound - salaires;
      if (reste < 0.2 * s.fixedCostsPerRound) {
        ecarts.push(
          `${d.code} : ${Math.round(s.fixedCostsPerRound / 1000)} k€ de structure dont ${Math.round(salaires / 1000)} k€ de salaires, ${Math.round(reste / 1000)} k€ pour le reste (${Math.round((reste / s.fixedCostsPerRound) * 100)} %)`,
        );
      }
    }
    expect(ecarts, ecarts.join("\n")).toEqual([]);
  });
});

describe("bilan d'ouverture", () => {
  it("les dettes fournisseurs d'ouverture suivent le délai fournisseur du scénario", () => {
    const ecarts: string[] = [];
    for (const d of SCENARIOS) {
      const payables = d.company("garde", "garde", "human").finance.payables;
      if (payables === 0) continue;
      const attendu = dettesAttendues(d);
      const ratio = payables / attendu;
      if (ratio < 0.5 || ratio > 1.5) {
        ecarts.push(
          `${d.code} : ${Math.round(payables / 1000)} k€ de dettes fournisseurs pour ~${Math.round(attendu / 1000)} k€ d'achats à ${d.scenario.finance.supplierPaymentDelayDays} jours (× ${ratio.toFixed(2)})`,
        );
      }
    }
    expect(ecarts, ecarts.join("\n")).toEqual([]);
  });

  it("le bilan d'ouverture est équilibré au centime", () => {
    for (const d of SCENARIOS) {
      const b = d.company("garde", "garde", "human").finance;
      const actif = b.fixedAssetsNet + b.inventoryValue + b.receivables + b.cash;
      const passif = b.equity + b.financialDebt + b.payables + b.overdraft;
      expect(Math.abs(actif - passif), d.code).toBeLessThan(0.01);
    }
  });
});
