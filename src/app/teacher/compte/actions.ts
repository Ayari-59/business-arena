"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { enregistrerConsentement } from "@/services/nouveautes.service";
import { envoyerLeLienDeConfirmation } from "@/services/confirmation-email.service";

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

/**
 * RENVOYER LE LIEN DE CONFIRMATION DE L'ADRESSE (migration 0046) : au compte de la session,
 * jamais à une adresse venue du formulaire. Le résultat revient dans l'adresse de la page.
 */
export async function renvoyerLeLienAction(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const r = await envoyerLeLienDeConfirmation(session.userId);
  const suite = r.etat === "trop_tot" ? `trop_tot&minutes=${r.minutes}` : r.etat;
  redirect(`/teacher/compte?lien=${suite}#adresse`);
}
