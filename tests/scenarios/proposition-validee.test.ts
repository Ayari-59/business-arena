import { describe, expect, it } from "vitest";
import { SCENARIO_CHOICES, NOVA_DEFINITION, scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { presetByLevel } from "@/config/difficulty";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { botDecisions, botPersonalityFromSeed, soldByProduct, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { expurgerLeScenario } from "@/engine/estimation";
import { proposedDecisionsFor, type MarcheDuTourPasse } from "@/services/decision-baseline";
import type { CompanyRoundResult, CompanyState, EventInstance, RoundDecisions } from "@/engine/types";

/**
 * UNE ÉQUIPE QUI VALIDE LA PROPOSITION NE FAIT PAS FAILLITE.
 *
 * Le diagnostic des crises des niveaux 1 à 6 : la proposition était la gestion
 * neutre du tour 1 reconduite six tours, son plan (65 % de l'atelier) sous le
 * point mort de NOVA pendant que la demande dépassait la capacité. Une équipe qui
 * validait tout sans rien changer tombait en crise 8 fois sur 12 en NOVA mono
 * (4 défaillances), 10 fois sur 12 en NOVA gamme aux niveaux 5 et 6, 5 fois sur
 * 12 chez MAILLE & CO. Aucun test ne jouait la proposition reconduite.
 *
 * La garde : les neuf secteurs, les niveaux 1 à 6, des parties solo comme
 * `createSoloGame` les crée (l'équipe et deux concurrents, monde variable,
 * histoires d'investissement), l'équipe validant à chaque tour ce que le
 * formulaire lui propose. Aucune défaillance, aucune crise de trésorerie.
 */

const GRAINES = [8_919, 32_676, 64_352, 96_028];
const vendu = (r?: CompanyRoundResult) =>
  r ? Object.values(r.market.bySegment).reduce((s, x) => s + x.sold, 0) + (r.subscription?.retained ?? 0) : undefined;

function partieValidee(secteur: string, niveau: number, graine: number) {
  const def = scenarioByCode(scenarioCodeForLevel(secteur, niveau));
  const leviers = presetByLevel.get(niveau as 1 | 2 | 3 | 4 | 5 | 6)!.decisions;
  const scenario = composerLeScenarioJoue({
    scenario: def.scenario,
    seed: graine,
    variableWorld: true,
    level: niveau,
    concurrents: 3,
    periodicity: "quarter",
    investmentStories: true,
  });
  const equipes = [
    { id: "a-equipe", nom: def.playerTeamName, ctl: "human" as const, profil: undefined as BotProfile | undefined },
    ...def.bots.slice(0, 2).map((b, i) => ({ id: `b-bot${i}`, nom: b.name, ctl: "bot" as const, profil: b.profile as BotProfile })),
  ];
  let etats: CompanyState[] = equipes.map((e) =>
    applyPeriodicityToCompany(def.company(e.id, e.nom, e.ctl, e.profil), "quarter", {
      abonnement: def.scenario.subscription !== undefined,
    }),
  );
  let actifs: EventInstance[] = [];
  let precedents: Record<string, CompanyRoundResult> = {};
  let precedente: RoundDecisions | null = null;
  const tours: CompanyRoundResult[] = [];
  let statut = "";
  for (let tour = 1; tour <= scenario.roundsCount; tour += 1) {
    const decisions: Record<string, RoundDecisions> = {};
    for (const e of equipes) {
      const etat = etats.find((c) => c.id === e.id)!;
      const p = precedents[e.id];
      decisions[e.id] =
        e.ctl === "human"
          ? proposedDecisionsFor({
              snapshot: scenario,
              state: etat,
              roundIndex: tour,
              previousPayload: precedente,
              lastMarket: p?.market.bySegment ?? null,
              leviers,
            })
          : botDecisions(e.profil!, {
              scenario,
              state: etat,
              roundIndex: tour,
              lastSoldUnits: vendu(p),
              lastSoldByProduct: p ? soldByProduct(scenario, p.market.bySegment) : undefined,
              humanAvgPrice: precedente?.price,
              personality: botPersonalityFromSeed(graine, e.profil!),
              leviers,
            });
    }
    const sortie = simulateRound({ scenario, roundIndex: tour, companies: etats, decisions, activeEvents: actifs, seed: graine });
    tours.push(sortie.results["a-equipe"]!);
    precedente = decisions["a-equipe"]!;
    precedents = sortie.results;
    etats = sortie.companies;
    actifs = sortie.events;
    statut = etats.find((c) => c.id === "a-equipe")!.status ?? "";
  }
  return { tours, statut };
}

describe("l'équipe qui valide la proposition à chaque tour", () => {
  for (const def of SCENARIO_CHOICES) {
    it(`${def.code}, niveaux 1 à 6 : ni crise de trésorerie, ni défaillance`, () => {
      const enCrise: string[] = [];
      for (const niveau of [1, 2, 3, 4, 5, 6]) {
        for (const graine of GRAINES) {
          const { tours, statut } = partieValidee(def.code, niveau, graine);
          const crise = tours.findIndex((r) => r.treasury?.crisis);
          if (crise >= 0 || statut === "defaillant")
            enCrise.push(`niveau ${niveau}, graine ${graine} : ${statut || `crise au tour ${crise + 1}`}`);
        }
      }
      expect(enCrise).toEqual([]);
    });
  }
});

describe("ce que la proposition lit, et ce qu'elle ne lit pas", () => {
  const scenario = composerLeScenarioJoue({
    scenario: NOVA_DEFINITION.scenario,
    seed: 8_919,
    variableWorld: true,
    level: 2,
    concurrents: 3,
    periodicity: "quarter",
  });
  const leviers = presetByLevel.get(2)!.decisions;
  const ouverture = applyPeriodicityToCompany(NOVA_DEFINITION.company("a", "NOVA", "human"), "quarter", { abonnement: false });
  const precedente: RoundDecisions = {
    price: 61.5,
    productionPlan: 4_000,
    marketingBudget: 7_000,
    qualityBudget: 2_000,
    maintenanceBudget: 4_500,
    supplierChoice: "premium",
  };
  const marche = (vendus: number, manques: number): MarcheDuTourPasse =>
    Object.fromEntries(
      scenario.market.segments.map((s, i) => [s.code, i === 0 ? { sold: vendus, lost: manques } : { sold: 0, lost: 0 }]),
    );
  const proposer = (lastMarket: MarcheDuTourPasse, etat: CompanyState = ouverture, tour = 2, s = scenario) =>
    proposedDecisionsFor({ snapshot: s, state: etat, roundIndex: tour, previousPayload: precedente, lastMarket, leviers });
  const saison = (tour: number) =>
    (scenario.market.segments[0]!.seasonality ?? scenario.market.seasonality)[tour - 1]! /
    (scenario.market.segments[0]!.seasonality ?? scenario.market.seasonality)[tour - 2]!;

  it("le prix et les budgets restent ceux de l'équipe ; le plan sert la demande reçue, ventes manquées comprises", () => {
    const d = proposer(marche(3_000, 1_000));
    expect(d).toMatchObject({ price: 61.5, marketingBudget: 7_000, qualityBudget: 2_000, maintenanceBudget: 4_500, supplierChoice: "premium" });
    expect(d.productionPlan).toBe(Math.floor(4_000 * Math.min(2, Math.max(0.5, saison(2)))));
  });

  it("le stock d'ouverture se vend d'abord", () => {
    const avecStock = { ...ouverture, finishedGoods: { quantity: 500, unitCost: 38 } };
    expect(proposer(marche(3_000, 0), avecStock).productionPlan).toBe(
      Math.floor(3_000 * Math.min(2, Math.max(0.5, saison(2))) - 500),
    );
  });

  it("jamais au-delà de l'atelier, même quand la demande le dépasse", () => {
    const d = proposer(marche(7_000, 9_000));
    const machines = ouverture.machineCapacity * ouverture.availability;
    const heures = (ouverture.headcount * ouverture.hoursPerEmployee * ouverture.productivity) / scenario.product.hoursPerUnit;
    expect(d.productionPlan).toBe(Math.floor(Math.min(machines, heures)));
  });

  it("rien du marché caché : le même tour sur le scénario expurgé propose la même chose", () => {
    const lu = marche(3_200, 800);
    expect(proposer(lu, ouverture, 3, expurgerLeScenario(scenario))).toEqual(proposer(lu, ouverture, 3));
  });
});
