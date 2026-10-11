"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session-admin";
import {
  activerPlateforme,
  ajouterDeploiements,
  creerJetonInscription,
  inscrirePlateforme,
  InscriptionRefusee,
  lireDeploiements,
  revoquerJeton,
} from "@/lti/plateformes";

/**
 * LES GESTES DE L'ADMINISTRATEUR GÉNÉRAL SUR LES PLATEFORMES LTI. Chaque action relit la
 * session d'administration ; les refus repartent par un code dans l'adresse.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const champ = (fd: FormData, nom: string) => String(fd.get(nom) ?? "").trim();

/** Un jeton d'inscription dynamique pour une organisation. */
export async function creerJetonAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  const organizationId = champ(formData, "organisation");
  if (!UUID.test(organizationId)) redirect("/admin/lti?refus=organisation#jetons");
  await creerJetonInscription({ organizationId, adminId });
  revalidatePath("/admin/lti");
  redirect("/admin/lti?fait=jeton#jetons");
}

export async function revoquerJetonAction(jetonId: string): Promise<void> {
  await requireAdminSession();
  if (UUID.test(jetonId)) await revoquerJeton(jetonId);
  revalidatePath("/admin/lti");
  redirect("/admin/lti?fait=revoque#jetons");
}

/** L'inscription manuelle : les adresses recopiées depuis la plateforme. */
export async function ajouterPlateformeAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  try {
    await inscrirePlateforme({
      nom: champ(formData, "nom"),
      issuer: champ(formData, "issuer"),
      clientId: champ(formData, "clientId"),
      deploymentIds: lireDeploiements(champ(formData, "deploymentIds")),
      urlAuthentification: champ(formData, "urlAuthentification"),
      urlJeton: champ(formData, "urlJeton"),
      urlJwks: champ(formData, "urlJwks"),
      organizationId: champ(formData, "organisation"),
      inscription: "manuelle",
    });
  } catch (e) {
    if (!(e instanceof InscriptionRefusee)) throw e;
    redirect(`/admin/lti?refus=${e.code}#ajout`);
  }
  revalidatePath("/admin/lti");
  redirect("/admin/lti?fait=plateforme#plateformes");
}

export async function basculerPlateformeAction(plateformeId: string, actif: boolean): Promise<void> {
  await requireAdminSession();
  if (UUID.test(plateformeId)) await activerPlateforme(plateformeId, actif);
  revalidatePath("/admin/lti");
  redirect(`/admin/lti?fait=${actif ? "active" : "desactive"}#plateformes`);
}

export async function ajouterDeploiementAction(plateformeId: string, formData: FormData): Promise<void> {
  await requireAdminSession();
  const ids = lireDeploiements(champ(formData, "deploymentId"));
  if (UUID.test(plateformeId) && ids.length > 0) await ajouterDeploiements(plateformeId, ids);
  revalidatePath("/admin/lti");
  redirect("/admin/lti?fait=deploiement#plateformes");
}
