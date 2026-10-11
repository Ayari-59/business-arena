import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { origineDeLaRequete } from "@/lib/origine";
import { aiguiller, appliquerAiguillage } from "@/lti/aiguillage";
import { journaliserRefus } from "@/lti/journal";
import { echapper, pageDeRefus, pageLti } from "@/lti/html";
import { LancementRefuse, validerLancement } from "@/lti/lancement";
import { COOKIE_STATE } from "@/lti/oidc";
import { ecranDeSelection, originesDeLaPlateforme } from "@/lti/selection";
import { creerTicket } from "@/lti/tickets";

/**
 * LE LANCEMENT : la plateforme poste ici l'`id_token` (formulaire auto-soumis, depuis
 * son site). Vérification complète (lti/lancement.ts), puis :
 *   · une sélection de contenu : l'écran de choix, servi ici (lti/selection.ts) ;
 *   · un lancement d'activité : les cookies de la personne, et le renvoi vers sa page.
 *     Reçu dans une iframe (`document_target`), l'outil ne s'y affiche pas : il propose
 *     de s'ouvrir dans une nouvelle fenêtre, par un ticket à usage unique.
 * Un refus : une page sobre, le motif au journal, jamais le jeton.
 */
export const dynamic = "force-dynamic";

const DUREE_OUVERTURE_S = 120;

export async function POST(request: Request): Promise<Response> {
  const origine = await origineDeLaRequete();
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return pageDeRefus();
  }
  const champ = (c: string) => {
    const v = form.get(c);
    return typeof v === "string" ? v : null;
  };
  const store = await cookies();
  if (champ("error")) {
    await journaliserRefus({ etape: "lancement", motif: `la plateforme a répondu une erreur : ${champ("error")!.slice(0, 60)}` });
    return pageDeRefus();
  }

  let lancement;
  try {
    lancement = await validerLancement({
      idToken: champ("id_token"),
      state: champ("state"),
      stateCookie: store.get(COOKIE_STATE)?.value ?? null,
    });
  } catch (e) {
    if (!(e instanceof LancementRefuse)) throw e;
    await journaliserRefus({ etape: "lancement", motif: e.motif, issuer: e.issuer, plateformeId: e.plateformeId });
    return pageDeRefus();
  }
  store.set(COOKIE_STATE, "", { httpOnly: true, secure: true, sameSite: "none", path: "/api/lti", maxAge: 0 });

  if (lancement.type === "selection") return ecranDeSelection(lancement);

  const aiguillage = await aiguiller(lancement);
  if (lancement.affichage === "iframe" || lancement.affichage === "frame") {
    const ticket = await creerTicket({
      type: "ouverture",
      plateformeId: lancement.plateforme.id,
      donnees: aiguillage as unknown as Record<string, unknown>,
      dureeS: DUREE_OUVERTURE_S,
    });
    return pageLti({
      titre: "Business Arena s'ouvre dans une nouvelle fenêtre",
      integrablePar: originesDeLaPlateforme(lancement.plateforme),
      corps: `<p>Le jeu a besoin de tout l'écran : il s'ouvre à côté de votre cours, que vous retrouvez en fermant la fenêtre.</p>
<a class="bouton" href="/api/lti/ouverture?ticket=${echapper(ticket)}" target="_blank" rel="noopener">Ouvrir Business Arena</a>
<p class="note">Votre établissement peut régler l'outil sur « Nouvelle fenêtre » dans la plateforme : ce bouton disparaît alors.</p>`,
    });
  }
  await appliquerAiguillage(aiguillage);
  return NextResponse.redirect(new URL(aiguillage.chemin, origine), 303);
}
