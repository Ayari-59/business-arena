import { describe, expect, it } from "vitest";
import {
  DIFFICULTY_PRESETS,
  NIVEAU_GROUPE,
  presetByLevel,
  presetFromProfile,
  profilDuNiveau,
} from "@/config/difficulty";
import { agrandirLeScenario, composerLeScenarioJoue, rdDuNiveau } from "@/config/scenarios/scenario-joue";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { novaGammeCompany, novaGammeScenario } from "@/config/scenarios/nova-gamme";
import { novaScenario } from "@/config/scenarios/nova";
import { aLaMesureDuNiveau } from "@/engine/bots";
import { comparatifDesNiveaux, tableauDuNiveau } from "@/config/tableau-des-niveaux";
import { roundDecisionsSchema } from "@/services/decision-schema";
import type { RoundDecisions } from "@/engine/types";
import { agrandir } from "@/engine/groupe";
import { NOVA_HOME } from "@/config/groupe/nova";
import { simulateRound } from "@/engine/simulation";
import { balanceGap } from "@/engine/finance/statements";

/** Une décision neutre et sobre du tour 1. */
const NIVEAU_GROUPE_DECISION: RoundDecisions = { price: 60, productionPlan: 0, marketingBudget: 0, qualityBudget: 0, maintenanceBudget: 0 };

/**
 * LE NIVEAU 7 « GROUPE », À CÔTÉ DU PARCOURS.
 *
 * Il ne doit rien changer aux six niveaux : ni leur liste, ni leurs leviers, ni
 * leur tableau ; et son bloc de groupe n'existe que dans un snapshot de niveau
 * 7 d'un scénario qui en porte un.
 */
const composer = (scenario: typeof novaGammeScenario, level: number, concurrents = 4) =>
  composerLeScenarioJoue({ scenario, seed: 2026, level, concurrents, periodicity: "quarter", investmentStories: true });

