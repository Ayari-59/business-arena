import { clesDeLOutil, LtiNonConfigure } from "@/lti/cles";

/**
 * LES CLÉS PUBLIQUES DE L'OUTIL (JWKS), que la plateforme lit pour vérifier ce que
 * l'outil signe. La clé courante d'abord, puis les précédentes (rotation, voir
 * lti/cles.ts). Jamais de clé privée ici : seuls `kty`, `n`, `e`, `alg`, `use`, `kid`.
 */
export const dynamic = "force-dynamic";

export function GET(): Response {
  try {
    const { publiques } = clesDeLOutil();
    return Response.json(
      { keys: publiques },
      { headers: { "cache-control": "public, max-age=300", "access-control-allow-origin": "*" } },
    );
  } catch (e) {
    if (e instanceof LtiNonConfigure) {
      return Response.json({ keys: [], erreur: "LTI non configuré" }, { status: 503 });
    }
    throw e;
  }
}
