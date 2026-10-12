import { getSession } from "@/lib/session";
import { exportDeLExamen } from "@/services/examen.service";

/**
 * LE TABLEUR DES RÉSULTATS D'UN EXAMEN (config/examen/export.ts) : point-virgule, virgule
 * décimale, signature d'octets, nom de fichier daté. Un examen qui n'est pas celui de
 * l'enseignant se lit comme un examen qui n'existe pas. Seules les copies de CET examen
 * sortent : jamais une donnée d'un autre établissement.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new Response("Connexion requise.", { status: 401 });
  const { id } = await params;
  const fichier = await exportDeLExamen(session.userId, id);
  if (!fichier) return new Response("Examen introuvable.", { status: 404 });
  return new Response(fichier.contenu, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${fichier.nom}"`,
      "cache-control": "no-store",
    },
  });
}
