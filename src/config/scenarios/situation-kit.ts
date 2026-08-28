import { modelByCode } from "../pedagogy/models";

/**
 * Machinerie commune aux situations pédagogiques, tous secteurs confondus
 * (doc 03). Le CONTENU appartient à chaque scénario ; ce module ne porte que
 * les types et les règles de forme : barème des indices, notation en crédit
 * partiel, et génération de la question « quel modèle d'analyse ? ».
 */

export type ModelRelevance = "optimal" | "acceptable" | "misleading" | "irrelevant";

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
}

/** Coûts standard des 5 niveaux (doc 03 §4) : cumulés = 45 % de score restant. */
const HINT_COSTS = [0.05, 0.1, 0.2, 0.35, 0.55] as const;

export const hints = (
  texts: [string, string, string, string, string],
): SituationHintDef[] =>
  texts.map((text, i) => ({ level: (i + 1) as 1 | 2 | 3 | 4 | 5, text, costRatio: HINT_COSTS[i]! }));

const RELEVANCE_CREDITS: Record<ModelRelevance, number> = {
  optimal: 1,
  acceptable: 0.6,
  misleading: 0.2,
  irrelevant: 0,
};

/**
 * Question « quel modèle d'analyse mobilisez-vous ? » — même forme QCM que le
 * reste (pas de liste déroulante) : jusqu'à 4 options tirées de la matrice de
 * pertinence de la situation, notées en crédit partiel (§7).
 */
/** Identifiant stable de la question du modèle, seule question conservée en mode « model ». */
export const MODEL_QUESTION_ID = "model_choice";

function modelQuestion(
  relevance: Record<string, ModelRelevance>,
  explain: string,
): QuizQuestionDef {
  const byPriority: ModelRelevance[] = ["optimal", "misleading", "acceptable", "irrelevant"];
  const codes = byPriority
    .flatMap((r) => Object.keys(relevance).filter((code) => relevance[code] === r))
    .slice(0, 4);
  const options = codes
    .map((code) => ({
      id: code,
      label: modelByCode.get(code)?.name ?? code,
      credit: RELEVANCE_CREDITS[relevance[code]!],
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr")); // jamais la bonne réponse en tête
  const optimal = codes.find((code) => relevance[code] === "optimal")!;
  return {
    id: MODEL_QUESTION_ID,
    prompt: "Quel modèle d'analyse mobilisez-vous en priorité ici ?",
    options,
    correctOptionId: optimal,
    explain,
  };
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
    s.quiz.push(modelQuestion(s.modelRelevance, explain));
  }
}
