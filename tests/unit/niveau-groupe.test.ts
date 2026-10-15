import { describe, expect, it } from "vitest";
import {
  DIFFICULTY_PRESETS,
  NIVEAU_GROUPE,
  presetByLevel,
  presetFromProfile,
  profilDuNiveau,
} from "@/config/difficulty";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { novaGammeScenario } from "@/config/scenarios/nova-gamme";
import { novaScenario } from "@/config/scenarios/nova";
import { aLaMesureDuNiveau } from "@/engine/bots";
import { comparatifDesNiveaux, tableauDuNiveau } from "@/config/tableau-des-niveaux";
import { roundDecisionsSchema } from "@/services/decision-schema";
import type { RoundDecisions } from "@/engine/types";

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
      rachat: { cible: { type: "site_ferme", id: "x" }, prixMaximum: 1, paiement: "numeraire" },
      diligence: { type: "site_ferme", id: "x" },
      sousTraitance: { "nova-go": 100 },
    } as RoundDecisions;
    const six = aLaMesureDuNiveau(d, presetByLevel.get(6)!.decisions);
    expect(six.rachat).toBeUndefined();
    expect(six.diligence).toBeUndefined();
    expect(six.sousTraitance).toBeUndefined();
    const sept = aLaMesureDuNiveau(d, NIVEAU_GROUPE.decisions);
    expect(sept.rachat).toBeDefined();
    expect(sept.diligence).toBeDefined();
    expect(sept.sousTraitance).toBeDefined();
  });
});

describe("le bloc de groupe du snapshot", () => {
  it("n'existe qu'au niveau 7, et seulement pour un scénario qui en porte un", () => {
    for (const level of [1, 2, 3, 4, 5, 6]) expect(composer(novaGammeScenario, level).groupe, `niveau ${level}`).toBeUndefined();
    expect(composer(novaScenario, 7).groupe).toBeUndefined();
    expect(composer(novaGammeScenario, 7).groupe).toBeDefined();
  });

  it("le snapshot du 7 est celui du 6, bloc de groupe en plus : la demande n'est ni lissée ni réduite", () => {
    const six = composer(novaGammeScenario, 6);
    const sept = composer(novaGammeScenario, 7);
    const sansGroupe = { ...sept };
    delete sansGroupe.groupe;
    expect(sansGroupe).toEqual(six);
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
    // les charges d'un site aussi ; son prix, non
    expect(mois.groupe!.sites![0]!.chargesParTour).toBeCloseTo((trim.groupe!.sites![0]!.chargesParTour * mois.roundDays) / trim.roundDays, 6);
    expect(mois.groupe!.sites![0]!.prix).toBe(trim.groupe!.sites![0]!.prix);
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
    expect(classe.groupe?.sites).toBeUndefined();
    expect(classe.groupe?.sousTraitance).toBeDefined();
  });
});

describe("les décisions du niveau 7 passent le schéma", () => {
  const base = { price: 50, productionPlan: 100, marketingBudget: 0, qualityBudget: 0, maintenanceBudget: 0 };
  it("rachat, audit et sous-traitance, bornés", () => {
    const site = { type: "site_ferme", id: "hexalys" };
    const ok = roundDecisionsSchema.safeParse({
      ...base,
      rachat: { cible: site, prixMaximum: 200000, paiement: "numeraire", emprunt: 100000, augmentationDeCapital: 50000 },
      diligence: site,
      sousTraitance: { "nova-go": 1500 },
    });
    expect(ok.success).toBe(true);
    expect(roundDecisionsSchema.safeParse({ ...base, rachat: { cible: site, prixMaximum: -1, paiement: "numeraire" } }).success).toBe(false);
    expect(roundDecisionsSchema.safeParse({ ...base, rachat: { cible: site, prixMaximum: 1, paiement: "troc" } }).success).toBe(false);
    // une cible se nomme par son type : un identifiant nu ne passe plus
    expect(roundDecisionsSchema.safeParse({ ...base, rachat: { cible: "bot-1", prixMaximum: 1, paiement: "numeraire" } }).success).toBe(false);
    expect(roundDecisionsSchema.safeParse({ ...base, diligence: { type: "concurrent", id: "bot-1" } }).success).toBe(false);
  });
});
