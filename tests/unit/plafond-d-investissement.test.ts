import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DIFFICULTY_PRESETS,
  REPARTITION_AVANT_2026_10_11,
  premierNiveauQuiOuvre,
  presetFromProfile,
  profilDuNiveau,
} from "@/config/difficulty";
import { SCENARIOS, NOVA_DEFINITION } from "@/config/scenarios/registry";
import {
  bornerLInvestissement,
  capaciteAjoutee,
  capaciteDeLAtelier,
  depasseLePlafond,
  investissementPlafonne,
  plafondDInvestissement,
} from "@/engine/investment/plafond";
import { botDecisions } from "@/engine/bots";
import type { CompanyState, EngineScenarioConfig } from "@/engine/types";
import { aideDuPlafond, messageDuPlafond } from "@/config/refus-de-decision";
import { refusDuPlafondDInvestissement } from "@/services/decision-schema";

/**
 * LE PLAFOND D'INVESTISSEMENT QUAND LES EMBAUCHES SONT FERMÉES.
 *
 * Le propriétaire : « au niveau 3, on peut investir dans des machines, augmenter
 * la capacité, mais on ne gère pas les RH ». La production est le minimum de la
 * capacité machine et de la capacité main-d'œuvre : au-delà de l'équipe, une
 * machine achetée ne produit rien. Une seule fonction calcule le plafond
 * (`engine/investment/plafond`), et ces gardes le tiennent : ses entrées, son
 * arrondi, son refus, et ceux qui doivent le respecter sans formulaire.
 */

const N1_A_3 = { hr: false, investment: true };
const N4 = { hr: true, investment: true };

const nova = NOVA_DEFINITION.scenario;
const etatNova = (patch: Partial<CompanyState> = {}): CompanyState => ({
  ...NOVA_DEFINITION.company("nova", "NOVA", "human"),
  ...patch,
});

describe("qui est plafonné", () => {
  it("aucun niveau actuel : l'investissement s'ouvre avec les embauches ; les parties d'avant, aux niveaux 1 à 3", () => {
    // Depuis octobre 2026, aucun préréglage n'ouvre l'investissement sans les RH.
    // La règle reste pour les parties créées avant (leviers relus dans
    // REPARTITION_AVANT_2026_10_11), où les niveaux 1 à 3 investissaient sans
    // pouvoir embaucher.
    expect(DIFFICULTY_PRESETS.filter((p) => investissementPlafonne(p.decisions))).toEqual([]);
    const avant = DIFFICULTY_PRESETS.filter((p) => investissementPlafonne(REPARTITION_AVANT_2026_10_11[p.level])).map(
      (p) => p.level,
    );
    expect(avant).toEqual([1, 2, 3]);
    expect(investissementPlafonne(presetFromProfile({ difficulty: { level: 2 } }).decisions)).toBe(true);
    expect(investissementPlafonne(presetFromProfile({ difficulty: profilDuNiveau(DIFFICULTY_PRESETS[1]!) }).decisions)).toBe(false);
    expect(investissementPlafonne(N4)).toBe(false);
    expect(investissementPlafonne({ hr: false, investment: false })).toBe(false);
    expect(investissementPlafonne(null)).toBe(false);
  });
});

