"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { enregistrerConsentement } from "@/services/nouveautes.service";
import { envoyerLeLienDeConfirmation } from "@/services/confirmation-email.service";
import { clearSession, getSession } from "@/lib/session";
import { supprimerCompteEnseignant } from "@/services/effacement.service";
import { MOT_DE_SUPPRESSION } from "@/config/conservation";
import type { EtatDeSuppression } from "@/components/suppression-confirmee";

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

/**
 * « SUPPRIMER MON COMPTE » (RGPD, droit à l'effacement) : le compte de la session, jamais
 * un identifiant venu du formulaire. Le mot de confirmation, tapé dans la page, est
 * revérifié ici. La suppression emporte les parties, classes, examens, concours, cohortes
 * et classes du cours de l'enseignant, et les élèves sans compte qui n'y étaient rattachés
 * que par lui (services/effacement.service.ts). La session est fermée ensuite.
 */
export async function supprimerMonCompteAction(
  _etat: EtatDeSuppression,
  formData: FormData,
): Promise<EtatDeSuppression> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const mot = String(formData.get("confirmation") ?? "").trim().toUpperCase();
  if (mot !== MOT_DE_SUPPRESSION) {
    return { erreur: `Tapez ${MOT_DE_SUPPRESSION} pour confirmer la suppression.` };
  }
  const r = await supprimerCompteEnseignant(session.userId);
  if (!r.ok) return { erreur: r.raison };
  await clearSession();
  redirect("/teacher/login?compte=supprime");
}
