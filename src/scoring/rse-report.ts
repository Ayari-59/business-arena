import type { CompanyRoundResult } from "@/engine/types";
import type { RseIndex } from "./rse";

/**
 * RAPPORT EXTRA-FINANCIER — LOT 3 : UNE SYNTHÈSE, PAS UNE NORME.
 *
 * Le Lot 1 mesurait la RSE tour par tour ; les Lots 2A-2C.2 en ont fait un
 * levier aux effets réels. Ce module CONSOLIDE, sur TOUS les tours joués, une
 * lecture façon « déclaration de performance extra-financière » (DPEF) :
 * trajectoire ESG, engagement cumulé, empreinte carbone SIMPLIFIÉE, et une
 * poignée d'indicateurs par pilier — plus les faits marquants (labels,
 * sanctions…).
 *
 * DEUX PARTIS PRIS, ASSUMÉS :
 * - PUR & LECTURE SEULE : tout se dérive des résultats déjà persistés (comme
 *   l'indice du Lot 1). Aucun champ moteur, aucune migration.
 * - INDICATIF, NON NORMÉ : l'empreinte carbone est un PROXY pédagogique (pas
 *   une comptabilité carbone réelle), exprimé en « points » et non en tCO₂e
 *   pour ne pas simuler une précision qu'on n'a pas. L'affichage doit le dire.
 */

/** Un tour résolu, réduit à ce dont le rapport a besoin. */
export interface RseReportPeriod {
  round: number;
  result: CompanyRoundResult;
  events: string[];
  rse: RseIndex;
}

export type IndicatorFormat = "percent" | "euro" | "units" | "index" | "count" | "ratio";

export interface RseReportIndicator {
  label: string;
  value: number;
  format: IndicatorFormat;
  /** Sens de lecture bref (facultatif), pour le débrief. */
  hint?: string;
}

export interface RseReport {
  /**
   * Le rapport n'a de sens que si l'équipe a JOUÉ la RSE (dépense ou capital
   * sur au moins un tour). Sinon `available` est faux et l'écran invite à
   * l'ouvrir plutôt que d'afficher un rapport vide de zéros.
   */
  available: boolean;
  roundsCovered: number;
  /** Indice ESG global du dernier tour couvert (0-100). */
  latestScore: number;
  /** Trajectoire de l'indice ESG, un point par tour. */
  trajectory: { round: number; score: number; environment: number; social: number; governance: number }[];
  /** Engagement RSE cumulé (budget + investissement), en €. */
  engagementTotal: number;
  carbon: {
    /** Empreinte cumulée, en POINTS indicatifs (proxy, pas des tCO₂e). */
    totalPoints: number;
    /** Empreinte par unité produite (points/unité). */
    perUnit: number;
    /** Part d'empreinte évitée par le capital « process propre » (0-1). */
    avoidedShare: number;
    /** Tendance de l'intensité (points/unité) entre la 1re et la 2de moitié. */
    trend: "amélioration" | "stable" | "dégradation";
  };
  pillars: {
    environment: RseReportIndicator[];
    social: RseReportIndicator[];
    governance: RseReportIndicator[];
  };
  /** Faits marquants extra-financiers, en clair. */
  highlights: string[];
}

// Constantes du PROXY carbone. Indicatives, nommées (jamais en dur dans le
// calcul), et volontairement grossières : l'objectif est de faire SENTIR
// qu'importer loin et produire « sale » pèse, pas de mesurer des tonnes.
const CARBON = {
  /** Empreinte de base par unité produite (points). */
  perUnit: 1,
  /** Fournisseur mieux-disant qualité (proxy « responsable/proximité »). */
  supplierResponsible: 0.85,
  /** Fournisseur low-cost importé (costMultiplier bas) : transport, moins-disant. */
  supplierCheapImport: 1.15,
  /** Rupture d'approvisionnement (réacheminement en urgence). */
  supplierDisruption: 1.1,
  /** Seuil de coût sous lequel un fournisseur est lu comme low-cost importé. */
  cheapImportThreshold: 0.95,
} as const;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** Facteur carbone d'un fournisseur (1 = neutre), lu de ses attributs. */
function supplierCarbonFactor(supplier: CompanyRoundResult["supplier"]): number {
  if (!supplier) return 1;
  if (supplier.supplyDisruption) return CARBON.supplierDisruption;
  if (supplier.qualityBonus > 0.001) return CARBON.supplierResponsible;
  if (supplier.costMultiplier < CARBON.cheapImportThreshold) return CARBON.supplierCheapImport;
  return 1;
}

function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

/**
 * Rapport extra-financier d'une partie, dérivé de ses tours résolus.
 * `RSE_CARD_CODES` est passé pour compter les cartes sans dépendre du moteur.
 */
