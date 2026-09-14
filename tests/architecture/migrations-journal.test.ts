import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MIGRATIONS_HISTORIQUES } from "../helpers/migrations";

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
   * Les migrations de l'historique en sont exemptées ; la liste et la raison
   * vivent dans tests/helpers/migrations.ts, que le test d'intégration lit
   * aussi.
   *
   * Ce test-ci ne lit que la FORME du SQL — c'est une heuristique, et elle
   * s'est déjà trompée (elle cherchait ses motifs jusque dans les
   * commentaires). La preuve, elle, est faite par l'exécution, dans
   * tests/integration/migrations-rejouables.test.ts : les fichiers y sont
   * réellement rejoués sur un Postgres embarqué. Celui-ci sert de garde-fou
   * rapide et de message d'erreur lisible.
   *
   * Deux notes de PostgreSQL, qui expliquent la forme des règles :
   *  · `CREATE TYPE` n'accepte pas IF NOT EXISTS ; un nouveau type
   *    d'énumération demande un bloc DO. La règle ne porte donc que sur ce qui
   *    peut le recevoir.
   *  · `ADD CONSTRAINT` non plus. La seule façon de le rendre rejouable est de
   *    l'envelopper dans un bloc DO qui rattrape `duplicate_object` — c'est ce
   *    que drizzle générait lui-même dans ses versions précédentes.
   */
  const ANCIENNES = MIGRATIONS_HISTORIQUES;

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
      // ADD CONSTRAINT ne prend pas IF NOT EXISTS : chacun doit avoir son
      // bloc DO qui rattrape `duplicate_object`. On compte les deux plutôt que
      // d'essayer de reconnaître l'imbrication à l'expression régulière.
      const contraintes = sql.match(/ADD CONSTRAINT/gi)?.length ?? 0;
      const rattrapages = sql.match(/duplicate_object/gi)?.length ?? 0;
      if (contraintes > rattrapages) {
        fautifs.push(
          `${e.tag} : ${contraintes - rattrapages} « ADD CONSTRAINT » sans bloc DO`,
        );
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
