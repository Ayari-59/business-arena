import { MODEL_QUESTION_ID, type SituationDef } from "./situation-kit";

/**
 * Édition du TEXTE d'une situation héritée (éditeur de scénarios, PR 4).
 *
 * On ne touche qu'au texte : titre, récit, problème, libellés des options de
 * diagnostic, les cinq indices, la correction du choix de modèle, plus le tour
 * de déclenchement et le poids. La STRUCTURE — matrice de pertinence des
 * modèles, identifiants et exactitude des options, niveaux et coûts des indices,
 * notions — est préservée telle quelle. Aucun invariant de situation n'est donc
 * mis en jeu : l'authoring d'une situation de zéro (composer la matrice) est un
 * autre chantier.
 */

export interface SituationTextPatch {
  title: string;
  narrative: string;
  problem: string;
  /** Libellés des options de diagnostic, dans le même ordre (ids/exactitude conservés). */
  diagnosticLabels: string[];
  /** Textes des cinq indices, dans l'ordre (niveaux et coûts conservés). */
  hintTexts: string[];
  /** Correction affichée après la question « quel modèle ? ». */
  modelExplain: string;
  /** Tour de déclenchement, seulement si la situation se déclenche par tour. */
  triggerRound?: number;
  /** Poids de la situation dans le score. */
  weight?: number;
}

const nonVide = (s: string, quoi: string): string => {
  const t = s.trim();
  if (!t) throw new Error(`Champ requis vide : ${quoi}`);
  return t;
};

export function patchSituationText(
  situation: SituationDef,
  patch: SituationTextPatch,
): SituationDef {
  if (patch.diagnosticLabels.length !== situation.diagnosticOptions.length) {
    throw new Error("Nombre d'options de diagnostic inattendu");
  }
  if (patch.hintTexts.length !== situation.hints.length) {
    throw new Error("Nombre d'indices inattendu");
  }
  const modelExplain = nonVide(patch.modelExplain, "correction du choix de modèle");

  const trigger =
    "round" in situation.trigger && patch.triggerRound !== undefined
      ? { round: patch.triggerRound }
      : situation.trigger;

  return {
    ...situation,
    title: nonVide(patch.title, "titre"),
    narrative: nonVide(patch.narrative, "récit"),
    problem: nonVide(patch.problem, "problème"),
    diagnosticOptions: situation.diagnosticOptions.map((o, i) => ({
      ...o,
      label: nonVide(patch.diagnosticLabels[i]!, `option de diagnostic ${i + 1}`),
    })),
    hints: situation.hints.map((h, i) => ({
      ...h,
      text: nonVide(patch.hintTexts[i]!, `indice ${i + 1}`),
    })),
    // La correction vit dans la question canonique du modèle ; la vue et le
    // score la reconstruisent depuis là (modelQuestionFor).
    quiz: situation.quiz.map((q) =>
      q.id === MODEL_QUESTION_ID ? { ...q, explain: modelExplain } : q,
    ),
    trigger,
    weight: patch.weight ?? situation.weight,
  };
}