describe("le niveau 7, à côté des six niveaux du parcours", () => {
  it("les six niveaux restent six ; le 7 se lit par son numéro", () => {
    expect(DIFFICULTY_PRESETS.map((p) => p.level)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(presetByLevel.get(7)).toBe(NIVEAU_GROUPE);
    expect(NIVEAU_GROUPE.decisions.croissanceExterne).toBe(true);
    expect(NIVEAU_GROUPE.decisions.externalisation).toBe(true);
  });

  it("les six niveaux ne portent même pas les leviers du 7 : leurs profils figés restent ceux d'avant", () => {
    for (const p of DIFFICULTY_PRESETS) {
      expect("croissanceExterne" in p.decisions, `niveau ${p.level}`).toBe(false);
      expect("externalisation" in p.decisions, `niveau ${p.level}`).toBe(false);
      expect(Object.keys(profilDuNiveau(p).decisions)).not.toContain("croissanceExterne");
    }
  });

  it("le monde du 7 est celui du 6, plus ses deux leviers", () => {
    const six = presetByLevel.get(6)!;
    expect(NIVEAU_GROUPE.eventProbabilityMultiplier).toBe(six.eventProbabilityMultiplier);
    const { croissanceExterne: _c, externalisation: _e, ...reste } = NIVEAU_GROUPE.decisions;
    void _c;
    void _e;
    expect(reste).toEqual(six.decisions);
  });

  it("une partie de niveau 7 fige ses leviers ; un profil d'avant les lit fermés", () => {
    const profil = { difficulty: profilDuNiveau(NIVEAU_GROUPE) };
    expect(presetFromProfile(profil).decisions).toEqual(NIVEAU_GROUPE.decisions);
    const ancien = { difficulty: { level: 6, decisions: { ...presetByLevel.get(6)!.decisions } } };
    expect(presetFromProfile(ancien).decisions).toEqual(presetByLevel.get(6)!.decisions);
    expect(presetFromProfile(ancien).decisions.croissanceExterne).toBeFalsy();
  });

  it("le tableau et le comparatif des six niveaux ne parlent pas des leviers du 7", () => {
    const lignes = comparatifDesNiveaux().lignes.map((l) => l.groupe);
    expect(lignes).not.toContain("croissanceExterne");
    expect(lignes).not.toContain("externalisation");
    for (const p of DIFFICULTY_PRESETS) {
      const t = tableauDuNiveau(p.level)!;
      expect(t.gere.join(" ")).not.toMatch(/rachat|sous-traitance|atelier/i);
    }
  });

  it("le bot ne rachète ni ne sous-traite hors des leviers ouverts", () => {
    const d = {
      price: 50,
      productionPlan: 1000,
      marketingBudget: 0,
      qualityBudget: 0,
      maintenanceBudget: 0,
      rachat: { cible: { type: "fournisseur", id: "standard" }, prixMaximum: 1, paiement: "numeraire" },
      sousTraitance: { "nova-go": 100 },
    } as RoundDecisions;
    const six = aLaMesureDuNiveau(d, presetByLevel.get(6)!.decisions);
    expect(six.rachat).toBeUndefined();
    expect(six.sousTraitance).toBeUndefined();
    const sept = aLaMesureDuNiveau(d, NIVEAU_GROUPE.decisions);
    expect(sept.rachat).toBeDefined();
    expect(sept.sousTraitance).toBeDefined();
  });
});

describe("le bloc de groupe du snapshot", () => {
  it("n'existe qu'au niveau 7, et seulement pour un scénario qui en porte un", () => {
    for (const level of [1, 2, 3, 4, 5, 6]) expect(composer(novaGammeScenario, level).groupe, `niveau ${level}`).toBeUndefined();
    expect(composer(novaScenario, 7).groupe).toBeUndefined();
    expect(composer(novaGammeScenario, 7).groupe).toBeDefined();
  });

  it("le snapshot du 7 est celui du 6, Studio livrée prête, agrandi au facteur de départ, NOVA Home et bloc de groupe en plus : la demande n'est ni lissée ni réduite", () => {
    const six = composer(novaGammeScenario, 6);
    // Le 6 tel que le 7 le reprend : la Studio y est livrée prête (`rdDuNiveau` au
    // niveau 7), la seule chose que cette table change d'un niveau à l'autre.
    const sixPrete = rdDuNiveau(six, 7, true);
    const septBrut = composer(novaGammeScenario, 7);
    // La Studio est à développer au niveau 6, et livrée prête au niveau 7
    // (`REFERENCES_LIVREES_PRETES`), où la référence à développer est NOVA Home,
    // sa nouveauté propre.
    expect(novaGammeScenario.products!.find((p) => p.code === "nova-studio")!.development).toBeDefined();
    expect(six.products!.find((p) => p.code === "nova-studio")!.development).toBeDefined();
    expect(septBrut.products!.find((p) => p.code === "nova-studio")!.development).toBeUndefined();
    expect(six.products!.some((p) => p.code === "nova-home")).toBe(false);
    const home = septBrut.products!.find((p) => p.code === "nova-home")!;
    expect(home.development).toEqual(NOVA_HOME.reference.development);
    // Sans la Home, le 7 est le 6 agrandi, au caractère près.
    const sept = { ...septBrut, products: septBrut.products!.filter((p) => p.code !== "nova-home") };
    const sansGroupe = { ...sept };
    delete sansGroupe.groupe;
    const f = sept.groupe!.depart!.facteur;
    expect(f).toBeGreaterThan(1);
    expect(sansGroupe).toEqual(agrandirLeScenario(sixPrete, f));
    expect(sept.market).toEqual(six.market);
    expect(sept.products).toEqual(sixPrete.products);
    expect(sept.scriptedEvents).toEqual(six.scriptedEvents);
    // la structure suit la taille : l'effectif inclus et ses salaires, pas le reste
    expect(sept.hr!.includedHeadcount).toBe(Math.round(six.hr!.includedHeadcount * f));
    expect(sept.fixedCostsPerRound - six.fixedCostsPerRound).toBeCloseTo(
      (sept.hr!.includedHeadcount - six.hr!.includedHeadcount) * six.hr!.salaryPerEmployeePerRound,
      6,
    );
  });

  it("à la première ouverture, chaque entreprise prend sa taille de départ : lignes, effectif, bilan équilibré, valeur de départ = capitaux propres", () => {
    const sept = composer(novaGammeScenario, 7);
    const f = sept.groupe!.depart!.facteur;
    const e = novaGammeCompany("e0", "E0", "human");
    const g = agrandir(e, f);
    expect(g.machineCapacity).toBe(e.machineCapacity * f);
    expect(g.headcount).toBe(e.headcount * f);
    expect((g.fleet ?? []).map((l) => l.count)).toEqual((e.fleet ?? []).map((l) => l.count * f));
    expect(g.finance.equity).toBe(e.finance.equity * f);
    expect(Math.abs(balanceGap(g.finance))).toBeLessThan(0.01);
    expect((g.loans ?? [])[0]!.remaining).toBe((e.loans ?? [])[0]!.remaining * f);
    const bots = novaGammeCompany("e1", "E1", "bot", "premium");
    const out = simulateRound({
      scenario: sept,
      roundIndex: 1,
      companies: [e, bots],
      decisions: { e0: NIVEAU_GROUPE_DECISION, e1: NIVEAU_GROUPE_DECISION },
      activeEvents: [],
      seed: 2026,
    });
    for (const id of ["e0", "e1"]) {
      expect(out.results[id]!.production.machineCapacity).toBeCloseTo(e.machineCapacity * f, 6);
      expect(Math.abs(balanceGap(out.results[id]!.balanceSheet))).toBeLessThan(0.01);
    }
    // Les capitaux propres de départ : ceux de l'entreprise agrandie, plus le fonds de roulement apporté.
    expect(out.companies[0]!.groupe!.valeurInitialeParAction).toBeCloseTo(
      (e.finance.equity * f + (sept.groupe!.depart!.apport ?? 0)) / sept.groupe!.valorisation.actionsInitiales,
      6,
    );
  });

  it("survit au chargement du snapshot à la clôture", () => {
    const sept = composer(novaGammeScenario, 7);
    expect(parseScenarioConfig(JSON.parse(JSON.stringify(sept))).groupe).toEqual(sept.groupe);
  });

  it("au mois, les tranches et le plafond du sous-traitant suivent la périodicité", () => {
    const mois = composerLeScenarioJoue({ scenario: novaGammeScenario, seed: 2026, level: 7, concurrents: 4, periodicity: "month" });
    const trim = composer(novaGammeScenario, 7);
    const m = mois.groupe!.sousTraitance!["nova-one"]!;
    const t = trim.groupe!.sousTraitance!["nova-one"]!;
    expect(m.plafond).toBeCloseTo((t.plafond * mois.roundDays) / trim.roundDays, 6);
    expect(m.tranches[0]!.prix).toBe(t.tranches[0]!.prix);
  });

  it("une classe (croissance externe fermée) n'a pas de rachat, mais garde la sous-traitance", () => {
    const classe = composerLeScenarioJoue({
      scenario: novaGammeScenario,
      seed: 2026,
      level: 7,
      concurrents: 4,
      periodicity: "quarter",
      leviers: { ...NIVEAU_GROUPE.decisions, croissanceExterne: false },
    });
    expect(classe.groupe?.rachat).toBeUndefined();
    expect(classe.groupe?.sousTraitance).toBeDefined();
  });
});

describe("les décisions du niveau 7 passent le schéma", () => {
  const base = { price: 50, productionPlan: 100, marketingBudget: 0, qualityBudget: 0, maintenanceBudget: 0 };
  it("rachat et sous-traitance, bornés ; un site fermé n'est plus une cible", () => {
    const site = { type: "fournisseur", id: "acoustika" };
    const ok = roundDecisionsSchema.safeParse({
      ...base,
      rachat: { cible: site, prixMaximum: 200000, paiement: "numeraire", emprunt: 100000, augmentationDeCapital: 50000 },
      sousTraitance: { "nova-go": 1500 },
    });
    expect(ok.success).toBe(true);
    expect(roundDecisionsSchema.safeParse({ ...base, rachat: { cible: site, prixMaximum: -1, paiement: "numeraire" } }).success).toBe(false);
    expect(roundDecisionsSchema.safeParse({ ...base, rachat: { cible: site, prixMaximum: 1, paiement: "troc" } }).success).toBe(false);
    // une cible se nomme par son type : un identifiant nu ne passe plus
    expect(roundDecisionsSchema.safeParse({ ...base, rachat: { cible: "bot-1", prixMaximum: 1, paiement: "numeraire" } }).success).toBe(false);
    expect(
      roundDecisionsSchema.safeParse({ ...base, rachat: { cible: { type: "site_ferme", id: "hexalys" }, prixMaximum: 1, paiement: "numeraire" } }).success,
    ).toBe(false);
    expect(
      roundDecisionsSchema.safeParse({ ...base, rachat: { cible: { type: "fournisseur", id: "standard" }, prixMaximum: 1, paiement: "titres" } }).success,
    ).toBe(true);
  });
});
