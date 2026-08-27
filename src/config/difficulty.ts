import { z } from "zod";
import type { EngineScenarioConfig } from "@/engine/types";

/**
 * Niveaux de difficulté (doc 08 §2, §20) : la difficulté n'est PAS un entier
 * codé en dur — c'est un profil paramétrique dont les six niveaux nommés sont
 * des PRÉRÉGLAGES (données ci-dessous, modifiables sans toucher au moteur).
 *
 * Le moteur économique ignore la difficulté : elle agit uniquement via des
 * paramètres effectifs (probabilités d'événements du snapshot), le plafond
 * d'indices (couche pédagogie) et les décisions exposées (couche présentation).
 */

export interface DifficultyPreset {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  code: string;
  name: string;
  tagline: string;
  /** Plafond d'indices débloquables (0 = aucun indice). */
  hintMaxLevel: 0 | 1 | 2 | 3 | 4 | 5;
  /** Décisions exposées au joueur (prix, production, marketing : toujours actives). */
  decisions: {
    quality: boolean;
    maintenance: boolean;
    finance: boolean;
    insurance: boolean;
    /** RH (embauches, formation, salaires) — doc 08 : dès ARBITRAGE. */
    hr: boolean;
    /** Investissement capacitaire — doc 08 : dès ARBITRAGE. */
    investment: boolean;
  };
  /** Multiplicateur des probabilités d'événements aléatoires (les 0 restent 0). */
  eventProbabilityMultiplier: number;
}

export const DIFFICULTY_PRESETS: readonly DifficultyPreset[] = [
  {
    level: 1,
    code: "decouverte",
    name: "Découverte",
    tagline: "Prix, production, marketing — l'essentiel, avec tous les indices.",
    hintMaxLevel: 5,
    decisions: { quality: false, maintenance: false, finance: false, insurance: false, hr: false, investment: false },
    eventProbabilityMultiplier: 0.5,
  },
  {
    level: 2,
    code: "gestion",
    name: "Gestion",
    tagline: "Qualité et maintenance entrent en jeu.",
    hintMaxLevel: 5,
    decisions: { quality: true, maintenance: true, finance: false, insurance: false, hr: false, investment: false },
    eventProbabilityMultiplier: 0.75,
  },
  {
    level: 3,
    code: "pilotage",
    name: "Pilotage",
    tagline: "Financement et assurance — la trésorerie se pilote. Indices limités.",
    hintMaxLevel: 3,
    decisions: { quality: true, maintenance: true, finance: true, insurance: true, hr: false, investment: false },
    eventProbabilityMultiplier: 1,
  },
  {
    level: 4,
    code: "arbitrage",
    name: "Arbitrage",
    tagline: "Les aléas frappent plus souvent : anticipez.",
    hintMaxLevel: 3,
    decisions: { quality: true, maintenance: true, finance: true, insurance: true, hr: true, investment: true },
    eventProbabilityMultiplier: 1.25,
  },
  {
    level: 5,
    code: "strategie",
    name: "Stratégie",
    tagline: "Deux indices, pas un de plus — et un marché nerveux.",
    hintMaxLevel: 2,
    decisions: { quality: true, maintenance: true, finance: true, insurance: true, hr: true, investment: true },
    eventProbabilityMultiplier: 1.5,
  },
  {
    level: 6,
    code: "executive",
    name: "Executive",
    tagline: "Aucun indice, événements doublés : conditions réelles.",
    hintMaxLevel: 0,
    decisions: { quality: true, maintenance: true, finance: true, insurance: true, hr: true, investment: true },
    eventProbabilityMultiplier: 2,
  },
];

export const presetByLevel = new Map(DIFFICULTY_PRESETS.map((p) => [p.level, p]));

/** Comportement des parties créées AVANT le sélecteur (rétro-compatibilité). */
export const LEGACY_PRESET: DifficultyPreset = {
  level: 3,
  code: "legacy",
  name: "Pilotage",
  tagline: "",
  hintMaxLevel: 5,
  decisions: { quality: true, maintenance: true, finance: true, insurance: true, hr: false, investment: false },
  eventProbabilityMultiplier: 1,
};

/** Lit le préréglage d'un difficultyProfile de partie (null → LEGACY_PRESET). */
export function presetFromProfile(profile: unknown): DifficultyPreset {
  const d = (profile as { difficulty?: { level?: number } })?.difficulty;
  return (d?.level && presetByLevel.get(d.level as DifficultyPreset["level"])) || LEGACY_PRESET;
}

/**
 * QCM de connaissances actifs pour cette partie. L'absence du drapeau vaut
 * ACTIVÉ : les parties créées avant le réglage gardent leur comportement, et
 * seule une désactivation explicite de l'enseignant les retire.
 */
