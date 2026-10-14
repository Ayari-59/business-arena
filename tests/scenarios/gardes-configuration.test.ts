import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { toGamme } from "../../src/engine/gamme";
import { axesProposables, axisAffinity } from "../../src/engine/market/communication";

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

/**
 * UN AXE DE COMMUNICATION QU'ON NE PEUT PAS TENIR N'EST PAS UN CHOIX.
 *
 * L'axe innovation ne parle que s'il y a du neuf à montrer : une référence
 * qu'on vient de lancer, un niveau technique qu'on a fait monter. Sans levier
 * R&D, un secteur n'a jamais ni l'un ni l'autre — l'axe y dessert TOUTES les
 * clientèles, à tous les tours, sans échappatoire. Deux secteurs étaient dans
 * ce cas (MAILLE & CO, L'ESCALE · gamme) et le proposaient quand même.
 *
 * La règle : un secteur ne propose un axe que s'il peut le tenir.
 */
describe("les axes de communication proposés se tiennent", () => {
  const avecCommunication = Object.values(SCENARIOS).filter((s) => s.scenario.communication);

  it("au moins un secteur ouvre le levier (sans quoi la garde ne garde rien)", () => {
    expect(avecCommunication.length).toBeGreaterThan(0);
  });

  it("l'innovation n'est proposée que là où la R&D existe", () => {
    for (const { scenario } of avecCommunication) {
      const axes = axesProposables(scenario);
      expect(axes.includes("innovation"), scenario.code).toBe(Boolean(scenario.rd));
      // Les trois autres restent toujours offerts : chacun porte une clientèle
      // et en dessert une autre, ce qui est la décision qu'on demande.
      for (const axe of ["prix", "qualite", "image"] as const) {
        expect(axes, scenario.code).toContain(axe);
      }
    }
  });

  it("aucun axe proposé ne dessert toutes les clientèles du secteur", () => {
    // La formulation générale de la règle : si un axe est misfit partout, à
    // prix usuel et sans nouveauté, il ne peut que coûter — il n'a rien à faire
    // dans la liste.
    for (const { scenario } of avecCommunication) {
      const segments = toGamme(scenario).flatMap((p) => p.market.segments);
      for (const axe of axesProposables(scenario)) {
        const partout = segments.every(
          (s) =>
            axisAffinity(axe, s, { price: s.refPrice, techLevel: 0, freshlyLaunched: false }) ===
            "misfit",
        );
        // L'innovation reste misfit au tour 1 même avec un levier R&D — elle
        // devient tenable dès que le niveau technique monte ou qu'une
        // référence est lancée, ce qui est justement le pari qu'elle propose.
        if (axe !== "innovation") {
          expect(partout, `${scenario.code} · ${axe}`).toBe(false);
        }
      }
    }
  });
});
