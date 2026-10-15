import { describe, expect, it } from "vitest";
import { roundDecisionsSchema } from "@/services/decision-schema";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { novaCompany, novaScenario } from "@/config/scenarios/nova";
import { ecommerceScenario } from "@/config/scenarios/ecommerce";
import { bistrotScenario } from "@/config/scenarios/bistrot";
import { conseilScenario } from "@/config/scenarios/conseil";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { presetByLevel } from "@/config/difficulty";
import { decisionsSaisies } from "@/config/decisions-saisies";
import { champDeModule, modulesSaisis } from "@/config/modules-saisis";
import { carryOverDecisions } from "@/services/decision.service";
import {
  bilanDesModules,
  construireOffreDesModules,
  refusDesModules,
  type OffreDesModules,
} from "@/services/modules-offer";
import { simulateRound } from "@/engine/simulation";
import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";

/**
 * LES MODULES DU SCÉNARIO, DE LA FEUILLE AU MOTEUR.
 *
 * Deux catalogues optionnels restent au jeu : les démarches qualité et les
 * programmes de R&D. Chaque maillon de la chaîne est gardé ici : le formulaire
 * qui les lit, le schéma qui les laisse passer (un `z.object` supprime en
 * silence ce qu'il ne connaît pas), le snapshot qui les garde, l'offre qui ne
 * propose que ce qui est ouvert, le serveur qui refuse le reste, et le moteur
 * qui les compte.
 */

const BASE: RoundDecisions = {
  price: 79,
  productionPlan: 5000,
  marketingBudget: 8000,
  qualityBudget: 4000,
  maintenanceBudget: 4000,
};

const MODULES: Partial<RoundDecisions> = {
  qualityActions: [{ actionCode: "amelioration_composants", level: 1 }],
  startedRdActionIds: ["rd-process"],
};

describe("(a) le schéma des décisions garde les choix de module", () => {
  it("chaque champ de module passe tel quel", () => {
    const lu = roundDecisionsSchema.parse({ ...BASE, ...MODULES });
    for (const [cle, valeur] of Object.entries(MODULES)) {
      expect(lu[cle as keyof typeof lu], cle).toEqual(valeur);
    }
  });

  it("une liste démesurée est refusée", () => {
    const trop = Array.from({ length: 21 }, (_, i) => `x${i}`);
    expect(roundDecisionsSchema.safeParse({ ...BASE, startedRdActionIds: trop }).success).toBe(false);
  });

  it("sans module, rien n'est ajouté ; la décision d'un module retiré tombe", () => {
    const lu = roundDecisionsSchema.parse(BASE);
    expect(Object.keys(lu).sort()).toEqual(Object.keys(BASE).sort());
    const ancienne = roundDecisionsSchema.parse({ ...BASE, activePricingStrategyIds: ["ps-premium"] });
    expect(Object.keys(ancienne).sort()).toEqual(Object.keys(BASE).sort());
  });
});

describe("(b) le snapshot du scénario garde ses catalogues", () => {
  /** Les clés de chaque élément de catalogue, telles que les types moteur les déclarent. */
  const CLES: Record<string, { liste: string; cles: string[] }> = {
    qualityActions: { liste: "actions", cles: ["code", "label", "levels"] },
    rdActions: { liste: "actions", cles: ["id", "label", "costPerRound", "durationRounds", "effects"] },
  };
  const SCENARIOS: [string, EngineScenarioConfig, string[]][] = [
    ["nova", novaScenario, ["qualityActions", "rdActions"]],
    ["ecommerce", ecommerceScenario, ["qualityActions", "rdActions"]],
    ["bistrot", bistrotScenario, ["qualityActions"]],
    ["conseil", conseilScenario, []],
  ];

  for (const [code, scenario, attendus] of SCENARIOS) {
    it(`${code} : chaque catalogue survit à l'aller-retour en base, champ par champ`, () => {
      // Le snapshot est figé en JSON à la création, puis relu par parseScenarioConfig.
      const relu = parseScenarioConfig(JSON.parse(JSON.stringify(scenario)));
      for (const bloc of Object.keys(CLES)) {
        const avant = (scenario as unknown as Record<string, Record<string, unknown[]>>)[bloc];
        const apres = (relu as unknown as Record<string, Record<string, unknown[]>>)[bloc];
        if (!attendus.includes(bloc)) {
          expect(avant, `${code}.${bloc} inattendu`).toBeUndefined();
          continue;
        }
        const { liste, cles } = CLES[bloc]!;
        expect(avant, `${code}.${bloc} absent du scénario`).toBeDefined();
        expect(apres, `${code}.${bloc} perdu au chargement`).toEqual(avant);
        for (const el of apres![liste]!) {
          for (const k of cles) expect(el, `${code}.${bloc}.${liste} : ${k}`).toHaveProperty(k);
        }
      }
    });
  }

  it("le scénario joué (niveau, périodicité) garde les catalogues", () => {
    const joue = composerLeScenarioJoue({
      scenario: novaScenario,
      seed: 1,
      level: 6,
      concurrents: 3,
      periodicity: "quarter",
    });
    expect(joue.qualityActions).toEqual(novaScenario.qualityActions);
    expect(parseScenarioConfig(JSON.parse(JSON.stringify(joue))).rdActions).toEqual(novaScenario.rdActions);
  });
});

