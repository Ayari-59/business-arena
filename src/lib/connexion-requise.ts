import { headers } from "next/headers";
import { adresseDeConnexion, ENTETE_CHEMIN_DEMANDE } from "@/lib/connexion-enseignant";

/**
 * L'ADRESSE DE CONNEXION POUR LA PAGE EN COURS, avec son retour.
 *
 * Les pages de /teacher qui exigent une session écrivent
 * `if (!session) redirect(await connexionPourLaPageDemandee());` : la connexion
 * ramène ensuite à la page demandée (voir lib/connexion-enseignant.ts). Hors du
 * proxy (en-tête absent), c'est la connexion simple.
 */
export async function connexionPourLaPageDemandee(): Promise<string> {
  const h = await headers();
  return adresseDeConnexion(h.get(ENTETE_CHEMIN_DEMANDE));
}