export function quizEnabledFromProfile(profile: unknown): boolean {
  return (profile as { quizEnabled?: boolean } | null)?.quizEnabled !== false;
}

// ---------------------------------------------------------------------------
// Paramètres économiques modulables à la création (jamais codés en dur) :
// chaque champ absent conserve la valeur du scénario. Bornes = garde-fous.
// Les montants s'entendent en BASE TRIMESTRIELLE (redimensionnés ensuite
// par la périodicité) ; les taux sont des fractions (0,2 = 20 %).
// ---------------------------------------------------------------------------

export const economicOverridesSchema = z.object({
  /** Taux d'IS (impôt sur les bénéfices). */
  taxRate: z.number().min(0).max(0.6).optional(),
  /** Taux de TVA (0 = désactivée). */
  vatRate: z.number().min(0).max(0.3).optional(),
  /** Taux d'emprunt annuel. */
  loanAnnualRate: z.number().min(0).max(0.25).optional(),
  /** Taux de découvert annuel. */
  overdraftAnnualRate: z.number().min(0).max(0.4).optional(),
  /** Délai de paiement fournisseurs (jours). */
  supplierPaymentDelayDays: z.number().int().min(0).max(120).optional(),
  /** Charges de structure par trimestre (salaires, loyers, charges sociales…). */
  fixedCostsPerRound: z.number().min(0).max(5_000_000).optional(),
  /** Coût matières par unité produite. */
  materialCostPerUnit: z.number().min(0).max(500).optional(),
  /** Autres coûts variables unitaires (main-d'œuvre chargée, énergie…). */
  otherVariableCostPerUnit: z.number().min(0).max(500).optional(),
  /** Taux de rebuts de base (active les coûts de la non-qualité, 0-15 %). */
  baseDefectRate: z.number().min(0).max(0.15).optional(),
});

export type EconomicOverrides = z.infer<typeof economicOverridesSchema>;

/**
 * Validation champ par champ : une valeur hors bornes est simplement ignorée
 * (retour à la valeur du scénario) au lieu de faire échouer la création.
 */
export function sanitizeEconomicOverrides(raw: EconomicOverrides | undefined): EconomicOverrides {
  if (!raw) return {};
  const out: Record<string, unknown> = {};
  for (const [key, fieldSchema] of Object.entries(economicOverridesSchema.shape)) {
    const value = (raw as Record<string, unknown>)[key];
    if (value === undefined) continue;
    const parsed = (fieldSchema as z.ZodType).safeParse(value);
    if (parsed.success && parsed.data !== undefined) out[key] = parsed.data;
  }
  return out as EconomicOverrides;
}

/** Applique les paramètres économiques au scénario de BASE (avant périodicité). */
export function applyEconomicOverrides(
  scenario: EngineScenarioConfig,
  overrides: EconomicOverrides | undefined,
): EngineScenarioConfig {
  if (!overrides || Object.values(overrides).every((v) => v === undefined)) return scenario;
  return {
    ...scenario,
    product: {
      ...scenario.product,
      materialCostPerUnit: overrides.materialCostPerUnit ?? scenario.product.materialCostPerUnit,
      otherVariableCostPerUnit:
        overrides.otherVariableCostPerUnit ?? scenario.product.otherVariableCostPerUnit,
    },
    finance: {
      ...scenario.finance,
      taxRate: overrides.taxRate ?? scenario.finance.taxRate,
      vatRate: overrides.vatRate ?? scenario.finance.vatRate,
      loanAnnualRate: overrides.loanAnnualRate ?? scenario.finance.loanAnnualRate,
      overdraftAnnualRate: overrides.overdraftAnnualRate ?? scenario.finance.overdraftAnnualRate,
      supplierPaymentDelayDays:
        overrides.supplierPaymentDelayDays ?? scenario.finance.supplierPaymentDelayDays,
    },
    fixedCostsPerRound: overrides.fixedCostsPerRound ?? scenario.fixedCostsPerRound,
    // Non-qualité : l'activer à la création crée le bloc qualityCosts
    // (sensibilité aux retours externes : donnée ci-dessous, pas du dur).
    ...(overrides.baseDefectRate !== undefined && overrides.baseDefectRate > 0
      ? {
          qualityCosts: {
            baseDefectRate: overrides.baseDefectRate,
            externalReturnSensitivity: 0.5,
          },
        }
      : {}),
  };
}

/** Applique l'intensité d'événements du niveau (les probabilités 0 restent 0). */
export function applyEventIntensity(
  scenario: EngineScenarioConfig,
  multiplier: number,
): EngineScenarioConfig {
  if (multiplier === 1) return scenario;
  return {
    ...scenario,
    events: scenario.events.map((e) => ({
      ...e,
      probability: Math.min(0.9, e.probability * multiplier),
    })),
  };
}
