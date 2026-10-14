import { configurationSaml } from "@/saml/configuration";
import { metadonneesDuSp } from "@/saml/metadonnees-sp";
import { reponseIndisponible } from "@/saml/http";

/**
 * LES MÉTADONNÉES DU FOURNISSEUR DE SERVICES, à déclarer dans le registre de la
 * fédération (voir saml/metadonnees-sp.ts). 503 tant que la clé du SP et l'épingle de
 * l'agrégat ne sont pas configurées.
 */
export const dynamic = "force-dynamic";

export function GET(): Response {
  const c = configurationSaml();
  if (!c) return reponseIndisponible();
  return new Response(metadonneesDuSp(c), {
    headers: {
      "content-type": "application/samlmetadata+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
