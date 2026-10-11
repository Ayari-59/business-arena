import { randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  ltiJetonsInscription,
  ltiNonces,
  ltiPlateformes,
  ltiRefus,
  ltiTickets,
  organizations,
} from "@/db/schema";
import { urlDePlateformeAdmise } from "./reseau";
import { DUREE_JETON_INSCRIPTION_JOURS } from "./constantes";

/**
 * LES PLATEFORMES INSCRITES ET LES JETONS D'INSCRIPTION.
 *
 * Une plateforme se reconnaît à son couple (émetteur, client_id) ; elle n'est écoutée
 * que tant qu'elle est ACTIVE. La désactiver depuis /admin/lti coupe tous ses
 * lancements à l'instant, sans rien effacer : les parties et les comptes restent.
 */

export type Plateforme = typeof ltiPlateformes.$inferSelect;

export { DUREE_JETON_INSCRIPTION_JOURS };

/** Les identifiants de déploiement saisis à la main : séparés par des virgules ou des espaces. */
export function lireDeploiements(saisie: string): string[] {
  return [
    ...new Set(
      saisie
        .split(/[\s,;]+/)
        .map((d) => d.trim())
        .filter((d) => d.length > 0 && d.length <= 255),
    ),
  ];
}

/**
 * La plateforme ACTIVE qui porte cet émetteur et ce client_id. Sans client_id (la
 * connexion OIDC ne l'envoie pas toujours), l'émetteur seul doit désigner une seule
 * plateforme active : sinon la demande est ambiguë et refusée.
 */
export async function plateformeActive(
  issuer: string,
  clientId?: string | null,
): Promise<Plateforme | "ambigue" | null> {
  const lignes = await db
    .select()
    .from(ltiPlateformes)
    .where(
      clientId
        ? and(eq(ltiPlateformes.issuer, issuer), eq(ltiPlateformes.clientId, clientId), eq(ltiPlateformes.actif, true))
        : and(eq(ltiPlateformes.issuer, issuer), eq(ltiPlateformes.actif, true)),
    );
  if (lignes.length === 0) return null;
  if (lignes.length > 1) return "ambigue";
  return lignes[0]!;
}

export async function plateformeParId(id: string): Promise<Plateforme | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return (await db.select().from(ltiPlateformes).where(eq(ltiPlateformes.id, id)))[0] ?? null;
}

/** Les refus d'une inscription, par code : l'écran d'administration dit la phrase. */
export const REFUS_D_INSCRIPTION = {
  issuer: "L'émetteur (issuer) doit être une adresse en https.",
  client: "Le client_id est requis.",
  urlAuthentification: "L'adresse d'authentification doit être en https.",
  urlJeton: "L'adresse de jeton doit être en https.",
  urlJwks: "L'adresse des clés (JWKS) doit être en https.",
  organisation: "Choisissez l'organisation de la plateforme.",
  autreOrganisation: "Cette plateforme est déjà inscrite pour une autre organisation.",
} as const;
export type RefusDInscription = keyof typeof REFUS_D_INSCRIPTION;

export class InscriptionRefusee extends Error {
  constructor(readonly code: RefusDInscription) {
    super(REFUS_D_INSCRIPTION[code]);
    this.name = "InscriptionRefusee";
  }
}

/** Vérifie et normalise ce qui décrit une plateforme ; lève `InscriptionRefusee`. */
function verifierDescription(args: {
  issuer: string;
  clientId: string;
  urlAuthentification: string;
  urlJeton: string;
  urlJwks: string;
}) {
  const issuer = args.issuer.trim();
  const clientId = args.clientId.trim();
  if (!urlDePlateformeAdmise(issuer)) throw new InscriptionRefusee("issuer");
  if (!clientId || clientId.length > 255) throw new InscriptionRefusee("client");
  const urls = {
    urlAuthentification: args.urlAuthentification.trim(),
    urlJeton: args.urlJeton.trim(),
    urlJwks: args.urlJwks.trim(),
  };
  for (const [nom, valeur] of Object.entries(urls)) {
    if (!urlDePlateformeAdmise(valeur)) throw new InscriptionRefusee(nom as RefusDInscription);
  }
  return { issuer, clientId, ...urls };
}

