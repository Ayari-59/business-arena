import { LE_DECOUVERT_DE_NOVA } from "./le-decouvert-de-nova";
import { LES_ESCOMPTES_DE_JANVIER } from "./les-escomptes-de-janvier";
import { LES_COMPTES_QUE_VOULAIT_LE_PRESIDENT } from "./les-comptes-que-voulait-le-president";
import { L_OBJECTIF_DU_PRESIDENT } from "./l-objectif-du-president";
import { LE_CONTROLE_FISCAL } from "./le-controle-fiscal";
import { BOUCLER_LE_PLAN_DE_LA_GAMME } from "./boucler-le-plan-de-la-gamme";
import { LE_DOSSIER_VERT_DE_NOVA } from "./le-dossier-vert-de-nova";
import { LA_LIGNE_EN_CREDIT_BAIL } from "./la-ligne-en-credit-bail";
import { LE_PRIX_DES_RESSOURCES } from "./le-prix-des-ressources";
import type { Scenario } from "./types";

export type { Scenario } from "./types";

/**
 * LES SCÉNARIOS À EMBRANCHEMENTS DU COURS (décision du propriétaire, novembre 2026) : des activités à
 * part, servies une décision à la fois et calculées au serveur (scenarios/types.ts). Un prototype pour
 * l'instant.
 */
export const SCENARIOS: readonly Scenario[] = [
  LE_DECOUVERT_DE_NOVA,
  // Les activités des chapitres (novembre 2026), lot A.
  LES_ESCOMPTES_DE_JANVIER,
  LES_COMPTES_QUE_VOULAIT_LE_PRESIDENT,
  // Les activités des chapitres, lot B (novembre 2026).
  L_OBJECTIF_DU_PRESIDENT,
  LE_CONTROLE_FISCAL,
  // Les activités des chapitres, lot E (novembre 2026).
  BOUCLER_LE_PLAN_DE_LA_GAMME,
  LE_DOSSIER_VERT_DE_NOVA,
  // Les activités des chapitres, lot C (novembre 2026).
  LA_LIGNE_EN_CREDIT_BAIL,
  LE_PRIX_DES_RESSOURCES,
];

export const scenarioParCode = (code: string) => SCENARIOS.find((s) => s.code === code);

/** Les scénarios qui reprennent un chapitre : la page du chapitre et le catalogue y mènent. */
export const scenariosDuChapitre = (chapitre: string) => SCENARIOS.filter((s) => s.reprend.includes(chapitre));

/** L'adresse d'un scénario. */
export const lienDuScenario = (s: Pick<Scenario, "code">) => `/cours/scenario/${s.code}`;
