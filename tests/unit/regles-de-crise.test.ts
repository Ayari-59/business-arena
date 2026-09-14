import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { applyEconomicOverrides, sanitizeEconomicOverrides } from "@/config/difficulty";
import { economicDefaults } from "@/config/scenarios/registry";
import { scenarioByCode } from "@/config/scenarios/registry";
import { parseScenarioConfig } from "@/config/scenarios/schema";

/**
 * LES RÈGLES DE DÉFAILLANCE APPARTIENNENT À L'ENSEIGNANT.
 *
 * Deux tours de cessation de paiements avant la faillite, et un crédit sans
 * borne : c'étaient des constantes du moteur. Ce sont des règles de jeu, et
 * elles n'ont pas la même valeur selon la séance — une heure en BTS ne se
 * joue pas comme un atelier de quatre séances en DCG.
 *
 * Le chemin est celui, déjà écrit, des paramètres économiques : le panneau
 * enseignant → `sanitizeEconomicOverrides` → `applyEconomicOverrides` → le
 * snapshot figé de la partie. Ce test garde le chemin ENTIER, parce qu'un
 * maillon manquant ne casse rien de visible : le réglage est simplement
 * ignoré, et l'enseignant croit avoir changé la règle.
 */

const PANNEAU = readFileSync("src/components/economic-params.tsx", "utf-8");
const ACTION_PARTIE = readFileSync("src/app/teacher/actions.ts", "utf-8");
const ACTION_SCENARIO = readFileSync("src/app/teacher/scenarios/actions.ts", "utf-8");

const REGLES = ["maxDebtToEquity", "crisisRoundsBeforeFailure"] as const;

describe("règles de crise réglables par l'enseignant", () => {
  it("chaque règle est posée par le panneau et relue par les deux actions", () => {
    for (const regle of REGLES) {
      expect(PANNEAU, `${regle} : absent du panneau enseignant`).toContain(`name: "${regle}"`);
      expect(ACTION_PARTIE, `${regle} : la création de partie ne le relit pas`).toContain(regle);
      expect(ACTION_SCENARIO, `${regle} : l'éditeur de scénario ne le relit pas`).toContain(regle);
    }
  });

  it("les valeurs du scénario préremplissent le panneau", () => {
    // Un champ vide passerait pour « pas de règle » alors que le moteur en
    // applique une : l'enseignant doit voir ce qu'il modifie.
    const defauts = economicDefaults(scenarioByCode("nova")!);
    expect(defauts.maxDebtToEquity).toBe("2");
    expect(defauts.crisisRoundsBeforeFailure).toBe("2");
  });

  it("le réglage traverse la validation et atteint la config du moteur", () => {
    const propre = sanitizeEconomicOverrides({
      maxDebtToEquity: 3.5,
      crisisRoundsBeforeFailure: 1,
    });
    const config = applyEconomicOverrides(scenarioByCode("nova")!.scenario, propre);
    expect(config.finance.maxDebtToEquity).toBe(3.5);
    expect(config.finance.crisisRoundsBeforeFailure).toBe(1);
  });

  it("une valeur hors bornes est ignorée, pas retenue de travers", () => {
    // La règle de la maison : hors bornes = on garde la valeur du scénario,
    // jamais d'échec de création de partie.
    const propre = sanitizeEconomicOverrides({
      maxDebtToEquity: 99,
      crisisRoundsBeforeFailure: 0,
    });
    expect(propre.maxDebtToEquity).toBeUndefined();
    expect(propre.crisisRoundsBeforeFailure).toBeUndefined();
    const config = applyEconomicOverrides(scenarioByCode("nova")!.scenario, propre);
    expect(config.finance.maxDebtToEquity).toBe(2);
  });

  it("le schéma du scénario conserve les deux règles au parse", () => {
    // Le parse est la frontière que traverse le snapshot : une clé qu'il ne
    // déclare pas est retirée en silence, et la règle ne vaudrait plus qu'en
    // mémoire — jamais en partie.
    const brut = JSON.parse(
      JSON.stringify(
        applyEconomicOverrides(scenarioByCode("nova")!.scenario, {
          maxDebtToEquity: 4,
          crisisRoundsBeforeFailure: 3,
        }),
      ),
    );
    const relu = parseScenarioConfig(brut);
    expect(relu.finance.maxDebtToEquity).toBe(4);
    expect(relu.finance.crisisRoundsBeforeFailure).toBe(3);
  });
});
