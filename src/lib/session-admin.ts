import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { requirePlatformAdmin } from "@/services/admin.service";

/**
 * La session d'un administrateur général, ou le renvoi vers la connexion.
 *
 * Elle vivait en privé dans les actions de l'admin. Une seconde page d'admin en
 * a besoin, et la recopier aurait donné deux contrôles d'accès qui dérivent : le
 * jour où l'un se durcit, l'autre reste ouvert. Elle ne peut pas être exportée
 * d'un fichier d'actions, où tout export devient un point d'entrée appelable
 * depuis le navigateur ; elle vit donc ici, hors de toute action.
 */
export async function requireAdminSession(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  await requirePlatformAdmin(session.userId);
  return session.userId;
}
