import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { composerLeScenarioJoue } from "../../src/config/scenarios/scenario-joue";
import {
  applyPeriodicityToCompany,
  PERIODICITY_DAYS,
  type Periodicity,
} from "../../src/config/scenarios/periodicity";
import { situationDeLaPartie, textesDe } from "../../src/config/scenarios/situation-texte";
import { isProductAvailable } from "../../src/engine/gamme";
import type { EngineScenarioConfig, ProductDef } from "../../src/engine/types";
import type { SituationDef } from "../../src/config/scenarios/situation-kit";
import { corrigerLesDates } from "./corrections-des-dates";

/**
 * LES SITUATIONS DE NOVA ET DE NOVA · GAMME SUIVENT LA DURÉE DU TOUR DE LEUR PARTIE.
 *
 * Au mois, le moteur donne à l'atelier de NOVA 2 333 enceintes par tour, met
 * l'investissement capacitaire à 667 unités amorties sur 48 tours, actualise
 * l'étude de projet à 0,42 % par tour, facture la plateforme de la NOVA Home
 * 2 667 € et ne la met pas en vente avant le tour 7 (son tour de disponibilité
 * et sa durée minimale de développement sont recomptés en tours par
 * `applyPeriodicity`). Les énoncés disaient 7 000, 2 000, 16 trimestres,
 * 1,25 %, 8 000 € et « tour 3 » quelle que soit la partie. Cette garde rend
 * chaque situation au mois, au trimestre et à l'année, et vérifie :
 *  · que chaque montant en euros cité est l'un de ceux recalculés ici depuis le
 *    scénario JOUÉ à cette durée (`composerLeScenarioJoue`, monde figé), ou un
 *    invariant vérifié par le calcul ;
 *  · que les tours, capacités et taux cités sont ceux du moteur ;
 *  · qu'aucun « trimestre » ne reste au mois ni à l'année, et qu'aucun jeton
 *    n'atteint l'écran ;
 *  · qu'au trimestre, le texte est octet pour octet celui d'avant les jetons
 *    (tests/fixtures/situations-nova-courriers-au-trimestre.json, relevé sur
 *    1c6bc002 avant toute modification), aux seules corrections près des
 *    situations détectées de NOVA · GAMME, qui supposaient au trimestre même un
 *    pic passé que le tour n'avait pas (décision du propriétaire,
 *    `corrections-des-dates.ts`).
 */

const DUREES: Periodicity[] = ["month", "quarter", "year"];
const NOM: Record<Periodicity, string> = { month: "au mois", quarter: "au trimestre", year: "à l'année" };
const nova = scenarioByCode("nova");
const gamme = scenarioByCode("nova-gamme");
const AVANT = JSON.parse(
  readFileSync(new URL("../fixtures/situations-nova-courriers-au-trimestre.json", import.meta.url), "utf-8"),
) as Record<string, string[]>;

/** L'instantané qu'une partie fige à cette durée, monde figé. */
const joue = (scenario: EngineScenarioConfig, periodicity: Periodicity, level?: number): EngineScenarioConfig =>
  composerLeScenarioJoue({ scenario, seed: 7, concurrents: 3, periodicity, ...(level ? { level } : {}) });

const milliers = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const auCentieme = (x: number) =>
  (Math.round(x * 10000) / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2, useGrouping: false });

/** Tous les montants en euros d'un texte : « 38 € », « 40 000 € », « 59,90 € ». */
const euros = (t: string) => [...t.matchAll(/(\d{1,3}(?: \d{3})*(?:,\d+)?) €/g)].map((m) => m[1]!);
/** Les numéros de tour cités : « au tour 3 », « le pic du tour 4 ». */
const tours = (t: string) => [...t.matchAll(/\btour (\d+)/g)].map((m) => Number(m[1]));

const produit = (s: EngineScenarioConfig, code: string): ProductDef => {
  const p = s.products?.find((x) => x.code === code);
  if (!p) throw new Error(`${code} absent de l'instantané`);
  return p;
};

/**
 * Le premier tour de vente d'une référence en développement, lu de
 * l'instantané : la R&D cumulée des tours passés (`partFinancee` à la fin de
 * chaque tour), démarrage au tour 1, retard de certification non tiré.
 */
function premiereVente(p: ProductDef, partFinancee: (tour: number) => number): number {
  for (let tour = 2; tour < 100; tour++) {
    const rd = { invested: p.development!.cost * partFinancee(tour - 1), launched: false, techLevel: 0, demarreAuTour: 1 };
    if (isProductAvailable(p, rd, tour)) return tour;
  }
  throw new Error("jamais en vente");
}

