import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { scenarioByCode } from "@/config/scenarios/registry";
import { composerLeScenarioJoue, CORRECTIFS_DES_PARTIES_NOUVELLES } from "@/config/scenarios/scenario-joue";
import { GRAINE_DU_COURS, decisionsDuCours, type ChangementDuJoueur } from "@/config/cours/arene-du-cours";
import { runGame } from "@/engine/simulation/runGame";
import { fleetCapacity, simulateRound } from "@/engine/simulation";
import { neutralDecisions } from "@/engine/bots";
import {
  MAJORATION_DU_TAUX_DE_CREDIT_BAIL,
  PART_DE_L_OPTION_D_ACHAT,
  conditionsDuCreditBail,
  dureeDuCreditBail,
  dureeResiduelle,
} from "@/engine/credit-bail";
import { applyPeriodicity } from "@/config/scenarios/periodicity";
import type { CompanyRoundResult, ContratDeCreditBail, EngineScenarioConfig, RoundDecisions } from "@/engine/types";

/**
 * LE CRÉDIT-BAIL DES MACHINES (`creditBail`, engine/credit-bail). Un contrat type : douze
 * loyers trimestriels constants, au taux d'emprunt plus 1,5 point, une option d'achat à
 * 1 % du prix. Les gardes jouent l'arène du cours (graine 20260101, le bon gestionnaire)
 * et y ajoutent un contrat ; les parties créées avant le drapeau rejouent leur témoin.
 */

const NEUF = ["nova", "boutique-mono", "hotel", "bistrot", "conseil", "ecommerce", "fitness", "batiment", "transport"];
const GAMMES = ["nova-gamme", "boutique", "hotel-gamme", "bistrot-gamme", "conseil-gamme", "ecommerce-gamme"];

const composer = (code: string, tours: number, creditBail: boolean, equilibre = true) =>
  composerLeScenarioJoue({
    scenario: scenarioByCode(code).scenario,
    seed: GRAINE_DU_COURS,
    concurrents: 3,
    roundsCount: tours,
    periodicity: "quarter",
    ...CORRECTIFS_DES_PARTIES_NOUVELLES,
    equilibre,
    creditBail,
  });

