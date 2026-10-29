"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { reglerLeTuteur } from "@/services/tuteur.service";

/**
 * ALLUMER OU COUPER LE TUTEUR IA DE LA PARTIE. La session dit qui demande ; le service
 * vérifie que la partie est bien la sienne. L'action du tuteur relit ce réglage à chaque
 * question (app/arena/[gameId]/ai-actions.ts).
 */
export async function reglerLeTuteurAction(gameId: string, formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const actif = formData.get("tuteur") === "oui";
  await reglerLeTuteur({ gameId, teacherId: session.userId, actif });
  revalidatePath(`/teacher/games/${gameId}`);
}