/**
 * Inscrire une plateforme, ou mettre à jour celle qui porte déjà ce couple (émetteur,
 * client_id) : ses adresses sont remplacées, ses déploiements s'ajoutent, elle
 * redevient active. Le sel n'est tiré qu'une fois : les `sub` déjà hachés restent
 * reconnus.
 */
export async function inscrirePlateforme(args: {
  nom: string;
  issuer: string;
  clientId: string;
  deploymentIds: string[];
  urlAuthentification: string;
  urlJeton: string;
  urlJwks: string;
  organizationId: string;
  inscription: "manuelle" | "dynamique";
}): Promise<Plateforme> {
  const d = verifierDescription(args);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(args.organizationId)) {
    throw new InscriptionRefusee("organisation");
  }
  const [org] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.id, args.organizationId));
  if (!org) throw new InscriptionRefusee("organisation");
  const nom = args.nom.trim().slice(0, 120) || new URL(d.issuer).host;
  const existante = (
    await db
      .select()
      .from(ltiPlateformes)
      .where(and(eq(ltiPlateformes.issuer, d.issuer), eq(ltiPlateformes.clientId, d.clientId)))
  )[0];
  if (existante) {
    if (existante.organizationId !== args.organizationId) {
      throw new InscriptionRefusee("autreOrganisation");
    }
    const [maj] = await db
      .update(ltiPlateformes)
      .set({
        nom,
        deploymentIds: [...new Set([...existante.deploymentIds, ...args.deploymentIds])],
        urlAuthentification: d.urlAuthentification,
        urlJeton: d.urlJeton,
        urlJwks: d.urlJwks,
        actif: true,
        updatedAt: new Date(),
      })
      .where(eq(ltiPlateformes.id, existante.id))
      .returning();
    return maj!;
  }
  const [cree] = await db
    .insert(ltiPlateformes)
    .values({
      nom,
      issuer: d.issuer,
      clientId: d.clientId,
      deploymentIds: [...new Set(args.deploymentIds)],
      urlAuthentification: d.urlAuthentification,
      urlJeton: d.urlJeton,
      urlJwks: d.urlJwks,
      organizationId: args.organizationId,
      sel: randomBytes(32).toString("base64url"),
      inscription: args.inscription,
    })
    .returning();
  return cree!;
}

export async function activerPlateforme(id: string, actif: boolean): Promise<void> {
  await db
    .update(ltiPlateformes)
    .set({ actif, updatedAt: new Date() })
    .where(eq(ltiPlateformes.id, id));
}

export async function ajouterDeploiements(id: string, deploiements: string[]): Promise<void> {
  const p = await plateformeParId(id);
  if (!p) return;
  await db
    .update(ltiPlateformes)
    .set({ deploymentIds: [...new Set([...p.deploymentIds, ...deploiements])], updatedAt: new Date() })
    .where(eq(ltiPlateformes.id, id));
}

export interface PlateformeListee extends Plateforme {
  organisation: string;
}

export async function listerPlateformes(): Promise<PlateformeListee[]> {
  const lignes = await db
    .select({ p: ltiPlateformes, organisation: organizations.name })
    .from(ltiPlateformes)
    .innerJoin(organizations, eq(organizations.id, ltiPlateformes.organizationId))
    .orderBy(desc(ltiPlateformes.createdAt));
  return lignes.map((l) => ({ ...l.p, organisation: l.organisation }));
}

/* ---------------------------------------------------------------------------
 * LES JETONS D'INSCRIPTION DYNAMIQUE.
 *
 * Le jeton se garde en clair : l'administrateur doit pouvoir réafficher l'adresse à
 * coller tant qu'elle n'a pas servi. Son pouvoir est borné : il n'inscrit qu'UNE
 * plateforme, pour l'organisation choisie à sa création, une seule fois, pendant
 * quelques jours ; la plateforme inscrite apparaît aussitôt dans /admin/lti, où elle
 * se désactive d'un clic.
 * ------------------------------------------------------------------------- */

