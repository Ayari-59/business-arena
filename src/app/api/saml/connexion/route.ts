import { NextResponse } from "next/server";
import { configurationSaml } from "@/saml/configuration";
import { COOKIE_REQUETE, DUREE_REQUETE_S } from "@/saml/constantes";
import { idpDeLaFederation } from "@/saml/federation";
import { reponseIndisponible, versLeRefus } from "@/saml/http";
import { journaliserRefus } from "@/saml/journal";
import { preparerDemande } from "@/saml/requete";
import { retourInterne } from "@/saml/retour";

/**
 * LE DÉPART DE LA CONNEXION : « Se connecter avec mon établissement ».
 *
 *   · sans établissement choisi : vers le service de découverte de RENATER (WAYF), qui
 *     revient ici avec `idp` = l'entityID choisi (protocole IdP Discovery) ;
 *   · avec `idp` : l'IdP doit être dans l'agrégat signé de la fédération ; une demande
 *     d'authentification signée part vers lui (saml/requete.ts), son ID en base et en
 *     cookie (SameSite=None ; Secure : la réponse reviendra d'un autre site, par POST).
 *
 * `retour` : la page où revenir après la connexion, un chemin interne seulement
 * (saml/retour.ts), qui voyage avec la demande.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const c = configurationSaml();
  if (!c) return reponseIndisponible();
  const url = new URL(request.url);
  const retour = retourInterne(url.searchParams.get("retour"));
  const choisi = url.searchParams.get("idp")?.trim() || url.searchParams.get("entityID")?.trim() || "";

  if (!choisi) {
    const wayf = new URL(c.urlWayf);
    const ici = new URL(c.connexion);
    if (retour) ici.searchParams.set("retour", retour);
    wayf.searchParams.set("entityID", c.entityId);
    wayf.searchParams.set("return", ici.toString());
    wayf.searchParams.set("returnIDParam", "idp");
    return NextResponse.redirect(wayf.toString(), 302);
  }

  const idp = await idpDeLaFederation(c, choisi.slice(0, 500));
  if (!idp) {
    await journaliserRefus({ etape: "connexion", motif: "IdP absent de l'agrégat de la fédération", idp: choisi });
    return versLeRefus(c.origine, "inconnu", 302);
  }
  const { redirection, id } = await preparerDemande({ configuration: c, idp, retour });
  const reponse = NextResponse.redirect(redirection, 302);
  reponse.cookies.set(COOKIE_REQUETE, id, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/api/saml",
    maxAge: DUREE_REQUETE_S,
  });
  return reponse;
}
