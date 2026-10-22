import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { composerLeScenarioJoue } from "../../src/config/scenarios/scenario-joue";
import { parseScenarioConfig } from "../../src/config/scenarios/schema";
import { prolongerLaSaison, TOURS_MAX_AU_TRIMESTRE } from "../../src/config/scenarios/rounds";
import { computePotentialDemand, facteurDeCroissance } from "../../src/engine/market/demand";
import type { EngineScenarioConfig, SegmentConfig } from "../../src/engine/types";

/**
 * UNE PARTIE PLUS LONGUE QUE SON SCÉNARIO (décision du propriétaire : jusqu'à douze
 * tours, au trimestre seulement ; au-delà des tours écrits, des tours de gestion).
 *
 * Ce qui la tient : l'année du métier revient tous les quatre tours, le marché arrête
 * de croître au dernier tour écrit, et une partie de six tours ou moins reste celle
 * d'avant, au bit près.
 */

const reglages = (def: (typeof SCENARIOS)[number], roundsCount?: number, periodicity: "month" | "quarter" | "year" = "quarter") => ({
  scenario: def.scenario,
  seed: 4242,
  variableWorld: false,
  level: 4,
  concurrents: 3,
  periodicity,
  ...(roundsCount === undefined ? {} : { roundsCount }),
});

/** Chaque tableau de saison du scénario, avec le segment qui le porte s'il y en a un. */
const tableaux = (s: EngineScenarioConfig): { nom: string; valeurs: number[]; segment?: SegmentConfig }[] => [
  { nom: "marché", valeurs: s.market.seasonality },
  ...s.market.segments.flatMap((g) => (g.seasonality ? [{ nom: g.name, valeurs: g.seasonality, segment: g }] : [])),
  ...(s.products ?? []).flatMap((p) => [
    ...(p.market.seasonality ? [{ nom: p.name, valeurs: p.market.seasonality }] : []),
    ...p.market.segments.flatMap((g) => (g.seasonality ? [{ nom: `${p.name} · ${g.name}`, valeurs: g.seasonality, segment: g }] : [])),
  ]),
  ...(s.subscription?.churnSeasonality ? [{ nom: "attrition", valeurs: s.subscription.churnSeasonality }] : []),
];

const segments = (s: EngineScenarioConfig): SegmentConfig[] => [
  ...s.market.segments,
  ...(s.products ?? []).flatMap((p) => p.market.segments),
];

describe("une partie de six tours ou moins ne change pas", () => {
  for (const def of SCENARIOS) {
    it(`${def.code} : l'instantané est celui d'avant, à toutes les durées demandées jusqu'à six`, () => {
      const avant = composerLeScenarioJoue(reglages(def));
      for (const n of [1, 3, 6]) {
        const joue = composerLeScenarioJoue(reglages(def, n));
        expect(joue, `${n} tours`).toEqual({ ...avant, roundsCount: n });
        expect(segments(joue).some((g) => g.croissanceJusquAuTour !== undefined), `${n} tours`).toBe(false);
      }
    });
  }
});

