import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { ltiNonces } from "@/db/schema";
import { CLAIM, MESSAGE, roleRetenu, VERSION_LTI, type RoleLti } from "./constantes";
import { clePubliqueDepuisJwk, decoderJwt, exigerRS256, JwtInvalide, verifierSignature } from "./jwt";
import { cleDeLaPlateforme } from "./reseau";
import { plateformeActive, type Plateforme } from "./plateformes";
import { CLAIM_AGS } from "./ags/constantes";
import { lireLaRevendication, type AgsDuLancement } from "./ags/regles";

/**
 * LE LANCEMENT : VÉRIFIER L'`id_token` AVANT DE CROIRE UN MOT DE CE QU'IL DIT.
 *
 * L'ordre compte. On ne lit de la charge, avant la signature, que de quoi trouver la
 * plateforme (iss, aud, azp) ; puis :
 *   1. l'algorithme : RS256 seulement (`none`, HS256 et les autres refusés) ;
 *   2. la plateforme : active, émetteur ET client_id inscrits ; `aud` contient le
 *      client_id, et s'il en contient plusieurs, `azp` doit le désigner ;
 *   3. la signature : la clé publique de LA plateforme trouvée (JWKS, en cache, relu
 *      quand le `kid` est inconnu) ;
 *   4. les dates : `exp` dans le futur et `iat` pas dans le futur, à soixante secondes
 *      près (horloges des serveurs) ;
 *   5. la version `1.3.0`, le type de message, le `deployment_id` inscrit, le `sub` ;
 *   6. le nonce : celui qu'on a tiré à la connexion, encore valable, et CONSOMMÉ ici
 *      (un jeton rejoué le trouve déjà utilisé) ; le `state` posté doit être celui tiré
 *      avec ce nonce, et celui du cookie aussi quand le navigateur l'a renvoyé.
 *
 * Tout refus lève `LancementRefuse` avec un motif court, que la route écrit au journal
 * (jamais le jeton) et qui n'est jamais montré tel quel à la personne.
 */

export const TOLERANCE_HORLOGE_S = 60;

export class LancementRefuse extends Error {
  constructor(
    readonly motif: string,
    readonly issuer: string | null = null,
    readonly plateformeId: string | null = null,
  ) {
    super(motif);
    this.name = "LancementRefuse";
  }
}

export interface Lancement {
  plateforme: Plateforme;
  type: "lancement" | "selection";
  sub: string;
  role: RoleLti;
  deploymentId: string;
  ressource: { id: string; titre: string | null } | null;
  contexte: { id: string; titre: string | null } | null;
  /** Le prénom envoyé par la plateforme, s'il l'est. */
  prenom: string | null;
  /** Le nom complet : gardé pour un ENSEIGNANT seulement. */
  nomComplet: string | null;
  /** Le courriel : gardé pour un ENSEIGNANT seulement. */
  courriel: string | null;
  personnalise: Record<string, string>;
  selection: { retour: string; donnees: string | null; types: string[] } | null;
  /** Où la plateforme affiche l'outil : « window », « iframe », « frame »… */
  affichage: string | null;
  /** Le service de notes accordé à l'activité (lti/ags), ou null : aucun. */
  ags?: AgsDuLancement | null;
}

const texte = (v: unknown, max = 300): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

const objet = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

