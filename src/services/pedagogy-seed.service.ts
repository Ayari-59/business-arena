import { concepts, decisionModels, hints, situationConcepts, situationModels, situations } from "@/db/schema";
import { db } from "@/db";
import { CONCEPTS } from "@/config/pedagogy/concepts";
import { DECISION_MODELS } from "@/config/pedagogy/models";
import { ALL_SITUATIONS } from "@/config/scenarios/registry";

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

export async function seedPedagogyReferentials(): Promise<void> {
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
      ALL_SITUATIONS.map((s) => ({
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

  const hintValues = ALL_SITUATIONS.flatMap((s) =>
    s.hints.map((h) => ({
      situationId: situationIdByCode.get(s.code)!,
      level: h.level,
      textKey: h.text,
      costRatio: h.costRatio.toString(),
    })),
  );
  if (hintValues.length > 0) await db.insert(hints).values(hintValues).onConflictDoNothing();

  const relevanceValues = ALL_SITUATIONS.flatMap((s) =>
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

  const conceptValues = ALL_SITUATIONS.flatMap((s) =>
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