describe("le calcul du plafond (NOVA : 4 personnes, 7 200 enceintes ; 7 000 de lignes)", () => {
  it("la machine sous la main-d'œuvre : la marge est l'écart, en capacité nominale", () => {
    const p = plafondDInvestissement(nova, etatNova(), N1_A_3);
    expect(p.mainDOeuvre).toBe(7200);
    expect(p.machine).toBe(7000);
    expect(p.marge).toBe(200);
    expect(p.applique).toBe(true);
    // Machine entière : la plus petite ligne en fait 1 000, aucune n'entre sous 200.
    expect(p.unite?.type).toBe("machines");
    if (p.unite?.type === "machines") {
      expect(p.unite.machines.every((m) => m.maxSousLePlafond === 0)).toBe(true);
    }
  });

  it("la machine au niveau de la main-d'œuvre, ou au-dessus : plafond à zéro, jamais négatif", () => {
    const egale = plafondDInvestissement(nova, etatNova({ headcount: 4, hoursPerEmployee: 525 }), N1_A_3);
    expect(egale.mainDOeuvre).toBeCloseTo(7000, 6);
    expect(egale.marge).toBe(0);
    const dessus = plafondDInvestissement(nova, etatNova({ headcount: 3 }), N1_A_3);
    expect(dessus.mainDOeuvre).toBe(5400);
    expect(dessus.marge).toBe(0);
  });

  it("les machines commandées au tour d'avant comptent déjà", () => {
    const etat = etatNova({ headcount: 6, pendingFleet: [{ typeCode: "manual", count: 2, acquiredRound: 1, bookValue: 30000 }] });
    const p = plafondDInvestissement(nova, etat, N1_A_3);
    expect(p.machine).toBe(9000);
    expect(p.mainDOeuvre).toBe(10800);
    expect(p.marge).toBe(1800);
    if (p.unite?.type === "machines") {
      const parType = Object.fromEntries(p.unite.machines.map((m) => [m.code, m.maxSousLePlafond]));
      // 1 800 : une ligne manuelle (1 000), une semi-automatique (1 500), aucune automatisée (2 500).
      expect(parType).toEqual({ manual: 1, semi_auto: 1, auto: 0 });
    }
  });

  it("la productivité et la disponibilité entrent dans le calcul", () => {
    const productif = plafondDInvestissement(nova, etatNova({ productivity: 1.25 }), N1_A_3);
    expect(productif.mainDOeuvre).toBe(9000);
    expect(productif.marge).toBe(2000);
    // À 80 % de disponibilité, 7 000 nominaux rendent 5 600 ; l'équipe en fait 7 200,
    // et une ligne achetée ne rendrait que 80 % d'elle-même : 7 200 / 0,8 − 7 000.
    const use = plafondDInvestissement(nova, etatNova({ availability: 0.8 }), N1_A_3);
    expect(use.machineDisponible).toBeCloseTo(5600, 6);
    expect(use.marge).toBe(2000);
  });

  it("la morale du tour, quand des décisions RH la fixent", () => {
    const sansRh = capaciteDeLAtelier(nova, etatNova());
    expect(sansRh.morale).toBe(1);
    const sousPaye = capaciteDeLAtelier(nova, etatNova(), { salaryIndex: 0.9 });
    expect(sousPaye.morale).toBeLessThan(1);
    expect(sousPaye.mainDOeuvre).toBeLessThan(sansRh.mainDOeuvre);
  });

  it("l'investissement homogène s'arrondit à l'unité de capacité", () => {
    const homogene: EngineScenarioConfig = { ...nova, equipment: undefined };
    const etat = etatNova({ fleet: undefined, pendingFleet: undefined, machineCapacity: 6000, pendingCapacity: 500.4 });
    const p = plafondDInvestissement(homogene, etat, N1_A_3);
    expect(p.machine).toBeCloseTo(6500.4, 6);
    expect(p.marge).toBe(699);
    expect(p.unite).toEqual({ type: "capacite", maxParTour: nova.investment!.maxPerRound, maxSousLePlafond: 699 });
    expect(depasseLePlafond(p, { machineCapacityUnits: 699 })).toBe(false);
    expect(depasseLePlafond(p, { machineCapacityUnits: 700 })).toBe(true);
  });
});

describe("chaque entreprise qui investit", () => {
  for (const d of SCENARIOS) {
    it(`${d.code} : la marge est l'écart équipe ÷ disponibilité − parc, et les machines qui tiennent dedans`, () => {
      const etat = d.company("x", "x", "human");
      const p = plafondDInvestissement(d.scenario, etat, N1_A_3);
      expect(p.unite, "un scénario sans investissement").not.toBeNull();
      const attendue = Math.max(0, Math.floor(p.mainDOeuvre / p.disponibilite - p.machine + 1e-6));
      expect(p.marge).toBe(attendue);
      if (p.unite?.type === "machines") {
        for (const m of p.unite.machines) {
          expect(m.maxSousLePlafond * m.capacite).toBeLessThanOrEqual(p.marge);
          if (m.maxSousLePlafond < m.maxParTour) expect((m.maxSousLePlafond + 1) * m.capacite).toBeGreaterThan(p.marge);
          // Le maximum sous le plafond passe ; une machine de plus est refusée.
          expect(depasseLePlafond(p, { equipmentBuy: [{ typeCode: m.code, quantity: m.maxSousLePlafond }] })).toBe(false);
          if ((m.maxSousLePlafond + 1) * m.capacite > p.marge) {
            expect(depasseLePlafond(p, { equipmentBuy: [{ typeCode: m.code, quantity: m.maxSousLePlafond + 1 }] })).toBe(true);
          }
        }
      }
      // Les mots du secteur sont déclarés : la phrase du refus ne parle pas de machines dans un hôtel.
      expect(d.vocabulary.plafond, `${d.code} sans les mots du plafond`).toBeDefined();
    });
  }
});

