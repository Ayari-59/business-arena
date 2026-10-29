import { appelDuCronAutorise } from "@/lib/secret-du-cron";
import { purger } from "@/services/purge.service";

/**
 * LA PURGE DE CHAQUE NUIT (RGPD), appelée par la tâche planifiée de vercel.json.
 *
 * Protégée par le secret `CRON_SECRET` (en-tête `Authorization: Bearer …`), refusée si la
 * variable manque. Les durées sont dans config/conservation.ts, le travail dans
 * services/purge.service.ts. La réponse ne donne que des nombres, aucune donnée.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!appelDuCronAutorise(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return new Response("Non autorisé.", { status: 401, headers: { "cache-control": "no-store" } });
  }
  const bilan = await purger();
  return Response.json({ ok: true, bilan }, { headers: { "cache-control": "no-store" } });
}
