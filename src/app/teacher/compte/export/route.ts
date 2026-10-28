import { getSession } from "@/lib/session";
import { exporterMesDonnees } from "@/services/export-donnees.service";

/**
 * « EXPORTER MES DONNÉES » (RGPD, accès et portabilité) : le fichier JSON du compte de la
 * session, et de lui seul (services/export-donnees.service.ts). Jamais mis en cache.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Connectez-vous pour exporter vos données.", { status: 401 });
  const donnees = await exporterMesDonnees(session.userId);
  if (!donnees) return new Response("Compte introuvable.", { status: 404 });
  const jour = donnees.genereLe.slice(0, 10);
  return new Response(JSON.stringify(donnees, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="business-arena-mes-donnees-${jour}.json"`,
      "cache-control": "no-store, private",
    },
  });
}
