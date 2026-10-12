import { getSession } from "@/lib/session";
import { exportDesPairs } from "@/services/pairs.service";

/**
 * LE TABLEUR DE L'ÉVALUATION ENTRE COÉQUIPIERS (config/pairs/export.ts) : point-virgule,
 * virgule décimale, signature d'octets, nom de fichier daté. Une partie qui n'est pas
 * celle de l'enseignant se lit comme une partie qui n'existe pas.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const session = await getSession();
  if (!session) return new Response("Connexion requise.", { status: 401 });
  const { gameId } = await params;
  const fichier = await exportDesPairs(session.userId, gameId);
  if (!fichier) return new Response("Évaluation introuvable.", { status: 404 });
  return new Response(fichier.contenu, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${fichier.nom}"`,
      "cache-control": "no-store",
    },
  });
}