export async function validerLancement(args: {
  idToken: string | null;
  state: string | null;
  stateCookie?: string | null;
  now?: number;
}): Promise<Lancement> {
  const now = args.now ?? Date.now();
  if (!args.idToken) throw new LancementRefuse("id_token absent");
  if (!args.state) throw new LancementRefuse("state absent");

  let decode;
  try {
    decode = decoderJwt(args.idToken);
    exigerRS256(decode.entete);
  } catch (e) {
    throw new LancementRefuse(e instanceof JwtInvalide ? e.motif : "jeton illisible");
  }
  const c = decode.charge;
  const iss = texte(c.iss);
  if (!iss) throw new LancementRefuse("iss absent");

  // 2. La plateforme : émetteur et client_id inscrits, et active.
  const auds = Array.isArray(c.aud) ? c.aud.filter((a): a is string => typeof a === "string") : typeof c.aud === "string" ? [c.aud] : [];
  if (auds.length === 0) throw new LancementRefuse("aud absent", iss);
  const azp = texte(c.azp);
  if (auds.length > 1 && !azp) throw new LancementRefuse("aud multiple sans azp", iss);
  const clientId = auds.length === 1 ? auds[0]! : azp!;
  if (!auds.includes(clientId)) throw new LancementRefuse("azp absent de aud", iss);
  if (azp && azp !== clientId) throw new LancementRefuse("azp différent du client_id", iss);
  const trouvee = await plateformeActive(iss, clientId);
  if (!trouvee || trouvee === "ambigue") throw new LancementRefuse("émetteur ou client_id non inscrit", iss);
  const plateforme = trouvee;
  const refus = (motif: string): never => {
    throw new LancementRefuse(motif, iss, plateforme.id);
  };

  // 3. La signature, avec la clé de CETTE plateforme.
  try {
    const kid = typeof decode.entete.kid === "string" ? decode.entete.kid : undefined;
    const jwk = await cleDeLaPlateforme(plateforme.urlJwks, kid, now);
    verifierSignature(decode, clePubliqueDepuisJwk(jwk));
  } catch (e) {
    refus(e instanceof JwtInvalide ? e.motif : "clés de la plateforme injoignables");
  }

  // 4. Les dates, à la tolérance d'horloge près.
  const secondes = now / 1000;
  if (typeof c.exp !== "number") refus("exp absent");
  if (typeof c.iat !== "number") refus("iat absent");
  if ((c.exp as number) + TOLERANCE_HORLOGE_S < secondes) refus("jeton expiré");
  if ((c.iat as number) - TOLERANCE_HORLOGE_S > secondes) refus("jeton émis dans le futur");

  // 5. Le message.
  if (c[CLAIM.version] !== VERSION_LTI) refus("version LTI autre que 1.3.0");
  const typeDeMessage = c[CLAIM.typeDeMessage];
  if (typeDeMessage !== MESSAGE.lancement && typeDeMessage !== MESSAGE.selection) {
    refus("type de message non pris en charge");
  }
  const deploymentId = texte(c[CLAIM.deployment], 255);
  if (!deploymentId || !plateforme.deploymentIds.includes(deploymentId)) refus("deployment_id non inscrit");
  const sub = texte(c.sub, 255);
  if (!sub) refus("sub absent (lancement anonyme)");
  const nonce = texte(c.nonce, 200);
  if (!nonce) refus("nonce absent");

  const ressourceBrute = objet(c[CLAIM.ressource]);
  const ressourceId = texte(ressourceBrute.id, 255);
  if (typeDeMessage === MESSAGE.lancement && !ressourceId) refus("resource_link absent");
  const reglages = objet(c[CLAIM.reglagesDl]);
  const retour = texte(reglages.deep_link_return_url, 2000);
  if (typeDeMessage === MESSAGE.selection && !retour) refus("deep_link_return_url absent");

  // 6. Le nonce, consommé : un jeton ne sert qu'une fois.
  const [connexion] = await db
    .update(ltiNonces)
    .set({ utiliseLe: new Date(now) })
    .where(
      and(
        eq(ltiNonces.nonce, nonce!),
        eq(ltiNonces.plateformeId, plateforme.id),
        isNull(ltiNonces.utiliseLe),
        gt(ltiNonces.expireLe, new Date(now)),
      ),
    )
    .returning();
  if (!connexion) refus("nonce inconnu, expiré ou déjà utilisé");
  if (connexion!.state !== args.state) refus("state différent de celui de la connexion");
  if (args.stateCookie && args.stateCookie !== args.state) refus("state différent du cookie");

  const role = roleRetenu(c[CLAIM.roles]);
  const contexteBrut = objet(c[CLAIM.contexte]);
  const contexteId = texte(contexteBrut.id, 255);
  const personnalise: Record<string, string> = {};
  for (const [k, v] of Object.entries(objet(c[CLAIM.personnalise]))) {
    if (typeof v === "string" && k.length <= 64) personnalise[k] = v.slice(0, 300);
  }
  const types = Array.isArray(reglages.accept_types)
    ? reglages.accept_types.filter((t): t is string => typeof t === "string")
    : [];

  return {
    plateforme,
    type: typeDeMessage === MESSAGE.selection ? "selection" : "lancement",
    sub: sub!,
    role,
    deploymentId: deploymentId!,
    ressource: ressourceId ? { id: ressourceId, titre: texte(ressourceBrute.title, 200) } : null,
    contexte: contexteId ? { id: contexteId, titre: texte(contexteBrut.title, 200) } : null,
    prenom: texte(c.given_name, 60),
    nomComplet: role === "enseignant" ? texte(c.name, 120) : null,
    courriel: role === "enseignant" ? texte(c.email, 200) : null,
    personnalise,
    selection: retour ? { retour, donnees: texte(reglages.data, 2000), types } : null,
    affichage: texte(objet(c[CLAIM.presentation]).document_target, 20),
    ags: lireLaRevendication(c[CLAIM_AGS]),
  };
}
