import { urlDePlateformeAdmise } from "../reseau";

/**
 * UNE REQUÊTE AU SERVICE DE NOTES DE LA PLATEFORME : HTTPS (ou la machine locale des
 * tests, comme le reste de LTI), le jeton d'accès en en-tête, les types de contenu de la
 * norme, bornée en temps et en taille. Ne lève jamais : une plateforme injoignable rend
 * le statut « reseau », que les règles savent lire (regles.ts, `issueDeLEnvoi`).
 */

export interface ReponseAgs {
  statut: number | "reseau";
  json: unknown;
}

export type RequeteAgs = (args: {
  methode: "GET" | "POST";
  url: string;
  jeton: string;
  /** Le type du corps envoyé. */
  type?: string;
  /** Le type attendu en réponse. */
  accepte?: string;
  corps?: unknown;
}) => Promise<ReponseAgs>;

export const requeteAgs: RequeteAgs = async (args) => {
  const admise = urlDePlateformeAdmise(args.url);
  if (!admise) return { statut: 400, json: null };
  try {
    const reponse = await fetch(admise, {
      method: args.methode,
      headers: {
        authorization: `Bearer ${args.jeton}`,
        accept: args.accepte ?? "application/json",
        ...(args.corps !== undefined ? { "content-type": args.type ?? "application/json" } : {}),
      },
      body: args.corps !== undefined ? JSON.stringify(args.corps) : undefined,
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const texte = await reponse.text();
    let json: unknown = null;
    try {
      json = texte && texte.length <= 512_000 ? JSON.parse(texte) : null;
    } catch {
      json = null;
    }
    return { statut: reponse.status, json };
  } catch {
    return { statut: "reseau", json: null };
  }
};
