import { describe, expect, it } from "vitest";
import { SCENARIO_CHOICES, NOVA_DEFINITION, scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { presetByLevel } from "@/config/difficulty";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { aLaMesureDuNiveau, botDecisions, botPersonalityFromSeed, neutralDecisions, soldByProduct, type BotProfile } from "@/engine/bots";
import { decisionDeLaGestionNeutre } from "@/pedagogy/merite/etalons";
import { decisionDeReference } from "@/pedagogy/merite/reference";
import { simulateRound } from "@/engine/simulation";
import { expurgerLeScenario } from "@/engine/estimation";
import { avecLaQualiteProposee, proposedDecisionsFor, type MarcheDuTourPasse } from "@/services/decision-baseline";
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
 *
 * Et la proposition reste NEUTRE (décision du propriétaire) : une équipe qui se
 * contente de valider finit à peu près où finit la gestion neutre du secteur
 * tenue à la qualité que le formulaire propose (`qualiteProposee`, la seule
 * valeur où la proposition s'en écarte au départ), et loin derrière un bon
 * gestionnaire.
 */

const GRAINES = [8_919, 32_676, 64_352, 96_028];
const vendu = (r?: CompanyRoundResult) =>
  r ? Object.values(r.market.bySegment).reduce((s, x) => s + x.sold, 0) + (r.subscription?.retained ?? 0) : undefined;

function partieValidee(
  secteur: string,
  niveau: number,
  graine: number,
  politique: "propose" | "neutre-a-la-qualite-proposee" | "bon" = "propose",
) {
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
      const ctx = {
        scenario,
        state: etat,
        roundIndex: tour,
        lastSoldUnits: vendu(p),
        lastSoldByProduct: p ? soldByProduct(scenario, p.market.bySegment) : undefined,
      };
      decisions[e.id] =
        e.ctl === "human" && politique === "neutre-a-la-qualite-proposee"
          ? (() => {
              const neutre = decisionDeLaGestionNeutre(ctx, leviers);
              return aLaMesureDuNiveau(avecLaQualiteProposee(scenario, neutre), leviers, neutre);
            })()
          : e.ctl === "human" && politique === "bon"
            ? decisionDeReference({ ...ctx, ...(p ? { resultatPrecedent: p } : {}), ...(precedente ? { decisionPrecedente: precedente } : {}) }, leviers)
            : e.ctl === "human"
          ? proposedDecisionsFor({
              snapshot: scenario,
              state: etat,
              roundIndex: tour,
              previousPayload: precedente,
              lastMarket: p?.market.bySegment ?? null,
              lastBreakEven: p?.breakeven.breakEvenUnits ?? null,
              lastNetIncome: p?.incomeStatement.netIncome ?? null,
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
  return { tours, statut, cumul: tours.reduce((t, r) => t + r.incomeStatement.netIncome, 0) };
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

describe("une proposition neutre : ni une stratégie, ni une aide à gagner", () => {
  // Les secteurs où la gestion neutre joue la même partie que la proposition (ni
  // référence à bâtir, que la gestion neutre finance et la proposition jamais, ni
  // budget de marque, que la proposition remet aux références).
  const CAS: [string, number][] = [
    ["nova", 2],
    ["nova", 4],
    ["boutique", 4],
    ["hotel", 2],
    ["bistrot", 3],
    ["conseil", 2],
    ["transport", 4],
    ["batiment", 4],
  ];
  for (const [secteur, niveau] of CAS) {
    it(`${secteur}, niveau ${niveau} : à ±15 % de la gestion neutre à la qualité proposée, loin du bon gestionnaire`, () => {
      const somme = (politique: "propose" | "neutre-a-la-qualite-proposee" | "bon") =>
        GRAINES.reduce((t, g) => t + partieValidee(secteur, niveau, g, politique).cumul, 0) / GRAINES.length;
      const [proposee, neutre, bon] = [somme("propose"), somme("neutre-a-la-qualite-proposee"), somme("bon")];
      expect(Math.abs(proposee - neutre), `proposée ${Math.round(proposee)} €, neutre ${Math.round(neutre)} €`).toBeLessThanOrEqual(
        Math.max(0.15 * Math.abs(neutre), 15_000),
      );
      expect(proposee, `bon gestionnaire ${Math.round(bon)} €`).toBeLessThan(bon - 20_000);
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
    rdBudget: 5_000,
  };
  const marche = (vendus: number, manques: number): MarcheDuTourPasse =>
    Object.fromEntries(
      scenario.market.segments.map((s, i) => [s.code, i === 0 ? { sold: vendus, lost: manques } : { sold: 0, lost: 0 }]),
    );
  const proposer = (
    lastMarket: MarcheDuTourPasse,
    o: { etat?: CompanyState; tour?: number; s?: typeof scenario; pointMort?: number; resultat?: number } = {},
  ) =>
    proposedDecisionsFor({
      snapshot: o.s ?? scenario,
      state: o.etat ?? ouverture,
      roundIndex: o.tour ?? 2,
      previousPayload: precedente,
      lastMarket,
      lastBreakEven: o.pointMort ?? 3_000,
      lastNetIncome: o.resultat ?? 5_000,
      leviers,
    });
  const planNeutre = (vendus: number, etat: CompanyState = ouverture) =>
    Math.floor(neutralDecisions({ scenario, state: etat, roundIndex: 2, lastSoldUnits: vendus }).productionPlan);

  it("le prix et les budgets restent ceux de l'équipe, sans R&D ; le plan est celui de la gestion neutre", () => {
    const d = proposer(marche(3_000, 1_000));
    expect(d).toMatchObject({ price: 61.5, marketingBudget: 7_000, qualityBudget: 2_000, maintenanceBudget: 4_500, supplierChoice: "premium", rdBudget: 0 });
    // Les ventes réalisées, pas la demande manquée.
    expect(d.productionPlan).toBe(planNeutre(3_000));
    expect(proposer(marche(3_000, 4_000)).productionPlan).toBe(planNeutre(3_000));
  });

  it("le plancher du point mort : seulement après une perte, à découvert, quand la demande le permet", () => {
    const aDecouvert = { ...ouverture, finance: { ...ouverture.finance, cash: 0, overdraft: 12_000 } };
    const sousLePointMort = { pointMort: 5_400, resultat: -8_000 };
    const plancher = proposer(marche(4_000, 2_500), { ...sousLePointMort, etat: aDecouvert }).productionPlan;
    expect(plancher).toBeGreaterThan(planNeutre(4_000, aDecouvert));
    expect(plancher).toBe(Math.floor(5_400 * 1.02));
    // Sans perte, sans découvert, ou sans demande manquée : le plan de la gestion neutre.
    expect(proposer(marche(4_000, 2_500), { pointMort: 5_400, resultat: 1_000, etat: aDecouvert }).productionPlan).toBe(planNeutre(4_000, aDecouvert));
    expect(proposer(marche(4_000, 2_500), sousLePointMort).productionPlan).toBe(planNeutre(4_000));
    expect(proposer(marche(4_000, 0), { ...sousLePointMort, etat: aDecouvert }).productionPlan).toBe(planNeutre(4_000, aDecouvert));
    // Jamais au-delà de la demande reçue.
    expect(proposer(marche(4_000, 300), { ...sousLePointMort, etat: aDecouvert }).productionPlan).toBeLessThanOrEqual(
      Math.ceil(4_300 * 2),
    );
  });

  it("rien du marché caché : le même tour sur le scénario expurgé propose la même chose", () => {
    const lu = marche(3_200, 800);
    expect(proposer(lu, { tour: 3, s: expurgerLeScenario(scenario) })).toEqual(proposer(lu, { tour: 3 }));
  });
});
