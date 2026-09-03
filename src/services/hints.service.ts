import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { games, hintUsages, hints } from "@/db/schema";
import { presetFromProfile } from "@/config/difficulty";
import { nextUnlockableLevel } from "@/pedagogy/hints";
import { loadInstanceForUser, unlockedLevels } from "./situation-instance.service";

/**
 * Déblocage et plafond des indices (doc 03 §4).
 *
 * Extrait de pedagogy.service.ts (refactoring V2, étape 9). S'appuie sur
 * situation-instance.service pour charger l'instance et ses niveaux débloqués.
 */

/**
 * Plafond d'indices de la partie, et la phrase qui l'explique.
 *
 * Une seule definition pour les deux usages : le refus au moment du clic, et
 * l'affichage qui doit l'annoncer AVANT. Les avoir separes est ce qui a produit
 * un bouton propose puis refuse.
 */
export function hintCapOf(game: typeof games.$inferSelect): { cap: number; reason: string } {
  const preset = presetFromProfile(game.difficultyProfile);
  const cap = game.mode === "competition" ? Math.min(preset.hintMaxLevel, 3) : preset.hintMaxLevel;
  return {
    cap,
    reason:
      cap === 0
        ? `Niveau ${preset.name} : aucun indice, conditions réelles`
        : game.mode === "competition" && cap === 3
          ? "Mode compétition : indices limités aux niveaux 1 à 3"
          : `Niveau ${preset.name} : indices limités aux niveaux 1 à ${cap}`,
  };
}

/** Débloque le prochain indice (séquentiel, irréversible, tracé — doc 03 §4). */
export async function unlockHint(args: {
  instanceId: string;
  userId: string;
}): Promise<{ level: number; text: string }> {
  const { instance, situationRow, def, game } = await loadInstanceForUser(args.instanceId, args.userId);
  if (instance.status === "debriefed") throw new Error("Cette situation est déjà débriefée");
  const levels = await unlockedLevels(args.instanceId);
  const next = nextUnlockableLevel(levels);
  if (next === null) throw new Error("Tous les indices sont déjà débloqués");
  if (game) {
    const { cap, reason } = hintCapOf(game);
    if (next > cap) throw new Error(reason);
  }
  const hintRow = (
    await db
      .select()
      .from(hints)
      .where(and(eq(hints.situationId, situationRow.id), eq(hints.level, next)))
  )[0];
  if (!hintRow) throw new Error("Indice introuvable");
  await db
    .insert(hintUsages)
    .values({
      situationInstanceId: args.instanceId,
      hintId: hintRow.id,
      level: next,
      userId: args.userId,
    })
    .onConflictDoNothing();
  const text = def.hints.find((h) => h.level === next)?.text ?? hintRow.textKey;
  return { level: next, text };
}
