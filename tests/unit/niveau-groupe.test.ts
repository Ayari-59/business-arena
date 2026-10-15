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
import { GROUPE_NOVA } from "@/config/groupe/nova";
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

  it("aucun des six niveaux n'ouvre la croissance externe ni l'externalisation", () => {
    for (const p of DIFFICULTY_PRESETS) {
      expect(p.decisions.croissanceExterne, `niveau ${p.level}`).toBe(false);
      expect(p.decisions.externalisation, `niveau ${p.level}`).toBe(false);
    }
  });

  it("le monde du 7 est celui du 6, plus ses deux leviers", () => {
    const six = presetByLevel.get(6)!;
    expect(NIVEAU_GROUPE.eventProbabilityMultiplier).toBe(six.eventProbabilityMultiplier);
    expect({ ...NIVEAU_GROUPE.decisions, croissanceExterne: false, externalisation: false }).toEqual(six.decisions);
  });

  it("une partie de niveau 7 fige ses leviers ; un profil d'avant les lit fermés", () => {
    const profil = { difficulty: profilDuNiveau(NIVEAU_GROUPE) };
    expect(presetFromProfile(profil).decisions).toEqual(NIVEAU_GROUPE.decisions);
    const ancien = { difficulty: { level: 6, decisions: { ...presetByLevel.get(6)!.decisions, croissanceExterne: undefined, externalisation: undefined } } };
    expect(presetFromProfile(ancien).decisions.croissanceExterne).toBe(false);
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
      rachat: { cible: "x", prixMaximum: 1, paiement: "numeraire" },
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

  it("le snapshot du 7 est celui du 6, marché propre et bloc de groupe en plus", () => {
    const six = composer(novaGammeScenario, 6);
    const sept = composer(novaGammeScenario, 7);
    const f = GROUPE_NOVA.facteurDeDemande!;
    const sansGroupe = { ...sept };
    delete sansGroupe.groupe;
    const sixAuMarcheDu7 = {
      ...six,
      market: { ...six.market, segments: six.market.segments.map((s) => ({ ...s, size: s.size * f })) },
      products: six.products!.map((p) => ({
        ...p,
        market: { ...p.market, segments: p.market.segments.map((s) => ({ ...s, size: s.size * f })) },
      })),
    };
    expect(sansGroupe).toEqual(sixAuMarcheDu7);
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
  it("rachat et sous-traitance, bornés", () => {
    const ok = roundDecisionsSchema.safeParse({
      ...base,
      rachat: { cible: "bot-1", prixMaximum: 200000, paiement: "numeraire", emprunt: 100000, augmentationDeCapital: 50000 },
      sousTraitance: { "nova-go": 1500 },
    });
    expect(ok.success).toBe(true);
    expect(roundDecisionsSchema.safeParse({ ...base, rachat: { cible: "bot-1", prixMaximum: -1, paiement: "numeraire" } }).success).toBe(false);
    expect(roundDecisionsSchema.safeParse({ ...base, rachat: { cible: "bot-1", prixMaximum: 1, paiement: "troc" } }).success).toBe(false);
  });
});
