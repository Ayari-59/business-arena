import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { NOVA_DEFINITION, scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { avecLaQualiteProposeeDe, composerLeScenarioJoue, CORRECTIFS_DES_PARTIES_NOUVELLES } from "@/config/scenarios/scenario-joue";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { leviersFigesDuProfil, presetByLevel, profilDuNiveau, type DifficultyPreset } from "@/config/difficulty";
import { neutralDecisions, type BotProfile } from "@/engine/bots";
import { sansAvenir } from "@/engine/market/sans-avenir";
import { investissementPlafonne } from "@/engine/investment/plafond";
import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import { commeEnBase, partieFigee, type PartieARejouer } from "@/pedagogy/merite/rejeu";
import { decisionDeReference, selonLeNiveau } from "@/pedagogy/merite/reference";
import { proposedDecisionsFor, startingDecisionsFor, type MarcheDuTourPasse } from "@/services/decision-baseline";

/**
 * LA PROPOSITION À LA DEMANDE ET SON BON GESTIONNAIRE (`propositionALaDemande`,
 * engine/types.ts), pour les parties créées avec le drapeau.
 *
 *   · le drapeau se pose à la création, et le bilan relit celui de la partie ;
 *   · sans lui, le formulaire et le bon gestionnaire d'avant, AU CENTIME : les
 *     empreintes de leurs décisions ont été relevées sur le commit d'avant le
 *     drapeau, et la branche les retrouve à l'identique ;
 *   · avec lui, le plan proposé lit la demande (ventes et ventes manquées) et la
 *     saison en phase, au tour 1 comme ensuite ;
 *   · avec lui seulement, le bon gestionnaire tient le formulaire : sans signal
 *     net, ses décisions sont celles du formulaire.
 *
 * Le garde-fou sur le verdict (valider seul n'est presque jamais « solide ») vit
 * dans `proposition-validee-merite.test.ts`.
 */

/** Une partie solo comme `createSoloGame` la crée, pour le rejeu (le cadre du bilan). */
function cadre(secteur: string, niveau: number, graine: number, drapeau: boolean) {
  const def = scenarioByCode(scenarioCodeForLevel(secteur, niveau));
  const preset = presetByLevel.get(niveau as DifficultyPreset["level"])!;
  const ouverts = preset.decisions;
  const leviers = leviersFigesDuProfil({ difficulty: profilDuNiveau(preset) });
  const equipes = [
    { id: "a-joueur", controller: "human" as const, botProfile: null },
    ...def.bots.slice(0, 2).map((b, i) => ({ id: `b-${i}`, controller: "bot" as const, botProfile: b.profile as string })),
  ];
  const mondes = new Map<number, EngineScenarioConfig>();
  const scenarioPour = (g: number) => {
    if (!mondes.has(g)) {
      mondes.set(
        g,
        commeEnBase(
          composerLeScenarioJoue({
            scenario: def.scenario,
            seed: g,
            variableWorld: true,
            level: niveau,
            concurrents: equipes.length,
            periodicity: "quarter",
            investmentStories: true,
            concurrentsAssainis: true,
            parcSansDoublon: true,
            ...(drapeau ? { propositionALaDemande: true } : {}),
          }),
        ),
      );
    }
    return mondes.get(g)!;
  };
  const etats = equipes.map((t) =>
    applyPeriodicityToCompany(def.company(t.id, t.id, t.controller, (t.botProfile ?? undefined) as BotProfile | undefined), "quarter", {
      abonnement: def.scenario.subscription !== undefined,
    }),
  );
  const base: PartieARejouer = {
    graine,
    joueur: "a-joueur",
    equipes,
    etatsInitiaux: etats,
    tours: scenarioPour(graine).roundsCount,
    scenarioPour,
    decisions: [],
    reconduits: [],
    pedagogie: [],
    investissementPlafonne: investissementPlafonne(ouverts),
    leviers,
    leviersDuNiveau: ouverts,
  };
  type Contexte = Parameters<Parameters<typeof partieFigee>[1]>[0];
  const formulaire = (c: Contexte) =>
    proposedDecisionsFor({
      snapshot: c.scenario,
      state: c.state,
      roundIndex: c.roundIndex,
      previousPayload: c.decisionPrecedente ?? null,
      lastMarket: c.resultatPrecedent?.market.bySegment ?? null,
      lastBreakEven: c.resultatPrecedent?.breakeven.breakEvenUnits ?? null,
      lastNetIncome: c.resultatPrecedent?.incomeStatement.netIncome ?? null,
      leviers,
    });
  return { base, ouverts, formulaire };
}

const empreinte = (x: unknown) => createHash("sha256").update(JSON.stringify(x)).digest("hex").slice(0, 16);

describe("le drapeau se pose à la création d'une partie, et nulle part ailleurs", () => {
  const reglages = {
    scenario: NOVA_DEFINITION.scenario,
    seed: 11,
    variableWorld: true,
    level: 2,
    concurrents: 3,
    periodicity: "quarter" as const,
  };

  it("le scénario joué le porte quand on le demande, et seulement alors ; le parse le garde", () => {
    const avec = composerLeScenarioJoue({ ...reglages, propositionALaDemande: true });
    expect(avec.propositionALaDemande).toBe(true);
    expect("propositionALaDemande" in composerLeScenarioJoue(reglages)).toBe(false);
    expect(parseScenarioConfig(JSON.parse(JSON.stringify(avec))).propositionALaDemande).toBe(true);
    expect(sansAvenir(avec, 2).propositionALaDemande).toBe(true);
  });

  it("la création d'une partie le demande, pour la partie et son tour d'essai, et le bilan relit celui de la partie", () => {
    const creation = readFileSync("src/services/game-creation.service.ts", "utf8");
    // La création pose les correctifs des parties nouvelles, pour la partie et son tour
    // d'essai ; ce correctif en fait partie (le lot de l'examen lit la même liste).
    expect(creation.match(/\.\.\.CORRECTIFS_DES_PARTIES_NOUVELLES/g)?.length).toBe(2);
    expect(CORRECTIFS_DES_PARTIES_NOUVELLES.propositionALaDemande).toBe(true);
    const rejeu = readFileSync("src/services/merite.service.ts", "utf8");
    expect(rejeu).toMatch(/propositionALaDemande: snapshot\.propositionALaDemande === true/);
  });
});

describe("la qualité proposée d'une partie à la demande (`qualiteProposeeALaDemande`)", () => {
  const transport = scenarioByCode("transport").scenario;
  const reglages = {
    scenario: transport,
    seed: 11,
    variableWorld: true,
    level: 2,
    concurrents: 3,
    periodicity: "quarter" as const,
  };

  it("avec le drapeau, le scénario joué la porte comme SA qualité proposée ; sans lui, celle d'avant ; la clé du registre ne passe jamais", () => {
    const aLaDemande = transport.qualiteProposeeALaDemande!;
    expect(aLaDemande, "le transport en donne une autre").not.toBe(transport.qualiteProposee);
    const avec = composerLeScenarioJoue({ ...reglages, propositionALaDemande: true });
    const sans = composerLeScenarioJoue(reglages);
    expect(avec.qualiteProposee).toBe(aLaDemande);
    expect(sans.qualiteProposee).toBe(transport.qualiteProposee);
    expect("qualiteProposeeALaDemande" in avec).toBe(false);
    expect("qualiteProposeeALaDemande" in sans).toBe(false);
    // Le bilan recompose le monde d'une partie depuis son instantané, et le retrouve
    // tel que la base le garde.
    const recompose = (instantane: EngineScenarioConfig, drapeau: boolean) =>
      composerLeScenarioJoue({
        ...reglages,
        scenario: avecLaQualiteProposeeDe(transport, instantane),
        ...(drapeau ? { propositionALaDemande: true } : {}),
      });
    expect(JSON.stringify(commeEnBase(recompose(avec, true)))).toBe(JSON.stringify(commeEnBase(avec)));
    expect(JSON.stringify(commeEnBase(recompose(sans, false)))).toBe(JSON.stringify(commeEnBase(sans)));
    // Une partie créée sous une autre qualité du registre retrouve la sienne, pas celle d'aujourd'hui.
    expect(recompose({ ...avec, qualiteProposee: aLaDemande / 2 }, true).qualiteProposee).toBe(aLaDemande / 2);
  });

  it("au transport, le formulaire d'une partie à drapeau la propose, et le bon gestionnaire la tient", () => {
    for (const niveau of [2, 4]) {
      const { base, ouverts, formulaire } = cadre("transport", niveau, 20260101, true);
      const echelle = base.scenarioPour(base.graine).production.qualityScale;
      const qualites: [number, number][] = [];
      partieFigee(base, (c) => {
        const bon = decisionDeReference(c, ouverts);
        qualites.push([formulaire(c).qualityBudget, bon.qualityBudget]);
        return bon;
      });
      expect(qualites[0]![0], `niveau ${niveau}, tour 1`).toBeCloseTo(transport.qualiteProposeeALaDemande! * echelle, 6);
      for (const [propose, tenu] of qualites) expect(tenu, `niveau ${niveau}`).toBe(propose);
    }
  });
});

describe("sans le drapeau, le formulaire et le bon gestionnaire d'avant, au centime", () => {
  // Relevées sur `ebd7c0a2` (avant le drapeau), graine 20260101, partie solo fidèle :
  // les décisions de qui valide le formulaire, puis celles du bon gestionnaire.
  const TEMOINS: [string, number, string, string][] = [
    ["nova", 2, "8ae4dbe7e4e242e7", "aac3daafda784786"],
    ["hotel", 2, "40f977795bc9fa9a", "aaede4d44779fff9"],
    ["transport", 4, "60fd2ef77138c920", "270d0aee1f08d18c"],
    ["fitness", 2, "6f9b04940a91aeb2", "deb3aa082703539c"],
    ["boutique", 4, "0b431638999ebe9f", "d93d99629e4d02b2"],
    ["nova", 5, "9e34190728e86245", "fd3622f93f0ae7b2"],
    ["bistrot", 4, "09d2cf4799a63252", "ca1ef079e0d70910"],
  ];
  for (const [secteur, niveau, valider, bon] of TEMOINS) {
    it(`${secteur}, niveau ${niveau} : les mêmes décisions qu'avant le drapeau`, () => {
      const { base, ouverts, formulaire } = cadre(secteur, niveau, 20260101, false);
      expect(empreinte(partieFigee(base, formulaire).decisions), "le formulaire validé").toBe(valider);
      expect(empreinte(partieFigee(base, (c) => decisionDeReference(c, ouverts)).decisions), "le bon gestionnaire").toBe(bon);
    });
  }
});

describe("avec le drapeau, le plan proposé lit la demande et la saison en phase", () => {
  const leviers = presetByLevel.get(2)!.decisions;
  // Une saison qu'on choisit : un pic au tour 3, un creux au tour 4.
  const SAISON = [1, 1, 1.3, 0.8, 1, 1];
  const saisonnier = (s: EngineScenarioConfig, saison: number[]): EngineScenarioConfig => ({
    ...s,
    market: {
      ...s.market,
      seasonality: saison,
      segments: s.market.segments.map((g) => ({ ...g, seasonality: saison })),
    },
  });
  const composer = (drapeau: boolean, saison = SAISON) =>
    saisonnier(
      composerLeScenarioJoue({
        scenario: NOVA_DEFINITION.scenario,
        seed: 8_919,
        variableWorld: true,
        level: 2,
        concurrents: 3,
        periodicity: "quarter",
        ...(drapeau ? { propositionALaDemande: true } : {}),
      }),
      saison,
    );
  const ouverture: CompanyState = applyPeriodicityToCompany(NOVA_DEFINITION.company("a", "NOVA", "human"), "quarter", {
    abonnement: false,
  });
  const precedente: RoundDecisions = {
    price: 61.5,
    productionPlan: 4_000,
    marketingBudget: 7_000,
    qualityBudget: 2_000,
    maintenanceBudget: 4_500,
  };
  const marche = (s: EngineScenarioConfig, vendus: number, manques: number): MarcheDuTourPasse =>
    Object.fromEntries(s.market.segments.map((g, i) => [g.code, i === 0 ? { sold: vendus, lost: manques } : { sold: 0, lost: 0 }]));
  const proposer = (s: EngineScenarioConfig, tour: number, vendus: number, manques: number) =>
    proposedDecisionsFor({
      snapshot: s,
      state: ouverture,
      roundIndex: tour,
      previousPayload: precedente,
      lastMarket: marche(s, vendus, manques),
      lastBreakEven: 1_000,
      lastNetIncome: 5_000,
      leviers,
    });
  const stock = ouverture.finishedGoods.quantity;
  const atelier = Math.min(
    ouverture.machineCapacity * ouverture.availability,
    (ouverture.headcount * ouverture.hoursPerEmployee * ouverture.productivity) / NOVA_DEFINITION.scenario.product.hoursPerUnit,
  );

  it("la demande du tour passé, ventes manquées comprises, à la saison du tour rapportée à celle du tour passé, moins le stock", () => {
    const s = composer(true);
    // Tour 3 : le pic. La saison du tour (1,3) sur celle du tour passé (1).
    const attendu = (2_000 + 800) * (SAISON[2]! / SAISON[1]!) - stock;
    expect(attendu).toBeLessThan(atelier);
    expect(proposer(s, 3, 2_000, 800).productionPlan).toBe(Math.floor(attendu));
    // Tour 4 : le creux, la saison du tour (0,8) sur celle du pic.
    expect(proposer(s, 4, 2_000, 800).productionPlan).toBe(Math.floor(Math.max(0, (2_800 * SAISON[3]!) / SAISON[2]! - stock)));
    // Les ventes manquées comptent : la même vente, plus de demande, plus de plan.
    expect(proposer(s, 3, 2_000, 1_200).productionPlan).toBeGreaterThan(proposer(s, 3, 2_000, 800).productionPlan);
    // Le prix et les budgets restent ceux de l'équipe.
    expect(proposer(s, 3, 2_000, 800)).toMatchObject({ price: 61.5, marketingBudget: 7_000, qualityBudget: 2_000 });
  });

  it("la saison des tours à venir n'y entre pas", () => {
    const avenir = [...SAISON.slice(0, 3), 3, 3, 3];
    expect(proposer(composer(true, avenir), 3, 2_000, 800)).toEqual(proposer(composer(true), 3, 2_000, 800));
  });

  it("sans le drapeau, le plan d'avant : les ventes réalisées, la demande manquée ignorée", () => {
    const s = composer(false);
    const neutre = Math.floor(neutralDecisions({ scenario: s, state: ouverture, roundIndex: 3, lastSoldUnits: 2_000 }).productionPlan);
    expect(proposer(s, 3, 2_000, 800).productionPlan).toBe(neutre);
    expect(proposer(s, 3, 2_000, 1_200).productionPlan).toBe(neutre);
    expect(proposer(composer(true), 3, 2_000, 800).productionPlan).not.toBe(neutre);
  });

  it("le tour 1 est mis en phase : le départ ne lit pas la saison du tour 2", () => {
    const depart = (s: EngineScenarioConfig) =>
      proposedDecisionsFor({ snapshot: s, state: ouverture, roundIndex: 1, previousPayload: null, leviers });
    const pic = [1, 1.3, 1, 1, 1, 1];
    const plat = [1, 1, 1, 1, 1, 1];
    // Avec le drapeau, le pic du tour 2 ne change rien au tour 1.
    expect(depart(composer(true, pic))).toEqual(depart(composer(true, plat)));
    expect(depart(composer(true, pic))).toEqual(startingDecisionsFor(sansAvenir(composer(true, pic), 1), ouverture, 1, leviers));
    // Sans lui, le départ produit déjà pour le pic du tour suivant.
    expect(depart(composer(false, pic)).productionPlan).toBeGreaterThan(depart(composer(false, plat)).productionPlan);
  });
});

describe("le bon gestionnaire tient le formulaire, avec le drapeau seulement", () => {
  // L'hôtel, le transport et le bistrot au niveau 2 : sur ce marché, rien n'y commande
  // un écart net, et le bon gestionnaire y est le formulaire, au centime (rapport
  // « mesure-gestionnaire »). Seuls diffèrent les montants de financement que la
  // méthode écrit toujours à zéro (`selonLeNiveau`).
  for (const secteur of ["hotel", "transport", "bistrot"]) {
    it(`${secteur}, niveau 2 : avec le drapeau, ses décisions sont celles du formulaire ; sans lui, non`, () => {
      for (const drapeau of [true, false]) {
        const { base, ouverts, formulaire } = cadre(secteur, 2, 20260101, drapeau);
        const ecarts: number[] = [];
        partieFigee(base, (c) => {
          const bon = decisionDeReference(c, ouverts);
          const propose = selonLeNiveau(formulaire(c), ouverts);
          if (JSON.stringify(commeEnBase(bon)) !== JSON.stringify(commeEnBase(propose))) ecarts.push(c.roundIndex);
          return bon;
        });
        if (drapeau) expect(ecarts, "tours où il s'écarte du formulaire").toEqual([]);
        else expect(ecarts.length, "le bon gestionnaire d'avant s'écarte du formulaire").toBeGreaterThan(0);
      }
    });
  }
});
