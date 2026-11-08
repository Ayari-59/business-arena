import { appelDuCronAutorise } from "@/lib/secret-du-cron";
import { journaliserPurgeEchouee, journaliserPurgeReussie } from "@/lib/journal-de-purge";
import { ErreurDePurge, purger } from "@/services/purge.service";

/**
 * LA PURGE DE CHAQUE NUIT (RGPD), appelée par la tâche planifiée de vercel.json.
 *
 * Protégée par le secret `CRON_SECRET` (en-tête `Authorization: Bearer …`), refusée si la
 * variable manque. Les durées sont dans config/conservation.ts, le travail dans
 * services/purge.service.ts. La réponse ne donne que des nombres, aucune donnée.
 *
 * Chaque exécution autorisée écrit une ligne dans le journal (lib/journal-de-purge.ts) :
 * date, durée et lignes purgées par catégorie. Un échec écrit l'étape en cause et le
 * message, et répond 500.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!appelDuCronAutorise(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return new Response("Non autorisé.", { status: 401, headers: { "cache-control": "no-store" } });
  }
  const debut = new Date();
  try {
    const bilan = await purger();
    journaliserPurgeReussie({ debut, fin: new Date(), bilan });
    return Response.json({ ok: true, bilan }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    const categorie = e instanceof ErreurDePurge ? e.categorie : "inconnue";
    journaliserPurgeEchouee({ debut, fin: new Date(), categorie, erreur: e instanceof ErreurDePurge ? e.cause : e });
    return Response.json({ ok: false, categorie }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
