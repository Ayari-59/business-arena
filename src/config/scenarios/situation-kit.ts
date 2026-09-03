import { modelByCode } from "../pedagogy/models";
import { createRng } from "../../engine/random";

/**
 * Machinerie commune aux situations pédagogiques, tous secteurs confondus
 * (doc 03). Le CONTENU appartient à chaque scénario ; ce module ne porte que
 * les types et les règles de forme : barème des indices, notation en crédit
 * partiel, et génération de la question « quel modèle d'analyse ? ».
 */

export type ModelRelevance = "optimal" | "acceptable" | "misleading" | "irrelevant";

export type DecisionField =
  | "price"
  | "productionPlan"
  | "marketingBudget"
  | "qualityBudget"
  | "maintenanceBudget";

export type LeverDirection = "up" | "down" | "review";

export interface DecisionLever {
  field: DecisionField;
  direction: LeverDirection;
  hint: string;
}

export type SituationCategory =
  | "prise_de_poste"
  | "contexte_marche"
  | "decision_strategique"
  | "alerte_comptable"
  | "tresorerie_dormante";

export type DetectCode =
  | "profitable_illiquid"
  | "stockout"
  | "below_breakeven"
  | "capacity_saturated"
  /**
   * Trésorerie qui dort. Le seul déclencheur qui ne signale pas un problème :
   * l'entreprise va bien, et c'est justement pour cela que la question se
   * pose. Il suppose que le niveau ouvre le placement, sans quoi la situation
   * poserait un arbitrage que le joueur ne peut pas trancher.
   */
  | "idle_cash";

export interface SituationHintDef {
  level: 1 | 2 | 3 | 4 | 5;
  text: string;
  costRatio: number;
}

/**
 * QCM : même forme que le diagnostic (options radio, pas de liste déroulante).
 * `credit` optionnel par option pour la notation partielle (ex. question du
 * modèle d'analyse : pertinent 1, acceptable 0,6, trompeur 0,2, hors sujet 0) ;
 * sans crédit, la bonne réponse vaut 1 et les autres 0. Corrigé au débriefing.
 */
export interface QuizQuestionDef {
  id: string;
  prompt: string;
  options: { id: string; label: string; credit?: number }[];
  correctOptionId: string;
  explain: string;
}

export interface SituationDef {
  code: string;
  category: SituationCategory;
  title: string;
  narrative: string;
  problem: string; // question ouverte
  diagnosticOptions: { id: string; label: string; correct: boolean }[];
  /**
   * Questions de connaissances, complétées automatiquement par la question
   * « quel modèle d'analyse mobilisez-vous ? » (générée depuis modelRelevance
   * par `attachModelQuestions`).
   */
  quiz: QuizQuestionDef[];
  modelRelevance: Record<string, ModelRelevance>; // par code de modèle ; note la question du modèle (§7)
  conceptCodes: string[];
  hints: SituationHintDef[];
  trigger: { round: number } | { detect: DetectCode };
  weight: number;
  decisionLevers: DecisionLever[];
  /**
   * Vivier de distracteurs pour la question du modèle (codes de modèles).
   * Facultatif : à défaut, les distracteurs sont tirés de `modelRelevance`.
   * Sert à proposer des voisins plausibles supplémentaires au-delà des modèles
   * déjà notés par la situation (P8, distracteurs par niveau).
   */
  distractorPool?: string[];
}

/** Coûts standard des 5 niveaux (doc 03 §4) : cumulés = 45 % de score restant. */
const HINT_COSTS = [0.05, 0.1, 0.2, 0.35, 0.55] as const;

export const hints = (
  texts: [string, string, string, string, string],
): SituationHintDef[] =>
  texts.map((text, i) => ({ level: (i + 1) as 1 | 2 | 3 | 4 | 5, text, costRatio: HINT_COSTS[i]! }));

export const RELEVANCE_CREDITS: Record<ModelRelevance, number> = {
  optimal: 1,
  acceptable: 0.6,
  misleading: 0.2,
  irrelevant: 0,
};

/** Hachage stable d'une chaîne (pour dériver une graine par situation). */
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

/** Mélange déterministe (Fisher-Yates) piloté par une graine. */
function shuffleSeeded<T>(items: readonly T[], seed: number): T[] {
  const rng = createRng(seed >>> 0);
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Distracteurs par niveau (P8). L'optimal est toujours présent ; les trois
 * distracteurs sont choisis dans le vivier (celui de la situation, sinon les
 * autres modèles de sa matrice de pertinence) selon le niveau :
 *
 * - niveaux 1-2 : la même famille d'abord — modèles acceptables (voisins
 *   raisonnables), puis hors-sujet manifestes ; le piège plausible (misleading)
 *   passe en dernier, pour que l'optimal se détache nettement ;
 * - niveaux 3+ : le voisin plausible (misleading) passe en tête — le choix
 *   demande alors de vraiment distinguer les modèles.
 *
 * L'ordre des options est ensuite mélangé par la graine (jamais figé).
 */