/** Deux entreprises NOVA, la seconde sans module : la différence vient des modules. */
function tour(
  roundIndex: number,
  companies: CompanyState[],
  decisionsA: RoundDecisions,
): ReturnType<typeof simulateRound> {
  return simulateRound({
    scenario: novaScenario,
    roundIndex,
    companies,
    decisions: { a: decisionsA, b: BASE },
    activeEvents: [],
    seed: 11,
  });
}

describe("(c) le moteur compte les modules choisis", () => {
  it("démarche qualité et programme R&D : coûts du tour, puis effets", () => {
    const depart = [novaCompany("a", "A", "human"), novaCompany("b", "B", "human")];
    const t1 = tour(1, depart, { ...BASE, ...MODULES });
    const r1 = t1.results.a!;
    const niveau = novaScenario.qualityActions!.actions.find((a) => a.code === "amelioration_composants")!.levels[0]!;
    const programme = novaScenario.rdActions!.actions.find((a) => a.id === "rd-process")!;
    expect(r1.qualityActions?.started).toEqual([{ actionCode: "amelioration_composants", level: 1, cost: niveau.cost }]);
    expect(r1.rdActionsCost).toBe(programme.costPerRound);
    expect(t1.results.b!.qualityActions).toBeUndefined();
    expect(t1.results.b!.rdActionsCost).toBeUndefined();
    const etatA = t1.companies.find((c) => c.id === "a")!;
    expect(etatA.qualityActionsCompleted).toEqual({ amelioration_composants: 1 });
    expect(etatA.rdActionsInProgress).toEqual([{ id: "rd-process", roundsCompleted: 1 }]);
  });

  it("le bilan du tour dit ce qui a été engagé, ce que cela a coûté et l'effet", () => {
    const depart = [novaCompany("a", "A", "human"), novaCompany("b", "B", "human")];
    const decisions: RoundDecisions = { ...BASE, ...MODULES };
    const t1 = tour(1, depart, decisions);
    const bilan = bilanDesModules(t1.results.a!, decisions, novaScenario)!;
    const rd = bilan.lignes.find((l) => l.titre === "Programmes de R&D")!;
    expect(rd.engage).toEqual(["Optimisation du process de fabrication"]);
    expect(rd.cout).toBe(novaScenario.rdActions!.actions.find((a) => a.id === "rd-process")!.costPerRound);
    expect(bilan.lignes.find((l) => l.titre === "Démarches qualité")!.engage).toEqual([
      "Amélioration des composants (qualité audio) · niveau 1",
    ]);
    // Une entreprise sans module n'a pas de bilan.
    expect(bilanDesModules(t1.results.b!, BASE, novaScenario)).toBeNull();
  });
});

