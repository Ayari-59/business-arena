import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { simulateRound } from "../../src/engine/simulation";
import { toGamme } from "../../src/engine/gamme";
import type { CompanyState, RoundDecisions } from "../../src/engine/types";

/**
 * MULTIPLIER SES PRIX PAR DIX NE DOIT PAS ÊTRE LA MEILLEURE STRATÉGIE.
 *
 * C'était pourtant le cas. Sur NOVA, un prix à ×10 vendait encore 918 unités,
 * faisait 541 914 € de chiffre d'affaires et 296 258 € de résultat net — là où
 * le prix juste en perdait 17 500. Deux gardes du modèle se retournaient
 * contre le jeu :
 *
 *  - `priceEffectBounds.min` RELÈVE l'attraction au lieu de la laisser tomber.
 *    À ×10, l'effet brut valait 0,006 chez les étudiants ; le plancher le
 *    remontait à 0,15.
 *  - une élasticité faible (les passionnés à −0,7) laissait de toute façon un
 *    cinquième de l'attraction au même prix, plancher ou pas.
 *
 * Un élève qui trouve ça n'apprend rien, et il le trouve vite. Ce test le
 * cherche à sa place, sur TOUS les secteurs, parce que la faute était dans le
 * modèle commun et qu'elle les touchait donc tous.
 */

const BASE = (prix: number, volume: number): RoundDecisions => ({
  price: prix,
  productionPlan: volume,
  marketingBudget: 0,
  qualityBudget: 0,
  maintenanceBudget: 0,
});

/** Le prix usuel du scénario : celui de la clientèle la plus nombreuse. */
function prixUsuel(code: string): number {
  const d = SCENARIOS.find((s) => s.code === code)!;
  const segments = toGamme(d.scenario).flatMap((p) => p.market.segments);
  return [...segments].sort((a, b) => b.size - a.size)[0]!.refPrice;
}

function jouer(code: string, prix: number) {
  const d = SCENARIOS.find((s) => s.code === code)!;
  const companies: CompanyState[] = [
    d.company("moi", "Moi", "human"),
    ...d.bots.slice(0, 1).map((b) => d.company(b.id, b.name, "bot", b.profile)),
  ];
  const usuel = prixUsuel(code);
  const volume = Math.max(1, Math.round(d.scenario.market.segments[0]!.size / 2));
  return simulateRound({
    scenario: d.scenario,
    roundIndex: 1,
    companies,
    decisions: Object.fromEntries(
      companies.map((c) => [c.id, BASE(c.id === "moi" ? prix : usuel, volume)]),
    ),
    activeEvents: [],
    seed: 42,
  }).results["moi"]!;
}

/**
 * On mesure l'ATTRACTION, pas les unités vendues. C'est elle que `priceEffect`
 * nourrit, et elle seule dit si la clientèle veut encore du produit. Les
 * volumes, eux, dépendent de la capacité : VOLT FITNESS a ses places prises
 * par ses adhérents d'un tour sur l'autre et vendrait zéro à son propre prix
 * de référence, ce qui ferait échouer un test juste pour une mauvaise raison.
 */
const attractionTotale = (r: ReturnType<typeof jouer>) =>
  Object.values(r.market.bySegment).reduce((somme, d) => somme + d.attraction, 0);

describe("un prix absurde ne rapporte rien", () => {
  for (const d of SCENARIOS) {
    it(`${d.code} : à dix fois le prix usuel, plus aucune clientèle ne veut du produit`, () => {
      const attraction = attractionTotale(jouer(d.code, prixUsuel(d.code) * 10));
      expect(attraction, `${d.code} garde ${attraction.toFixed(3)} d'attraction à ×10`).toBe(0);
    });

    it(`${d.code} : au prix usuel, le marché répond`, () => {
      // Le revers du correctif : à force de fermer la porte haute, on pourrait
      // fermer le jeu.
      const attraction = attractionTotale(jouer(d.code, prixUsuel(d.code)));
      expect(attraction, `${d.code} n'attire personne à son propre prix`).toBeGreaterThan(0);
    });
  }
});
