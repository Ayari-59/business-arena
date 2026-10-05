import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { episodeParties } from "@/db/schema";
import { versionDuModele } from "@/config/episodes/versions";
import { episodeParCode } from "@/pedagogy/episodes/registre";
import type { PartieEnregistree } from "@/pedagogy/profil/types";

/**
 * GARDER LES PARTIES D'ÉPISODES MANAGER.
 *
 * Le navigateur envoie la partie à l'ouverture du bilan. On n'en croit rien :
 * chaque champ est borné, puis confronté à l'épisode lui-même — un choix qui
 * n'existe pas, une source d'une autre étape, un diagnostic inconnu, et la
 * partie est refusée. On garde les faits bruts, jamais un score.
 *
 * La clé, tirée au début de la partie, rend l'écriture idempotente : recharger
 * le bilan renvoie la partie déjà gardée au lieu d'en créer une seconde.
 */

const texte = z.string().min(1).max(60);

export const entreeDePartie = z.object({
  cle: z.uuid(),
  code: z.string().min(1).max(80),
  niveau: z.enum(["decouverte", "standard", "expert"]),
  graine: z.number().int().min(1).max(1_000_000),
  chemin: z.array(z.number().int().min(0).max(20)).max(12),
  consultes: z.array(z.array(texte).max(20)).max(12),
  jours: z.number().min(0).max(30),
  diagnostic: texte,
  reevaluation: z.object({ choix: z.enum(["maintient", "corrige"]), principal: texte.nullable() }),
  prevision: z.number().min(-1e9).max(1e9),
  confiance: z.number().int().min(0).max(100),
});

export type EntreeDePartie = z.infer<typeof entreeDePartie>;

export type ResultatDEnregistrement =
  | { ok: true; id: string; premiere: boolean; dejaGardee: boolean }
  | { ok: false; erreur: string };

/** Ce qui rend une partie impossible pour cet épisode ; `null` si elle est cohérente. */
function incoherence(e: EntreeDePartie): string | null {
  const ep = episodeParCode(e.code);
  if (!ep) return "Épisode inconnu.";
  if (e.chemin.length !== ep.etapes.length) return "La partie n'a pas toutes ses décisions.";
  if (e.chemin.some((o, d) => o >= ep.etapes[d]!.options.length)) return "Un choix n'existe pas.";
  if (e.consultes.length > ep.etapes.length) return "Des vérifications en trop.";
  const sourceInconnue = e.consultes.some((ids, d) =>
    ids.some((id) => !ep.etapes[d]!.sources.some((s) => s.id === id)),
  );
  if (sourceInconnue) return "Une vérification n'existe pas.";
  const diagnostics = ep.diagnostics.map((d) => d.id);
  if (!diagnostics.includes(e.diagnostic)) return "Diagnostic inconnu.";
  const r = e.reevaluation;
  if (r.principal != null && !diagnostics.includes(r.principal)) return "Réévaluation inconnue.";
  if (e.prevision < ep.prevision.min || e.prevision > ep.prevision.max) {
    return "Prévision hors des bornes de l'épisode.";
  }
  return null;
}

export async function enregistrerPartie(
  userId: string,
  brut: unknown,
): Promise<ResultatDEnregistrement> {
  const lu = entreeDePartie.safeParse(brut);
  if (!lu.success) return { ok: false, erreur: "Partie illisible." };
  const e = lu.data;
  const erreur = incoherence(e);
  if (erreur) return { ok: false, erreur };

  const dejaLa = await db
    .select({ id: episodeParties.id, premiere: episodeParties.premiere })
    .from(episodeParties)
    .where(and(eq(episodeParties.userId, userId), eq(episodeParties.cle, e.cle)));
  if (dejaLa[0]) return { ok: true, ...dejaLa[0], dejaGardee: true };

  const avant = await db
    .select({ id: episodeParties.id })
    .from(episodeParties)
    .where(and(eq(episodeParties.userId, userId), eq(episodeParties.episodeCode, e.code)))
    .limit(1);
  const premiere = avant.length === 0;
  const inseree = await db
    .insert(episodeParties)
    .values({
      userId,
      cle: e.cle,
      episodeCode: e.code,
      versionModele: versionDuModele(e.code),
      niveau: e.niveau,
      graine: e.graine,
      chemin: e.chemin,
      consultes: e.consultes,
      jours: e.jours,
      diagnostic: e.diagnostic,
      reevaluation: e.reevaluation,
      prevision: e.prevision,
      confiance: e.confiance,
      premiere,
    })
    .onConflictDoNothing({ target: [episodeParties.userId, episodeParties.cle] })
    .returning({ id: episodeParties.id });
  if (inseree[0]) return { ok: true, id: inseree[0].id, premiere, dejaGardee: false };
  // Deux envois simultanés de la même partie : l'autre l'a gardée.
  const gagnante = await db
    .select({ id: episodeParties.id, premiere: episodeParties.premiere })
    .from(episodeParties)
    .where(and(eq(episodeParties.userId, userId), eq(episodeParties.cle, e.cle)));
  return { ok: true, ...gagnante[0]!, dejaGardee: true };
}

/** Les parties d'une personne, de la plus ancienne à la plus récente. */
export async function partiesDe(userId: string): Promise<PartieEnregistree[]> {
  const lignes = await db
    .select()
    .from(episodeParties)
    .where(eq(episodeParties.userId, userId))
    .orderBy(asc(episodeParties.createdAt), asc(episodeParties.id));
  return lignes.map((l) => ({
    id: l.id,
    code: l.episodeCode,
    versionModele: l.versionModele,
    date: l.createdAt.toISOString(),
    premiere: l.premiere,
    partie: {
      graine: l.graine,
      chemin: l.chemin,
      consultes: l.consultes,
      jours: l.jours,
      diagnostic: l.diagnostic,
      reevaluation: l.reevaluation,
      prevision: l.prevision,
      confiance: l.confiance,
      niveau: l.niveau as "decouverte" | "standard" | "expert",
    },
  }));
}

/** Effacer toutes les parties d'une personne, à sa demande. Renvoie le nombre effacé. */
export async function effacerParties(userId: string): Promise<number> {
  const effacees = await db
    .delete(episodeParties)
    .where(eq(episodeParties.userId, userId))
    .returning({ id: episodeParties.id });
  return effacees.length;
}