function partie(scenario: EngineScenarioConfig, code: string, change?: ChangementDuJoueur) {
  const def = scenarioByCode(code);
  const entreprises = [
    def.company("joueur", def.playerTeamName, "bot", "balanced"),
    ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const p = runGame({ scenario, initialCompanies: entreprises, seed: GRAINE_DU_COURS, providers: decisionsDuCours(entreprises, scenario, change) });
  return {
    res: p.rounds.map((r) => r.results.joueur!),
    etats: p.rounds.map((r) => r.companies.find((c) => c.id === "joueur")!),
  };
}

/** Une partie plus longue que les douze trimestres d'une partie réelle, pour voir le contrat à son terme. */
const allonger = (s: EngineScenarioConfig, tours: number): EngineScenarioConfig => ({ ...s, roundsCount: tours });
/** La capacité nominale du parc d'un état, machines en attente comprises. */
const capaciteDu = (s: EngineScenarioConfig, e: { fleet?: import("@/engine/types").EquipmentItem[]; pendingFleet?: import("@/engine/types").EquipmentItem[] }) =>
  fleetCapacity([...(e.fleet ?? []), ...(e.pendingFleet ?? [])], new Map(s.equipment!.types.map((t) => [t.code, t])));
const plusPetite = (s: EngineScenarioConfig) => [...s.equipment!.types].sort((a, b) => a.costPerUnit - b.costPerUnit)[0]!;
const prendre = (typeCode: string, au = 1): ChangementDuJoueur => (t, d) =>
  t === au ? { ...d, investment: { ...d.investment, equipmentLease: [{ typeCode, quantity: 1 }] } } : d;
const avec = (a: ChangementDuJoueur, b: ChangementDuJoueur): ChangementDuJoueur => (t, d) => b(t, a(t, d) ?? d);
const decider = (au: number, contractId: string, choice: "lever" | "rendre" | "rompre"): ChangementDuJoueur => (t, d) =>
  t === au ? { ...d, investment: { ...d.investment, leaseDecisions: [{ contractId, choice }] } } : d;

// ---------------------------------------------------------------------------
// Les parties en cours
// ---------------------------------------------------------------------------

describe("une partie créée sans le crédit-bail rejoue son témoin, au centime", () => {
  /**
   * Le témoin 0.2.0 a été relevé sur le code d'avant le crédit-bail (commit d4e3a01) :
   * six trimestres de l'arène du cours dans les quinze scénarios, le bon gestionnaire, une
   * gestion naïve (une machine achetée, l'entretien à moitié, le salaire à 0,9), et la même
   * qui demande deux fois un emprunt que la banque plafonne. Le témoin 0.1.0, celui de
   * l'équilibre (`tests/engine/equilibre.test.ts`), se rejoue lui aussi avec les correctifs
   * d'aujourd'hui, le crédit-bail compris.
   */
  const TEMOIN = JSON.parse(readFileSync(new URL("../fixtures/parties-0-2-0.json", import.meta.url), "utf8")) as Record<
    string,
    Record<string, number[]>[]
  >;
  const centime = (x: number) => Math.round(x * 100) / 100;
  for (const code of [...NEUF, ...GAMMES]) {
    it(`${code} : sans le drapeau, puis avec lui sans contrat, les trois gestions rejouent le témoin`, () => {
      for (const creditBail of [false, true]) {
        const scenario = composer(code, 6, creditBail);
        const typ = plusPetite(scenario);
        const naif: ChangementDuJoueur = (t, d) => ({
          ...d,
          maintenanceBudget: d.maintenanceBudget * 0.5,
          hr: { ...(d.hr ?? { salaryIndex: 1 }), salaryIndex: 0.9 },
          ...(t === 1 ? { investment: { equipmentBuy: [{ typeCode: typ.code, quantity: 1 }] } } : {}),
        });
        const emprunt: ChangementDuJoueur = (t, d) => ({ ...naif(t, d)!, ...(t === 1 || t === 3 ? { finance: { newLoan: 5_000_000 } } : {}) });
        for (const [nom, change] of [["gestionnaire", undefined], ["naif", naif], ["emprunt", emprunt]] as const) {
          const def = scenarioByCode(code);
          const entreprises = [
            def.company("joueur", def.playerTeamName, "bot", "balanced"),
            ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile)),
          ];
          const p = runGame({ scenario, initialCompanies: entreprises, seed: GRAINE_DU_COURS, providers: decisionsDuCours(entreprises, scenario, change) });
          const lu = p.rounds.map((r) =>
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
                    x.balanceSheet.financialDebt,
                    x.balanceSheet.fixedAssetsNet,
                    etat.availability,
                    etat.headcount,
                    etat.machineCapacity,
                  ].map(centime),
                ];
              }),
            ),
          );
          expect(lu, `${code} ${nom} ${creditBail ? "avec" : "sans"} le drapeau`).toEqual(TEMOIN[`${code} ${nom}`]);
          // Sans contrat, ni l'état ni le résultat ne portent de clé de crédit-bail.
          expect(JSON.stringify(p.rounds.map((r) => r.results.joueur))).not.toContain("creditBail");
          expect(p.finalCompanies.every((c) => c.creditBail === undefined)).toBe(true);
        }
      }
    });
  }

  it("le drapeau se pose à la création, et seulement là où il y a des machines", () => {
    expect(CORRECTIFS_DES_PARTIES_NOUVELLES.creditBail).toBe(true);
    expect(composer("nova", 4, true).creditBail).toBe(true);
    expect(composer("nova", 4, false).creditBail).toBeUndefined();
    expect(JSON.stringify(composer("hotel", 4, false))).not.toContain("creditBail");
  });

  it("sans le drapeau, une demande de crédit-bail ne fait rien", () => {
    const scenario = composer("nova", 3, false);
    const sans = partie(scenario, "nova");
    const demande = partie(scenario, "nova", prendre(plusPetite(scenario).code));
    expect(demande.res).toEqual(sans.res);
  });
});

// ---------------------------------------------------------------------------
// Le contrat type
// ---------------------------------------------------------------------------

