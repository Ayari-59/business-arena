import { eq } from "drizzle-orm";
import { concepts, decisionModels, hints, situationConcepts, situationModels, situations } from "@/db/schema";
import { db } from "@/db";
import { CONCEPTS, CONCEPT_PREREQUISITES } from "@/config/pedagogy/concepts";
import { DECISION_MODELS } from "@/config/pedagogy/models";
import { ALL_SITUATIONS } from "@/config/scenarios/registry";
import type { SituationDef } from "@/config/scenarios/situation-kit";

/**
 * Seed idempotent des référentiels pédagogiques (concepts, modèles, situations
 * et leurs jointures), appelé à la création de partie. Les référentiels sont
 * des DONNÉES engendrées depuis la config — jamais de contenu en dur ici.
 *
 * Extrait de pedagogy.service.ts (refactoring V2, étape 9) : responsabilité
 * isolée, sans lien avec le cycle de vie des situations ni le débriefing.
 */

const DOMAIN_TO_DB: Record<string, "market" | "commercial" | "costs" | "margins" | "thresholds" | "production" | "finance" | "profitability"> = {
  market: "market",
  commercial: "commercial",
  costs: "costs",
  margins: "margins",
  thresholds: "thresholds",
  production: "production",
  finance: "finance",
  profitability: "profitability",
};

export async function seedPedagogyReferentials(
  /**
   * Situations d'un scénario ENSEIGNANT à semer en plus du référentiel intégré.
   * Un scénario base porte ses propres situations, absentes de `ALL_SITUATIONS`
   * (qui n'agrège que les 9 secteurs code) : sans ce seed, l'instanciation ne
   * trouverait pas leur id. Idempotent (mêmes `onConflictDoNothing`).
   */
  extraSituations: SituationDef[] = [],
): Promise<void> {
  // Dédup par code : un intégré prime sur un homonyme fourni (défensif).
  const seen = new Set(ALL_SITUATIONS.map((s) => s.code));
  const allSituations: SituationDef[] = [
    ...ALL_SITUATIONS,
    ...extraSituations.filter((s) => !seen.has(s.code)),
  ];

  await db
    .insert(concepts)
    .values(
      CONCEPTS.map((c) => ({
        code: c.code,
        name: c.name,
        domain: DOMAIN_TO_DB[c.domain]!,
        definition: c.definition,
        layers: { intuition: c.intuition, method: c.method },
        formulas: c.formula ? [c.formula] : null,
        introDifficulty: 1,
      })),
    )
    .onConflictDoNothing({ target: concepts.code });

  await db
    .insert(decisionModels)
    .values(
      DECISION_MODELS.map((m) => ({
        code: m.code,
        name: m.name,
        description: m.description,
        objective: m.objective,
        difficulty: m.difficulty,
      })),
    )
    .onConflictDoNothing({ target: decisionModels.code });

  await db
    .insert(situations)
    .values(
      allSituations.map((s) => ({
        code: s.code,
        titleKey: s.title,
        narrativeKey: s.narrative,
        problemKey: s.problem,
        diagnosticOptions: s.diagnosticOptions,
        trigger: s.trigger,
        difficulty: 1,
        weight: s.weight.toString(),
      })),
    )
    .onConflictDoNothing({ target: situations.code });

  // Jointures (hints, matrice de pertinence, concepts) — après résolution des ids
  const situationRows = await db.select().from(situations);
  const modelRows = await db.select().from(decisionModels);
  const conceptRows = await db.select().from(concepts);
  const situationIdByCode = new Map(situationRows.map((r) => [r.code, r.id]));
  const modelIdByCode = new Map(modelRows.map((r) => [r.code, r.id]));
  const conceptIdByCode = new Map(conceptRows.map((r) => [r.code, r.id]));

  // Prérequis (V2 couche 2, #1) : on résout les codes du graphe en ids puis on
  // renseigne prerequisiteIds. onConflictDoNothing ci-dessus ne touche pas les
  // notions déjà présentes ; cette passe est donc auto-réparatrice (backfill des
  // parties antérieures) tout en restant idempotente — on n'écrit que si l'ordre
  // ou le contenu diffère de ce qui est déjà en base.
  const sameIds = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);
  for (const row of conceptRows) {
    const desired = (CONCEPT_PREREQUISITES[row.code] ?? [])
      .map((code) => conceptIdByCode.get(code))
      .filter((id): id is string => Boolean(id));
    if (sameIds(desired, row.prerequisiteIds ?? [])) continue;
    await db
      .update(concepts)
      .set({ prerequisiteIds: desired })
      .where(eq(concepts.id, row.id));
  }

  const hintValues = allSituations.flatMap((s) =>
    s.hints.map((h) => ({
      situationId: situationIdByCode.get(s.code)!,
      level: h.level,
      textKey: h.text,
      costRatio: h.costRatio.toString(),
    })),
  );
  if (hintValues.length > 0) await db.insert(hints).values(hintValues).onConflictDoNothing();

  const relevanceValues = allSituations.flatMap((s) =>
    Object.entries(s.modelRelevance)
      .filter(([code]) => modelIdByCode.has(code))
      .map(([code, relevance]) => ({
        situationId: situationIdByCode.get(s.code)!,
        decisionModelId: modelIdByCode.get(code)!,
        relevance,
      })),
  );
  if (relevanceValues.length > 0)
    await db.insert(situationModels).values(relevanceValues).onConflictDoNothing();

  const conceptValues = allSituations.flatMap((s) =>
    s.conceptCodes
      .filter((code) => conceptIdByCode.has(code))
      .map((code) => ({
        situationId: situationIdByCode.get(s.code)!,
        conceptId: conceptIdByCode.get(code)!,
      })),
  );
  if (conceptValues.length > 0)
    await db.insert(situationConcepts).values(conceptValues).onConflictDoNothing();
}
