"use server";

import { revalidatePath } from "next/cache";
import { getGuestUserId } from "@/lib/guest";
import { roundDecisionsSchema } from "@/services/decision-schema";
import { getGameKind, resolveCurrentRound, submitTeamDecisions } from "@/services/game.service";

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
    finance: {
      newLoan: formData.get("newLoan") || 0,
      loanRepayment: formData.get("loanRepayment") || 0,
    },
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
