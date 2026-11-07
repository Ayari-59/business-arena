import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { scenarioByCode } from "@/config/scenarios/registry";
import { composerLeScenarioJoue, CORRECTIFS_DES_PARTIES_NOUVELLES } from "@/config/scenarios/scenario-joue";
import { GRAINE_DU_COURS, decisionsDuCours, type ChangementDuJoueur } from "@/config/cours/arene-du-cours";
import {
  CHARGE_FIXE_DES_MACHINES,
  HEURES_PAR_UNITE,
  MULTIPLICATEUR_DU_PRIX_DES_MACHINES,
  SATISFACTION_N1,
  avecLEquilibre,
} from "@/config/scenarios/equilibre";
import { amortissementsDuDepart } from "@/config/scenarios/amortissements-du-depart";
import { runGame } from "@/engine/simulation/runGame";
import { ENGINE_VERSION, simulateRound } from "@/engine/simulation";
import { seuilDEntretien, updateAvailability } from "@/engine/production";
import { computeHr, PRODUCTIVITE_DU_REMPLACANT } from "@/engine/hr";
import { neutralDecisions } from "@/engine/bots";
import type { CompanyRoundResult, EngineScenarioConfig, RoundDecisions } from "@/engine/types";

/**
 * L'ÉQUILIBRE DU MOTEUR 0.2.0 (relevé de novembre 2026, `config/scenarios/equilibre.ts`).
 *
 * Le relevé jouait l'arène du cours (graine 20260101, trois entreprises au trimestre, le
 * bon gestionnaire) et mesurait des stratégies naïves qui rapportaient. Ces gardes refont
 * la mesure sur le scénario qu'une partie créée aujourd'hui fige, et sur celui d'une
 * partie créée avant : celle-là garde l'ancien équilibre, au centime.
 */

const NEUF = ["nova", "boutique-mono", "hotel", "bistrot", "conseil", "ecommerce", "fitness", "batiment", "transport"];
const GAMMES = ["nova-gamme", "boutique", "hotel-gamme", "bistrot-gamme", "conseil-gamme", "ecommerce-gamme"];

const composer = (code: string, tours: number, equilibre: boolean) =>
  composerLeScenarioJoue({
    scenario: scenarioByCode(code).scenario,
    seed: GRAINE_DU_COURS,
    concurrents: 3,
    roundsCount: tours,
    periodicity: "quarter",
    ...CORRECTIFS_DES_PARTIES_NOUVELLES,
    equilibre,
  });