describe("ce qui dépasse, et ce qui ne dépasse pas", () => {
  const p = plafondDInvestissement(nova, etatNova({ headcount: 6 }), N1_A_3); // 10 800 − 7 000 = 3 800
  it("les cessions libèrent de la place ; la capacité nette compte", () => {
    expect(p.marge).toBe(3800);
    const achat = { equipmentBuy: [{ typeCode: "auto", quantity: 1 }, { typeCode: "semi_auto", quantity: 1 }] };
    expect(capaciteAjoutee(achat, p.unite)).toBe(4000);
    expect(depasseLePlafond(p, achat)).toBe(true);
    const avecCession = { ...achat, equipmentSell: [{ typeCode: "manual", quantity: 1 }] };
    expect(capaciteAjoutee(avecCession, p.unite)).toBe(3000);
    expect(depasseLePlafond(p, avecCession)).toBe(false);
  });

  it("au niveau 4, aucun plafond : la même commande passe", () => {
    const n4 = plafondDInvestissement(nova, etatNova(), N4);
    expect(n4.applique).toBe(false);
    expect(depasseLePlafond(n4, { equipmentBuy: [{ typeCode: "auto", quantity: 1 }] })).toBe(false);
    // L'aide reste : elle dit d'où il faudra embaucher.
    expect(aideDuPlafond(n4, NOVA_DEFINITION.vocabulary)).toBe(
      "Au-delà de 200 enceintes de capacité en plus, il faudra embaucher pour la faire tourner.",
    );
  });

  it("borner : les achats réduits dans l'ordre, machine entière, sous la marge", () => {
    const d = bornerLInvestissement(
      {
        price: 60,
        productionPlan: 5000,
        marketingBudget: 0,
        qualityBudget: 0,
        maintenanceBudget: 0,
        investment: { equipmentBuy: [{ typeCode: "auto", quantity: 1 }, { typeCode: "manual", quantity: 3 }] },
      },
      p,
    );
    // 3 800 : l'automatisée (2 500), puis une manuelle (1 000) ; la troisième ne tient plus.
    expect(d.investment?.equipmentBuy).toEqual([
      { typeCode: "auto", quantity: 1 },
      { typeCode: "manual", quantity: 1 },
    ]);
    expect(depasseLePlafond(p, d.investment)).toBe(false);
  });
});

describe("la langue du refus et de l'aide", () => {
  it("le message du propriétaire, mot pour mot, sur NOVA au départ", () => {
    const p = plafondDInvestissement(nova, etatNova(), N1_A_3);
    // Une partie de niveau 3 d'avant la répartition : les embauches viennent au niveau 4.
    expect(messageDuPlafond(p, NOVA_DEFINITION.vocabulary, premierNiveauQuiOuvre("hr", undefined, 3)).replace(/[\u00a0\u202f]/g, " ")).toBe(
      "Investissement : votre équipe de 4 personnes fait tourner 7 200 enceintes par tour ; vos machines en font déjà 7 000. Au-delà de 200 enceintes de capacité en plus, une machine resterait à l'arrêt. Les embauches s'ouvrent au niveau 4.",
    );
    expect(aideDuPlafond(p, NOVA_DEFINITION.vocabulary)?.replace(/[\u00a0\u202f]/g, " ")).toBe(
      "Jusqu'à 200 enceintes de capacité en plus à ce niveau. La plus petite, Ligne manuelle, en ajoute 1 000 : aucune n'entre sous ce plafond.",
    );
  });

  it("le niveau des embauches se lit dans les préréglages, au-delà du niveau joué", () => {
    expect(premierNiveauQuiOuvre("hr")).toBe(DIFFICULTY_PRESETS.find((p) => p.decisions.hr)!.level);
    expect(premierNiveauQuiOuvre("hr", undefined, 3)).toBe(DIFFICULTY_PRESETS.find((p) => p.level > 3 && p.decisions.hr)!.level);
  });

  it("le serveur refuse au-delà, sur la case du premier type acheté ; accepte en dessous", () => {
    const etat = etatNova({ headcount: 6 });
    const plafond = { ...plafondDInvestissement(nova, etat, N1_A_3), niveauDesEmbauches: 4 };
    const base = { price: 60, productionPlan: 5000, marketingBudget: 0, qualityBudget: 0, maintenanceBudget: 0 };
    const refus = refusDuPlafondDInvestissement(
      { ...base, investment: { equipmentBuy: [{ typeCode: "semi_auto", quantity: 2 }, { typeCode: "manual", quantity: 1 }] } },
      plafond,
      NOVA_DEFINITION.vocabulary,
    );
    expect(refus?.champ).toBe("equipmentBuy.semi_auto");
    expect(refus?.message).toMatch(/^Investissement : votre équipe de 6 personnes fait tourner 10[\u00a0\u202f ]800 enceintes par tour/);
    expect(
      refusDuPlafondDInvestissement(
        { ...base, investment: { equipmentBuy: [{ typeCode: "semi_auto", quantity: 2 }] } },
        plafond,
        NOVA_DEFINITION.vocabulary,
      ),
    ).toBeNull();
    // Niveau 4 : la même commande passe.
    expect(
      refusDuPlafondDInvestissement(
        { ...base, investment: { equipmentBuy: [{ typeCode: "auto", quantity: 1 }, { typeCode: "semi_auto", quantity: 2 }] } },
        { ...plafondDInvestissement(nova, etat, N4), niveauDesEmbauches: 4 },
        NOVA_DEFINITION.vocabulary,
      ),
    ).toBeNull();
  });
});

