import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { scenarios, users } from "@/db/schema";
import { isBuiltInScenarioCode, scenarioByCode } from "@/config/scenarios/registry";
import {
  hydrateDefinition,
  parseStoredScenario,
  serializeDefinition,
  type StoredScenarioDefinition,
} from "@/config/scenarios/serialize";
import { essaiABlanc, type EssaiVerdict } from "@/config/scenarios/essai-a-blanc";
import { patchSituationText, type SituationTextPatch } from "@/config/scenarios/situation-patch";
import { buildSituation, type NewSituationInput } from "@/config/scenarios/situation-build";

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
 * Insère un nouveau brouillon enseignant à partir de données d'habillage
 * (`StoredScenarioDefinition`), sous une identité NEUVE (code unique, version
 * « 1 », statut `draft`). Cœur commun à la duplication d'un secteur, au fork
 * d'un scénario partagé et à l'import. On repique l'identité neuve dans la
 * config moteur ET l'habillage : le code stocké doit coïncider avec la ligne
 * (le snapshot et la résolution s'y fient).
 */
async function insertDraftFromStored(
  source: StoredScenarioDefinition,
  authorId: string,
  title: string,
): Promise<ScenarioSummary> {
  const code = newScenarioCode();
  const version = "1";
  const stored: StoredScenarioDefinition = {
    ...source,
    code,
    title,
    scenario: { ...source.scenario, code, version },
  };
  const [row] = await db
    .insert(scenarios)
    .values({
      code,
      version,
      title,
      summary: stored.tagline,
      minCompanies: 1,
      maxCompanies: 8,
      roundsCount: stored.scenario.roundsCount,
      baseDifficulty: 1,
      config: stored.scenario,
      definition: stored,
      status: "draft",
      authorId,
    })
    .returning();
  if (!row) throw new Error("Création du brouillon de scénario impossible");
  return toSummary(row);
}

/**
 * Duplique un secteur INTÉGRÉ en un brouillon enseignant éditable. Le brouillon
 * est une copie de données autonome : éditer un secteur intégré reste impossible.
 */
export async function createScenarioDraftFromBuiltIn(args: {
  baseCode: string;
  authorId: string;
  title: string;
}): Promise<ScenarioSummary> {
  if (!isBuiltInScenarioCode(args.baseCode)) {
    throw new Error(`Base inconnue : « ${args.baseCode} » n'est pas un secteur intégré`);
  }
  return insertDraftFromStored(serializeDefinition(scenarioByCode(args.baseCode)), args.authorId, args.title);
}

export interface SharedScenario extends ScenarioSummary {
  authorName: string | null;
}

/**
 * Scénarios PUBLIÉS par d'AUTRES enseignants — la banque partagée. Un scénario
 * n'y figure qu'une fois publié ; les brouillons restent privés à leur auteur.
 */
export async function listSharedScenarios(viewerId: string): Promise<SharedScenario[]> {
  const rows = await db
    .select({ s: scenarios, authorName: users.displayName })
    .from(scenarios)
    .leftJoin(users, eq(users.id, scenarios.authorId))
    .where(and(eq(scenarios.status, "published")))
    .orderBy(desc(scenarios.updatedAt));
  return rows
    .filter((r) => r.s.definition != null && r.s.authorId !== viewerId)
    .map((r) => ({ ...toSummary(r.s), authorName: r.authorName }));
}

/**
 * Copie un scénario existant en un NOUVEAU brouillon appartenant à `authorId`.
 * Autorisé si le scénario est publié (banque partagée) OU s'il appartient déjà
 * à l'appelant (dupliquer son propre scénario). Refuse le brouillon d'un autre.
 */
export async function forkScenario(
  sourceId: string,
  authorId: string,
  title: string,
): Promise<ScenarioSummary> {
  const row = (await db.select().from(scenarios).where(eq(scenarios.id, sourceId)))[0];
  if (!row || row.definition == null) throw new Error("Scénario introuvable");
  if (row.status !== "published" && row.authorId !== authorId) {
    throw new Error("Ce scénario n'est pas partagé");
  }
  return insertDraftFromStored(parseStoredScenario(row.definition), authorId, title);
}

/**
 * Importe un scénario depuis des données JSON (export d'un autre espace) en un
 * nouveau brouillon. `parseStoredScenario` valide la forme et re-valide la
 * config moteur ; un JSON incohérent est refusé sans rien créer.
 */
export async function importScenario(
  raw: unknown,
  authorId: string,
  title: string,
): Promise<ScenarioSummary> {
  return insertDraftFromStored(parseStoredScenario(raw), authorId, title);
}

/**
 * Charge une ligne de scénario ENSEIGNANT éditable et vérifie la propriété.
 * `authorId` fourni ⇒ la ligne doit lui appartenir (garde d'autorisation) ; on
 * refuse aussi tout secteur intégré. Jette sinon.
 */
async function loadEditableRow(
  id: string,
  authorId?: string,
): Promise<typeof scenarios.$inferSelect> {
  const row = (await db.select().from(scenarios).where(eq(scenarios.id, id)))[0];
  if (!row || row.definition == null) throw new Error("Scénario introuvable");
  if (isBuiltInScenarioCode(row.code)) {
    throw new Error("Un secteur intégré ne s'édite pas");
  }
  if (authorId !== undefined && row.authorId !== authorId) {
    throw new Error("Ce scénario ne vous appartient pas");
  }
  return row;
}

export async function getScenarioById(
  id: string,
  authorId?: string,
): Promise<{ summary: ScenarioSummary; definition: StoredScenarioDefinition } | null> {
  const row = (await db.select().from(scenarios).where(eq(scenarios.id, id)))[0];
  if (!row || row.definition == null) return null;
  if (authorId !== undefined && row.authorId !== authorId) return null;
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
 * pour qu'un éditeur ne puisse pas la désynchroniser. Refuse un secteur intégré
 * et, si `authorId` est fourni, un scénario d'un autre auteur.
 */
export async function updateScenarioDefinition(
  id: string,
  next: StoredScenarioDefinition,
  authorId?: string,
): Promise<ScenarioSummary> {
  const row = await loadEditableRow(id, authorId);
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
  authorId?: string,
): Promise<ScenarioSummary> {
  await loadEditableRow(id, authorId);
  const [updated] = await db
    .update(scenarios)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(scenarios.id, id)))
    .returning();
  if (!updated) throw new Error("Changement de statut impossible");
  return toSummary(updated);
}

