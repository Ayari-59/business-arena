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
  // Une ligne de réglages vide : la configuration par défaut du code s'applique.
  // (L'ancien palier gratuit n'est plus un réglage ; tests/golden/freemium-entitlements
  // vérifie qu'un réglage hérité reste sans effet.)
  await database.insert(schema.platformSettings).values({ id: 1, settings: {} });
  return database;
}