describe("les concurrents pilotés restent sous le plafond", () => {
  // Les concurrents n'investissent que dans un scénario « enrichi » (`enrichedBots`) :
  // un atelier saturé, au tour 2, pousse le profil croissance à acheter une ligne.
  const enrichi: EngineScenarioConfig = { ...nova, enrichedBots: true };
  const ctx = (plafonne: boolean) => ({
    scenario: enrichi,
    state: NOVA_DEFINITION.company("bot", "Bot", "bot", "growth"),
    roundIndex: 2,
    lastSoldUnits: 6900,
    investissementPlafonne: plafonne,
  });

  it("sans plafond, le bot achète ; plafonné, son achat tient sous la marge de son équipe", () => {
    const libre = botDecisions("growth", ctx(false));
    expect(capaciteAjoutee(libre.investment, plafondDInvestissement(enrichi, ctx(false).state, N1_A_3).unite)).toBeGreaterThan(0);
    const borne = botDecisions("growth", ctx(true));
    const plafond = plafondDInvestissement(enrichi, ctx(true).state, N1_A_3, borne.hr);
    expect(depasseLePlafond(plafond, libre.investment), "le cas ne teste rien").toBe(true);
    expect(depasseLePlafond(plafond, borne.investment)).toBe(false);
  });

  for (const profil of ["growth", "premium", "price_aggressive", "balanced", "passive"] as const) {
    it(`${profil} : aucune entreprise, aucun tour où il dépasse`, () => {
      for (const d of SCENARIOS) {
        const scenario = { ...d.scenario, enrichedBots: true };
        const state = d.company("bot", "Bot", "bot", profil);
        for (const roundIndex of [2, 3, 4]) {
          const dec = botDecisions(profil, {
            scenario,
            state,
            roundIndex,
            lastSoldUnits: 1e6,
            investissementPlafonne: true,
          });
          const plafond = plafondDInvestissement(scenario, state, N1_A_3, dec.hr);
          expect(depasseLePlafond(plafond, dec.investment), `${d.code} tour ${roundIndex}`).toBe(false);
        }
      }
    });
  }
});

describe("une seule source, lue partout", () => {
  const lire = (f: string) => readFileSync(f, "utf-8");
  it("la feuille, l'action, la vue, les bots et la référence lisent le même calcul", () => {
    expect(lire("src/components/decision-form.tsx")).toContain("depasseLePlafond(plafondInvestissement");
    expect(lire("src/app/arena/[gameId]/actions.ts")).toContain("refusDuPlafondDInvestissement(");
    expect(lire("src/services/game-view.service.ts")).toContain("plafondDInvestissement(snapshot, state, preset.decisions)");
    expect(lire("src/services/game-view.service.ts")).toContain("capaciteDeLAtelier(snapshot, state)");
    expect(lire("src/engine/bots/index.ts")).toContain("bornerLInvestissement(");
    expect(lire("src/pedagogy/merite/reference.ts")).toContain("bornerLInvestissement(");
    expect(lire("src/services/round-resolution.service.ts")).toContain("investissementPlafonne(");
    expect(lire("src/pedagogy/merite/rejeu.ts")).toContain("investissementPlafonne:");
  });

  it("le moteur n'applique aucun plafond : une décision enregistrée se rejoue telle quelle", () => {
    expect(lire("src/engine/simulation/index.ts")).not.toMatch(/plafondDInvestissement|bornerLInvestissement/);
  });
});
