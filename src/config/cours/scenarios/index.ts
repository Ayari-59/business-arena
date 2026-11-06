import { LE_DECOUVERT_DE_NOVA } from "./le-decouvert-de-nova";
import { LA_LIGNE_EN_CREDIT_BAIL } from "./la-ligne-en-credit-bail";
import { LE_PRIX_DES_RESSOURCES } from "./le-prix-des-ressources";
import type { Scenario } from "./types";

export type { Scenario } from "./types";

/**
 * LES SCÉNARIOS À EMBRANCHEMENTS DU COURS (décision du propriétaire, novembre 2026) : des activités à
 * part, servies une décision à la fois et calculées au serveur (scenarios/types.ts). Un prototype pour
 * l'instant.
 */
export const SCENARIOS: readonly Scenario[] = [LE_DECOUVERT_DE_NOVA, LA_LIGNE_EN_CREDIT_BAIL, LE_PRIX_DES_RESSOURCES];

export const scenarioParCode = (code: string) => SCENARIOS.find((s) => s.code === code);

/** Les scénarios qui reprennent un chapitre : la page du chapitre et le catalogue y mènent. */
export const scenariosDuChapitre = (chapitre: string) => SCENARIOS.filter((s) => s.reprend.includes(chapitre));

/** L'adresse d'un scénario. */
export const lienDuScenario = (s: Pick<Scenario, "code">) => `/cours/scenario/${s.code}`;