export function modelOptionCodes(
  relevance: Record<string, ModelRelevance>,
  distractorPool: string[] | undefined,
  level: number,
  seed: number,
): string[] {
  const rel = (code: string): ModelRelevance => relevance[code] ?? "irrelevant";
  const optimal = Object.keys(relevance).find((c) => relevance[c] === "optimal");
  const pool = (distractorPool && distractorPool.length > 0
    ? distractorPool
    : Object.keys(relevance)
  ).filter((c) => c !== optimal);
  // « optimal » reste en tête : une situation peut coter plusieurs modèles
  // comme optimaux (plusieurs bonnes réponses), et ils doivent figurer parmi
  // les options. L'ordre des deux distracteurs suivants porte le niveau :
  // aux niveaux 1-2 l'acceptable (voisin de la même famille) précède le piège
  // « misleading » ; à partir du niveau 3 le piège plausible passe devant.
  const priority: ModelRelevance[] =
    level <= 2
      ? ["optimal", "acceptable", "irrelevant", "misleading"]
      : ["optimal", "misleading", "acceptable", "irrelevant"];
  const distractors = priority.flatMap((r) => pool.filter((c) => rel(c) === r)).slice(0, 3);
  const codes = optimal ? [optimal, ...distractors] : distractors;
  return shuffleSeeded(codes, (seed ^ hashCode(optimal ?? "")) >>> 0);
}

function optionsFromCodes(
  relevance: Record<string, ModelRelevance>,
  codes: string[],
): { id: string; label: string; credit: number }[] {
  return codes.map((code) => ({
    id: code,
    label: modelByCode.get(code)?.name ?? code,
    credit: RELEVANCE_CREDITS[relevance[code] ?? "irrelevant"],
  }));
}

/**
 * Question « quel modèle d'analyse mobilisez-vous ? » — même forme QCM que le
 * reste (pas de liste déroulante) : jusqu'à 4 options tirées de la matrice de
 * pertinence de la situation, notées en crédit partiel (§7).
 */
/** Identifiant stable de la question du modèle, seule question conservée en mode « model ». */
export const MODEL_QUESTION_ID = "model_choice";

interface ModelQuestionOpts {
  level: number;
  seed: number;
  distractorPool?: string[];
}

function modelQuestion(
  relevance: Record<string, ModelRelevance>,
  explain: string,
  opts: ModelQuestionOpts,
): QuizQuestionDef {
  const codes = modelOptionCodes(relevance, opts.distractorPool, opts.level, opts.seed);
  const optimal = codes.find((code) => relevance[code] === "optimal") ?? codes[0]!;
  return {
    id: MODEL_QUESTION_ID,
    prompt: "Quel modèle d'analyse mobilisez-vous en priorité ici ?",
    options: optionsFromCodes(relevance, codes),
    correctOptionId: optimal,
    explain,
  };
}

/**
 * Reconstruit la question du modèle d'une situation pour un niveau et une
 * graine donnés (distracteurs par niveau, ordre mélangé — P8). La graine de
 * partie est combinée au code de la situation pour que deux situations d'un
 * même tour ne partagent pas le même ordre. La correction (explication) est
 * reprise de la question canonique déjà attachée.
 */
export function modelQuestionFor(
  def: SituationDef,
  level: number,
  gameSeed: number,
): QuizQuestionDef {
  const canonical = def.quiz.find((q) => q.id === MODEL_QUESTION_ID);
  return modelQuestion(def.modelRelevance, canonical?.explain ?? "", {
    level,
    seed: (gameSeed ^ hashCode(def.code)) >>> 0,
    distractorPool: def.distractorPool,
  });
}

/**
 * Ajoute la question du modèle à chaque situation, en place. `explains` donne
 * la correction par code de situation : une situation sans explication est une
 * erreur d'écriture, pas un cas à ignorer silencieusement.
 */
export function attachModelQuestions(
  situations: SituationDef[],
  explains: Record<string, string>,
): void {
  for (const s of situations) {
    const explain = explains[s.code];
    if (!explain) {
      throw new Error(`Situation « ${s.code} » : correction du choix de modèle manquante`);
    }
    if (!Object.values(s.modelRelevance).includes("optimal")) {
      throw new Error(`Situation « ${s.code} » : aucun modèle marqué « optimal »`);
    }
    // Question canonique (niveau 3, graine 0) : source stable de la correction
    // et des crédits ; la vue et le calcul du score la reconstruisent ensuite
    // par niveau et par graine de partie (modelQuestionFor).
    s.quiz.push(modelQuestion(s.modelRelevance, explain, { level: 3, seed: 0, distractorPool: s.distractorPool }));
  }
}
