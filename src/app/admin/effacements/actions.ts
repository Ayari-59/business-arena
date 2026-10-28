"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session-admin";
import { MOT_DE_SUPPRESSION } from "@/config/conservation";
import type { EtatDeSuppression } from "@/components/suppression-confirmee";
import {
  noterLEffacement,
  supprimerUnEleve,
  supprimerUnEtablissement,
} from "@/services/effacement.service";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * LES EFFACEMENTS SUR DEMANDE (RGPD), DEPUIS L'ADMINISTRATION : un établissement entier, ou
 * un élève sans compte. Chaque action relit la session d'administration et le mot de
 * confirmation tapé dans la page ; le service refuse ce qui ne doit pas partir (« Grand
 * public », un compte qui n'est pas celui d'un élève).
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function confirme(formData: FormData): boolean {
  return String(formData.get("confirmation") ?? "").trim().toUpperCase() === MOT_DE_SUPPRESSION;
}

export async function supprimerEtablissementAction(
  _etat: EtatDeSuppression,
  formData: FormData,
): Promise<EtatDeSuppression> {
  const adminId = await requireAdminSession();
  const id = String(formData.get("organisation") ?? "");
  if (!UUID.test(id)) return { erreur: "Établissement introuvable." };
  if (!confirme(formData)) return { erreur: `Tapez ${MOT_DE_SUPPRESSION} pour confirmer.` };
  const [org] = await db.select({ nom: organizations.name }).from(organizations).where(eq(organizations.id, id));
  const r = await supprimerUnEtablissement(id);
  if (!r.ok) return { erreur: r.raison };
  await noterLEffacement(
    adminId,
    "effacement_etablissement",
    `${org?.nom ?? "établissement"} : ${r.enseignantsDetaches ?? 0} enseignant(s) détaché(s) (comptes conservés), ${r.parties} partie(s), ${r.eleves} élève(s)`,
  );
  revalidatePath("/admin");
  redirect("/admin/effacements?fait=etablissement");
}

export async function supprimerEleveAction(
  _etat: EtatDeSuppression,
  formData: FormData,
): Promise<EtatDeSuppression> {
  const adminId = await requireAdminSession();
  const id = String(formData.get("eleve") ?? "");
  if (!UUID.test(id)) return { erreur: "Élève introuvable." };
  if (!confirme(formData)) return { erreur: `Tapez ${MOT_DE_SUPPRESSION} pour confirmer.` };
  const r = await supprimerUnEleve(id);
  if (!r.ok) return { erreur: r.raison };
  await noterLEffacement(adminId, "effacement_eleve", `un élève sans compte, ${r.parties} partie(s) à lui`);
  redirect("/admin/effacements?fait=eleve");
}
