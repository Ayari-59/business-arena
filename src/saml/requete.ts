import { randomBytes } from "node:crypto";
import { lt } from "drizzle-orm";
import { SAML, ValidateInResponseTo, type CacheProvider, type SamlConfig } from "@node-saml/node-saml";
import { db } from "@/db";
import { samlAssertions, samlRequetes } from "@/db/schema";
import type { ConfigurationSaml } from "./configuration";
import { DUREE_REQUETE_S, TOLERANCE_HORLOGE_MS } from "./constantes";
import type { IdpDeLaFederation } from "./federation";

/**
 * LA DEMANDE D'AUTHENTIFICATION (AuthnRequest), PREMIER TEMPS DE LA CONNEXION.
 *
 * Le navigateur part vers l'IdP de l'établissement avec une demande SIGNÉE par la clé du
 * SP (liaison HTTP-Redirect). Son ID est gardé en base dix minutes, avec l'IdP visé et
 * la page où revenir : la réponse devra porter cet ID (`InResponseTo`), et elle le
 * consommera. Le même ID part en cookie (SameSite=None ; Secure ; HttpOnly) : la réponse
 * doit arriver dans le navigateur qui a demandé.
 *
 * La bibliothèque @node-saml/node-saml fabrique et signe la demande ; elle vérifiera la
 * réponse (reponse.ts) avec les mêmes réglages, écrits une fois ici.
 */

/** Les réglages de @node-saml/node-saml pour un IdP de la fédération. */
export function reglagesSaml(
  c: ConfigurationSaml,
  idp: Pick<IdpDeLaFederation, "ssoRedirect" | "certificats">,
  extra: Partial<SamlConfig> = {},
): SamlConfig {
  return {
    issuer: c.entityId,
    audience: c.entityId,
    callbackUrl: c.acs,
    entryPoint: idp.ssoRedirect,
    // Les seuls certificats de CET IdP, tels que l'agrégat signé les publie.
    idpCert: idp.certificats,
    privateKey: c.clePrivee,
    publicCert: c.certificat,
    decryptionPvk: c.clePrivee,
    signatureAlgorithm: "sha256",
    digestAlgorithm: "sha256",
    // La signature de la RÉPONSE ou celle de l'ASSERTION : l'une des deux est exigée
    // (une réponse non signée exige une assertion signée).
    wantAuthnResponseSigned: false,
    wantAssertionsSigned: false,
    acceptedClockSkewMs: TOLERANCE_HORLOGE_MS,
    // Pas de format de NameID imposé : l'identifiant vient des attributs (pairwise-id).
    identifierFormat: null,
    disableRequestedAuthnContext: true,
    validateInResponseTo: ValidateInResponseTo.always,
    requestIdExpirationPeriodMs: DUREE_REQUETE_S * 1000,
    ...extra,
  };
}

/** Un « cache » qui ne connaît qu'un ID : celui que la base vient de consommer. */
export function cacheDUneRequete(id: string | null, emiseLe: Date | null): CacheProvider {
  return {
    saveAsync: async () => null,
    getAsync: async (cle: string) => (id !== null && cle === id && emiseLe ? emiseLe.toISOString() : null),
    removeAsync: async (cle: string | null) => cle,
  };
}

/** Purge des demandes et des assertions expirées (à chaque nouvelle demande, c'est bon marché). */
async function purger(now: Date): Promise<void> {
  await db.delete(samlRequetes).where(lt(samlRequetes.expireLe, new Date(now.getTime() - 24 * 3600 * 1000)));
  await db.delete(samlAssertions).where(lt(samlAssertions.expireLe, now));
}

/** L'adresse de l'IdP qui porte la demande signée, et l'ID de la demande. */
export async function preparerDemande(args: {
  configuration: ConfigurationSaml;
  idp: IdpDeLaFederation;
  retour: string | null;
  now?: Date;
}): Promise<{ redirection: string; id: string }> {
  const now = args.now ?? new Date();
  await purger(now);
  // Un ID SAML commence par une lettre ou « _ » (xs:ID).
  const id = `_${randomBytes(20).toString("hex")}`;
  const saml = new SAML(
    reglagesSaml(args.configuration, args.idp, {
      generateUniqueId: () => id,
      cacheProvider: cacheDUneRequete(null, null),
    }),
  );
  const redirection = await saml.getAuthorizeUrlAsync("", undefined, {});
  await db.insert(samlRequetes).values({
    id,
    idpEntityId: args.idp.entityId,
    retour: args.retour,
    expireLe: new Date(now.getTime() + DUREE_REQUETE_S * 1000),
  });
  return { redirection, id };
}
