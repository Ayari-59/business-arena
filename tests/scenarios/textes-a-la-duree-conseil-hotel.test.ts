import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { composerLeScenarioJoue } from "../../src/config/scenarios/scenario-joue";
import {
  applyPeriodicityToCompany,
  PERIODICITY_DAYS,
  type Periodicity,
} from "../../src/config/scenarios/periodicity";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { jetonsDe, situationDeLaPartie, sourceDe, textesDe } from "../../src/config/scenarios/situation-texte";
import type { EngineScenarioConfig } from "../../src/engine/types";

/**
 * ATLAS CONSEIL ET L'ESCALE SE LISENT À LA DURÉE DU TOUR DE LEUR PARTIE.
 *
 * Un cabinet vend des jours-consultants, un hôtel des nuitées : la capacité est
 * un FLUX par tour, comme les charges de structure et les salaires. Au mois, le
 * moteur offre 240 jours et 1 800 nuitées ; les énoncés disaient « 720 » et
 * « 5 400 » quelle que soit la partie, et un seuil calculé sur des charges
 * trimestrielles. Cette garde rend chaque situation des quatre scénarios du
 * groupe au mois, au trimestre et à l'année, et vérifie :
 *  · que CHAQUE nombre cité est l'un de ceux que l'on recalcule ici du scénario
 *    JOUÉ à cette durée (l'instantané que la partie fige, monde figé) et de
 *    l'entreprise de départ mise à cette durée comme la création de partie la
 *    met, ou un invariant : vérifié par le calcul ci-dessous quand la
 *    configuration le porte, constante du récit sinon ;
 *  · qu'aucun « trimestre » ne reste au mois ni à l'année, et qu'aucun jeton
 *    n'atteint l'écran ;
 *  · qu'au trimestre, le texte est octet pour octet celui d'avant les jetons
 *    (tests/fixtures/situations-conseil-hotel-au-trimestre.json, relevé sur 1c6bc002),
 *    aux corrections près que nomme `CORRECTIONS`.
 */

const DUREES: Periodicity[] = ["month", "quarter", "year"];
const NOM: Record<Periodicity, string> = { month: "au mois", quarter: "au trimestre", year: "à l'année" };
const AVANT = JSON.parse(
  readFileSync(new URL("../fixtures/situations-conseil-hotel-au-trimestre.json", import.meta.url), "utf-8"),
) as Record<string, string[]>;

/**
 * LES ERREURS QUE LE TEXTE CONTENAIT DÉJÀ AU TRIMESTRE, corrigées et nommées : la
 * fixture garde le texte d'avant, et c'est ici, et nulle part ailleurs, que le texte
 * au trimestre a le droit de s'en écarter.
 */
const CORRECTIONS: { cles: string[]; avant: string; apres: string }[] = [
  {
    // L'ESCALE achète sa capacité en chambres typées (`equipment.types`), et le moteur
    // lit ce parc quand il existe (`engine/investment/plafond.ts`). Le prix d'une
    // nuitée de capacité n'est donc pas un : la standard la vend 89 € (80 000 € ÷ 900),
    // la rénovée 100 € (180 000 € ÷ 1 800), la suite premium 115 € (310 000 € ÷ 2 700).
    // L'énoncé ne citait que la rénovée ; il cite désormais la fourchette lue du parc,
    // à toute durée (test « le prix d'une nuitée de capacité » ci-dessous).
    cles: ["hotel/hotel_detect_capacity_saturated", "hotel-gamme/hotelg_detect_capacity_saturated"],
    avant: "comparez le coût de la capacité (100 € par nuitée trimestrielle)",
    apres: "comparez le coût de la capacité (de 89 à 115 € par nuitée trimestrielle selon le type de chambre)",
  },
];

/** Le texte au trimestre attendu : la fixture, corrections nommées appliquées. */
const attenduAuTrimestre = (cle: string): string[] =>
  AVANT[cle]!.map((t) => CORRECTIONS.filter((c) => c.cles.includes(cle)).reduce((acc, c) => acc.split(c.avant).join(c.apres), t));

/** Le prix d'une nuitée de capacité par tour, du type de chambre le moins cher au plus cher : coût ÷ capacité. */
const prixDuParc = (s: EngineScenarioConfig) => {
  const prix = s.equipment!.types.map((t) => t.costPerUnit / t.capacityPerUnit);
  return { min: Math.min(...prix), max: Math.max(...prix) };
};