describe("au trimestre, douze tours : l'année du métier se répète", () => {
  for (const def of SCENARIOS) {
    const ecrits = def.scenario.roundsCount;
    const long = composerLeScenarioJoue(reglages(def, TOURS_MAX_AU_TRIMESTRE));
    const court = composerLeScenarioJoue(reglages(def));

    it(`${def.code} : douze valeurs par tableau ; les tours écrits gardent les leurs, les suivants répètent une année`, () => {
      expect(long.roundsCount).toBe(TOURS_MAX_AU_TRIMESTRE);
      const avant = tableaux(court);
      const apres = tableaux(long);
      expect(apres.map((t) => t.nom)).toEqual(avant.map((t) => t.nom));
      apres.forEach((t, i) => {
        const ecrit = avant[i]!.valeurs;
        expect(t.valeurs, t.nom).toHaveLength(TOURS_MAX_AU_TRIMESTRE);
        expect(t.valeurs.slice(0, ecrit.length), t.nom).toEqual(ecrit);
        // L'année revient tous les quatre tours : après la première année répétée, le
        // tour t vaut le tour t − 4.
        for (let tour = ecrit.length + 5; tour <= TOURS_MAX_AU_TRIMESTRE; tour += 1) {
          expect(t.valeurs[tour - 1], `${t.nom}, tour ${tour}`).toBe(t.valeurs[tour - 5]);
        }
      });
    });

    it(`${def.code} : le marché arrête de croître au tour ${ecrits}, la saison continue`, () => {
      for (const g of segments(long)) {
        expect(g.croissanceJusquAuTour, g.name).toBe(ecrits);
        for (let tour = ecrits; tour <= TOURS_MAX_AU_TRIMESTRE; tour += 1) {
          expect(facteurDeCroissance(g, tour), `${g.name}, tour ${tour}`).toBe(facteurDeCroissance(g, ecrits));
        }
        // Le cas mord : sans l'arrêt, le segment croîtrait encore.
        if (g.growth > 0) expect(facteurDeCroissance({ growth: g.growth }, TOURS_MAX_AU_TRIMESTRE)).toBeGreaterThan(facteurDeCroissance(g, TOURS_MAX_AU_TRIMESTRE));
        const saison = g.seasonality ?? long.market.seasonality;
        expect(computePotentialDemand(g, 8, long.market.seasonality, 1), `${g.name}, tour 8`).toBeCloseTo(
          g.size * facteurDeCroissance(g, ecrits) * saison[7]!,
          6,
        );
      }
    });

    it(`${def.code} : la partie enregistrée garde l'arrêt de la croissance`, () => {
      const relu = parseScenarioConfig(JSON.parse(JSON.stringify(long)));
      expect(segments(relu).map((g) => g.croissanceJusquAuTour)).toEqual(segments(long).map((g) => g.croissanceJusquAuTour));
      expect(tableaux(relu).map((t) => t.valeurs)).toEqual(tableaux(long).map((t) => t.valeurs));
    });
  }
});

describe("au mois et à l'année, une partie ne s'allonge pas", () => {
  for (const def of SCENARIOS.slice(0, 3)) {
    for (const p of ["month", "year"] as const) {
      it(`${def.code} ${p} : douze tours demandés, ${def.scenario.roundsCount} joués, rien de prolongé`, () => {
        const joue = composerLeScenarioJoue(reglages(def, TOURS_MAX_AU_TRIMESTRE, p));
        expect(joue).toEqual(composerLeScenarioJoue(reglages(def, undefined, p)));
      });
    }
  }
});

describe("un tableau qui raconte une ouverture écrit l'année qui suit", () => {
  it("chaque segment dont la saison compte un zéro (il ouvre ou ferme en cours de partie) déclare son année suivante, sans zéro", () => {
    const sansAnnee: string[] = [];
    for (const def of SCENARIOS) {
      for (const t of tableaux(def.scenario)) {
        if (!t.valeurs.includes(0)) continue;
        const annee = t.segment?.saisonDesAnneesSuivantes;
        if (!annee) sansAnnee.push(`${def.code} · ${t.nom}`);
        else expect(annee, `${def.code} · ${t.nom}`).not.toContain(0);
      }
    }
    expect(sansAnnee).toEqual([]);
  });

  it("CampusTech (NOVA) : le tour 7 est un troisième trimestre courant, pas un second lancement", () => {
    const nova = SCENARIOS.find((d) => d.code === "nova")!;
    const long = composerLeScenarioJoue(reglages(nova, TOURS_MAX_AU_TRIMESTRE));
    const campus = long.market.segments.find((g) => g.seasonality?.includes(0))!;
    expect(campus.seasonality).toEqual([0, 0, 0.25, 1.4, 1, 1, 1, 1.4, 1, 1, 1, 1.4]);
    expect("saisonDesAnneesSuivantes" in campus).toBe(false);
  });

  it("une saison trop courte pour dire une année, ou une année mal comptée, est refusée", () => {
    expect(() => prolongerLaSaison([1, 2, 3], 8)).toThrow(/année entière/);
    expect(() => prolongerLaSaison([1, 1, 1, 1, 1, 1], 8, [1, 1, 1])).toThrow(/4 trimestres/);
    expect(prolongerLaSaison([1, 2, 3, 4, 5, 6], 6)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
