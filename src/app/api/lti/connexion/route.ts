import { NextResponse } from "next/server";
import { origineDeLaRequete } from "@/lib/origine";
import { journaliserRefus } from "@/lti/journal";
import { pageDeRefus } from "@/lti/html";
import { ConnexionRefusee, COOKIE_STATE, DUREE_CONNEXION_S, initierConnexion, type ParametresConnexion } from "@/lti/oidc";

/**
 * LA CONNEXION OIDC (« login initiation »), en GET ou en POST selon la plateforme.
 * Voir lti/oidc.ts : state et nonce tirés, gardés en base, et renvoi vers
 * l'authentification de la plateforme.
 */
export const dynamic = "force-dynamic";

const CHAMPS = ["iss", "login_hint", "target_link_uri", "lti_message_hint", "client_id", "lti_deployment_id"] as const;

async function traiter(lire: (cle: string) => string | null): Promise<Response> {
  const params: ParametresConnexion = {};
  for (const c of CHAMPS) params[c] = lire(c);
  try {
    const { redirection, state } = await initierConnexion(params, await origineDeLaRequete());
    const reponse = NextResponse.redirect(redirection, 302);
    // SameSite=None : le lancement revient par un POST d'un autre site. Le cookie n'est
    // qu'une vérification de plus ; la base suffit quand le navigateur ne le renvoie pas.
    reponse.cookies.set(COOKIE_STATE, state, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/api/lti",
      maxAge: DUREE_CONNEXION_S,
    });
    return reponse;
  } catch (e) {
    if (!(e instanceof ConnexionRefusee)) throw e;
    await journaliserRefus({ etape: "connexion", motif: e.motif, issuer: e.issuer ?? params.iss, plateformeId: e.plateformeId });
    return pageDeRefus();
  }
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  return traiter((c) => url.searchParams.get(c));
}

export async function POST(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return pageDeRefus();
  }
  return traiter((c) => {
    const v = form.get(c);
    return typeof v === "string" ? v : null;
  });
}
