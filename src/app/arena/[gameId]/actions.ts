"use server";

import { revalidatePath } from "next/cache";
import { getGuestUserId } from "@/lib/guest";
import { roundDecisionsSchema } from "@/services/decision-schema";
import { getGameKind, resolveCurrentRound, submitTeamDecisions } from "@/services/game.service";
import { submitDiagnosis, submitQuiz, unlockHint } from "@/services/pedagogy.service";

export interface PlayRoundState {
  error: string | null;
}

/** Valide les décisions du joueur et résout le tour courant (mode solo, ADR-04). */
export async function playRoundAction(
  gameId: string,
  _previous: PlayRoundState,
  formData: FormData,
): Promise<PlayRoundState> {
  const userId = await getGuestUserId();
  if (!userId) return { error: "Session expirée : relancez une partie depuis l'accueil." };

  const parsed = roundDecisionsSchema.safeParse({
    price: formData.get("price"),
    productionPlan: formData.get("productionPlan"),
    marketingBudget: formData.get("marketingBudget"),
    qualityBudget: formData.get("qualityBudget"),
    maintenanceBudget: formData.get("maintenanceBudget"),
    insurance: formData.get("insurance") === "on",
    hr: formData.has("salaryPercent")
      ? {
          hire: formData.get("hire") || 0,
          fire: formData.get("fire") || 0,
          trainingBudget: formData.get("trainingBudget") || 0,
          salaryIndex: Number(formData.get("salaryPercent") || 100) / 100,
        }
      : undefined,
    investment: formData.has("machineCapacityUnits")
      ? { machineCapacityUnits: formData.get("machineCapacityUnits") || 0 }
      : undefined,
    finance: {
      newLoan: formData.get("newLoan") || 0,
      loanRepayment: formData.get("loanRepayment") || 0,
      capitalIncrease: formData.get("capitalIncrease") || 0,
    },
    treasury: formData.has("discount")
      ? {
          discount: formData.get("discount") || 0,
          factoring: formData.get("factoring") || 0,
        }
      : undefined,
  });
  if (!parsed.success) {
    return { error: "Décisions invalides : vérifiez les montants saisis." };
  }

  try {
    const kind = await getGameKind(gameId);
    if (kind === "solo") {
      await resolveCurrentRound({ gameId, userId, playerDecisions: parsed.data });
    } else {
      // partie de classe : on valide, l'enseignant clôt le tour (ADR-04)
      await submitTeamDecisions({ gameId, userId, payload: parsed.data });
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur lors de la simulation." };
  }
  revalidatePath(`/arena/${gameId}`);
  return { error: null };
}

export interface PedagogyState {
  error: string | null;
}

/** Débloque le prochain indice d'une situation (séquentiel, tracé — doc 03 §4). */
export async function unlockHintAction(
  gameId: string,
  instanceId: string,
  _prev: PedagogyState,
  _formData: FormData,
): Promise<PedagogyState> {
  const userId = await getGuestUserId();
  if (!userId) return { error: "Session expirée." };
  try {
    await unlockHint({ instanceId, userId });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur." };
  }
  revalidatePath(`/arena/${gameId}`);
  return { error: null };
}

/** Enregistre le diagnostic du joueur (options + analyse libre). */
export async function submitDiagnosisAction(
  gameId: string,
  instanceId: string,
  _prev: PedagogyState,
  formData: FormData,
): Promise<PedagogyState> {
  const userId = await getGuestUserId();
  if (!userId) return { error: "Session expirée." };
  const selected = formData.getAll("options").map(String);
  const freeText = String(formData.get("freeText") ?? "");
  try {
    await submitDiagnosis({ instanceId, userId, selectedOptionIds: selected, freeText });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur." };
  }
  revalidatePath(`/arena/${gameId}`);
  return { error: null };
}

/** Enregistre les réponses au QCM de mobilisation des connaissances. */
export async function submitQuizAction(
  gameId: string,
  instanceId: string,
  _prev: PedagogyState,
  formData: FormData,
): Promise<PedagogyState> {
  const userId = await getGuestUserId();
  if (!userId) return { error: "Session expirée." };
  const answers: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("quiz_") && typeof value === "string" && value) {
      answers[key.slice("quiz_".length)] = value;
    }
  }
  if (Object.keys(answers).length === 0)
    return { error: "Répondez aux questions avant de valider." };
  try {
    await submitQuiz({ instanceId, userId, answers });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur." };
  }
  revalidatePath(`/arena/${gameId}`);
  return { error: null };
}