/** L'instantané qu'une partie fige à cette durée, monde figé. */
const joue = (code: string, periodicity: Periodicity): EngineScenarioConfig =>
  composerLeScenarioJoue({ scenario: scenarioByCode(code).scenario, seed: 7, concurrents: 6, periodicity });

/** L'entreprise de départ, mise à la durée du tour comme `game-creation.service` la met. */
const depart = (code: string, periodicity: Periodicity) => {
  const d = scenarioByCode(code);
  return applyPeriodicityToCompany(d.company("t", "T", "human"), periodicity, {
    abonnement: d.scenario.subscription !== undefined,
  });
};

const milliers = (n: number) => {
  const r = Math.round(Number(n.toFixed(9)));
  return (r < 0 ? "-" : "") + String(Math.abs(r)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};
const variable = (s: EngineScenarioConfig) => s.product.materialCostPerUnit + s.product.otherVariableCostPerUnit;

/** Ce que l'entreprise de départ vend en un tour : son parc ou ses heures, le plus petit. */
function capacite(code: string, periodicity: Periodicity, s: EngineScenarioConfig): number {
  const e = depart(code, periodicity);
  return Math.min(e.machineCapacity, (e.headcount * e.hoursPerEmployee) / s.product.hoursPerUnit);
}

/** Le TJM moyen et le prix moyen d'une nuitée que les énoncés posent. */
const TJM = 560;
const PRIX_NUITEE = 95;
/** Le volume du récit, écrit au trimestre : les jours vendus d'un cabinet sous son seuil. */
const JOURS_VENDUS = 380;
/** Le distracteur « 65 % d'occupation » de L'ESCALE, écrit au trimestre. */
const NUITEES_65 = 3500;

interface Famille {
  codes: string[];
  /** Les nombres qui suivent la durée du tour, recalculés ici. */
  attendus: (code: string, periodicity: Periodicity) => Set<string>;
  /** Ce que la durée ne change pas : vérifié par le calcul (test « les invariants ») ou constante du récit. */
  invariants: Set<string>;
  /**
   * Les valeurs au trimestre qu'un invariant porte aussi (« 380 € » la journée et
   * « 380 jours » vendus) : le test des nombres ne les distingue pas, un test ciblé
   * ci-dessous les vérifie à chaque durée.
   */
  homonymes: string[];
}

const CONSEIL: Famille = {
  codes: ["conseil", "conseil-gamme"],
  attendus: (code, periodicity) => {
    const s = joue(code, periodicity);
    const e = depart(code, periodicity);
    const cap = capacite(code, periodicity, s);
    const marge = TJM - variable(s);
    const seuil = Math.round(s.fixedCostsPerRound / marge);
    const vendus = Math.round((JOURS_VENDUS * s.roundDays) / 90);
    const jours = e.hoursPerEmployee;
    return new Set(
      [
        cap,
        2 * cap,
        cap * 0.3,
        cap * 0.8,
        jours,
        3 * jours,
        s.fixedCostsPerRound,
        seuil,
        vendus,
        seuil - vendus,
        s.hr!.salaryPerEmployeePerRound,
        Math.round((jours * 0.65 * marge) / 100) * 100,
      ].map(milliers),
    );
  },
  invariants: new Set([
    // Vérifiés par le calcul : TJM, frais, marge, salaire d'une journée, embauche,
    // licenciement, affacturage, banquier, créances, effectif, délai des grands
    // comptes, taux d'occupation d'équilibre et du cabinet sous son seuil, offres de la gamme.
    "560", "90", "470", "210", "8 000", "15 000", "24 000", "2,5", "97 500", "2 500", "13", "2",
    "180 000", "12", "60", "58", "53", "190", "780", "115", "665", "850", "100", "750",
    // Le récit : une proposition à 260 €, une mission à 380 € la journée et 60 jours,
    // 100 000 € mobilisés, un décret à 250 salariés, des pourcentages et leurs écarts.
    "0", "260", "170", "290", "380", "100 000", "250", "15", "30", "65", "80",
  ]),
  homonymes: ["380"],
};

const HOTEL: Famille = {
  codes: ["hotel", "hotel-gamme"],
  attendus: (code, periodicity) => {
    const s = joue(code, periodicity);
    const marge = PRIX_NUITEE - variable(s);
    const auxDizaines = (x: number) => Math.round(x / 10) * 10;
    return new Set(
      [
        capacite(code, periodicity, s),
        s.fixedCostsPerRound,
        auxDizaines(s.fixedCostsPerRound / marge),
        auxDizaines(s.fixedCostsPerRound / PRIX_NUITEE),
        auxDizaines((NUITEES_65 * s.roundDays) / 90),
        s.roundDays,
        10 * s.roundDays,
        prixDuParc(s).min,
        prixDuParc(s).max,
        s.investment!.depreciationRounds,
        360 / s.roundDays,
      ].map(milliers),
    );
  },
  invariants: new Set([
    // Vérifiés par le calcul : prix, coût variable et marge d'une nuitée, banquier,
    // effectif, heures par nuitée, élasticités et saisonnalités citées, crédit
    // immobilier, rénovation et ses flux annuels, chambres de la gamme.
    "95", "21", "74", "12", "2", "14", "0,75", "1,3", "0,7", "1,75", "0,5", "0,3", "2,0", "1,5",
    "900 000", "90 000", "10", "9 000", "159 800", "266 400", "342 000", "60", "26", "39",
    // Le récit : la soirée bradée, la hausse de saturation, la commission, les tarifs
    // de la gamme, les taux d'occupation cités et leurs écarts.
    "0", "17", "18", "58", "37", "140", "101", "105", "82", "85,50", "64,50", "17,5", "15", "0,60",
    "31", "40", "52", "65", "80", "100", "88", "125", "220", "67", "99", "181",
  ]),
  homonymes: ["40"],
};

const nombres = (t: string) => [...t.matchAll(/\d{1,3}(?: \d{3})*(?:,\d+)?/g)].map((m) => m[0]);

for (const famille of [CONSEIL, HOTEL]) {
  for (const code of famille.codes) {
    const d = scenarioByCode(code);
    describe(`${code} : chaque situation se rend à la durée du tour de sa partie`, () => {
      for (const periodicity of DUREES) {
        const attendus = famille.attendus(code, periodicity);
        describe(NOM[periodicity], () => {
          for (const def of d.situations) {
            const textes = textesDe(situationDeLaPartie(def, PERIODICITY_DAYS[periodicity]));

            it(`${def.code} : chaque nombre cité est celui du scénario joué, ou un invariant`, () => {
              for (const t of textes) {
                for (const n of nombres(t)) {
                  expect(attendus.has(n) || famille.invariants.has(n), `« ${n} » dans « ${t} »`).toBe(true);
                }
              }
            });

            it(`${def.code} : aucun jeton n'atteint l'écran${periodicity === "quarter" ? "" : ", aucun trimestre ne reste"}`, () => {
              for (const t of textes) {
                expect(t, t).not.toMatch(/\{\{|\}\}/);
                if (periodicity !== "quarter") expect(t, t).not.toMatch(/trimestr/i);
              }
            });
          }
        });
      }

      it("au trimestre, le texte est octet pour octet celui d'avant les jetons", () => {
        const codes = Object.keys(AVANT).filter((k) => k.startsWith(`${code}/`));
        expect(codes.sort()).toEqual(d.situations.map((s) => `${code}/${s.code}`).sort());
        for (const def of d.situations) {
          expect(textesDe(situationDeLaPartie(def, 90)), def.code).toEqual(attenduAuTrimestre(`${code}/${def.code}`));
          // Le registre porte le texte au trimestre : catalogue, éditeur, référentiel semé.
          expect(textesDe(def), def.code).toEqual(attenduAuTrimestre(`${code}/${def.code}`));
        }
      });
    });
  }

  it(`${famille.codes[0]} : un invariant n'est jamais la valeur au trimestre d'un flux, hors homonymes vérifiés`, () => {
    for (const code of famille.codes) {
      const trimestre = famille.attendus(code, "quarter");
      const ailleurs = new Set([...famille.attendus(code, "month"), ...famille.attendus(code, "year")]);
      const communs = [...trimestre].filter((n) => !ailleurs.has(n) && famille.invariants.has(n));
      expect(communs.sort(), code).toEqual([...famille.homonymes].sort());
    }
  });
}

/** Le texte d'une situation à cette durée, à plat. */
const rendu = (code: string, situation: string, periodicity: Periodicity) =>
  textesDe(
    situationDeLaPartie(
      scenarioByCode(code).situations.find((s) => s.code === situation)!,
      PERIODICITY_DAYS[periodicity],
    ),
  ).join("\n");

describe("les homonymes : ce que le test des nombres ne distingue pas", () => {
  for (const periodicity of DUREES) {
    for (const [code, prefixe] of [["conseil", "conseil"], ["conseil-gamme", "conseilg"]] as const) {
      it(`${code} ${NOM[periodicity]} : les jours ouvrés et les jours vendus suivent le tour`, () => {
        const jours = depart(code, periodicity).hoursPerEmployee;
        const s = joue(code, periodicity);
        expect(rendu(code, `${prefixe}_t1_reprise`, periodicity)).toContain(`disposant chacun de ${milliers(jours)} jours ouvrés`);
        expect(rendu(code, `${prefixe}_t4_recrutement`, periodicity)).toContain(`apporte ${milliers(jours)} jours`);
        expect(rendu(code, `${prefixe}_detect_below_breakeven`, periodicity)).toContain(
          `Vous avez vendu ${milliers((JOURS_VENDUS * s.roundDays) / 90)} jours`,
        );
      });
    }
    for (const [code, prefixe] of [["hotel", "hotel"], ["hotel-gamme", "hotelg"]] as const) {
      it(`${code} ${NOM[periodicity]} : le prix d'une nuitée de capacité et la durée de la rénovation suivent le tour`, () => {
        const s = joue(code, periodicity);
        // La fourchette du parc : de la chambre standard à la suite premium.
        const { min, max } = prixDuParc(s);
        expect(rendu(code, `${prefixe}_detect_capacity_saturated`, periodicity)).toContain(
          `(de ${milliers(min)} à ${milliers(max)} € par nuitée`,
        );
        // Dix ans d'amortissement, comptés en tours de la partie.
        const pendant = { month: "pendant 120 mois", quarter: "pendant quarante trimestres", year: "pendant dix exercices" };
        expect(s.investment!.depreciationRounds).toBe({ month: 120, quarter: 40, year: 10 }[periodicity]);
        expect(rendu(code, `${prefixe}_t5_renovation`, periodicity)).toContain(pendant[periodicity]);
      });
    }
  }
});

describe("au mois, les énoncés disent ce que le moteur offre et facture", () => {
  it("ATLAS CONSEIL : 240 jours-consultants, 66 000 € de structure, un seuil à 140 jours", () => {
    const s = joue("conseil", "month");
    const cap = capacite("conseil", "month", s);
    expect(cap).toBe(240);
    expect(s.fixedCostsPerRound).toBe(66000);
    const t1 = rendu("conseil", "conseil_t1_reprise", "month");
    expect(t1).toContain("Le mois offre 240 jours-consultants à vendre.");
    expect(t1).toContain("Seuil = 66 000 ÷ 470 ≈ 140 jours sur 240, soit 58 % d'occupation.");
    expect(rendu("conseil", "conseil_t4_recrutement", "month")).toContain("contre 4 200 € de salaire");
  });

  it("L'ESCALE : de 89 à 115 € la nuitée trimestrielle de capacité, de 267 à 344 € la mensuelle, de 22 à 29 € l'annuelle", () => {
    const attendu = { quarter: "(de 89 à 115 € par nuitée trimestrielle", month: "(de 267 à 344 € par nuitée mensuelle", year: "(de 22 à 29 € par nuitée annuelle" };
    for (const periodicity of DUREES) {
      expect(rendu("hotel", "hotel_detect_capacity_saturated", periodicity)).toContain(attendu[periodicity]);
    }
  });

  it("L'ESCALE : 1 800 nuitées, 60 chambres × 30 nuits, une rénovation de 300 nuitées par mois", () => {
    const s = joue("hotel", "month");
    expect(capacite("hotel", "month", s)).toBe(1800);
    const t1 = rendu("hotel", "hotel_t1_reprise", "month");
    expect(t1).toContain("Le mois offre 1 800 nuitées à vendre.");
    expect(t1).toContain("60 chambres × 30 nuits");
    const t5 = rendu("hotel", "hotel_t5_renovation", "month");
    expect(t5).toContain("Elles ajouteraient 300 nuitées vendables par mois.");
    expect(t5).toContain("300 × 0,60 × 74 € × 12 mois ≈ 159 800 €");
    expect(t5).toContain("pendant 120 mois");
  });
});

describe("les invariants : ce que l'énoncé écrit en clair vaut à toutes les durées", () => {
  for (const periodicity of DUREES) {
    it(`ATLAS CONSEIL ${NOM[periodicity]}`, () => {
      for (const code of CONSEIL.codes) {
        const s = joue(code, periodicity);
        const e = depart(code, periodicity);
        const cap = capacite(code, periodicity, s);
        const pme = s.market.segments.find((x) => x.code === "pme")!;
        expect(pme.refPrice, code).toBe(TJM);
        expect(variable(s), code).toBe(90);
        expect(TJM - variable(s)).toBe(470);
        // Le salaire d'une journée : salaire et jours ouvrés suivent le même facteur.
        expect(s.hr!.salaryPerEmployeePerRound / e.hoursPerEmployee, code).toBe(210);
        expect(s.hr!.hiringCost).toBe(8000);
        expect(3 * s.hr!.hiringCost).toBe(24000);
        expect(s.hr!.firingCost).toBe(15000);
        expect(s.treasury!.factoringFeeRate).toBe(0.025);
        expect(100000 * (1 - s.treasury!.factoringFeeRate)).toBe(97500);
        expect(s.finance.overdraftAnnualRate).toBe(0.13);
        expect(s.treasury!.placementAnnualRate).toBe(0.02);
        expect(e.finance.receivables).toBe(180000);
        expect(e.headcount).toBe(12);
        expect(e.headcount * e.hoursPerEmployee).toBe(cap);
        expect(s.market.segments.find((x) => x.code === "grands_comptes")?.paymentDelayDays ?? 60).toBe(60);
        // Les taux d'occupation : charges, capacité et jours vendus suivent le même facteur.
        expect(Math.floor((s.fixedCostsPerRound / 470 / cap) * 100), code).toBe(58);
        const vendus = (JOURS_VENDUS * s.roundDays) / 90;
        expect(Math.round((vendus / cap) * 100), code).toBe(53);
        // Le distracteur qui inverse le rapport, arrondi à la dizaine.
        expect(Math.round((cap / vendus) * 10), code).toBe(19);
      }
      // Les offres de la gamme : frais et marges d'une journée.
      const g = joue("conseil-gamme", periodicity);
      const offre = (c: string) => g.products!.find((p) => p.code === c)!;
      const frais = (c: string) => offre(c).materialCostPerUnit + offre(c).otherVariableCostPerUnit;
      expect([frais("audit"), frais("transformation"), frais("cyber")]).toEqual([90, 115, 100]);
      expect([780 - frais("transformation"), 850 - frais("cyber")]).toEqual([665, 750]);
      expect(offre("transformation").market.segments.find((x) => x.code === "grands_comptes")!.refPrice).toBe(780);
      expect(offre("cyber").market.segments.find((x) => x.code === "dsi")!.refPrice).toBe(850);
    });

    it(`L'ESCALE ${NOM[periodicity]}`, () => {
      for (const code of HOTEL.codes) {
        const s = joue(code, periodicity);
        const e = depart(code, periodicity);
        expect(variable(s), code).toBe(21);
        expect(PRIX_NUITEE - variable(s)).toBe(74);
        expect(s.finance.overdraftAnnualRate).toBe(0.12);
        expect(s.treasury!.placementAnnualRate).toBe(0.02);
        expect(e.headcount).toBe(14);
        expect(s.product.hoursPerUnit).toBe(0.75);
        expect(e.finance.financialDebt).toBe(900000);
        // Soixante chambres, autant de nuits que le tour compte de jours.
        expect(60 * s.roundDays, code).toBe(capacite(code, periodicity, s));
        // La rénovation : dix chambres, 90 000 € au prix du moteur, dix ans.
        expect(10 * s.roundDays * s.investment!.costPerCapacityUnit, code).toBe(90000);
        expect((s.investment!.depreciationRounds * s.roundDays) / 360, code).toBe(10);
        // Le moteur vend la capacité de l'hôtel en chambres typées : le prix d'une nuitée
        // de capacité va de la standard à la suite premium, et le bloc `investment` n'en
        // est que le milieu (la rénovée), à toute durée.
        const prix = (c: string) => {
          const t = s.equipment!.types.find((x) => x.code === c)!;
          return t.costPerUnit / t.capacityPerUnit;
        };
        expect(prixDuParc(s), code).toEqual({ min: prix("chambre_standard"), max: prix("suite_premium") });
        expect(prix("chambre_renovee"), code).toBe(s.investment!.costPerCapacityUnit);
        expect(90000 / 10).toBe(9000);
        const annuel = 10 * s.roundDays * (360 / s.roundDays);
        expect(Math.round((annuel * 0.6 * 74) / 100) * 100).toBe(159800);
        expect(annuel * 74).toBe(266400);
        expect(annuel * PRIX_NUITEE).toBe(342000);
        // Les taux d'occupation cités : charges, capacité et distracteurs suivent le même facteur.
        const cap = capacite(code, periodicity, s);
        expect(Math.round((s.fixedCostsPerRound / 74 / cap) * 100), code).toBe(40);
        expect(Math.round((s.fixedCostsPerRound / PRIX_NUITEE / cap) * 100), code).toBe(31);
        expect(Math.round(((NUITEES_65 * s.roundDays) / 90 / cap) * 100), code).toBe(65);
      }
      // Les saisonnalités et élasticités citées : une valeur par tour, la même à toute durée (ADR-01).
      const h = joue("hotel", periodicity);
      const seg = (c: string) => h.market.segments.find((x) => x.code === c)!;
      expect([seg("affaires").priceElasticity, seg("loisirs").priceElasticity]).toEqual([-0.7, -1.75]);
      expect([seg("affaires").seasonality![2], seg("groupes").seasonality![2], seg("loisirs").seasonality![2]]).toEqual([
        0.5, 0.3, 2.0,
      ]);
      const g = joue("hotel-gamme", periodicity);
      const chambre = (c: string) => g.products!.find((p) => p.code === c)!;
      const frais = (c: string) => chambre(c).materialCostPerUnit + chambre(c).otherVariableCostPerUnit;
      expect([frais("chambre-standard"), frais("chambre-superieure"), frais("suite")]).toEqual([21, 26, 39]);
      expect(chambre("suite").hoursPerUnit).toBe(1.3);
      expect(chambre("suite").market.segments.find((x) => x.code === "occasions")!.seasonality![2]).toBe(1.5);
    });
  }
});

describe("ce que l'écart au seuil vaut en missions longues, à chaque durée", () => {
  // La mission longue du récit fait soixante jours (`conseil_t5_mission_rabais`), à toute
  // durée. L'écart au seuil, lui, suit le tour : 13 jours au mois, 41 au trimestre, 165 à
  // l'année. « Soit moins d'une mission longue » était faux à l'année.
  const MISSION_LONGUE = 60;
  const attendu = { month: "moins d'une mission longue", quarter: "moins d'une mission longue", year: "plus de deux missions longues" };
  for (const periodicity of DUREES) {
    for (const [code, prefixe] of [["conseil", "conseil"], ["conseil-gamme", "conseilg"]] as const) {
      it(`${code} ${NOM[periodicity]}`, () => {
        const s = joue(code, periodicity);
        const ecart = Math.round(s.fixedCostsPerRound / 470) - Math.round((JOURS_VENDUS * s.roundDays) / 90);
        const missions = ecart / MISSION_LONGUE;
        expect(missions < 1 ? "moins" : Math.floor(missions), periodicity).toBe(periodicity === "year" ? 2 : "moins");
        expect(rendu(code, `${prefixe}_detect_below_breakeven`, periodicity)).toContain(
          `Il manque environ ${milliers(ecart)} jours pour atteindre les ${milliers(s.fixedCostsPerRound / 470)} du seuil, soit ${attendu[periodicity]}.`,
        );
      });
    }
  }
});

describe("un mot de durée ne porte aucun chiffre", () => {
  // « × {{4 trimestres}} » portait un chiffre dans la clé d'un mot de durée. Les chiffres
  // d'un énoncé se lisent par une expression (`{{entier: …}}`) ; un mot de durée n'en
  // porte aucun, même quand il rend « 4 trimestres » au trimestre.
  it("dans les sources à jetons des quinze scénarios", () => {
    const mots = SCENARIOS.flatMap((d) =>
      d.situations.flatMap((def) => textesDe(sourceDe(def)).flatMap(jetonsDe).filter((j) => !j.includes(":"))),
    );
    expect(mots.length).toBeGreaterThan(100);
    expect(mots.filter((j) => /\d/.test(j))).toEqual([]);
  });
});