export async function deleteScenario(id: string, authorId?: string): Promise<void> {
  await loadEditableRow(id, authorId);
  await db.delete(scenarios).where(eq(scenarios.id, id));
}

/**
 * Un enseignant peut-il LANCER une partie sur ce code ? Vrai pour un secteur
 * intégré, ou pour l'un de ses propres scénarios (quel que soit le statut). Le
 * partage (publiés d'autrui) viendra plus tard ; ici on protège d'abord contre
 * le lancement du brouillon d'un autre.
 */
export async function canTeacherLaunchScenario(
  code: string,
  teacherId: string,
): Promise<boolean> {
  if (isBuiltInScenarioCode(code)) return true;
  const rows = await db.select().from(scenarios).where(eq(scenarios.code, code));
  return rows.some((r) => r.definition != null && r.authorId === teacherId);
}

/**
 * Essai à blanc d'un scénario enseignant : rejoue 5 stratégies et rend un
 * verdict de jouabilité. Filet informatif (ne bloque pas la publication), pur
 * moteur. Vérifie la propriété.
 */
export async function runEssaiABlanc(id: string, authorId?: string): Promise<EssaiVerdict> {
  const row = await loadEditableRow(id, authorId);
  const definition = hydrateDefinition(parseStoredScenario(row.definition));
  return essaiABlanc(definition);
}

/**
 * Édite le TEXTE d'une situation d'un scénario enseignant (titre, récit,
 * problème, options de diagnostic, indices, correction du modèle, tour, poids).
 * La structure est préservée ; vérifie la propriété.
 */
export async function updateSituationText(
  id: string,
  situationCode: string,
  patch: SituationTextPatch,
  authorId?: string,
): Promise<ScenarioSummary> {
  const row = await loadEditableRow(id, authorId);
  const stored = parseStoredScenario(row.definition);
  const index = stored.situations.findIndex((s) => s.code === situationCode);
  if (index < 0) throw new Error("Situation introuvable dans ce scénario");
  const situations = [...stored.situations];
  situations[index] = patchSituationText(situations[index]!, patch);
  return updateScenarioDefinition(id, { ...stored, situations }, authorId);
}

/**
 * Ajoute une situation créée DE ZÉRO à un scénario enseignant. Le code est
 * engendré (unique, hors des codes du référentiel intégré) ; `buildSituation`
 * valide tout (matrice « optimal », notions/modèles existants, cinq indices…)
 * et attache la question du modèle. Vérifie la propriété.
 */
export async function addSituation(
  id: string,
  input: NewSituationInput,
  authorId?: string,
): Promise<{ summary: ScenarioSummary; code: string }> {
  const row = await loadEditableRow(id, authorId);
  const stored = parseStoredScenario(row.definition);
  const existants = new Set(stored.situations.map((s) => s.code));
  let code = `sc-situ-${randomUUID().slice(0, 8)}`;
  while (existants.has(code)) code = `sc-situ-${randomUUID().slice(0, 8)}`;
  const built = buildSituation(input, code);
  const summary = await updateScenarioDefinition(
    id,
    { ...stored, situations: [...stored.situations, built] },
    authorId,
  );
  return { summary, code };
}

export async function deleteSituation(
  id: string,
  situationCode: string,
  authorId?: string,
): Promise<ScenarioSummary> {
  const row = await loadEditableRow(id, authorId);
  const stored = parseStoredScenario(row.definition);
  const situations = stored.situations.filter((s) => s.code !== situationCode);
  if (situations.length === stored.situations.length) {
    throw new Error("Situation introuvable dans ce scénario");
  }
  return updateScenarioDefinition(id, { ...stored, situations }, authorId);
}
