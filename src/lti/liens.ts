import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { episodeCohortes, games, ltiLiens, ltiPlateformes } from "@/db/schema";
import { PARAMETRE_CIBLE } from "./constantes";
import type { Lancement } from "./lancement";

/**
 * L'ACTIVITÉ DU COURS ET CE QU'ELLE OUVRE.
 *
 * Une activité (le « resource link » de la plateforme) se reconnaît à sa plateforme, son
 * déploiement et son identifiant. Elle naît au premier lancement, vide ; l'enseignant
 * choisit ensuite ce qu'elle ouvre : une partie de classe ou une cohorte d'épisodes, qui
 * doivent être À LUI et appartenir à l'organisation de la plateforme. Une fois reliée,
 * elle le reste : ses lancements mènent l'enseignant au pilotage, l'élève à sa partie.
 */

export type Lien = typeof ltiLiens.$inferSelect;
export type Cible = { type: "partie"; id: string } | { type: "cohorte"; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** « partie:<uuid> » ou « cohorte:<uuid> », tel que la sélection de contenu le pose. */
export function lireCible(valeur: string | null | undefined): Cible | null {
  const m = /^(partie|cohorte):(.+)$/.exec(valeur?.trim() ?? "");
  if (!m || !UUID.test(m[2]!)) return null;
  return { type: m[1] as "partie" | "cohorte", id: m[2]!.toLowerCase() };
}

export const ecrireCible = (c: Cible): string => `${c.type}:${c.id}`;

/** L'activité de ce lancement, créée au premier passage ; ses titres suivent la plateforme. */
export async function lienDuLancement(l: Lancement): Promise<Lien> {
  const r = l.ressource!;
  const valeurs = {
    contexteId: l.contexte?.id ?? null,
    contexteTitre: l.contexte?.titre ?? null,
    titre: r.titre,
  };
  const [lien] = await db
    .insert(ltiLiens)
    .values({ plateformeId: l.plateforme.id, deploymentId: l.deploymentId, resourceLinkId: r.id, ...valeurs })
    .onConflictDoUpdate({
      target: [ltiLiens.plateformeId, ltiLiens.deploymentId, ltiLiens.resourceLinkId],
      set: { ...valeurs, updatedAt: new Date() },
    })
    .returning();
  return lien!;
}

export async function lienParId(id: string | null | undefined): Promise<Lien | null> {
  if (!id || !UUID.test(id)) return null;
  return (await db.select().from(ltiLiens).where(eq(ltiLiens.id, id)))[0] ?? null;
}

/**
 * La cible est-elle à cet enseignant, et à l'organisation de la plateforme ? Une partie :
 * une partie DE CLASSE qu'il a créée. Une cohorte : une cohorte qu'il a créée.
 */
export async function cibleDeLEnseignant(args: {
  cible: Cible;
  enseignantId: string;
  organizationId: string;
}): Promise<boolean> {
  if (args.cible.type === "partie") {
    const [g] = await db.select().from(games).where(eq(games.id, args.cible.id));
    return (
      !!g &&
      g.createdBy === args.enseignantId &&
      g.organizationId === args.organizationId &&
      (g.difficultyProfile as { kind?: string } | null)?.kind === "class"
    );
  }
  const [c] = await db.select().from(episodeCohortes).where(eq(episodeCohortes.id, args.cible.id));
  return !!c && c.creePar === args.enseignantId && c.organizationId === args.organizationId;
}

/**
 * Relier l'activité à sa cible. Seulement si elle n'est pas encore reliée : une activité
 * déjà configurée ne change pas de cible par ce chemin (ses élèves y ont leur place).
 */
export async function relierLien(args: {
  lienId: string;
  enseignantId: string;
  cible: Cible;
}): Promise<boolean> {
  const lien = await lienParId(args.lienId);
  if (!lien || lien.cibleType) return false;
  const [p] = await db.select().from(ltiPlateformes).where(eq(ltiPlateformes.id, lien.plateformeId));
  if (!p) return false;
  if (!(await cibleDeLEnseignant({ cible: args.cible, enseignantId: args.enseignantId, organizationId: p.organizationId }))) {
    return false;
  }
  const maj = await db
    .update(ltiLiens)
    .set({
      cibleType: args.cible.type,
      gameId: args.cible.type === "partie" ? args.cible.id : null,
      cohorteId: args.cible.type === "cohorte" ? args.cible.id : null,
      configurePar: args.enseignantId,
      configureLe: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(ltiLiens.id, args.lienId), isNull(ltiLiens.cibleType)))
    .returning({ id: ltiLiens.id });
  return maj.length === 1;
}

/**
 * Une activité posée par sélection de contenu porte sa cible dans ses paramètres
 * personnalisés. Signés par la plateforme, ils restent vérifiés ici : la cible doit
 * appartenir à l'organisation de la plateforme, et à l'enseignant qui l'avait choisie
 * (son créateur), faute de quoi l'activité reste à configurer.
 */
export async function relierDepuisLaSelection(lien: Lien, l: Lancement): Promise<Lien> {
  if (lien.cibleType) return lien;
  const cible = lireCible(l.personnalise[PARAMETRE_CIBLE]);
  if (!cible) return lien;
  const proprietaire =
    cible.type === "partie"
      ? (await db.select({ u: games.createdBy }).from(games).where(eq(games.id, cible.id)))[0]?.u
      : (await db.select({ u: episodeCohortes.creePar }).from(episodeCohortes).where(eq(episodeCohortes.id, cible.id)))[0]?.u;
  if (!proprietaire) return lien;
  if (await relierLien({ lienId: lien.id, enseignantId: proprietaire, cible })) {
    return (await lienParId(lien.id)) ?? lien;
  }
  return lien;
}

/**
 * Une cible effacée depuis (partie supprimée, cohorte supprimée) laisse l'activité
 * orpheline : elle redevient à configurer plutôt que de mener nulle part.
 */
export async function lienSansCibleOrpheline(lien: Lien): Promise<Lien> {
  const orphelin =
    (lien.cibleType === "partie" && !lien.gameId) || (lien.cibleType === "cohorte" && !lien.cohorteId);
  if (!orphelin) return lien;
  const [maj] = await db
    .update(ltiLiens)
    .set({ cibleType: null, configurePar: null, configureLe: null, updatedAt: new Date() })
    .where(eq(ltiLiens.id, lien.id))
    .returning();
  return maj ?? lien;
}
