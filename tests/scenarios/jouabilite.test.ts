import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { simulateRound } from "../../src/engine/simulation";
import { botDecisions, neutralDecisions } from "../../src/engine/bots";
import { balanceGap } from "../../src/engine/finance/statements";
import type { CompanyState, RoundDecisions } from "../../src/engine/types";

/**
 * CHAQUE SCÉNARIO SE JOUE VRAIMENT, DU PREMIER AU DERNIER TOUR.
 *
 * Le registre garde la FORME d'un scénario : ses situations, son vocabulaire,
 * son bilan d'ouverture équilibré. Rien ne garantissait qu'il TOURNE. Un
 * secteur peut satisfaire toutes ces règles et se révéler injouable à
 * l'usage : une capacité si basse que rien ne se vend, un prix de référence
 * sous le coût variable, une structure qu'aucun volume atteignable ne couvre.
 * L'enseignant le découvrirait devant sa classe, au tour trois.
 *
 * Ce test joue la partie entière de chaque secteur, avec les décisions
 * neutres que le moteur applique à une équipe absente. Il ne juge pas la
 * performance : il vérifie que le monde tient debout et que le marché répond.
 */
describe("jouabilité de chaque secteur", () => {
  for (const d of SCENARIOS) {
    it(`${d.code} se joue de bout en bout sans casser`, () => {
      let companies: CompanyState[] = [
        d.company("player", d.playerTeamName, "human"),
        ...d.bots.map((b) => d.company(b.id, b.name, "bot", b.profile)),
      ];
      // Le profil vient du registre, pas de l'état : `botProfile` y est
      // stocké sans le type, et le deviner à la lecture ferait mentir le test.
      const profils = new Map(d.bots.map((b) => [b.id, b.profile]));
      let lastSold: number | undefined;
      const ventes: number[] = [];

      for (let round = 1; round <= d.scenario.roundsCount; round += 1) {
        const decisions: Record<string, RoundDecisions> = {};
        for (const c of companies) {
          const ctx = { scenario: d.scenario, state: c, roundIndex: round, lastSoldUnits: lastSold };
          const profil = profils.get(c.id);
          decisions[c.id] =
            profil === undefined ? neutralDecisions(ctx) : botDecisions(profil, ctx);
        }

        const out = simulateRound({
          scenario: d.scenario,
          roundIndex: round,
          companies,
          decisions,
          activeEvents: [],
          seed: 7,
        });

        const moi = out.results["player"]!;
        // Le moteur lève déjà sur un bilan déséquilibré ; on le revérifie ici
        // pour que l'échec nomme le secteur et le tour.
        expect(
          Math.abs(balanceGap(moi.balanceSheet)),
          `${d.code}, tour ${round} : bilan déséquilibré`,
        ).toBeLessThan(0.01);

        const vendu = Object.values(moi.market.bySegment).reduce((s, x) => s + x.sold, 0);
        ventes.push(vendu);
        expect(
          Number.isFinite(moi.incomeStatement.netIncome),
          `${d.code}, tour ${round} : résultat non fini`,
        ).toBe(true);
        expect(
          moi.production.machineCapacity,
          `${d.code}, tour ${round} : capacité nulle`,
        ).toBeGreaterThan(0);

        lastSold = vendu;
        companies = out.companies;
      }

      // Le marché doit répondre : un secteur où l'on ne vend rien en jouant
      // neutre est un secteur mal calibré, pas un secteur difficile.
      expect(ventes[0], `${d.code} : aucune vente au premier tour`).toBeGreaterThan(0);
      const total = ventes.reduce((s, v) => s + v, 0);
      expect(total, `${d.code} : ventes cumulées nulles`).toBeGreaterThan(0);
    });
  }

  it("aucun secteur ne vend à perte dès la première unité", () => {
    // Le prix de référence du segment principal doit couvrir le coût variable,
    // sinon toute vente appauvrit et le seuil de rentabilité n'existe pas.
    for (const d of SCENARIOS) {
      const s = d.scenario;
      const principal = [...s.market.segments].sort((a, b) => b.size - a.size)[0]!;
      const variable = s.product.materialCostPerUnit + s.product.otherVariableCostPerUnit;
      expect(
        principal.refPrice,
        `${d.code} : prix de référence (${principal.refPrice}) sous le coût variable (${variable})`,
      ).toBeGreaterThan(variable);
    }
  });

  it("la structure de chaque secteur est couvrable par sa capacité", () => {
    // Seuil de rentabilité en unités, comparé à ce que l'entreprise peut
    // produire. Au-delà de la capacité, aucune décision ne rend le secteur
    // bénéficiaire : ce ne serait plus un jeu de gestion, mais un piège.
    for (const d of SCENARIOS) {
      const s = d.scenario;
      const principal = [...s.market.segments].sort((a, b) => b.size - a.size)[0]!;
      const marge =
        principal.refPrice - s.product.materialCostPerUnit - s.product.otherVariableCostPerUnit;
      const seuil = s.fixedCostsPerRound / marge;
      const c = d.company("player", d.playerTeamName, "human");
      const capacite = Math.min(
        c.machineCapacity,
        (c.headcount * c.hoursPerEmployee) / s.product.hoursPerUnit,
      );
      expect(
        seuil,
        `${d.code} : seuil de ${Math.round(seuil)} pour une capacité de ${Math.round(capacite)}`,
      ).toBeLessThan(capacite);
    }
  });
});