describe("le contrat type", () => {
  it("douze loyers constants au trimestre, trois ans en tours ailleurs, au taux d'emprunt plus 1,5 point", () => {
    const s = composer("nova", 16, true);
    const typ = plusPetite(s);
    const c = conditionsDuCreditBail(s, typ);
    expect(c.duree).toBe(12);
    expect(c.tauxParTour).toBeCloseTo((s.finance.loanAnnualRate + MAJORATION_DU_TAUX_DE_CREDIT_BAIL) / 4, 12);
    expect(c.option).toBeCloseTo(typ.costPerUnit * PART_DE_L_OPTION_D_ACHAT, 9);
    // Les loyers et l'option, actualisés au taux implicite, rendent le prix : pas d'apport.
    const actualise = Array.from({ length: 12 }, (_, k) => c.loyer / Math.pow(1 + c.tauxParTour, k + 1)).reduce((a, b) => a + b, 0) +
      c.option / Math.pow(1 + c.tauxParTour, 12);
    expect(actualise).toBeCloseTo(typ.costPerUnit, 6);
    expect(dureeDuCreditBail(30)).toBe(36);
    expect(dureeDuCreditBail(360)).toBe(3);
    // Au mois, le taux du tour suit la durée.
    const auMois = applyPeriodicity(s, "month");
    expect(conditionsDuCreditBail(auMois, typ).duree).toBe(36);
    expect(conditionsDuCreditBail(auMois, typ).tauxParTour).toBeCloseTo(c.tauxParTour / 3, 12);
  });

  it("la durée résiduelle après la levée : celle du type moins le contrat, un an au moins", () => {
    expect(dureeResiduelle({ depreciationRounds: 20 }, 12, 90)).toBe(8);
    expect(dureeResiduelle({ depreciationRounds: 12 }, 12, 90)).toBe(4);
    expect(dureeResiduelle({ depreciationRounds: 60 }, 36, 30)).toBe(24);
  });
});

// ---------------------------------------------------------------------------
// Un contrat complet, dans l'arène du cours
// ---------------------------------------------------------------------------

