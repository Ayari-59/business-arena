import { getGuestUserId } from "@/lib/guest";
import { getSession } from "@/lib/session";
import { episodeParCode } from "@/pedagogy/episodes/registre";
import { demandeDePartie, PartieIncoherente, servirLaPartie } from "@/pedagogy/episodes/partie-servie";
import { accesAuxEpisodes, licencePourLEpisode, niveauxDeLEpisode } from "@/services/acces.service";

/**
 * UN GESTE D'UN ÉPISODE MANAGER, JOUÉ AU SERVEUR (audit du 10 novembre 2026, P1-1).
 *
 * Les épisodes ne partent plus dans le JavaScript public : l'écran envoie ici les faits de la
 * partie (le niveau, le tirage, les décisions et les vérifications déjà faites) à chaque geste
 * qui apprend quelque chose : commencer, vérifier, valider une décision. La route refait le
 * contrôle d'accès de la page, démonstrations comprises (services/acces.service.ts), rejoue la
 * partie et renvoie ce qu'il faut montrer, sans le résultat de ce qui n'est pas encore choisi
 * (pedagogy/episodes/partie-servie.ts).
 *
 * Une route plutôt qu'une action serveur, comme la lecture du cours (/api/cours/lecture) : un
 * geste ne change rien, il lit. Elle ne garde rien et ne lit la base que pour le contrôle
 * d'accès ; la partie terminée se garde toujours par `enregistrerPartieAction`.
 *
 * Corps : { code, geste, niveau, graine, decisions, consultes, fin?, precedente? }.
 * Réponses : 200 la vue ; 400 une demande illisible ou qui ne tient pas dans l'épisode ;
 * 403 un épisode ou un niveau que l'accès n'ouvre pas ; 404 un épisode inconnu.
 */
export async function POST(request: Request) {
  let brut: unknown;
  try {
    brut = await request.json();
  } catch {
    return Response.json({ refus: "corps" }, { status: 400 });
  }
  const lu = demandeDePartie.safeParse(brut);
  if (!lu.success) return Response.json({ refus: "demande" }, { status: 400 });
  const demande = lu.data;
  const ep = episodeParCode(demande.code);
  if (!ep) return Response.json({ refus: "episode" }, { status: 404 });

  const [userId, session] = await Promise.all([getGuestUserId(), getSession()]);
  const acces = await accesAuxEpisodes({ userId, sessionUserId: session?.userId });
  if (!niveauxDeLEpisode(acces, ep.code).includes(demande.niveau)) {
    return Response.json({ refus: "licence" }, { status: 403 });
  }
  try {
    const vue = servirLaPartie(ep, demande, { sansLicence: !licencePourLEpisode(acces, ep.code) });
    return Response.json(vue, { headers: { "cache-control": "private, no-store" } });
  } catch (e) {
    if (e instanceof PartieIncoherente) {
      return Response.json({ refus: "partie", raison: e.message }, { status: 400 });
    }
    throw e;
  }
}