/** Une année de l'arène du cours : le bon gestionnaire, que `change` peut modifier, et deux concurrents. */
function partie(code: string, tours: number, equilibre: boolean, change?: ChangementDuJoueur) {
  const def = scenarioByCode(code);
  const scenario = composer(code, tours, equilibre);
  const entreprises = [
    def.company("joueur", def.playerTeamName, "bot", "balanced"),
    ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const jouees: RoundDecisions[] = [];
  const p = runGame({
    scenario,
    initialCompanies: entreprises,
    seed: GRAINE_DU_COURS,
    providers: decisionsDuCours(entreprises, scenario, (t, d) => {
      const x = change ? (change(t, d) ?? d) : d;
      jouees.push(x);
      return x;
    }),
  });
  const res = p.rounds.map((r) => r.results.joueur!);
  return { scenario, res, jouees, rounds: p.rounds };
}
const resultat = (res: CompanyRoundResult[]) => res.reduce((s, r) => s + r.incomeStatement.netIncome, 0);
/** L'écart de résultat net cumulé d'une stratégie face au bon gestionnaire. */
const ecart = (code: string, tours: number, equilibre: boolean, change: ChangementDuJoueur) =>
  resultat(partie(code, tours, equilibre, change).res) - resultat(partie(code, tours, equilibre).res);

const ZERO_ENTRETIEN: ChangementDuJoueur = (_t, d) => ({ ...d, maintenanceBudget: 0 });
const LICENCIER: ChangementDuJoueur = (t, d) => (t === 1 ? { ...d, hr: { ...(d.hr ?? { salaryIndex: 1 }), fire: 1, hire: 0 } } : d);
const SOUS_PAYER: ChangementDuJoueur = (_t, d) => ({ ...d, hr: { ...(d.hr ?? { salaryIndex: 1 }), salaryIndex: 0.9 } });
const prevention =
  (part: number): ((s: EngineScenarioConfig) => ChangementDuJoueur) =>
  (s) =>
  (_t, d) => {
    const q = part * s.production.qualityScale;
    const produits = d.products ? Object.entries(d.products) : [];
    return {
      ...d,
      qualityBudget: q,
      ...(d.products ? { products: Object.fromEntries(produits.map(([c, p]) => [c, { ...p, qualityBudget: q / produits.length }])) } : {}),
    };
  };

// ---------------------------------------------------------------------------
// Les parties en cours
// ---------------------------------------------------------------------------

describe("une partie créée avant l'équilibre 0.2.0 garde le sien, au centime", () => {
  /**
   * Le témoin a été relevé sur le code d'avant l'équilibre (commit 5ef72e6), avec les
   * correctifs des parties nouvelles de l'époque : six trimestres de l'arène du cours
   * dans les quinze scénarios, le bon gestionnaire, puis une gestion naïve qui passe par
   * toutes les règles changées (une machine achetée, l'entretien à moitié, le salaire à
   * 0,9 : démissions comprises). Une partie dont l'instantané ne porte pas `equilibre`
   * doit le rejouer à l'identique.
   */
  const TEMOIN = JSON.parse(readFileSync(new URL("../fixtures/parties-0-1-0.json", import.meta.url), "utf8")) as Record<
    string,
    Record<string, number[]>[]
  >;
  const centime = (x: number) => Math.round(x * 100) / 100;
  for (const code of [...NEUF, ...GAMMES]) {
    it(`${code} : le bon gestionnaire et la gestion naïve rejouent le témoin`, () => {
      for (const variante of ["gestionnaire", "naif"] as const) {
        const typ = [...composer(code, 6, false).equipment!.types].sort((a, b) => a.costPerUnit - b.costPerUnit)[0]!;
        const naif: ChangementDuJoueur = (t, d) => ({
          ...d,
          maintenanceBudget: d.maintenanceBudget * 0.5,
          hr: { ...(d.hr ?? { salaryIndex: 1 }), salaryIndex: 0.9 },
          ...(t === 1 ? { investment: { equipmentBuy: [{ typeCode: typ.code, quantity: 1 }] } } : {}),
        });
        const { rounds } = partie(code, 6, false, variante === "naif" ? naif : undefined);
        const lu = rounds.map((r) =>
          Object.fromEntries(
            Object.entries(r.results).map(([id, x]) => {
              const etat = r.companies.find((c) => c.id === id)!;
              return [
                id,
                [
                  x.incomeStatement.revenue,
                  x.incomeStatement.netIncome,
                  x.incomeStatement.fixedCosts,
                  x.incomeStatement.depreciation,
                  x.balanceSheet.cash,
                  x.balanceSheet.overdraft,
                  etat.availability,
                  etat.headcount,
                ].map(centime),
              ];
            }),
          ),
        );
        expect(lu, `${code} ${variante}`).toEqual(TEMOIN[`${code} ${variante}`]);
      }
    });
  }

  it("le drapeau sépare bien les deux équilibres, et la création enregistre la version 0.2.0", () => {
    expect(composer("nova", 4, false).equilibre).toBeUndefined();
    expect(composer("nova", 4, true).equilibre).toBe("0.2.0");
    expect(CORRECTIFS_DES_PARTIES_NOUVELLES.equilibre).toBe(true);
    expect(ENGINE_VERSION).toBe("0.2.0");
    // Sans le drapeau, le scénario joué est celui d'avant : aucune clé ajoutée.
    expect(JSON.stringify(composer("hotel", 4, false))).not.toContain("chargeFixeParTour");
  });
});

// ---------------------------------------------------------------------------
// 7. Entretien
// ---------------------------------------------------------------------------

describe("7. l'entretien s'équilibre à la référence", () => {
  it("sous la référence la disponibilité baisse de usure × (1 − r), au-dessus elle remonte, jusqu'à 1", () => {
    const pas = (budget: number, current = 0.8) =>
      updateAvailability({ current, maintenanceBudget: budget, maintenanceReference: 4_000, availabilityDecay: 0.1, aLaReference: true });
    expect(pas(4_000)).toBeCloseTo(0.8, 12);
    expect(pas(2_000)).toBeCloseTo(0.8 - 0.1 * 0.5, 12);
    expect(pas(0)).toBeCloseTo(0.7, 12);
    expect(pas(6_000)).toBeCloseTo(0.85, 12);
    expect(pas(40_000)).toBe(1);
    expect(seuilDEntretien(4_000, true)).toBe(4_000);
    // L'ancienne règle, celle des parties 0.1.0 : l'équilibre aux deux tiers.
    expect(seuilDEntretien(4_000)).toBeCloseTo(4_000 / 1.5, 9);
  });

  it("le bon gestionnaire joue la référence, et l'usure double dans les quatre secteurs où ne rien entretenir payait", () => {
    for (const code of ["hotel", "conseil", "fitness", "batiment"]) {
      expect(composer(code, 4, true).production.availabilityDecay).toBeCloseTo(2 * composer(code, 4, false).production.availabilityDecay, 12);
    }
    for (const code of ["nova", "bistrot", "transport"]) {
      expect(composer(code, 4, true).production.availabilityDecay).toBe(composer(code, 4, false).production.availabilityDecay);
    }
    // Le bon gestionnaire entretient à la référence de son parc : sa disponibilité tient.
    for (const code of NEUF) {
      const { rounds } = partie(code, 8, true);
      expect(rounds.at(-1)!.companies.find((c) => c.id === "joueur")!.availability, code).toBeCloseTo(1, 3);
    }
  });

  /**
   * Relevé (0.1.0), zéro entretien face au bon gestionnaire sur quatre trimestres :
   * hôtel +35 100 €, conseil +23 100 €, salle de sport +11 000 €, bâtiment +10 500 €.
   * À l'équilibre 0.2.0 il perd partout, sauf là où l'atelier ne borne pas la production
   * dans l'année : au conseil, l'équipe est le goulot et la moitié des postes reste vide
   * (il perd 236 000 € sur huit trimestres) ; au commerce en ligne, le parc tourne sous la
   * moitié de sa capacité trois trimestres sur quatre (il perd 62 000 € sur huit).
   */
  const OU_L_ATELIER_NE_BORNE_PAS = new Set(["conseil", "ecommerce"]);
  for (const code of NEUF) {
    it(`${code} : zéro entretien perd sur huit trimestres${OU_L_ATELIER_NE_BORNE_PAS.has(code) ? "" : ", et déjà sur quatre"}`, () => {
      expect(ecart(code, 8, true, ZERO_ENTRETIEN)).toBeLessThan(0);
      if (!OU_L_ATELIER_NE_BORNE_PAS.has(code)) expect(ecart(code, 4, true, ZERO_ENTRETIEN)).toBeLessThan(0);
      else expect(ecart(code, 4, true, ZERO_ENTRETIEN), "l'exception sert encore").toBeGreaterThanOrEqual(0);
    });
  }
});

// ---------------------------------------------------------------------------
// 8. Prévention
// ---------------------------------------------------------------------------

describe("8. la prévention au budget conseillé n'est plus perdante dans la plupart des entreprises", () => {
  it("l'effet du budget qualité double, et les retours s'ouvrent chez NOVA, au conseil et au bâtiment", () => {
    for (const code of [...NEUF, ...GAMMES]) {
      expect(composer(code, 4, true).production.qualitySensitivity).toBeCloseTo(2 * composer(code, 4, false).production.qualitySensitivity, 12);
    }
    for (const code of ["nova", "nova-gamme", "conseil", "conseil-gamme", "batiment"]) {
      expect(composer(code, 4, false).qualityCosts?.externalReturnSensitivity ?? 0).toBe(0);
      expect(composer(code, 4, true).qualityCosts!.externalReturnSensitivity).toBeGreaterThan(0);
    }
  });

  /**
   * Relevé (0.1.0), la moitié de l'échelle face à zéro sur huit trimestres : elle perdait
   * chez NOVA, à la boutique, à l'hôtel, au commerce en ligne et au bâtiment (cinq sur
   * neuf). À l'équilibre 0.2.0, elle ne perd plus qu'à la boutique et à l'hôtel.
   */
  it("sur huit trimestres, elle fait au moins aussi bien que zéro dans six entreprises sur neuf au moins", () => {
    const gagnantes = NEUF.filter((code) => {
      const sans = resultat(partie(code, 8, true, (_t, d) => prevention(0)(composer(code, 8, true))(_t, d)).res);
      const avec = resultat(partie(code, 8, true, (_t, d) => prevention(0.5)(composer(code, 8, true))(_t, d)).res);
      return avec >= sans;
    });
    expect(gagnantes.length, gagnantes.join(", ")).toBeGreaterThanOrEqual(6);
  });
});

// ---------------------------------------------------------------------------
// 9. Satisfaction client
// ---------------------------------------------------------------------------

describe("9. l'action « satisfaction », niveau 1 : coût doublé, bonus d'image divisé par deux", () => {
  for (const code of ["nova", "bistrot", "ecommerce", "nova-gamme", "bistrot-gamme", "ecommerce-gamme"]) {
    it(code, () => {
      const lire = (s: EngineScenarioConfig) => s.qualityActions!.actions.find((a) => a.code.startsWith("satisfaction"))!;
      const avant = lire(composer(code, 4, false));
      const apres = lire(composer(code, 4, true));
      expect(apres.levels[0]!.cost).toBe(avant.levels[0]!.cost * SATISFACTION_N1.cout);
      expect(apres.levels[0]!.effects.qualityImageBonus).toBeCloseTo(avant.levels[0]!.effects.qualityImageBonus! * SATISFACTION_N1.image, 12);
      // Les niveaux suivants ne changent pas.
      expect(apres.levels.slice(1)).toEqual(avant.levels.slice(1));
    });
  }
});

/**
 * Relevé (0.1.0), sur huit trimestres : licencier un salarié au premier rapportait
 * dans six entreprises sur neuf (jusqu'à 54 000 € au transport), sous-payer de 10 %
 * aussi (jusqu'à 225 000 € à l'hôtel). À l'équilibre 0.2.0, ils perdent partout, à
 * trois écarts près, petits devant le résultat : au bistrot, licencier rend 500 € sur
 * deux ans (l'équipe réembauche au tour suivant) ; au commerce en ligne, il en rend
 * 5 900 sur 93 000 (la pointe de Noël garde l'équipe calée sur l'atelier) ; au bâtiment,
 * sous-payer en rend 5 700 sur 247 000. La tolérance est la part du résultat cumulé du
 * bon gestionnaire.
 */
const RESTES: Record<string, { licencier?: number; sousPayer?: number }> = {
  bistrot: { licencier: 0.01 },
  ecommerce: { licencier: 0.07 },
  batiment: { sousPayer: 0.03 },
};

// ---------------------------------------------------------------------------
// 10. Départs de salariés
// ---------------------------------------------------------------------------

describe("10. licencier ou sous-payer ne rapporte plus", () => {
  it("une démission est remplacée : l'effectif tient, le recrutement se paie, le remplaçant apprend un tour", () => {
    const hr = scenarioByCode("hotel").scenario.hr!;
    const avant = computeHr({ config: hr, decisions: { salaryIndex: 0.9 }, headcount: 14, productivity: 1 });
    const apres = computeHr({ config: hr, decisions: { salaryIndex: 0.9 }, headcount: 14, productivity: 1, remplacerLesDemissions: true });
    expect(avant.nextHeadcount).toBe(13);
    expect(apres.nextHeadcount).toBe(14);
    expect(apres.remplaces).toBe(1);
    expect(apres.cost - avant.cost).toBe(hr.hiringCost);
    // Au tour suivant, le remplaçant ne vaut qu'une part d'un poste.
    const s = composer("hotel", 2, true);
    const e = scenarioByCode("hotel").company("a", "A", "bot", "balanced");
    const d = neutralDecisions({ scenario: s, state: e, roundIndex: 1 });
    const tour = (remplacants: number) =>
      simulateRound({ scenario: s, roundIndex: 1, companies: [{ ...e, remplacantsEnRodage: remplacants }], decisions: { a: d }, activeEvents: [], seed: 1 })
        .results.a!.production.laborCapacity;
    expect(tour(1) / tour(0)).toBeCloseTo((e.headcount - (1 - PRODUCTIVITE_DU_REMPLACANT)) / e.headcount, 9);
  });

  it("l'équipe de départ couvre environ 1,05 fois le besoin", () => {
    for (const code of Object.keys(HEURES_PAR_UNITE)) {
      const avant = composer(code, 4, false);
      const apres = composer(code, 4, true);
      expect(apres.product.hoursPerUnit).toBeCloseTo(avant.product.hoursPerUnit * HEURES_PAR_UNITE[code]!, 12);
    }
    // La boutique couvrait trois fois son atelier : 1,05 désormais, au premier trimestre.
    const r = partie("boutique-mono", 1, true).res[0]!;
    expect(r.production.laborCapacity / r.production.machineCapacity).toBeCloseTo(1.05, 1);
  });

  for (const code of NEUF) {
    it(`${code} : sur huit trimestres, licencier et sous-payer font moins bien que le bon gestionnaire`, () => {
      const base = resultat(partie(code, 8, true).res);
      const licencier = ecart(code, 8, true, LICENCIER);
      const sousPayer = ecart(code, 8, true, SOUS_PAYER);
      const reste = RESTES[code] ?? {};
      if (reste.licencier === undefined) expect(licencier).toBeLessThan(0);
      else expect(licencier, "l'écart reste négligeable").toBeLessThanOrEqual(reste.licencier * base);
      if (reste.sousPayer === undefined) expect(sousPayer).toBeLessThan(0);
      else expect(sousPayer, "l'écart reste négligeable").toBeLessThanOrEqual(reste.sousPayer * base);
    });
  }
});

// ---------------------------------------------------------------------------
// 11. Machines
// ---------------------------------------------------------------------------

/** Le TRI annuel d'une machine qui rapporte `flux` chaque trimestre de sa durée. */
function triAnnuel(prix: number, flux: number, trimestres: number): number {
  let bas = -0.99;
  let haut = 50;
  for (let i = 0; i < 200; i++) {
    const m = (bas + haut) / 2;
    const van = -prix + (flux * (1 - Math.pow(1 + m, -trimestres))) / m;
    if (van > 0) bas = m;
    else haut = m;
  }
  return Math.pow(1 + (bas + haut) / 2, 4) - 1;
}

describe("11. une machine coûte ce qu'elle rapporte, et une capacité vide coûte", () => {
  it("prix décuplé, charge fixe au parc ; le parc de départ garde son prix d'achat", () => {
    for (const code of [...NEUF, ...GAMMES]) {
      const avant = composer(code, 4, false).equipment!;
      const apres = composer(code, 4, true).equipment!;
      for (const [i, t] of apres.types.entries()) {
        expect(t.costPerUnit).toBe(avant.types[i]!.costPerUnit * MULTIPLICATEUR_DU_PRIX_DES_MACHINES);
        expect(t.chargeFixeParTour).toBe(Math.round(t.costPerUnit * CHARGE_FIXE_DES_MACHINES));
        expect(t.prixDuParcDeDepart).toBe(avant.types[i]!.costPerUnit);
      }
      expect(amortissementsDuDepart(composer(code, 4, true))).toBeCloseTo(amortissementsDuDepart(composer(code, 4, false)), 9);
    }
  });

  it("le compte du premier tour ne bouge pas : la charge du parc de départ est déjà dans les charges de structure", () => {
    for (const code of [...NEUF, ...GAMMES]) {
      const def = scenarioByCode(code);
      const e = def.company("a", "A", "bot", "balanced");
      const tour = (equilibre: boolean) => {
        const s = composer(code, 4, equilibre);
        // Les mêmes décisions des deux côtés : seules les règles du compte diffèrent.
        const d = neutralDecisions({ scenario: composer(code, 4, false), state: e, roundIndex: 1 });
        return simulateRound({ scenario: s, roundIndex: 1, companies: [e], decisions: { a: d }, activeEvents: [], seed: 1 }).results.a!
          .incomeStatement;
      };
      const avant = tour(false);
      const apres = tour(true);
      expect(apres.fixedCosts + apres.depreciation, code).toBeCloseTo(avant.fixedCosts + avant.depreciation, 6);
    }
  });

  /**
   * Relevé (0.1.0) : la ligne manuelle de NOVA, pleinement vendue, rapportait 3 218 % par
   * an (elle se payait en 0,71 trimestre). Décuplée et chargée, environ 58 %. Les
   * autres entreprises s'écartent de la cible : voir le rapport du relevé.
   */
  it("NOVA : la ligne manuelle pleinement vendue rapporte environ 65 % par an", () => {
    const s = composer("nova", 4, true);
    const r = partie("nova", 1, true).res[0]!;
    const vendu = Object.values(r.market.bySegment).reduce((t, x) => t + x.sold, 0);
    const marge = r.incomeStatement.revenue / vendu - r.breakeven.unitVariableCost;
    const t = s.equipment!.types.find((x) => x.code === "manual")!;
    const tri = triAnnuel(t.costPerUnit, t.capacityPerUnit * marge - t.chargeFixeParTour!, t.depreciationRounds);
    expect(tri).toBeGreaterThan(0.45);
    expect(tri).toBeLessThan(0.85);
  });

  /**
   * Relevé (0.1.0) : là où la demande ne manque pas (aucune vente perdue au premier
   * trimestre), une machine achetée au premier tour, financée par un emprunt de son prix,
   * rapportait encore sur trois ans : +99 900 € à la boutique, +20 500 € au commerce en
   * ligne, +96 300 € à la salle de sport. Une capacité vide doit coûter.
   */
  for (const code of ["boutique-mono", "ecommerce", "fitness"]) {
    it(`${code} : une machine achetée sans demande perd sur trois ans`, () => {
      const s = composer(code, 12, true);
      const t = [...s.equipment!.types].sort((a, b) => a.costPerUnit - b.costPerUnit)[0]!;
      const acheter: ChangementDuJoueur = (tour, d) =>
        tour === 1
          ? { ...d, investment: { equipmentBuy: [{ typeCode: t.code, quantity: 1 }] }, finance: { ...(d.finance ?? {}), newLoan: (d.finance?.newLoan ?? 0) + t.costPerUnit } }
          : d;
      expect(ecart(code, 12, true, acheter)).toBeLessThan(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Le bon gestionnaire reste devant
// ---------------------------------------------------------------------------

describe("le bon gestionnaire reste nettement meilleur que les stratégies naïves", () => {
  it("à l'équilibre, sur huit trimestres, aucune ne fait mieux que lui, hors les écarts négligeables nommés", () => {
    const depassements: string[] = [];
    for (const code of NEUF) {
      const base = resultat(partie(code, 8, true).res);
      const reste = RESTES[code] ?? {};
      const naives: [string, ChangementDuJoueur, number][] = [
        ["zéro prévention", (t, d) => prevention(0)(composer(code, 8, true))(t, d), 0],
        ["licencier", LICENCIER, reste.licencier ?? 0],
        ["sous-payer", SOUS_PAYER, reste.sousPayer ?? 0],
      ];
      for (const [nom, change, tolere] of naives) {
        const e = ecart(code, 8, true, change);
        if (e > tolere * base) depassements.push(`${code} · ${nom} : +${Math.round(e)} €`);
      }
      // Et ne rien entretenir perd nettement : au moins un dixième du résultat.
      expect(ecart(code, 8, true, ZERO_ENTRETIEN), code).toBeLessThan(-0.1 * base);
    }
    expect(depassements).toEqual([]);
  });

  it("à l'équilibre d'avant, licencier ou sous-payer battait le bon gestionnaire dans six entreprises sur neuf au moins", () => {
    const depassements = NEUF.filter((code) => ecart(code, 8, false, SOUS_PAYER) > 0 || ecart(code, 8, false, LICENCIER) > 0);
    expect(depassements.length).toBeGreaterThanOrEqual(6);
  });
});

// La machine du bon gestionnaire suit le même prix : le parc ne s'achète qu'au prix décuplé.
it("le catalogue de l'arène, lu hors d'une partie, donne le prix d'une partie créée aujourd'hui", () => {
  expect(avecLEquilibre(scenarioByCode("nova").scenario).equipment!.types.find((t) => t.code === "manual")!.costPerUnit).toBe(150_000);
});
