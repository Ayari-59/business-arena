import { getSession } from "@/lib/session";
import { requirePlatformAdmin } from "@/services/admin.service";
import { exporterLesInscrits, lireLesFiltres } from "@/services/inscrits.service";
import { origineDeLaRequete } from "@/lib/origine";

/**
 * L'EXPORT DES INSCRITS, EN TABLEUR (CSV pour Excel en français : point-virgule, BOM UTF-8,
 * nom de fichier daté). Mêmes filtres que la page ; `?consentants=1` donne le fichier d'un
 * envoi de nouveautés : les seuls consentants qui ont une adresse, chacun avec son lien de
 * désinscription. Aucun élève, jamais (services/inscrits.service.ts).
 *
 * Même contrôle que la page : une session, et le rôle d'administrateur de la plateforme,
 * relu ici puis par le service. Un administrateur d'établissement reçoit 403.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response("Connexion requise.", { status: 401 });
  try {
    await requirePlatformAdmin(session.userId);
  } catch {
    return new Response("Réservé à l'administrateur de la plateforme.", { status: 403 });
  }
  const parametres = new URL(request.url).searchParams;
  const { nom, contenu } = await exporterLesInscrits(session.userId, lireLesFiltres(parametres), {
    consentants: parametres.get("consentants") === "1",
    origine: await origineDeLaRequete(),
  });
  return new Response(contenu, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${nom}"`,
      "cache-control": "no-store",
    },
  });
}
