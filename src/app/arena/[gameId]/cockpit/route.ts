import { getGuestUserId } from "@/lib/guest";
import { getGameView } from "@/services/game.service";
import { cockpitEquipe } from "@/services/cockpit.service";
import { rendreClasseur, XLSX_CONTENT_TYPE } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

/**
 * Le cockpit de prévision de l'équipe, servi en classeur (.xlsx) : le
 * scénario réellement joué, les tours qui restent, l'état d'où elle repart
 * et l'historique de ses tours. Une partie qui n'est pas la sienne se lit
 * comme une partie qui n'existe pas.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const userId = await getGuestUserId();
  if (!userId) return new Response("Session expirée.", { status: 401 });
  const { gameId } = await params;
  const view = await getGameView(gameId, userId);
  if (!view) return new Response("Partie introuvable.", { status: 404 });
  const spec = await cockpitEquipe(view);
  if (!spec) return new Response("Partie introuvable.", { status: 404 });

  const fichier = await rendreClasseur(spec);
  return new Response(new Uint8Array(fichier), {
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${spec.fichier}-tour-${view.currentRound}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