/** Ce que le moteur fait à cette durée, recalculé de l'instantané sans passer par le module des jetons. */
function moteur(periodicity: Periodicity) {
  const s = joue(nova.scenario, periodicity);
  const inv = s.investment!;
  const niveau7 = joue(gamme.scenario, periodicity, 7);
  const niveau5 = joue(gamme.scenario, periodicity, 5);
  const home = produit(niveau7, "nova-home");
  const plateforme = (niveau7.groupe as { nouveautes?: { code: string; plateforme: { coutFixeParTour: number } }[] })
    .nouveautes!.find((n) => n.code === "nova-home")!.plateforme.coutFixeParTour;
  return {
    capacite: applyPeriodicityToCompany(nova.company("t", "T", "human"), periodicity).machineCapacity,
    lignes: inv.maxPerRound,
    decaissement: inv.maxPerRound * inv.costPerCapacityUnit,
    // L'étude de projet (game-view.service) : le taux d'emprunt au prorata du tour, sur la durée d'amortissement.
    tauxDuTour: (s.finance.loanAnnualRate * s.roundDays) / 360,
    toursDAmortissement: Math.round(inv.depreciationRounds),
    plateforme,
    homeAuPlusTot: premiereVente(home, () => 1),
    homeParEtapes: premiereVente(home, (tour) => (tour >= 2 ? 1 : 1 / 3)),
    studio: premiereVente(produit(niveau5, "nova-studio"), () => 1),
  };
}

/**
 * Ce que la durée ne change pas, vérifié par le calcul à chaque durée dans le
 * test « les invariants » : prix et coûts unitaires (hors abonnement, ils ne
 * bougent pas), sous-traitance, coût de développement de la Home et ses
 * tranches, montant de l'investissement, effet d'une hausse de 20 % des
 * composants sur la Go et la Studio. Plus les chiffres du seul récit, qui
 * ne portent pas de durée : seuils psychologiques (50, 60, 59,90, 60,10) et le
 * parallèle de rentabilité (20 000 / 200 000 contre 30 000 / 500 000).
 */
const INVARIANTS = new Set([
  "38", "22", "16", "52", "59", "21", "7", "15", "36", "80", "70", "100", "90 000", "30 000", "60 000",
  "2", "10", "50", "60", "59,90", "60,10", "20 000", "200 000", "500 000",
]);

const SITUATIONS: SituationDef[] = [...nova.situations, ...gamme.situations];

