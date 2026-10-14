import { NextResponse } from "next/server";
import { getGuestUserId } from "@/lib/guest";
import { partiesSoloEnCours } from "@/services/partie-en-cours.service";

/**
 * Les parties solo en cours de cet appareil, pour l'accueil.
 *
 * L'accueil est servi statique (revalidé toutes les cinq minutes) : il ne peut
 * pas lire le cookie lui-même sans devenir dynamique pour tout le monde, robots
 * compris. Un îlot client demande donc la liste ici, et ne montre rien tant
 * qu'elle n'est pas là. Sans cookie valide : liste vide, jamais d'erreur.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestUserId();
  const parties = userId ? await partiesSoloEnCours(userId) : [];
  return NextResponse.json(
    { parties },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
