import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * LES MIGRATIONS S'APPLIQUENT DANS L'ORDRE, ET DRIZZLE LES CHOISIT PAR
 * HORODATAGE — PAS PAR NUMÉRO.
 *
 * `drizzle-kit migrate` n'exécute une migration que si son « when » dépasse
 * celui de la dernière migration déjà enregistrée en base. Une migration dont
 * l'horodatage est ANTÉRIEUR à une migration déjà appliquée est sautée en
 * silence : la console affiche « migrations applied successfully », mais la
 * table ou la colonne n'est jamais créée.
 *
 * C'est exactement ce qui a cassé la production : 0013/0014/0015 (vague 1)
 * portaient un « when » plus ancien que 0012 (vague 0), déjà appliqué ; d'où
 * des 500 sur « login_attempts » et « rounds.bpi_version » inexistants. Ce
 * test rend le piège impossible à réintroduire.
 */

interface JournalEntry {
  idx: number;
  when: number;
  tag: string;
}

const DRIZZLE_DIR = "drizzle";

const journal = JSON.parse(
  readFileSync(`${DRIZZLE_DIR}/meta/_journal.json`, "utf8"),
) as { entries: JournalEntry[] };

describe("journal des migrations", () => {
  it("indices contigus à partir de 0", () => {
    const idxs = journal.entries.map((e) => e.idx);
    expect(idxs).toEqual(idxs.map((_, i) => i));
  });

  it("horodatages strictement croissants — sinon drizzle saute la migration en silence", () => {
    for (let i = 1; i < journal.entries.length; i++) {
      const prev = journal.entries[i - 1]!;
      const cur = journal.entries[i]!;
      expect(
        cur.when,
        `${cur.tag} (when=${cur.when}) doit être POSTÉRIEUR à ${prev.tag} (when=${prev.when}), ` +
          `sinon drizzle-kit migrate l'ignore une fois ${prev.tag} en base`,
      ).toBeGreaterThan(prev.when);
    }
  });

  it("chaque entrée du journal a son fichier SQL", () => {
    const sql = new Set(readdirSync(DRIZZLE_DIR).filter((f) => f.endsWith(".sql")));
    for (const e of journal.entries) {
      expect(sql.has(`${e.tag}.sql`), `fichier de migration manquant : ${e.tag}.sql`).toBe(true);
    }
  });

  it("aucun fichier SQL orphelin (présent sur disque mais absent du journal)", () => {
    const tags = new Set(journal.entries.map((e) => e.tag));
    const orphelins = readdirSync(DRIZZLE_DIR)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => f.slice(0, -".sql".length))
      .filter((tag) => !tags.has(tag));
    expect(orphelins, `SQL absents du journal : ${orphelins.join(", ")}`).toEqual([]);
  });
});
