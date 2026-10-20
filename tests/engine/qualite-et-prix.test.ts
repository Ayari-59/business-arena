import { describe, expect, it } from "vitest";
import { SCENARIOS, type ScenarioDefinition } from "@/config/scenarios/registry";
import { applyMarketScale } from "@/config/scenarios/market-scale";
import { botDecisions, neutralDecisions } from "@/engine/bots";
import { aLaMesureDuNiveau } from "@/engine/bots/leviers";
import { simulateRound } from "@/engine/simulation";
import { presetByLevel } from "@/config/difficulty";
import type { CompanyState, EventInstance, RoundDecisions } from "@/engine/types";

/**
 * CE QUE L'AIDE DU BUDGET QUALITÉ AFFIRME, LE MOTEUR LE FAIT.
 *
 * L'aide dit trois choses (`config/qualite.ts`) :
 *
 *  1. à prix inchangé, le surcroît de clients couvre RAREMENT la dépense ;
 *  2. la qualité devient rentable quand elle permet de vendre plus cher ;
 *  3. et seulement là où la clientèle y tient.
 *
 * Chacune se mesure ici, sur les quinze secteurs, au niveau 2 (celui qui
 * ouvre la qualité), sur douze tours, face aux concurrents pilotés, toutes
 * les autres décisions étant celles de la gestion neutre du secteur
 * (`neutralDecisions`, dont la qualité est le point de comparaison ; la
 * qualité que le formulaire propose a sa propre mesure, en partie solo :
 * `tests/engine/qualite-proposee-mesure.test.ts`). Si un
 * recalibrage rend l'une d'elles fausse, ce test tombe : c'est l'aide qu'il
 * faut alors réécrire, pas ce test.
 */

const GRAINE = 20_261_009;
const TOURS = 12;
const leviers = presetByLevel.get(2)!.decisions;

function resultatCumule(def: ScenarioDefinition, facteurQualite: number, facteurPrix: number): number {
  const scenario = applyMarketScale(def.scenario, 1 + def.bots.length);
  let companies: CompanyState[] = [
    def.company("eleve", "Élève", "human"),
    ...def.bots.map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const profils = new Map(def.bots.map((b) => [b.id, b.profile]));
  let actifs: EventInstance[] = [];
  let cumul = 0;
  for (let tour = 1; tour <= TOURS; tour += 1) {
    const etat = companies.find((c) => c.id === "eleve")!;
    const neutre = neutralDecisions({ scenario, state: etat, roundIndex: tour });
    const modifie: RoundDecisions = {
      ...neutre,
      qualityBudget: neutre.qualityBudget * facteurQualite,
      price: neutre.price * facteurPrix,
      ...(neutre.products
        ? {
            products: Object.fromEntries(
              Object.entries(neutre.products).map(([k, p]) => [
                k,
                { ...p, qualityBudget: (p.qualityBudget ?? 0) * facteurQualite, price: p.price * facteurPrix },
              ]),
            ),
          }
        : {}),
    };
    const decisions: Record<string, RoundDecisions> = {
      eleve: aLaMesureDuNiveau(modifie, leviers, neutre),
    };
    for (const c of companies) {
      const p = profils.get(c.id);
      if (p !== undefined) decisions[c.id] = botDecisions(p, { scenario, state: c, roundIndex: tour, leviers });
    }
    const out = simulateRound({ scenario, roundIndex: tour, companies, decisions, activeEvents: actifs, seed: GRAINE });
    cumul += out.results.eleve!.incomeStatement.netIncome;
    companies = out.companies;
    actifs = out.events;
  }
  return cumul;
}

const QUALITES = [0.5, 1, 2, 3];

/** La qualité paie-t-elle à ce prix ? Un budget positif fait mieux que zéro. */
const laQualitePaie = (def: ScenarioDefinition, facteurPrix: number) => {
  const sans = resultatCumule(def, 0, facteurPrix);
  return QUALITES.some((q) => resultatCumule(def, q, facteurPrix) > sans);
};

describe("ce que l'aide du budget qualité affirme", () => {
  it("à prix inchangé, la qualité couvre rarement sa dépense (au plus un secteur sur cinq)", () => {
    const gagnants = SCENARIOS.filter((def) => laQualitePaie(def, 1));
    expect(gagnants.length).toBeLessThanOrEqual(SCENARIOS.length / 5);
  }, 120_000);

  it("en vendant plus cher, elle devient rentable dans une part réelle des secteurs", () => {
    const gagnants = SCENARIOS.filter((def) => laQualitePaie(def, 1.2));
    expect(gagnants.length).toBeGreaterThanOrEqual(SCENARIOS.length / 3);
  }, 120_000);

  it("et seulement là où la clientèle y tient : il existe un secteur où elle ne paie à aucun prix", () => {
    const jamais = SCENARIOS.filter((def) => [1, 1.1, 1.2, 1.3].every((fp) => !laQualitePaie(def, fp)));
    expect(jamais.length).toBeGreaterThanOrEqual(1);
  }, 120_000);
});
