import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { scenarios } from "@/db/schema";
import { isBuiltInScenarioCode, scenarioByCode } from "@/config/scenarios/registry";
import {
  parseStoredScenario,
  serializeDefinition,
  type StoredScenarioDefinition,
} from "@/config/scenarios/serialize";

/**
 * CRUD des scénarios ENSEIGNANTS en base — le socle de l'éditeur visuel (PR 1).
 *
 * Un scénario enseignant est un enregistrement complet de la table `scenarios` :
 * `config` porte la config moteur (frontière du snapshot), `definition` porte
 * l'habillage sérialisé (`StoredScenarioDefinition`). Les 9 secteurs intégrés ne
 * passent JAMAIS par ici : ils restent dans le code, immuables, testés par la
 * suite dorée. On ne peut ni dupliquer vers un code intégré, ni éditer l'un d'eux.
 */

const CODE_PREFIX = "sc-";

/** Un nouveau code de scénario enseignant, garanti hors des codes intégrés. */
function newScenarioCode(): string {
  return `${CODE_PREFIX}${randomUUID().slice(0, 8)}`;
}

export interface ScenarioSummary {
  id: string;
  code: string;
  version: string;
  title: string;
  status: "draft" | "published" | "archived";
  authorId: string | null;
  updatedAt: Date;
}

function toSummary(row: typeof scenarios.$inferSelect): ScenarioSummary {
  return {
    id: row.id,
    code: row.code,
    version: row.version,
    title: row.title,
    status: row.status,
    authorId: row.authorId,
    updatedAt: row.updatedAt,
  };
}

/**
 * Duplique un secteur INTÉGRÉ en un brouillon enseignant éditable, sous une
 * identité neuve (code unique, version « 1 », statut `draft`). Le brouillon est
 * une copie de données autonome : éditer un secteur intégré reste impossible.
 */
export async function createScenarioDraftFromBuiltIn(args: {
  baseCode: string;
  authorId: string;
  title: string;
}): Promise<ScenarioSummary> {
  if (!isBuiltInScenarioCode(args.baseCode)) {
    throw new Error(`Base inconnue : « ${args.baseCode} » n'est pas un secteur intégré`);
  }
  const base = scenarioByCode(args.baseCode);
  const code = newScenarioCode();
  const version = "1";
  // On repique l'identité neuve dans la config moteur ET l'habillage : le code
  // stocké doit coïncider avec la ligne (le snapshot et la résolution s'y fient).
  const stored: StoredScenarioDefinition = {
    ...serializeDefinition(base),
    code,
    title: args.title,
    scenario: { ...base.scenario, code, version },
  };

  const [row] = await db
    .insert(scenarios)
    .values({
      code,
      version,
      title: args.title,
      summary: stored.tagline,
      minCompanies: 1,
      maxCompanies: 8,
      roundsCount: stored.scenario.roundsCount,
      baseDifficulty: 1,
      config: stored.scenario,
      definition: stored,
      status: "draft",
      authorId: args.authorId,
    })
    .returning();
  if (!row) throw new Error("Création du brouillon de scénario impossible");
  return toSummary(row);
}

export async function getScenarioById(
  id: string,
): Promise<{ summary: ScenarioSummary; definition: StoredScenarioDefinition } | null> {
  const row = (await db.select().from(scenarios).where(eq(scenarios.id, id)))[0];
  if (!row || row.definition == null) return null;
  return { summary: toSummary(row), definition: parseStoredScenario(row.definition) };
}

export async function listScenariosByAuthor(authorId: string): Promise<ScenarioSummary[]> {
  const rows = await db
    .select()
    .from(scenarios)
    .where(eq(scenarios.authorId, authorId))
    .orderBy(desc(scenarios.updatedAt));
  return rows.filter((r) => r.definition != null).map(toSummary);
}

/**
 * Écrit une nouvelle version de l'habillage/config d'un brouillon. L'identité de
 * la ligne (code, version) fait foi : elle est ré-imposée à la config stockée,
 * pour qu'un éditeur ne puisse pas la désynchroniser. Refuse un scénario intégré.
 */
export async function updateScenarioDefinition(
  id: string,
  next: StoredScenarioDefinition,
): Promise<ScenarioSummary> {
  const row = (await db.select().from(scenarios).where(eq(scenarios.id, id)))[0];
  if (!row) throw new Error("Scénario introuvable");
  if (isBuiltInScenarioCode(row.code)) {
    throw new Error("Un secteur intégré ne s'édite pas");
  }
  const stored = parseStoredScenario({
    ...next,
    code: row.code,
    scenario: { ...next.scenario, code: row.code, version: row.version },
  });
  const [updated] = await db
    .update(scenarios)
    .set({
      title: stored.title,
      summary: stored.tagline,
      roundsCount: stored.scenario.roundsCount,
      config: stored.scenario,
      definition: stored,
      updatedAt: new Date(),
    })
    .where(eq(scenarios.id, id))
    .returning();
  if (!updated) throw new Error("Mise à jour du scénario impossible");
  return toSummary(updated);
}

export async function setScenarioStatus(
  id: string,
  status: "draft" | "published" | "archived",
): Promise<ScenarioSummary> {
  const row = (await db.select().from(scenarios).where(eq(scenarios.id, id)))[0];
  if (!row) throw new Error("Scénario introuvable");
  if (isBuiltInScenarioCode(row.code)) {
    throw new Error("Un secteur intégré n'a pas de statut modifiable");
  }
  const [updated] = await db
    .update(scenarios)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(scenarios.id, id)))
    .returning();
  if (!updated) throw new Error("Changement de statut impossible");
  return toSummary(updated);
}
