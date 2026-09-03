import { modelByCode } from "../pedagogy/models";
import { conceptByCode } from "../pedagogy/concepts";
import {
  attachModelQuestions,
  hints as buildHints,
  type DetectCode,
  type ModelRelevance,
  type SituationCategory,
  type SituationDef,
} from "./situation-kit";

/**
 * Construction d'une situation pédagogique DE ZÉRO (éditeur de scénarios).
 *
 * C'est la partie la plus dense en invariants : une situation ne se résume pas
 * à du texte, elle porte une matrice de pertinence des modèles d'analyse (avec
 * au moins un modèle « optimal »), des notions du référentiel, cinq indices à
 * coût croissant, un déclencheur et une correction. `attachModelQuestions`
 * refuse déjà une situation sans « optimal » ou sans correction ; on valide ici
 * tout le reste avant, pour rendre lisibles les erreurs de saisie de
 * l'enseignant plutôt que de laisser une situation bancale atteindre une partie.
 */

export const SITUATION_CATEGORIES: SituationCategory[] = [
  "prise_de_poste",
  "contexte_marche",
  "decision_strategique",
  "alerte_comptable",
  "tresorerie_dormante",
];

export const DETECT_CODES: DetectCode[] = [
  "profitable_illiquid",
  "stockout",
  "below_breakeven",
  "capacity_saturated",
  "idle_cash",
];

export interface NewSituationInput {
  category: SituationCategory;
  title: string;
  narrative: string;
  problem: string;
  /** Options de diagnostic (labels) ; l'exactitude est portée par `correct`. */
  diagnostic: { label: string; correct: boolean }[];
  /** Pertinence par code de modèle d'analyse ; au moins un « optimal ». */
  modelRelevance: Record<string, ModelRelevance>;
  conceptCodes: string[];
  hints: [string, string, string, string, string];
  modelExplain: string;
  trigger: { round: number } | { detect: DetectCode };
  weight: number;
}

const req = (s: string, quoi: string): string => {
  const t = s.trim();
  if (!t) throw new Error(`Champ requis vide : ${quoi}`);
  return t;
};

export function buildSituation(input: NewSituationInput, code: string): SituationDef {
  const category = input.category;
  if (!SITUATION_CATEGORIES.includes(category)) {
    throw new Error("Catégorie de situation inconnue");
  }

  const title = req(input.title, "titre");
  const narrative = req(input.narrative, "récit");
  const problem = req(input.problem, "problème");
  const modelExplain = req(input.modelExplain, "correction du choix de modèle");

  // Diagnostic : au moins deux options renseignées, exactement une correcte.
  const options = input.diagnostic
    .map((o) => ({ label: o.label.trim(), correct: o.correct }))
    .filter((o) => o.label);
  if (options.length < 2) {
    throw new Error("Au moins deux options de diagnostic sont requises");
  }
  const correctes = options.filter((o) => o.correct);
  if (correctes.length !== 1) {
    throw new Error("Exactement une option de diagnostic doit être la bonne réponse");
  }
  const diagnosticOptions = options.map((o, i) => ({ id: `d${i}`, label: o.label, correct: o.correct }));

  // Matrice de pertinence : codes existants, au moins un « optimal ».
  const modelRelevance: Record<string, ModelRelevance> = {};
  for (const [mcode, rel] of Object.entries(input.modelRelevance)) {
    if (!modelByCode.has(mcode)) throw new Error(`Modèle d'analyse inconnu : ${mcode}`);
    modelRelevance[mcode] = rel;
  }
  if (!Object.values(modelRelevance).includes("optimal")) {
    throw new Error("Au moins un modèle doit être marqué « optimal »");
  }

  // Notions : au moins une, toutes existantes.
  const conceptCodes = [...new Set(input.conceptCodes.map((c) => c.trim()).filter(Boolean))];
  if (conceptCodes.length === 0) throw new Error("Au moins une notion doit être choisie");
  for (const c of conceptCodes) {
    if (!conceptByCode.has(c)) throw new Error(`Notion inconnue : ${c}`);
  }

  // Indices : les cinq sont requis (barème à coût croissant).
  const hintTexts = input.hints.map((h, i) => req(h, `indice ${i + 1}`)) as [
    string,
    string,
    string,
    string,
    string,
  ];

  // Déclencheur.
  let trigger: SituationDef["trigger"];
  if ("round" in input.trigger) {
    if (!Number.isInteger(input.trigger.round) || input.trigger.round < 1) {
      throw new Error("Tour de déclenchement invalide");
    }
    trigger = { round: input.trigger.round };
  } else {
    if (!DETECT_CODES.includes(input.trigger.detect)) {
      throw new Error("Déclencheur de détection inconnu");
    }
    trigger = { detect: input.trigger.detect };
  }

  if (!(input.weight > 0)) throw new Error("Le poids doit être positif");

  const situation: SituationDef = {
    code,
    category,
    title,
    narrative,
    problem,
    diagnosticOptions,
    quiz: [],
    modelRelevance,
    conceptCodes,
    hints: buildHints(hintTexts),
    trigger,
    weight: input.weight,
    decisionLevers: [],
  };

  // Attache la question « quel modèle ? » (re-vérifie « optimal » + correction).
  attachModelQuestions([situation], { [code]: modelExplain });
  return situation;
}
