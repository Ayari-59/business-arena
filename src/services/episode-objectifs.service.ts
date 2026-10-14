import { eq } from "drizzle-orm";
import { db } from "@/db";
import { episodeObjectifs } from "@/db/schema";
import type { CodeCompetence } from "@/config/episodes/competences";
import { estUnObjectif } from "@/pedagogy/profil/profil";

/**
 * LA COMPÉTENCE QU'UNE PERSONNE CHOISIT DE TRAVAILLER.
 *
 * Le profil propose une compétence ; la personne peut en choisir une autre,
 * et la recommandation du prochain épisode la suit. Seules les compétences qui
 * ont un score se choisissent. Choisir « aucune » rend la main au profil.
 */

export async function objectifDe(userId: string): Promise<CodeCompetence | null> {
  const [o] = await db.select().from(episodeObjectifs).where(eq(episodeObjectifs.userId, userId));
  return o && estUnObjectif(o.competence) ? o.competence : null;
}

/** Garder le choix ; `null` ou une valeur inconnue l'efface. Renvoie ce qui est gardé. */
export async function choisirObjectif(
  userId: string,
  competence: string | null,
): Promise<CodeCompetence | null> {
  if (!estUnObjectif(competence)) {
    await db.delete(episodeObjectifs).where(eq(episodeObjectifs.userId, userId));
    return null;
  }
  await db
    .insert(episodeObjectifs)
    .values({ userId, competence })
    .onConflictDoUpdate({
      target: episodeObjectifs.userId,
      set: { competence, updatedAt: new Date() },
    });
  return competence;
}
