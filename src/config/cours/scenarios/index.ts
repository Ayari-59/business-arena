import { LE_DECOUVERT_DE_NOVA } from "./le-decouvert-de-nova";
import { L_OBJECTIF_DU_PRESIDENT } from "./l-objectif-du-president";
import { LE_CONTROLE_FISCAL } from "./le-controle-fiscal";
import type { Scenario } from "./types";

export type { Scenario } from "./types";

/**
 * LES SCÉNARIOS À EMBRANCHEMENTS DU COURS (décision du propriétaire, novembre 2026) : des activités à
 * part, servies une décision à la fois et calculées au serveur (scenarios/types.ts). Un prototype pour
 * l'instant.
 */
export const SCENARIOS: readonly Scenario[] = [
  LE_DECOUVERT_DE_NOVA,
  // Les activités des chapitres, lot B (novembre 2026).
  L_OBJECTIF_DU_PRESIDENT,
  LE_CONTROLE_FISCAL,
];

export const scenarioParCode = (code: string) => SCENARIOS.find((s) => s.code === code);

/** Les scénarios qui reprennent un chapitre : la page du chapitre et le catalogue y mènent. */
export const scenariosDuChapitre = (chapitre: string) => SCENARIOS.filter((s) => s.reprend.includes(chapitre));

/** L'adresse d'un scénario. */
export const lienDuScenario = (s: Pick<Scenario, "code">) => `/cours/scenario/${s.code}`;
