"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { enregistrerConsentement } from "@/services/nouveautes.service";

/**
 * LE RÉGLAGE DES NOUVEAUTÉS, DANS L'ESPACE ENSEIGNANT : la case cochée enregistre l'accord
 * (date et version du texte), décochée le retire. La session dit de quel compte il s'agit ;
 * aucun identifiant ne vient du formulaire.
 */
export async function reglerNouveautesAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const consenti = formData.get("nouveautes") === "oui";
  await enregistrerConsentement(session.userId, consenti);
  revalidatePath("/teacher/compte");
  redirect(`/teacher/compte?fait=${consenti ? "oui" : "non"}#nouveautes`);
}