export type JetonInscription = typeof ltiJetonsInscription.$inferSelect;

export async function creerJetonInscription(args: {
  organizationId: string;
  adminId: string;
  now?: Date;
}): Promise<string> {
  const now = args.now ?? new Date();
  const jeton = randomBytes(24).toString("base64url");
  await db.insert(ltiJetonsInscription).values({
    jeton,
    organizationId: args.organizationId,
    creePar: args.adminId,
    expireLe: new Date(now.getTime() + DUREE_JETON_INSCRIPTION_JOURS * 24 * 3600 * 1000),
  });
  return jeton;
}

const FORME_DU_JETON = /^[A-Za-z0-9_-]{16,64}$/;

/** Le jeton s'il est encore utilisable (sans le consommer). */
export async function jetonUtilisable(jeton: string, now: Date = new Date()): Promise<JetonInscription | null> {
  if (!FORME_DU_JETON.test(jeton)) return null;
  return (
    (
      await db
        .select()
        .from(ltiJetonsInscription)
        .where(
          and(
            eq(ltiJetonsInscription.jeton, jeton),
            isNull(ltiJetonsInscription.utiliseLe),
            gt(ltiJetonsInscription.expireLe, now),
          ),
        )
    )[0] ?? null
  );
}

/** Consomme le jeton en une seule écriture : deux inscriptions simultanées n'en font qu'une. */
export async function consommerJeton(jeton: string, now: Date = new Date()): Promise<JetonInscription | null> {
  if (!FORME_DU_JETON.test(jeton)) return null;
  const [pris] = await db
    .update(ltiJetonsInscription)
    .set({ utiliseLe: now })
    .where(
      and(
        eq(ltiJetonsInscription.jeton, jeton),
        isNull(ltiJetonsInscription.utiliseLe),
        gt(ltiJetonsInscription.expireLe, now),
      ),
    )
    .returning();
  return pris ?? null;
}

/** L'inscription a échoué chez la plateforme : le jeton redevient utilisable. */
export async function rendreJeton(id: string): Promise<void> {
  await db
    .update(ltiJetonsInscription)
    .set({ utiliseLe: null })
    .where(and(eq(ltiJetonsInscription.id, id), isNull(ltiJetonsInscription.plateformeId)));
}

export async function noterPlateformeDuJeton(id: string, plateformeId: string): Promise<void> {
  await db.update(ltiJetonsInscription).set({ plateformeId }).where(eq(ltiJetonsInscription.id, id));
}

export async function revoquerJeton(id: string, now: Date = new Date()): Promise<void> {
  await db
    .update(ltiJetonsInscription)
    .set({ expireLe: now })
    .where(and(eq(ltiJetonsInscription.id, id), isNull(ltiJetonsInscription.utiliseLe)));
}

export async function listerJetons(): Promise<(JetonInscription & { organisation: string })[]> {
  const lignes = await db
    .select({ j: ltiJetonsInscription, organisation: organizations.name })
    .from(ltiJetonsInscription)
    .innerJoin(organizations, eq(organizations.id, ltiJetonsInscription.organizationId))
    .orderBy(desc(ltiJetonsInscription.createdAt))
    .limit(30);
  return lignes.map((l) => ({ ...l.j, organisation: l.organisation }));
}

export async function derniersRefus(n = 20) {
  return db.select().from(ltiRefus).orderBy(desc(ltiRefus.createdAt)).limit(n);
}

/** Le ménage des lignes expirées depuis plus d'un jour (nonces, tickets). */
export async function purgerExpires(now: Date = new Date()): Promise<void> {
  const avant = new Date(now.getTime() - 24 * 3600 * 1000);
  try {
    await db.delete(ltiNonces).where(lt(ltiNonces.expireLe, avant));
    await db.delete(ltiTickets).where(lt(ltiTickets.expireLe, avant));
  } catch (e) {
    console.error("[lti] ménage des nonces expirés impossible :", e);
  }
}