describe("un contrat complet sur douze tours, chez NOVA", () => {
  const scenario = allonger(composer("nova", 12, true), 15);
  const typ = plusPetite(scenario);
  const id = `cb-${typ.code}-r1`;
  const cond = conditionsDuCreditBail(scenario, typ);
  const sans = partie(scenario, "nova");
  const lever = partie(scenario, "nova", prendre(typ.code));
  const rendre = partie(scenario, "nova", avec(prendre(typ.code), decider(13, id, "rendre")));

  it("la signature ne décaisse rien : la trésorerie du tour est celle d'une partie sans machine", () => {
    expect(lever.res[0]!.creditBail!.signes).toEqual([
      { id, typeCode: typ.code, typeName: typ.name, quantite: 1, loyer: cond.loyer, duree: 12, option: cond.option },
    ]);
    expect(lever.res[0]!.creditBail!.redevances).toBe(0);
    expect(lever.res[0]!.balanceSheet).toEqual(sans.res[0]!.balanceSheet);
    expect(lever.res[0]!.incomeStatement.redevancesCreditBail).toBeUndefined();
  });

  it("la machine sert dès le tour suivant, comme une machine achetée", () => {
    expect(lever.etats[0]!.pendingFleet).toEqual([{ typeCode: typ.code, count: 1, acquiredRound: 1, bookValue: 0, creditBail: id }]);
    for (let t = 0; t < 12; t++) {
      expect(capaciteDu(scenario, lever.etats[t]!), `tour ${t + 1}`).toBe(capaciteDu(scenario, sans.etats[t]!) + typ.capacityPerUnit);
    }
    // Suivie une à une, elle porte son contrat.
    expect(lever.etats[1]!.machineFleet!.filter((m) => m.id.startsWith(`${id}-`))).toHaveLength(1);
  });

  it("douze loyers au compte 612, avant l'EBE, payés au tour, et l'engagement décroît d'un loyer par tour", () => {
    for (let t = 1; t <= 12; t++) {
      const r = lever.res[t]!;
      expect(r.incomeStatement.redevancesCreditBail, `tour ${t + 1}`).toBeCloseTo(cond.loyer, 6);
      expect(r.cashFlow.items.find((i) => i.label === "redevances_credit_bail")!.amount).toBeCloseTo(-cond.loyer, 6);
      expect(r.creditBail!.engagement).toBeCloseTo(cond.loyer * (12 - t), 6);
      // Une charge externe : elle se retranche avant l'EBE.
      const c = r.incomeStatement;
      expect(c.ebitda).toBeCloseTo(
        c.grossMargin - c.marketingCost - c.qualityCost - c.maintenanceCost - (c.engagementRse ?? 0) - (c.rdCost ?? 0) - c.fixedCosts - cond.loyer,
        6,
      );
    }
    expect(lever.res[0]!.creditBail!.engagement).toBeCloseTo(cond.loyer * 12, 6);
    expect(lever.res[13]!.incomeStatement.redevancesCreditBail).toBeUndefined();
    expect(lever.res[13]!.creditBail).toBeUndefined();
    const total = lever.res.reduce((s, r) => s + (r.incomeStatement.redevancesCreditBail ?? 0), 0);
    expect(total).toBeCloseTo(12 * cond.loyer, 6);
  });

  it("aucun actif pendant le contrat : ni immobilisation, ni amortissement, ni dette", () => {
    for (let t = 0; t < 12; t++) {
      expect(lever.res[t]!.balanceSheet.fixedAssetsNet, `tour ${t + 1}`).toBeCloseTo(sans.res[t]!.balanceSheet.fixedAssetsNet, 6);
      expect(lever.res[t]!.incomeStatement.depreciation).toBeCloseTo(sans.res[t]!.incomeStatement.depreciation, 6);
      expect(lever.res[t]!.balanceSheet.financialDebt).toBeCloseTo(sans.res[t]!.balanceSheet.financialDebt, 6);
    }
  });

  it("la levée d'option : la machine entre à l'actif pour 1 % du prix, amortie sur sa durée résiduelle", () => {
    const fin = lever.res[12]!;
    expect(fin.creditBail!.leves).toEqual([{ id, option: cond.option }]);
    expect(fin.balanceSheet.fixedAssetsNet - sans.res[12]!.balanceSheet.fixedAssetsNet).toBeCloseTo(cond.option, 6);
    const residuelle = dureeResiduelle(typ, 12, scenario.roundDays);
    expect(lever.res[13]!.incomeStatement.depreciation - sans.res[13]!.incomeStatement.depreciation).toBeCloseTo(cond.option / residuelle, 6);
    // La capacité reste, et la machine se vend désormais comme les autres.
    expect(capaciteDu(scenario, lever.etats[13]!)).toBe(capaciteDu(scenario, sans.etats[13]!) + typ.capacityPerUnit);
    expect(lever.etats[13]!.machineFleet!.some((m) => m.id.startsWith("cb-"))).toBe(false);
    const lot = lever.etats[12]!.fleet!.find((l) => l.coutDAcquisition === cond.option)!;
    expect(lot.creditBail).toBeUndefined();
    expect(lot.dureeDAmortissement).toBe(residuelle);
    expect(lever.etats[12]!.creditBail).toEqual([]);
  });

  it("la restitution : la capacité disparaît au tour suivant, rien n'entre à l'actif", () => {
    const fin = rendre.res[12]!;
    expect(fin.creditBail!.rendus).toEqual([id]);
    expect(fin.creditBail!.leves).toEqual([]);
    expect(fin.balanceSheet.fixedAssetsNet).toBeCloseTo(sans.res[12]!.balanceSheet.fixedAssetsNet, 6);
    expect(capaciteDu(scenario, rendre.etats[12]!)).toBe(capaciteDu(scenario, sans.etats[12]!));
    expect(rendre.etats[12]!.fleet!.some((l) => l.creditBail !== undefined)).toBe(false);
    expect(rendre.etats[12]!.machineFleet!.some((m) => m.id.includes(id))).toBe(false);
    expect(rendre.etats[12]!.creditBail).toEqual([]);
  });

  it("une machine en crédit-bail ne se vend pas", () => {
    const vendre: ChangementDuJoueur = (t, d) => (t === 3 ? { ...d, investment: { equipmentSell: [{ typeCode: typ.code, quantity: 99 }] } } : d);
    const p = partie(scenario, "nova", avec(prendre(typ.code), vendre));
    const s = partie(scenario, "nova", vendre);
    expect(p.res[2]!.investment!.sold![0]!.quantity).toBe(s.res[2]!.investment!.sold![0]!.quantity);
    expect(capaciteDu(scenario, p.etats[2]!)).toBe(capaciteDu(scenario, s.etats[2]!) + typ.capacityPerUnit);
    expect(p.etats[2]!.fleet!.filter((l) => l.creditBail === id)).toHaveLength(1);
  });
});

