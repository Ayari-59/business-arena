import { NextResponse } from "next/server";
import { origineDeLaRequete } from "@/lib/origine";
import { appliquerAiguillage, type Aiguillage } from "@/lti/aiguillage";
import { journaliserRefus } from "@/lti/journal";
import { pageLti } from "@/lti/html";
import { plateformeParId } from "@/lti/plateformes";
import { consommerTicket } from "@/lti/tickets";

/**
 * L'OUVERTURE EN NOUVELLE FENÊTRE d'un lancement reçu dans une iframe : le ticket (usage
 * unique, deux minutes) porte ce que le lancement vérifié avait décidé ; ici, dans une
 * vraie fenêtre, les cookies se posent normalement.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const ticket = new URL(request.url).searchParams.get("ticket");
  const pris = await consommerTicket(ticket, "ouverture");
  const plateforme = pris ? await plateformeParId(pris.plateformeId) : null;
  if (!pris || !plateforme?.actif) {
    await journaliserRefus({ etape: "ouverture", motif: "ticket d'ouverture inconnu, expiré ou déjà utilisé" });
    return pageLti({
      titre: "Ce lien a déjà servi",
      statut: 410,
      corps: "<p>Pour votre sécurité, ce lien ne s'ouvre qu'une fois et peu de temps. Relancez l'activité depuis votre cours.</p>",
    });
  }
  const aiguillage = pris.donnees as unknown as Aiguillage;
  await appliquerAiguillage(aiguillage);
  return NextResponse.redirect(new URL(aiguillage.chemin, await origineDeLaRequete()), 303);
}