describe("NOVA et NOVA · GAMME : chaque situation se rend à la durée du tour de sa partie", () => {
  for (const periodicity of DUREES) {
    const m = moteur(periodicity);
    const attendus = new Set([milliers(m.decaissement), milliers(m.plateforme)]);

    describe(NOM[periodicity], () => {
      for (const def of SITUATIONS) {
        const rendue = situationDeLaPartie(def, PERIODICITY_DAYS[periodicity]);
        const textes = textesDe(rendue);

        it(`${def.code} : chaque montant cité est celui du scénario joué`, () => {
          for (const t of textes) {
            for (const e of euros(t)) {
              expect(attendus.has(e) || INVARIANTS.has(e), `« ${e} € » dans « ${t} »`).toBe(true);
            }
          }
        });

        it(`${def.code} : aucun jeton n'atteint l'écran${periodicity === "quarter" ? "" : ", aucun trimestre ne reste"}`, () => {
          for (const t of textes) {
            expect(t, t).not.toMatch(/\{\{|\}\}/);
            if (periodicity !== "quarter") expect(t, t).not.toMatch(/trimestr/i);
          }
        });

        it(`${def.code} : aucun tour ne bouge, sauf ceux que le moteur recompte`, () => {
          const avant = new Set(AVANT[def.code]!.flatMap(tours));
          const recomptes = new Set([m.homeAuPlusTot, m.homeParEtapes, m.studio]);
          for (const t of textes) {
            for (const n of tours(t)) expect(avant.has(n) || recomptes.has(n), `tour ${n} dans « ${t} »`).toBe(true);
          }
        });
      }

      it("l'atelier, l'investissement et l'étude de projet sont ceux du moteur", () => {
        const t3 = situationDeLaPartie(nova.situations.find((d) => d.code === "nova_t3_capacity")!, PERIODICITY_DAYS[periodicity]);
        // Au mois sur le calendrier, le pic n'est pas le tour qui suit (textes-au-calendrier.test.ts).
        const pic = periodicity === "month" ? "le pic à venir" : "le pic du tour 4";
        expect(t3.hints[4]!.text).toContain(`${pic} dépassera largement vos ${milliers(m.capacite)} unités`);
        const sat = situationDeLaPartie(
          nova.situations.find((d) => d.code === "detect_capacity_saturated")!,
          PERIODICITY_DAYS[periodicity],
        );
        // 2 000 unités par trimestre font 666,67 par mois : le moteur n'en ajoute pas 667.
        const juste = Number.isInteger(Number(m.lignes.toFixed(9)));
        expect(sat.narrative).toContain(`propose ${juste ? "" : "environ "}${milliers(m.lignes)} unités de capacité`);
        expect(juste, periodicity).toBe(periodicity !== "month");
        expect(sat.narrative).toContain(`pour ${milliers(m.decaissement)} €, amortis sur ${m.toursDAmortissement} `);
        expect(sat.hints[4]!.text).toContain(
          `VAN ≈ −${milliers(m.decaissement)} + Σ (unités supplémentaires vendues × marge unitaire) / (1 + ${auCentieme(m.tauxDuTour)} %)^t sur ${m.toursDAmortissement} `,
        );
      });

      it("la NOVA Home se lance et se paie au tour que le moteur dit", () => {
        const lancer = situationDeLaPartie(gamme.situations.find((d) => d.code === "novag7_t1_home")!, PERIODICITY_DAYS[periodicity]);
        const textes = textesDe(lancer).join(" ");
        expect(textes).toContain(`garder le droit de lancer au tour ${m.homeParEtapes},`);
        expect(textes).toContain(`la première vente reste possible au tour ${m.homeParEtapes}.`);
        expect(textes).toContain(`garde le lancement du tour ${m.homeParEtapes} ;`);
        expect(textes).toContain(`au tour ${m.homeAuPlusTot} au plus tôt,`);
        const rayon = situationDeLaPartie(gamme.situations.find((d) => d.code === "novag7_home_en_rayon")!, PERIODICITY_DAYS[periodicity]);
        expect(rayon.narrative).toContain(`coûte ${milliers(m.plateforme)} € par tour`);
        expect(rayon.hints[4]!.text).toContain(`retranchez les ${milliers(m.plateforme)} € de plateforme`);
      });

      it("la Studio financée au tour 1 se vend au tour que le moteur dit", () => {
        const reprise = situationDeLaPartie(gamme.situations.find((d) => d.code === "novag_t1_reprise")!, PERIODICITY_DAYS[periodicity]);
        expect(reprise.hints[4]!.text).toContain(
          `financée dès ce tour, elle se vend ${m.studio === 2 ? "au suivant" : `au tour ${m.studio}`}.`,
        );
      });
    });
  }

  it("au mois, le moteur recompte la NOVA Home en tours : pas de vente avant le tour 7", () => {
    // Mesuré sur l'instantané : tour de disponibilité 3 → 7, durée minimale 2 → 6.
    const home = produit(joue(gamme.scenario, "month", 7), "nova-home");
    expect(home.development).toMatchObject({ availableFromRound: 7, dureeMinimale: 6 });
    expect(moteur("month")).toMatchObject({ homeAuPlusTot: 7, homeParEtapes: 7, studio: 4, plateforme: 8000 / 3 });
    expect(moteur("quarter")).toMatchObject({ homeAuPlusTot: 3, homeParEtapes: 3, studio: 2, plateforme: 8000 });
  });

  it("au trimestre, le texte est octet pour octet celui d'avant les jetons", () => {
    expect(Object.keys(AVANT).sort()).toEqual(SITUATIONS.map((d) => d.code).sort());
    for (const def of SITUATIONS) {
      expect(textesDe(situationDeLaPartie(def, 90)), def.code).toEqual(corrigerLesDates(def.code, AVANT[def.code]!));
      // Le registre porte le texte au trimestre : catalogue, éditeur et référentiel semé le lisent.
      expect(textesDe(def), def.code).toEqual(corrigerLesDates(def.code, AVANT[def.code]!));
    }
  });

  it("les invariants : ce que l'énoncé écrit en clair vaut à toutes les durées", () => {
    for (const periodicity of DUREES) {
      const s = joue(nova.scenario, periodicity);
      const niveau7 = joue(gamme.scenario, periodicity, 7);
      const p = s.product;
      expect([p.materialCostPerUnit, p.otherVariableCostPerUnit], periodicity).toEqual([22, 16]);
      expect(p.materialCostPerUnit + p.otherVariableCostPerUnit, periodicity).toBe(38);
      expect(s.subcontracting!.unitCost, periodicity).toBe(52);
      expect(s.market.segments.some((x) => x.refPrice === 59), periodicity).toBe(true);
      const marge = (code: string) => {
        const r = produit(niveau7, code);
        return { marge: r.market.segments[0]!.refPrice - r.materialCostPerUnit - r.otherVariableCostPerUnit, heures: r.hoursPerUnit };
      };
      const home = produit(niveau7, "nova-home");
      expect(home.market.segments[0]!.refPrice - home.materialCostPerUnit - home.otherVariableCostPerUnit, periodicity).toBe(36);
      expect(Math.round(36 / home.hoursPerUnit), periodicity).toBe(80);
      expect(home.market.segments[0]!.psychThresholds[0]!.threshold, periodicity).toBe(100);
      expect(home.development!.cost, periodicity).toBe(90000);
      expect(home.development!.cost * home.development!.seuilDeDemarrage!, periodicity).toBe(30000);
      expect(marge("nova-go").marge, periodicity).toBe(15);
      // Une hausse de 20 % des composants : environ 2 € sur la Go, près de 10 € sur la Studio.
      expect(Math.round(produit(niveau7, "nova-go").materialCostPerUnit * 0.2), periodicity).toBe(2);
      expect(Math.round(produit(niveau7, "nova-studio").materialCostPerUnit * 0.2), periodicity).toBe(10);
      expect(Math.round(21 / marge("nova-one").heures), periodicity).toBe(70);
      // L'investissement : la machine coûte le même prix quelle que soit la durée.
      expect(s.investment!.maxPerRound * s.investment!.costPerCapacityUnit, periodicity).toBeCloseTo(40000, 6);
    }
  });
});