export function computeRseReport(
  periods: readonly RseReportPeriod[],
  cardCodes: { label: string; badBuzz: string; sanction: string; subvention: string },
): RseReport {
  const empty: RseReport = {
    available: false,
    roundsCovered: periods.length,
    latestScore: 0,
    trajectory: [],
    engagementTotal: 0,
    carbon: { totalPoints: 0, perUnit: 0, avoidedShare: 0, trend: "stable" },
    pillars: { environment: [], social: [], governance: [] },
    highlights: [],
  };
  if (periods.length === 0) return empty;

  const engagementTotal = periods.reduce(
    (s, p) => s + (p.result.rse ? p.result.rse.budget + p.result.rse.investment : 0),
    0,
  );
  const carriesCapital = periods.some(
    (p) => (p.result.rse?.imageCapital ?? 0) > 0 || (p.result.rse?.cleanCapital ?? 0) > 0,
  );
  if (engagementTotal <= 0 && !carriesCapital) {
    return { ...empty, available: false };
  }

  const trajectory = periods.map((p) => ({
    round: p.round,
    score: p.rse.score,
    environment: p.rse.environment.score,
    social: p.rse.social.score,
    governance: p.rse.governance.score,
  }));

  // --- Empreinte carbone (proxy indicatif) --------------------------------
  let totalPoints = 0;
  let totalPointsSansProcess = 0;
  let totalProduced = 0;
  const perUnitByRound: number[] = [];
  for (const p of periods) {
    const produced = Math.max(0, p.result.production?.produced ?? 0);
    const supplierFactor = supplierCarbonFactor(p.result.supplier);
    const cleanReduction = clamp01(p.result.rse?.defectReduction ?? 0); // 0..~0,4
    const brut = produced * CARBON.perUnit * supplierFactor;
    totalPointsSansProcess += brut;
    const net = brut * (1 - cleanReduction);
    totalPoints += net;
    totalProduced += produced;
    if (produced > 0) perUnitByRound.push(net / produced);
  }
  const perUnit = totalProduced > 0 ? totalPoints / totalProduced : 0;
  const avoidedShare =
    totalPointsSansProcess > 0 ? clamp01(1 - totalPoints / totalPointsSansProcess) : 0;
  const half = Math.floor(perUnitByRound.length / 2);
  const early = mean(perUnitByRound.slice(0, half || perUnitByRound.length));
  const late = mean(perUnitByRound.slice(half));
  const trend: RseReport["carbon"]["trend"] =
    perUnitByRound.length < 2 || Math.abs(late - early) < early * 0.05
      ? "stable"
      : late < early
        ? "amélioration"
        : "dégradation";

  // --- Indicateurs par pilier ---------------------------------------------
  const withSupplier = periods.filter((p) => p.result.supplier);
  const responsibleShare =
    withSupplier.length > 0
      ? withSupplier.filter((p) => (p.result.supplier!.qualityBonus ?? 0) > 0.001).length /
        withSupplier.length
      : 0;
  const defectRates = periods
    .filter((p) => p.result.qualityCosts && (p.result.production?.produced ?? 0) > 0)
    .map((p) => p.result.qualityCosts!.defectUnits / p.result.production!.produced);

  const withHr = periods.filter((p) => p.result.hr);
  const departedTotal = withHr.reduce((s, p) => s + (p.result.hr!.departed ?? 0), 0);
  const trainingTotal = withHr.reduce((s, p) => s + (p.result.hr!.trainingBudget ?? 0), 0);
  const salaryAvg = mean(withHr.map((p) => p.result.hr!.salaryIndex));

  const withBank = periods.filter((p) => p.result.bank && p.result.bank.reliability !== null);
  const reliabilityAvg = mean(withBank.map((p) => p.result.bank!.reliability as number));
  const crisisCount = periods.filter((p) => p.result.treasury?.crisis).length;

  const environment: RseReportIndicator[] = [
    { label: "Empreinte carbone (indice)", value: totalPoints, format: "index", hint: "points indicatifs cumulés" },
    { label: "Intensité par unité", value: perUnit, format: "ratio", hint: "points/unité" },
    { label: "Empreinte évitée (process propre)", value: avoidedShare, format: "percent" },
  ];
  if (withSupplier.length > 0)
    environment.push({ label: "Sourcing responsable", value: responsibleShare, format: "percent", hint: "part des tours" });
  if (defectRates.length > 0)
    environment.push({ label: "Taux de rebuts moyen", value: mean(defectRates), format: "percent" });

  const social: RseReportIndicator[] = [];
  if (withHr.length > 0) {
    social.push({ label: "Départs cumulés", value: departedTotal, format: "count" });
    social.push({ label: "Effort de formation", value: trainingTotal, format: "euro", hint: "cumulé" });
    social.push({ label: "Salaire moyen / marché", value: salaryAvg, format: "index", hint: "1 = marché" });
  }

  const governance: RseReportIndicator[] = [
    { label: "Engagement RSE cumulé", value: engagementTotal, format: "euro" },
  ];
  if (withBank.length > 0)
    governance.push({ label: "Fiabilité du plan (moy.)", value: reliabilityAvg, format: "percent" });
  governance.push({ label: "Crises de trésorerie", value: crisisCount, format: "count" });

  // --- Faits marquants (cartes RSE) ---------------------------------------
  const countCode = (code: string) => periods.filter((p) => p.events.includes(code)).length;
  const highlights: string[] = [];
  const labels = countCode(cardCodes.label);
  const subventions = countCode(cardCodes.subvention);
  const badBuzz = countCode(cardCodes.badBuzz);
  const sanctions = countCode(cardCodes.sanction);
  if (labels > 0) highlights.push(`🏅 Label obtenu (${labels} tour${labels > 1 ? "s" : ""})`);
  if (subventions > 0) highlights.push(`💶 Éco-subvention (${subventions})`);
  if (badBuzz > 0) highlights.push(`📢 Bad buzz (${badBuzz})`);
  if (sanctions > 0) highlights.push(`⚖️ Sanction (${sanctions})`);

  return {
    available: true,
    roundsCovered: periods.length,
    latestScore: trajectory[trajectory.length - 1]!.score,
    trajectory,
    engagementTotal,
    carbon: { totalPoints, perUnit, avoidedShare, trend },
    pillars: { environment, social, governance },
    highlights,
  };
}