describe("la rupture anticipée", () => {
  const scenario = composer("nova", 8, true);
  const typ = plusPetite(scenario);
  const id = `cb-${typ.code}-r1`;
  const cond = conditionsDuCreditBail(scenario, typ);
  const sans = partie(scenario, "nova");
  const rompu = partie(scenario, "nova", avec(prendre(typ.code), decider(5, id, "rompre")));

  it("les loyers restants se paient en charge au tour de la rupture, et la machine est rendue", () => {
    // Trois loyers payés (tours 2 à 4) : le tour 5 en paie neuf, le sien compris.
    expect(rompu.res[4]!.creditBail!.rompus).toEqual([{ id, montant: 9 * cond.loyer }]);
    expect(rompu.res[4]!.incomeStatement.redevancesCreditBail).toBeCloseTo(9 * cond.loyer, 6);
    expect(rompu.res[4]!.creditBail!.engagement).toBe(0);
    expect(capaciteDu(scenario, rompu.etats[3]!)).toBe(capaciteDu(scenario, sans.etats[3]!) + typ.capacityPerUnit);
    expect(capaciteDu(scenario, rompu.etats[4]!)).toBe(capaciteDu(scenario, sans.etats[4]!));
    expect(rompu.etats[4]!.creditBail).toEqual([]);
    expect(rompu.res[5]!.creditBail).toBeUndefined();
    const total = rompu.res.reduce((s, r) => s + (r.incomeStatement.redevancesCreditBail ?? 0), 0);
    expect(total).toBeCloseTo(12 * cond.loyer, 6);
  });
});

// ---------------------------------------------------------------------------
// La banque
// ---------------------------------------------------------------------------

describe("la capacité d'endettement compte l'engagement pour moitié", () => {
  it("la banque prête 2 × capitaux propres − dettes − la moitié des loyers restant à payer", () => {
    const def = scenarioByCode("nova");
    const scenario = composer("nova", 4, true);
    const base = def.company("joueur", def.playerTeamName, "human");
    const contrat: ContratDeCreditBail = {
      id: "cb-manual-r0",
      typeCode: plusPetite(scenario).code,
      quantite: 1,
      signeAuTour: 0,
      valeurFinancee: 120_000,
      loyer: 10_000,
      duree: 12,
      loyersPayes: 2,
      option: 1_200,
    };
    const demander = (avecContrat: boolean, s: EngineScenarioConfig = scenario): CompanyRoundResult => {
      const etat = avecContrat ? { ...base, creditBail: [contrat] } : base;
      const decisions: RoundDecisions = { ...neutralDecisions({ scenario: s, state: etat, roundIndex: 1 }), finance: { newLoan: 10_000_000 } };
      return simulateRound({ scenario: s, roundIndex: 1, companies: [etat], decisions: { joueur: decisions }, activeEvents: [], seed: 1 }).results.joueur!;
    };
    const plafond = s(base.finance.equity * scenario.finance.maxDebtToEquity! - base.finance.financialDebt);
    expect(demander(false).debt!.newLoan).toBeCloseTo(plafond, 6);
    // Dix loyers de 10 000 € restent à payer : 50 000 € de moins.
    expect(demander(true).debt!.newLoan).toBeCloseTo(plafond - 50_000, 6);
    // Sans le drapeau, la banque ne lit rien.
    expect(demander(true, composer("nova", 4, false)).debt!.newLoan).toBeCloseTo(plafond, 6);
  });
});
function s(x: number) {
  return Math.max(0, x);
}
