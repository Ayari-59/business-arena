import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../../../src/db/schema";

/**
 * Base Postgres embarquée (PGlite) pour les tests d'intégration : les mêmes
 * migrations SQL que la production (drizzle/) sont appliquées, puis les
 * services s'exécutent contre cette base via le mock de "@/db".
 */
export async function createTestDb() {
  const client = new PGlite();
  const dir = join(process.cwd(), "drizzle");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (trimmed) await client.exec(trimmed);
    }
  }
  const database = drizzle(client, { schema });
  // Palier gratuit « illimité » par défaut en test : les tests jouent des
  // parties complètes et créent des concours. Le freemium borné est vérifié à
  // part, par les tests qui écrivent eux-mêmes une config restrictive.
  await database.insert(schema.platformSettings).values({
    id: 1,
    settings: { freeTier: { maxRounds: null, competitions: true, ai: true, gradebookExport: true } },
  });
  return database;
}
