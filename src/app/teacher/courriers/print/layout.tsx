import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { connexionPourLaPageDemandee } from "@/lib/connexion-requise";

/**
 * LA LIASSE À IMPRIMER EST DE L'ESPACE ENSEIGNANT, comme le reste de /teacher.
 *
 * Constaté en production (audit d'octobre 2026) : la page répondait 200 sans
 * connexion, une page vide sous l'en-tête, alors que toutes les autres routes de
 * /teacher redirigent vers la connexion. La page ne lisait pas la session : la
 * garde se pose ici, côté serveur, pour la page et tout ce qu'elle contiendra,
 * avec le même retour après connexion que les autres pages.
 */
export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect(await connexionPourLaPageDemandee());
  return children;
}
