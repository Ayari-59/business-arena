import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { aiguiller, appliquerAiguillage } from "@/saml/aiguillage";
import { configurationSaml } from "@/saml/configuration";
import { COOKIE_REQUETE } from "@/saml/constantes";
import { reponseIndisponible, versLeRefus } from "@/saml/http";
import { journaliserRefus } from "@/saml/journal";
import { ReponseRefusee, validerReponse } from "@/saml/reponse";

/**
 * L'ACS (Assertion Consumer Service) : l'IdP de l'établissement poste ici la réponse
 * SAML, par un formulaire auto-soumis depuis SON site (POST d'un autre site, comme le
 * lancement LTI). Vérification complète (saml/reponse.ts), puis aiguillage
 * (saml/aiguillage.ts) : cookies de la personne et renvoi (303) vers sa page.
 * Un refus : une page sobre, le motif au journal, jamais la réponse.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const c = configurationSaml();
  if (!c) return reponseIndisponible();
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    await journaliserRefus({ etape: "reponse", motif: "corps illisible" });
    return versLeRefus(c.origine, "verification");
  }
  const brute = form.get("SAMLResponse");
  const store = await cookies();
  const cookieRequete = store.get(COOKIE_REQUETE)?.value ?? null;
  // La demande ne sert qu'une fois, réussie ou non.
  store.set(COOKIE_REQUETE, "", { httpOnly: true, secure: true, sameSite: "none", path: "/api/saml", maxAge: 0 });

  let identite;
  try {
    identite = await validerReponse({
      configuration: c,
      samlResponse: typeof brute === "string" ? brute.replace(/\s+/g, "") : null,
      cookieRequete,
    });
  } catch (e) {
    if (!(e instanceof ReponseRefusee)) throw e;
    await journaliserRefus({ etape: "reponse", motif: e.motif, idp: e.idp });
    return versLeRefus(c.origine, "verification");
  }
  const aiguillage = await aiguiller(identite);
  await appliquerAiguillage(aiguillage);
  return NextResponse.redirect(new URL(aiguillage.chemin, c.origine), 303);
}
