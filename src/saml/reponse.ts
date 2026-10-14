import { and, eq, gt, isNull } from "drizzle-orm";
import { SAML } from "@node-saml/node-saml";
import { db } from "@/db";
import { samlAssertions, samlRequetes } from "@/db/schema";
import { attributsRetenus, type AttributsRetenus, type ProfilRecu } from "./attributs";
import type { ConfigurationSaml } from "./configuration";
import { NS, TOLERANCE_HORLOGE_MS } from "./constantes";
import { idpDeLaFederation, type IdpDeLaFederation } from "./federation";
import { cacheDUneRequete, reglagesSaml } from "./requete";
import { analyser, elements, premier, racine, texte, XmlRefuse } from "./xml";

/**
 * LA RÉPONSE DE L'IdP, POSTÉE À L'ACS : TOUT EST VÉRIFIÉ AVANT DE CROIRE QUOI QUE CE SOIT.
 *
 * Dans l'ordre :
 *   1. le XML : taille bornée, aucune DTD (XXE), syntaxe ; une `samlp:Response` ;
 *   2. `InResponseTo` : présent, égal au cookie de ce navigateur, et une demande connue,
 *      non expirée, CONSOMMÉE ici (usage unique, atomique : deux envois simultanés de
 *      la même réponse n'en font passer qu'un) ;
 *   3. l'IdP : celui à qui la demande a été envoyée, toujours dans l'agrégat signé ;
 *      l'émetteur de la réponse, s'il est indiqué, est le sien ;
 *   4. @node-saml/node-saml, avec les SEULS certificats de cet IdP pris dans l'agrégat :
 *      signature de la réponse OU de l'assertion (l'une des deux exigée), déchiffrement,
 *      `Audience` = notre entityID, `NotBefore`/`NotOnOrAfter` à ±60 s, `InResponseTo`
 *      de la confirmation du sujet ;
 *   5. ce que la bibliothèque ne vérifie pas : `Destination` de la réponse et `Recipient`
 *      de la confirmation = notre ACS, émetteur de l'assertion (signée) = l'IdP attendu ;
 *   6. le rejeu : l'ID de l'assertion est gardé ; une assertion déjà vue est refusée ;
 *   7. les attributs (attributs.ts), et l'identifiant pseudonyme exigé.
 *
 * Toute anomalie lève `ReponseRefusee` ; la route journalise le motif, jamais la réponse.
 */

export class ReponseRefusee extends Error {
  constructor(
    readonly motif: string,
    readonly idp: string | null = null,
  ) {
    super(motif);
    this.name = "ReponseRefusee";
  }
}

export interface IdentiteFederee extends AttributsRetenus {
  identifiant: string;
  idp: IdpDeLaFederation;
  retour: string | null;
}

const TAILLE_MAX_REPONSE = 512 * 1024;

/** Consomme la demande : une seule réponse par demande, avant expiration. */
async function consommerLaDemande(id: string, now: Date) {
  const [ligne] = await db
    .update(samlRequetes)
    .set({ utiliseLe: now })
    .where(and(eq(samlRequetes.id, id), isNull(samlRequetes.utiliseLe), gt(samlRequetes.expireLe, now)))
    .returning();
  return ligne ?? null;
}

/** L'assertion n'a encore jamais été acceptée ; la noter (jusqu'à son expiration, au moins un jour). */
async function noterLAssertion(idp: string, assertionId: string, expire: Date, now: Date): Promise<boolean> {
  const jour = new Date(now.getTime() + 24 * 3600 * 1000);
  const [neuve] = await db
    .insert(samlAssertions)
    .values({ idpEntityId: idp, assertionId, expireLe: expire > jour ? expire : jour })
    .onConflictDoNothing()
    .returning();
  return !!neuve;
}

