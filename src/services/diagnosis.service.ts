import { eq } from "drizzle-orm";
import { db } from "@/db";
import { situationInstances } from "@/db/schema";
import { evaluateDiagnosis } from "@/pedagogy/evaluation";
import { NIVEAU_STANDARD, optionsDuDiagnostic } from "@/config/analyse-par-niveau";
import { presetFromProfile } from "@/config/difficulty";
import { loadInstanceForUser } from "./situation-instance.service";

/**
 * Diagnostic d'une situation : enregistrement des options cochées + texte libre
 * et calcul du score F1.
 *
 * Extrait de pedagogy.service.ts (refactoring V2, étape 9).
 */

/** Enregistre le diagnostic (options cochées + texte libre) et le score F1. */
export async function submitDiagnosis(args: {
  instanceId: string;
  userId: string;
  selectedOptionIds: string[];
  freeText?: string;
}): Promise<{ score: number }> {
  const { instance, def, game } = await loadInstanceForUser(args.instanceId, args.userId);
  if (instance.status === "debriefed") throw new Error("Cette situation est déjà débriefée");
  const score = evaluateDiagnosis(
    args.selectedOptionIds,
    optionsDuDiagnostic(def.diagnosticOptions, game ? presetFromProfile(game.difficultyProfile).level : NIVEAU_STANDARD),
  );
  await db
    .update(situationInstances)
    .set({
      diagnosis: { selected: args.selectedOptionIds, freeText: args.freeText ?? "", score },
      status: instance.status === "open" ? "diagnosed" : instance.status,
    })
    .where(eq(situationInstances.id, args.instanceId));
  return { score };
}
