import { describe, expect, it } from "vitest";
import { scenarioByCode } from "@/config/scenarios/registry";
import { composerLeScenarioJoue, CORRECTIFS_DES_PARTIES_NOUVELLES } from "@/config/scenarios/scenario-joue";
import { GRAINE_DU_COURS, decisionsDuCours } from "@/config/cours/arene-du-cours";
import { runGame } from "@/engine/simulation/runGame";
import { conditionsDuCreditBail } from "@/engine/credit-bail";

/**
 * ACHETER COMPTANT, EMPRUNTER OU PRENDRE EN CRÉDIT-BAIL LA PLUS PETITE MACHINE DU
 * CATALOGUE, PLEINEMENT VENDUE, SUR LES TROIS ANS DU CONTRAT (douze trimestres).
 *
 * Le flux d'un trimestre est celui de la garde de l'équilibre (`equilibre.test.ts`) : la
 * marge sur coût variable d'une unité vendue au premier trimestre de l'arène du cours,
 * fois la capacité de la machine, moins sa charge fixe (au conseil, moins le consultant
 * qui facture chaque jour). Il est le même dans les trois cas ; seul le financement change.
 *  · comptant : le prix sort au départ ;
 *  · emprunt : le prix, emprunté au taux de la banque sur la même durée, en amortissement
 *    constant ; la trésorerie paie les échéances et les intérêts ;
 *  · crédit-bail : douze loyers, puis l'option levée.
 * Dans les trois cas, l'entreprise possède la machine au bout des trois ans.
 */

const CODES = ["nova", "boutique-mono", "hotel", "bistrot", "conseil", "ecommerce", "fitness", "batiment", "transport", "nova-gamme", "boutique", "hotel-gamme", "bistrot-gamme", "conseil-gamme", "ecommerce-gamme"];
const TRIMESTRES = 12;

function comparaison(code: string) {
  const def = scenarioByCode(code);
  const s = composerLeScenarioJoue({ scenario: def.scenario, seed: GRAINE_DU_COURS, concurrents: 3, roundsCount: 1, periodicity: "quarter", ...CORRECTIFS_DES_PARTIES_NOUVELLES });
  const t = [...s.equipment!.types].sort((a, b) => a.costPerUnit - b.costPerUnit)[0]!;
  const entreprises = [def.company("joueur", def.playerTeamName, "bot", "balanced"), ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile))];
  const p = runGame({ scenario: s, initialCompanies: entreprises, seed: GRAINE_DU_COURS, providers: decisionsDuCours(entreprises, s) });
  const r = p.rounds[0]!.results.joueur!;
  const vendu = Object.values(r.market.bySegment).reduce((a, x) => a + x.sold, 0);
  const marge = r.incomeStatement.revenue / vendu - r.breakeven.unitVariableCost;
  const heures = (s.products?.[0] ?? s.product).hoursPerUnit;
  const jours = p.rounds[0]!.companies.find((c) => c.id === "joueur")!.hoursPerEmployee / heures;
  const salaire = code.startsWith("conseil") ? s.hr!.salaryPerEmployeePerRound / jours : 0;
  const flux = t.capacityPerUnit * (marge - salaire) - (t.chargeFixeParTour ?? 0);
  const prix = t.costPerUnit;
  const i = s.finance.loanAnnualRate / 4;
  let interets = 0;
  for (let k = 0; k < TRIMESTRES; k++) interets += (i * prix * (TRIMESTRES - k)) / TRIMESTRES;
  const cb = conditionsDuCreditBail(s, t);
  let actualise = cb.option / Math.pow(1 + i, TRIMESTRES);
  for (let k = 1; k <= TRIMESTRES; k++) actualise += cb.loyer / Math.pow(1 + i, k);
  return {
    prix,
    depart: { comptant: -prix, emprunt: 0, creditBail: 0 },
    cumul: {
      comptant: TRIMESTRES * flux - prix,
      emprunt: TRIMESTRES * flux - prix - interets,
      creditBail: TRIMESTRES * flux - TRIMESTRES * cb.loyer - cb.option,
    },
    /** Les loyers et l'option, actualisés au taux de la banque, rapportés au prix. */
    surcout: actualise / prix - 1,
  };
}

describe("acheter, emprunter ou prendre en crédit-bail une machine pleinement vendue", () => {
  for (const code of CODES) {
    it(`${code} : le crédit-bail préserve la trésorerie du départ et coûte un peu plus qu'un emprunt`, () => {
      const c = comparaison(code);
      expect(c.depart.creditBail).toBe(0);
      expect(c.depart.comptant).toBe(-c.prix);
      // Le comptant ne paie aucun financement ; l'emprunt, ses intérêts ; le crédit-bail, un peu plus.
      expect(c.cumul.comptant).toBeGreaterThan(c.cumul.emprunt);
      expect(c.cumul.emprunt).toBeGreaterThan(c.cumul.creditBail);
      expect(c.cumul.emprunt - c.cumul.creditBail).toBeLessThan(0.05 * c.prix);
      // Actualisé au taux de la banque, environ 2,4 % du prix de plus.
      expect(c.surcout).toBeGreaterThan(0.02);
      expect(c.surcout).toBeLessThan(0.03);
    });
  }
});
