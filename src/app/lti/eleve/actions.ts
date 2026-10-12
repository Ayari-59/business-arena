"use server";

import { redirect } from "next/navigation";
import { getGuestUserId } from "@/lib/guest";
import { entrerDansLaCible } from "@/lti/aiguillage";
import { lireContexte } from "@/lti/contexte";
import { lienParId } from "@/lti/liens";
import { apresLeLancement } from "@/lti/ags/envois";
import { plusTard } from "@/lti/ags/plus-tard";

/**
 * L'ÉLÈVE ARRIVÉ SANS PRÉNOM (la plateforme ne l'a pas envoyé) le donne ici, puis entre
 * dans la partie de l'activité, réparti dans une équipe comme par /join. Qui il est vient
 * du cookie invité posé au lancement, et l'activité du contexte signé : le formulaire ne
 * porte que le prénom.
 */
export async function entrerAction(formData: FormData): Promise<void> {
  const [ctx, invite] = await Promise.all([lireContexte(), getGuestUserId()]);
  if (!ctx || ctx.r !== "eleve" || !ctx.l || invite !== ctx.u) redirect("/lti/eleve");
  const pseudo = String(formData.get("pseudo") ?? "").trim().slice(0, 40);
  if (!pseudo) redirect("/lti/eleve?refus=prenom");
  const lien = await lienParId(ctx.l);
  if (!lien?.cibleType) redirect("/lti/eleve");
  const arrivee = await entrerDansLaCible({ userId: invite, pseudo, ...lien });
  // Entré dans une équipe : sa progression part vers le carnet de la plateforme (lti/ags).
  if (arrivee) plusTard(() => apresLeLancement(lien.id));
  redirect(arrivee ?? "/lti/eleve?refus=entree");
}
