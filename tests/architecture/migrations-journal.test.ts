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

  /**
   * UNE MIGRATION DOIT POUVOIR ÊTRE REJOUÉE.
   *
   * Le corollaire de la règle précédente. Six migrations sont restées hors du
   * journal pendant des semaines ; pour les y remettre sans connaître l'état
   * exact de la production, il a fallu qu'elles soient rejouables — sinon
   * `ADD COLUMN` tombait sur « column already exists », et comme drizzle joue
   * TOUTES les migrations en retard dans UNE SEULE transaction, un seul échec
   * annulait le déploiement entier.
   *
   * Les quatorze premières échappent à la règle : elles sont enregistrées en
   * base depuis longtemps, leur horodatage est sous le dernier enregistré,
   * drizzle ne les rejouera jamais. Les réécrire ne servirait à rien et
   * changerait leur empreinte. Toute migration AJOUTÉE ensuite, elle, doit être
   * rejouable — et n'ayant pas à figurer dans cette liste, elle y est soumise
   * d'office.
   *
   * Note : `CREATE TYPE` n'accepte pas IF NOT EXISTS en PostgreSQL ; un nouveau
   * type d'énumération demande un bloc DO. La règle ne porte donc que sur ce
   * qui peut le recevoir.
   */
  const ANCIENNES = new Set([
    "0000_lethal_post",
    "0001_lucky_pete_wisdom",
    "0002_friendly_thaddeus_ross",
    "0003_useful_triton",
    "0004_greedy_maverick",
    "0005_cooing_wild_pack",
    "0006_competition_entries_label_ci",
    "0007_competition_join_code",
    "0008_games_priority_indexes",
    "0009_secondary_indexes",
    "0010_trigger_context",
    "0011_consequence_context",
    "0012_interpretation_context",
    "0013_add_learning_steps_tables",
  ]);

  it("toute migration postérieure est rejouable (IF NOT EXISTS)", () => {
    const REGLES: { quoi: string; motif: RegExp }[] = [
      { quoi: "ADD COLUMN", motif: /ADD COLUMN\s+(?!IF NOT EXISTS)/gi },
      { quoi: "ADD VALUE", motif: /ADD VALUE\s+(?!IF NOT EXISTS)/gi },
      { quoi: "CREATE TABLE", motif: /CREATE\s+TABLE\s+(?!IF NOT EXISTS)/gi },
      { quoi: "CREATE INDEX", motif: /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?!IF NOT EXISTS)/gi },
    ];
    const fautifs: string[] = [];
    for (const e of journal.entries) {
      if (ANCIENNES.has(e.tag)) continue;
      // Les commentaires d'abord, sinon la prose est analysée comme du SQL :
      // 0019 explique « contrairement à 0017 et 0018 qui font un ADD COLUMN
      // nu », et cette phrase se dénonçait elle-même.
      const sql = readFileSync(`${DRIZZLE_DIR}/${e.tag}.sql`, "utf8")
        .split("\n")
        .filter((l) => !l.trimStart().startsWith("--"))
        .join("\n");
      for (const { quoi, motif } of REGLES) {
        const n = sql.match(motif)?.length ?? 0;
        if (n > 0) fautifs.push(`${e.tag} : ${n} « ${quoi} » sans IF NOT EXISTS`);
      }
    }
    expect(fautifs, fautifs.join(" · ")).toEqual([]);
  });

  it("la liste des anciennes ne désigne que des migrations qui existent", () => {
    // Sans quoi un tag mal orthographié exempterait une migration réelle en
    // silence, et la règle ci-dessus ne porterait plus sur elle.
    const tags = new Set(journal.entries.map((e) => e.tag));
    for (const ancienne of ANCIENNES) {
      expect(tags.has(ancienne), `${ancienne} n'est pas au journal`).toBe(true);
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