export async function validerReponse(args: {
  configuration: ConfigurationSaml;
  samlResponse: string | null;
  cookieRequete: string | null;
  now?: Date;
}): Promise<IdentiteFederee> {
  const c = args.configuration;
  const now = args.now ?? new Date();
  if (!args.samlResponse) throw new ReponseRefusee("SAMLResponse absente");
  if (args.samlResponse.length > (TAILLE_MAX_REPONSE * 4) / 3 + 4) throw new ReponseRefusee("réponse trop longue");

  // 1. Le XML.
  const xml = Buffer.from(args.samlResponse, "base64").toString("utf8");
  let reponse: Element;
  try {
    reponse = racine(analyser(xml, TAILLE_MAX_REPONSE), NS.samlp, "Response");
  } catch (e) {
    throw new ReponseRefusee(e instanceof XmlRefuse ? e.message : "XML illisible");
  }
  const enReponseA = reponse.getAttribute("InResponseTo") ?? "";
  const emetteurAnnonce = texte(premier(reponse, "./saml:Issuer")) || null;

  // 2. La demande : ce navigateur, connue, non expirée, consommée.
  if (!enReponseA) throw new ReponseRefusee("réponse non sollicitée (sans InResponseTo)", emetteurAnnonce);
  if (!args.cookieRequete || args.cookieRequete !== enReponseA) {
    throw new ReponseRefusee("la réponse n'arrive pas dans le navigateur qui a fait la demande", emetteurAnnonce);
  }
  const demande = await consommerLaDemande(enReponseA, now);
  if (!demande) throw new ReponseRefusee("InResponseTo inconnu, expiré ou déjà utilisé", emetteurAnnonce);

  // 3. L'IdP : celui de la demande, toujours dans l'agrégat signé.
  const attendu = demande.idpEntityId;
  if (emetteurAnnonce && emetteurAnnonce !== attendu) {
    throw new ReponseRefusee("émetteur de la réponse différent de l'IdP sollicité", emetteurAnnonce);
  }
  const idp = await idpDeLaFederation(c, attendu, now);
  if (!idp) throw new ReponseRefusee("IdP absent de l'agrégat de la fédération", attendu);

  // 4. La bibliothèque : signature, déchiffrement, audience, dates, InResponseTo.
  const saml = new SAML(
    reglagesSaml(c, idp, { cacheProvider: cacheDUneRequete(demande.id, demande.createdAt) }),
  );
  let profil: (ProfilRecu & { issuer?: string; getAssertionXml?: () => string }) | null;
  try {
    ({ profile: profil } = await saml.validatePostResponseAsync({ SAMLResponse: args.samlResponse }));
  } catch (e) {
    throw new ReponseRefusee(`refusée par la vérification SAML : ${e instanceof Error ? e.message.slice(0, 160) : "?"}`, attendu);
  }
  if (!profil || typeof profil.getAssertionXml !== "function") throw new ReponseRefusee("réponse sans assertion", attendu);

  // 5. Destination, Recipient, émetteur de l'assertion.
  if (reponse.getAttribute("Destination") !== c.acs) throw new ReponseRefusee("Destination différente de l'ACS", attendu);
  if (profil.issuer !== attendu) throw new ReponseRefusee("émetteur de l'assertion différent de l'IdP sollicité", attendu);
  let assertion: Element;
  try {
    assertion = racine(analyser(profil.getAssertionXml(), TAILLE_MAX_REPONSE), NS.saml, "Assertion");
  } catch {
    throw new ReponseRefusee("assertion vérifiée illisible", attendu);
  }
  const confirmations = elements(assertion, "./saml:Subject/saml:SubjectConfirmation[@Method='urn:oasis:names:tc:SAML:2.0:cm:bearer']/saml:SubjectConfirmationData");
  const pourNous = confirmations.find((d) => d.getAttribute("Recipient") === c.acs);
  if (!pourNous) throw new ReponseRefusee("Recipient différent de l'ACS", attendu);
  const limite = new Date(pourNous.getAttribute("NotOnOrAfter") ?? "");
  if (Number.isNaN(limite.getTime())) throw new ReponseRefusee("confirmation sans NotOnOrAfter", attendu);
  if (now.getTime() - TOLERANCE_HORLOGE_MS >= limite.getTime()) throw new ReponseRefusee("confirmation expirée", attendu);

  // 6. Le rejeu.
  const assertionId = assertion.getAttribute("ID") ?? "";
  if (!assertionId) throw new ReponseRefusee("assertion sans ID", attendu);
  if (!(await noterLAssertion(attendu, assertionId, limite, now))) throw new ReponseRefusee("assertion rejouée", attendu);

  // 7. Les attributs.
  const retenus = attributsRetenus(profil, idp.portees);
  if (!retenus.identifiant) {
    throw new ReponseRefusee("aucun identifiant pseudonyme transmis (pairwise-id, eduPersonTargetedID ou NameID persistant)", attendu);
  }
  return { ...retenus, identifiant: retenus.identifiant, idp, retour: demande.retour };
}