describe("(d) l'offre des modules", () => {
  const offre = (tourJoue: number, etat: Partial<CompanyState> = {}, niveau?: 1 | 2 | 3 | 4 | 5 | 6) =>
    construireOffreDesModules({
      scenario: novaScenario,
      etat,
      tour: tourJoue,
      leviers: niveau ? presetByLevel.get(niveau)!.decisions : null,
    });

  it("n'offre que les catalogues présents dans le scénario", () => {
    const sansModule: EngineScenarioConfig = { ...novaScenario };
    delete sansModule.qualityActions;
    delete sansModule.rdActions;
    expect(construireOffreDesModules({ scenario: sansModule, etat: {}, tour: 3 })).toBeNull();
    const seulementLaRd = { ...sansModule, rdActions: novaScenario.rdActions };
    expect(construireOffreDesModules({ scenario: seulementLaRd, etat: {}, tour: 3 })!.map((m) => m.decision)).toEqual([
      "startedRdActionIds",
    ]);
    // Le conseil n'a plus aucun catalogue ; le bistrot n'a pas de programme R&D.
    expect(construireOffreDesModules({ scenario: conseilScenario, etat: {}, tour: 3 })).toBeNull();
    expect(construireOffreDesModules({ scenario: bistrotScenario, etat: {}, tour: 3 })!.map((m) => m.decision)).toEqual([
      "qualityActions",
    ]);
  });

  it("suit le niveau de la partie", () => {
    expect(offre(3, {}, 1)).toBeNull();
    // Niveaux 2 à 4 : la qualité seule ; la R&D s'ouvre au niveau 5.
    for (const niveau of [2, 3, 4] as const)
      expect(offre(3, {}, niveau)!.map((m) => m.decision), `niveau ${niveau}`).toEqual(["qualityActions"]);
    expect(offre(3, {}, 5)!.map((m) => m.decision)).toEqual(["qualityActions", "startedRdActionIds"]);
  });

  it("met à part ce qui tourne déjà et déduit les places prises", () => {
    const o = offre(3, {
      // Les matériaux (trois tours) occupent leur place ; l'emballage (deux tours) s'achève ce tour et la libère.
      rdActionsInProgress: [
        { id: "rd-materiaux", roundsCompleted: 1 },
        { id: "rd-emballage", roundsCompleted: 1 },
      ],
      qualityActionsCompleted: { amelioration_composants: 1 },
    })!;
    const rd = o.find((m) => m.decision === "startedRdActionIds")!;
    expect(rd.elements.map((e) => e.id)).toEqual(["rd-process"]);
    expect(rd.plafond).toBe(novaScenario.rdActions!.maxSimultaneousProjects - 1);
    expect(rd.enCours.map((x) => x.libelle)).toEqual(["R&D matériaux biosourcés", "Emballage recyclable"]);
    const qualite = o.find((m) => m.decision === "qualityActions")!;
    expect(qualite.elements.find((e) => e.id === "amelioration_composants")!.valeur).toBe("2");
  });

  it("chaque élément porte un libellé, un coût, une durée et des effets ; un niveau dit ce qui se fait", () => {
    const o: OffreDesModules = offre(3)!;
    for (const m of o) {
      for (const el of m.elements) {
        expect(el.libelle.length, el.id).toBeGreaterThan(0);
        expect(el.effets.length, el.id).toBeGreaterThan(0);
        expect(el.duree, el.id).not.toBeNull();
        expect(el.champ).toBe(champDeModule(m.decision, el.id));
      }
    }
    const libelles = offre(1)!.find((m) => m.decision === "qualityActions")!.elements.map((e) => e.libelle);
    expect(libelles).toContain("Amélioration du process (assemblage) · niveau 1 : standardisation des postes de montage");
    for (const l of libelles) expect(l, l).not.toMatch(/ — | - /);
  });

  it("les rebuts et les retours ne se promettent que là où le scénario les compte", () => {
    const sansNonQualite: EngineScenarioConfig = { ...ecommerceScenario };
    delete sansNonQualite.qualityCosts;
    const effets = (s: EngineScenarioConfig) =>
      construireOffreDesModules({ scenario: s, etat: {}, tour: 1 })!
        .find((m) => m.decision === "qualityActions")!
        .elements.flatMap((e) => e.effets);
    expect(effets(ecommerceScenario).some((e) => e.startsWith("Retours clients"))).toBe(true);
    expect(effets(sansNonQualite).some((e) => e.startsWith("Retours clients") || e.startsWith("Rebuts"))).toBe(false);
  });
});

describe("la lecture du formulaire et le jugement du serveur", () => {
  it("les cases cochées deviennent des décisions, par le même lecteur des deux côtés", () => {
    const f = new FormData();
    f.set("price", "79");
    f.set("productionPlan", "5000");
    f.set(champDeModule("startedRdActionIds", "rd-process"), "rd-process");
    f.set(champDeModule("qualityActions", "amelioration_composants"), "1");
    // Une case d'un module retiré (brouillon d'avant) : rien n'en sort.
    f.set("module.activePricingStrategyIds.ps-premium", "ps-premium");
    const { decisions } = decisionsSaisies(f);
    expect(decisions.startedRdActionIds).toEqual(["rd-process"]);
    expect(decisions.qualityActions).toEqual([{ actionCode: "amelioration_composants", level: 1 }]);
    expect("activePricingStrategyIds" in decisions).toBe(false);
    expect(roundDecisionsSchema.parse(decisions).startedRdActionIds).toEqual(["rd-process"]);
    // Rien coché : aucune clé de module.
    expect(modulesSaisis(new FormData().entries())).toEqual({});
  });

  it("refuse un choix hors de l'offre, un plafond dépassé, un module non proposé", () => {
    const o = construireOffreDesModules({ scenario: novaScenario, etat: {}, tour: 1 });
    expect(refusDesModules({ startedRdActionIds: ["rd-process"] }, o)).toEqual([]);
    // Un programme inconnu du catalogue.
    expect(refusDesModules({ startedRdActionIds: ["rd-inconnu"] }, o)).toHaveLength(1);
    // Plafond : deux programmes en même temps.
    const rd = refusDesModules({ startedRdActionIds: ["rd-materiaux", "rd-process", "rd-emballage"] }, o);
    expect(rd.map((e) => e.champ)).toEqual([champDeModule("startedRdActionIds", "rd-emballage")]);
    // Un niveau qualité qui n'est pas le suivant.
    expect(refusDesModules({ qualityActions: [{ actionCode: "amelioration_composants", level: 2 }] }, o)).toHaveLength(1);
    // Une partie sans module refuse tout choix de module.
    expect(refusDesModules({ startedRdActionIds: ["rd-process"] }, null)).toHaveLength(1);
  });

  it("la reconduction d'un tour non rendu ne relance aucun module", () => {
    const reconduit = carryOverDecisions({ ...BASE, ...MODULES });
    for (const cle of Object.keys(MODULES)) {
      expect(reconduit[cle as keyof RoundDecisions], cle).toBeUndefined();
    }
  });
});
