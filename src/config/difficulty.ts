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
    /**
     * Placement du surplus de trésorerie. Réservé aux niveaux hauts : c'est
     * l'arbitrage inverse du découvert, et il ne se pose qu'à quelqu'un qui
     * sait déjà lire une trésorerie. Placer trop, c'est payer un découvert à
     * 9 % en détenant un placement à 2 %.
     */
    placement: boolean;
    /**
     * Affectation du résultat : distribuer aux associés ou garder pour
     * investir. Réservée au niveau 6, dont c'est la décision propre : les cinq
     * premiers ouvrent chacun un cran, le sixième se contentait de retirer les
     * indices, ce qui n'est pas ouvrir un cran.
     */
    dividend: boolean;
  };
  /** Multiplicateur des probabilités d'événements aléatoires (les 0 restent 0). */
  eventProbabilityMultiplier: number;
}

export const DIFFICULTY_PRESETS: readonly DifficultyPreset[] = [
  {
    level: 1,
    code: "decouverte",
    name: "Découverte",
    tagline: "Prix, production, marketing : l'essentiel, avec tous les indices.",
    hintMaxLevel: 5,
    decisions: { quality: false, maintenance: false, finance: false, insurance: false, hr: false, investment: false, placement: false, dividend: false },
    eventProbabilityMultiplier: 0.5,
  },
  {
    level: 2,
    code: "gestion",
    name: "Gestion",
    tagline: "Qualité et maintenance entrent en jeu.",
    hintMaxLevel: 5,
    decisions: { quality: true, maintenance: true, finance: false, insurance: false, hr: false, investment: false, placement: false, dividend: false },
    eventProbabilityMultiplier: 0.75,
  },
  {
    level: 3,
    code: "pilotage",
    name: "Pilotage",
    tagline: "Financement et assurance : la trésorerie se pilote. Indices limités.",
    hintMaxLevel: 3,
    decisions: { quality: true, maintenance: true, finance: true, insurance: true, hr: false, investment: false, placement: false, dividend: false },
    eventProbabilityMultiplier: 1,
  },
  {
    level: 4,
    code: "arbitrage",
    name: "Arbitrage",
    tagline: "Les aléas frappent plus souvent : anticipez.",
    hintMaxLevel: 3,
    decisions: { quality: true, maintenance: true, finance: true, insurance: true, hr: true, investment: true, placement: false, dividend: false },
    eventProbabilityMultiplier: 1.25,
  },
  {
    level: 5,
    code: "strategie",
    name: "Stratégie",
    tagline: "Deux indices, pas un de plus, et un marché nerveux.",
    hintMaxLevel: 2,
    decisions: { quality: true, maintenance: true, finance: true, insurance: true, hr: true, investment: true, placement: true, dividend: false },
    eventProbabilityMultiplier: 1.5,
  },
  {
    level: 6,
    code: "executive",
    name: "Executive",
    tagline:
      "Affectation du résultat, aucun indice, événements doublés : vous répondez aussi aux associés.",
    hintMaxLevel: 0,
    decisions: { quality: true, maintenance: true, finance: true, insurance: true, hr: true, investment: true, placement: true, dividend: true },
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
  decisions: { quality: true, maintenance: true, finance: true, insurance: true, hr: false, investment: false, placement: false, dividend: false },
  eventProbabilityMultiplier: 1,
};

/** Lit le préréglage d'un difficultyProfile de partie (null → LEGACY_PRESET). */
export function presetFromProfile(profile: unknown): DifficultyPreset {
  const d = (profile as { difficulty?: { level?: number } })?.difficulty;
  return (d?.level && presetByLevel.get(d.level as DifficultyPreset["level"])) || LEGACY_PRESET;
}

/**
 * Questions posées dans les situations. Le réglage distingue deux choses que
 * le QCM confondait :
 *
 * - les questions de CONNAISSANCES (définitions, formules) redemandent ce que
 *   le diagnostic teste déjà, mais hors contexte ;
 * - la question du MODÈLE d'analyse est la compétence propre de la
 *   plateforme, la seule qui mesure le choix de l'outil de raisonnement.
 *
 * D'où trois positions, et non un interrupteur : « model » est le défaut, il
 * garde l'essentiel sans l'habillage scolaire.
 */
export type QuizMode = "full" | "model" | "off";

export const DEFAULT_QUIZ_MODE: QuizMode = "model";

export const QUIZ_MODES: readonly { code: QuizMode; name: string; help: string }[] = [
  {
    code: "full",
    name: "Connaissances et modèle",
    help: "Deux questions de connaissances par situation, plus la question du modèle d'analyse. Le score se partage moitié diagnostic, moitié QCM.",
  },
  {
    code: "model",
    name: "Modèle d'analyse seul",
    help: "Une seule question : quel modèle mobiliser ici. C'est la compétence que la plateforme mesure, sans interroger les définitions.",
  },
  {
    code: "off",
    name: "Aucune question",
    help: "Le diagnostic fait toute la note. Le débriefing continue d'indiquer le modèle attendu et son explication, en lecture seule.",
  },
];

/**
 * Réglage d'une partie. Deux replis, dans cet ordre :
 * `quizMode` explicite, puis l'ancien drapeau booléen des parties créées avant
 * ce réglage (absent = tout servi, comme à l'époque).
 */
export function quizModeFromProfile(profile: unknown): QuizMode {
  const p = profile as { quizMode?: unknown; quizEnabled?: boolean } | null;
  if (p?.quizMode === "full" || p?.quizMode === "model" || p?.quizMode === "off") {
    return p.quizMode;
  }
  return p?.quizEnabled === false ? "off" : "full";
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
  /**
   * Délai de règlement des clients À CRÉDIT (jours). Voir
   * `applyEconomicOverrides` : les segments payés comptant le restent.
   */
  customerPaymentDelayDays: z.number().int().min(0).max(180).optional(),
  /** Plafond de découvert autorisé (€). Au-delà, l'affacturage forcé s'enclenche. */
  overdraftLimit: z.number().min(0).max(5_000_000).optional(),
  /** Durée d'amortissement d'un nouvel emprunt, en tours. */
  loanDurationRounds: z.number().int().min(1).max(60).optional(),
  /** Dotations aux amortissements par trimestre (€). */
  depreciationPerRound: z.number().min(0).max(500_000).optional(),
  /** Part maximale du poste clients mobilisable à l'escompte (0-1). */
  discountMaxShare: z.number().min(0).max(1).optional(),
  /** Commission d'affacturage (part du montant cédé, 0-0,2). */
  factoringFeeRate: z.number().min(0).max(0.2).optional(),
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

/**
 * Applique les paramètres économiques au scénario de BASE (avant périodicité).
 *
 * Deux choses que ce réglage ne touche VOLONTAIREMENT pas :
 * - les délais des OFFRES de commande exceptionnelle, dont l'alternance
 *   crédit / comptant est le cœur de l'exercice ;
 * - les délais propres à chaque FOURNISSEUR, qui opposent justement un
 *   déstockeur payé comptant à un grossiste à 45 jours.
 * Les uniformiser reviendrait à supprimer l'arbitrage qu'ils enseignent.
 */
export function applyEconomicOverrides(
  scenario: EngineScenarioConfig,
  overrides: EconomicOverrides | undefined,
): EngineScenarioConfig {
  if (!overrides || Object.values(overrides).every((v) => v === undefined)) return scenario;
  const treasury = scenario.treasury;
  return {
    ...scenario,
    market: {
      ...scenario.market,
      // Délai client : appliqué aux seuls segments qui font DÉJÀ crédit. Un
      // particulier qui paie en caisse continue de payer en caisse — sans quoi
      // le réglage effacerait la distinction que le scénario met en scène.
      segments:
        overrides.customerPaymentDelayDays === undefined
          ? scenario.market.segments
          : scenario.market.segments.map((s) =>
              s.paymentDelayDays > 0
                ? { ...s, paymentDelayDays: overrides.customerPaymentDelayDays! }
                : s,
            ),
    },
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
      overdraftLimit: overrides.overdraftLimit ?? scenario.finance.overdraftLimit,
      supplierPaymentDelayDays:
        overrides.supplierPaymentDelayDays ?? scenario.finance.supplierPaymentDelayDays,
      loanDurationRounds: overrides.loanDurationRounds ?? scenario.finance.loanDurationRounds,
      depreciationPerRound:
        overrides.depreciationPerRound ?? scenario.finance.depreciationPerRound,
    },
    // Mobilisation du poste clients : réglable seulement là où le scénario
    // l'ouvre déjà. La créer de toutes pièces ajouterait des décisions que
    // l'énoncé du scénario ne présente pas.
    ...(treasury
      ? {
          treasury: {
            ...treasury,
            discountMaxShare: overrides.discountMaxShare ?? treasury.discountMaxShare,
            factoringFeeRate: overrides.factoringFeeRate ?? treasury.factoringFeeRate,
          },
        }
      : {}),
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

/* ────────────────────────────────────────────────────────────────────────────
 * PONDÉRATIONS DU BPI, PARAMÉTRABLES PAR L'ENSEIGNANT (V2 couche 2, chantier #3).
 *
 * Hors moteur : le module de scoring (src/scoring/bpi.ts) reste pur et ignore
 * ces réglages ; on ne fait que réécrire `scenario.scoring.weights` AVANT de
 * figer le snapshot, exactement comme les paramètres économiques. Tout le
 * scoring aval (tour et classement) lit alors les poids surchargés sans le
 * savoir.
 *
 * L'enseignant pondère les SIX dimensions affichées du BPI v2. En interne, le
 * scénario porte sept poids : « pilotage » y est la SOMME de `strategy` +
 * `operational`, et le scoring v2 ne lit jamais que cette somme. On répartit
 * donc « pilotage » entre les deux en conservant le ratio d'origine — neutre
 * pour le calcul, et le schéma (somme = 1) reste satisfait.
 * ──────────────────────────────────────────────────────────────────────────── */
export const scoringWeightOverridesSchema = z.object({
  economic: z.number().min(0).max(1).optional(),
  financial: z.number().min(0).max(1).optional(),
  commercial: z.number().min(0).max(1).optional(),
  profitability: z.number().min(0).max(1).optional(),
  pilotage: z.number().min(0).max(1).optional(),
  decisionMastery: z.number().min(0).max(1).optional(),
});

export type ScoringWeightOverrides = z.infer<typeof scoringWeightOverridesSchema>;

/** Les six dimensions pondérables du BPI v2, dans l'ordre d'affichage. */
export const SCORING_WEIGHT_DIMENSIONS = [
  "economic",
  "financial",
  "commercial",
  "profitability",
  "pilotage",
  "decisionMastery",
] as const;

/** Validation champ par champ : une valeur hors bornes est ignorée. */
export function sanitizeScoringWeightOverrides(
  raw: ScoringWeightOverrides | undefined,
): ScoringWeightOverrides {
  if (!raw) return {};
  const out: Record<string, unknown> = {};
  for (const [key, fieldSchema] of Object.entries(scoringWeightOverridesSchema.shape)) {
    const value = (raw as Record<string, unknown>)[key];
    if (value === undefined) continue;
    const parsed = (fieldSchema as z.ZodType).safeParse(value);
    if (parsed.success && parsed.data !== undefined) out[key] = parsed.data;
  }
  return out as ScoringWeightOverrides;
}

/**
 * Réécrit les pondérations du BPI depuis les réglages de l'enseignant. Les
 * dimensions non fournies gardent la valeur du scénario. Le résultat est
 * TOUJOURS renormalisé (somme = 1, exigée par le schéma de scoring) : les
 * réglages expriment un poids RELATIF, jamais une valeur absolue. Une somme
 * nulle (tout à zéro) est ignorée — retour au scénario.
 */
export function applyScoringWeightOverrides(
  scenario: EngineScenarioConfig,
  overrides: ScoringWeightOverrides | undefined,
): EngineScenarioConfig {
  if (!overrides || Object.values(overrides).every((v) => v === undefined)) return scenario;
  const base = scenario.scoring.weights;
  const basePilotage = base.strategy + base.operational;
  const six = {
    economic: overrides.economic ?? base.economic,
    financial: overrides.financial ?? base.financial,
    commercial: overrides.commercial ?? base.commercial,
    profitability: overrides.profitability ?? base.profitability,
    pilotage: overrides.pilotage ?? basePilotage,
    decisionMastery: overrides.decisionMastery ?? base.decisionMastery,
  };
  const sum =
    six.economic +
    six.financial +
    six.commercial +
    six.profitability +
    six.pilotage +
    six.decisionMastery;
  if (sum <= 0) return scenario;
  const k = 1 / sum;
  // Répartition stratégie / opérationnel : conserve le ratio d'origine (le
  // scoring v2 n'en lit que la somme, via « pilotage »).
  const stratShare = basePilotage > 0 ? base.strategy / basePilotage : 0.5;
  const pilotageW = six.pilotage * k;
  return {
    ...scenario,
    scoring: {
      ...scenario.scoring,
      weights: {
        economic: six.economic * k,
        financial: six.financial * k,
        commercial: six.commercial * k,
        profitability: six.profitability * k,
        strategy: pilotageW * stratShare,
        operational: pilotageW * (1 - stratShare),
        decisionMastery: six.decisionMastery * k,
      },
    },
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
