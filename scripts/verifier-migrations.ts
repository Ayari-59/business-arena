/**
 * Vérifie ce que la base contient VRAIMENT, face aux migrations SQL du dépôt.
 *
 * Pourquoi ce script existe. Six fichiers de drizzle/ ne figurent pas au
 * journal (drizzle/meta/_journal.json) : `drizzle-kit migrate` ne les a donc
 * jamais joués. L'historique git confirme que ces entrées n'ont jamais existé —
 * le journal n'a pas été écrasé. Restait à savoir si leurs colonnes sont quand
 * même là (appliquées à la main) ou absentes.
 *
 * La réponse décide de la suite, et le risque n'est pas le même partout :
 *   - 0013, 0014, 0015, 0016 sont idempotentes (IF NOT EXISTS) : les rejouer ne
 *     casse rien, présentes ou pas.
 *   - 0017 et 0018 utilisent ADD COLUMN NU : les rejouer sur une base qui a
 *     déjà ces colonnes ÉCHOUE (« column already exists ») et interrompt la
 *     migration.
 *
 * CE SCRIPT N'ÉCRIT RIEN. Il ne fait que des SELECT sur les catalogues système
 * et sur la table de suivi de drizzle. Il ne joue aucune migration, ne crée ni
 * ne modifie aucun objet. On peut le lancer sur la production sans risque.
 *
 * Lancement :  npm run verify:migrations
 * (lit DIRECT_URL, sinon DATABASE_URL — la même URL que drizzle.config.ts,
 *  donc bien la base que `drizzle-kit migrate` viserait.)
 */
import { Client } from "pg";

type Objet =
  | { genre: "colonne"; table: string; nom: string }
  | { genre: "table"; nom: string }
  | { genre: "index"; nom: string }
  | { genre: "valeur d'enum"; type: string; nom: string };

interface Migration {
  fichier: string;
  /** Rejouable sans risque : toutes ses instructions portent un IF NOT EXISTS. */
  idempotente: boolean;
  ceQuElleCree: Objet[];
}

/** Les six fichiers présents sur disque et absents du journal drizzle. */
const ORPHELINES: Migration[] = [
  {
    fichier: "0013_decision_source",
    idempotente: true,
    ceQuElleCree: [{ genre: "colonne", table: "decisions", nom: "decision_source" }],
  },
  {
    fichier: "0014_login_hardening",
    idempotente: true,
    ceQuElleCree: [
      { genre: "colonne", table: "users", nom: "session_version" },
      { genre: "table", nom: "login_attempts" },
      { genre: "index", nom: "login_attempts_email_idx" },
      { genre: "index", nom: "login_attempts_ip_idx" },
    ],
  },
  {
    fichier: "0015_bpi_v2",
    idempotente: true,
    ceQuElleCree: [
      { genre: "valeur d'enum", type: "score_dimension", nom: "pilotage" },
      { genre: "colonne", table: "rounds", nom: "bpi_version" },
    ],
  },
  {
    fichier: "0016_scenario_definition",
    idempotente: true,
    ceQuElleCree: [{ genre: "colonne", table: "scenarios", nom: "definition" }],
  },
  {
    fichier: "0017_previous_lester",
    idempotente: false,
    ceQuElleCree: [
      { genre: "colonne", table: "competition_stages", nom: "starts_at" },
      { genre: "colonne", table: "competition_stages", nom: "ends_at" },
      { genre: "colonne", table: "games", nom: "opens_at" },
      { genre: "colonne", table: "games", nom: "closes_at" },
    ],
  },
  {
    fichier: "0018_public_competition_page",
    idempotente: false,
    ceQuElleCree: [
      { genre: "colonne", table: "competitions", nom: "public_visible" },
      { genre: "colonne", table: "competitions", nom: "tagline" },
      { genre: "colonne", table: "competitions", nom: "description" },
      { genre: "colonne", table: "competitions", nom: "organizer_label" },
      { genre: "colonne", table: "competitions", nom: "accent" },
    ],
  },
];

const REQUETES = {
  colonne:
    "select 1 from information_schema.columns where table_schema = 'public' and table_name = $1 and column_name = $2",
  table:
    "select 1 from information_schema.tables where table_schema = 'public' and table_name = $1",
  index: "select 1 from pg_indexes where schemaname = 'public' and indexname = $1",
  enum: `select 1 from pg_type t join pg_enum e on e.enumtypid = t.oid
         where t.typname = $1 and e.enumlabel = $2`,
} as const;

function decrire(o: Objet): string {
  switch (o.genre) {
    case "colonne":
      return `colonne ${o.table}.${o.nom}`;
    case "table":
      return `table ${o.nom}`;
    case "index":
      return `index ${o.nom}`;
    case "valeur d'enum":
      return `valeur « ${o.nom} » de l'enum ${o.type}`;
  }
}

async function existe(c: Client, o: Objet): Promise<boolean> {
  const r =
    o.genre === "colonne"
      ? await c.query(REQUETES.colonne, [o.table, o.nom])
      : o.genre === "table"
        ? await c.query(REQUETES.table, [o.nom])
        : o.genre === "index"
          ? await c.query(REQUETES.index, [o.nom])
          : await c.query(REQUETES.enum, [o.type, o.nom]);
  return r.rowCount !== null && r.rowCount > 0;
}

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("DIRECT_URL ou DATABASE_URL manquant (voir .env.example).");
    process.exit(1);
  }
  // L'hôte, sans les identifiants : on montre QUELLE base est interrogée sans
  // recopier un secret dans un terminal ou un rapport.
  let hote = "(URL illisible)";
  try {
    hote = new URL(url).host;
  } catch {
    /* URL non standard : on n'affiche rien plutôt que de risquer une fuite */
  }
  console.log(`Base interrogée : ${hote}`);
  console.log("Lecture seule : aucune migration n'est jouée, rien n'est écrit.\n");

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    // Ce que drizzle croit avoir appliqué.
    const suivi = await client.query<{ n: string }>(
      `select count(*)::text as n from information_schema.tables
       where table_schema = 'drizzle' and table_name = '__drizzle_migrations'`,
    );
    if (suivi.rows[0]?.n === "0") {
      console.log("Table de suivi drizzle.__drizzle_migrations : ABSENTE.");
      console.log("  → aucune migration n'a jamais été jouée par drizzle-kit sur cette base.\n");
    } else {
      const appliquees = await client.query<{ n: string; derniere: string | null }>(
        `select count(*)::text as n,
                to_char(to_timestamp(max(created_at) / 1000), 'YYYY-MM-DD HH24:MI') as derniere
         from drizzle.__drizzle_migrations`,
      );
      const l = appliquees.rows[0];
      console.log(
        `Table de suivi drizzle : ${l?.n} migration(s) enregistrée(s), la dernière le ${l?.derniere ?? "?"}.`,
      );
      console.log("  (le journal du dépôt en compte 14 : 0000 à 0012, plus 0013_add_learning_steps_tables)\n");
    }

    const bilan: { m: Migration; presents: number; total: number; manquants: string[] }[] = [];

    for (const m of ORPHELINES) {
      const manquants: string[] = [];
      let presents = 0;
      for (const o of m.ceQuElleCree) {
        if (await existe(client, o)) presents += 1;
        else manquants.push(decrire(o));
      }
      bilan.push({ m, presents, total: m.ceQuElleCree.length, manquants });
    }

    console.log("─".repeat(72));
    console.log("LES SIX MIGRATIONS ABSENTES DU JOURNAL");
    console.log("─".repeat(72));
    for (const { m, presents, total, manquants } of bilan) {
      const etat =
        presents === total ? "DÉJÀ EN BASE" : presents === 0 ? "ABSENTE" : "PARTIELLE";
      console.log(`\n${m.fichier}  —  ${etat}  (${presents}/${total} objets présents)`);
      console.log(`  rejouable sans risque : ${m.idempotente ? "oui (IF NOT EXISTS)" : "NON (ADD COLUMN nu)"}`);
      if (manquants.length > 0) {
        for (const x of manquants) console.log(`  manque : ${x}`);
      }
    }

    // Conclusion : c'est le croisement « déjà en base » × « non idempotente »
    // qui est dangereux, parce que l'inscrire au journal ferait échouer la
    // prochaine migration.
    const dangereuses = bilan.filter((b) => b.presents > 0 && !b.m.idempotente);
    const partielles = bilan.filter((b) => b.presents > 0 && b.presents < b.total);
    const absentes = bilan.filter((b) => b.presents === 0);

    console.log(`\n${"─".repeat(72)}`);
    console.log("CE QU'IL FAUT EN CONCLURE");
    console.log("─".repeat(72));

    if (absentes.length > 0) {
      console.log(`\n⚠ ${absentes.length} migration(s) n'ont JAMAIS été appliquées :`);
      for (const b of absentes) console.log(`    ${b.m.fichier}`);
      console.log("  La base manque donc ces colonnes : le code qui les lit échoue à l'exécution.");
    }
    if (partielles.length > 0) {
      console.log(`\n⚠ ${partielles.length} migration(s) PARTIELLEMENT appliquées — le cas le plus`);
      console.log("  délicat : ni rejouable telle quelle, ni ignorable.");
      for (const b of partielles) console.log(`    ${b.m.fichier}`);
    }
    if (dangereuses.length > 0) {
      console.log(`\n⚠ ${dangereuses.length} migration(s) ont leurs objets en base mais ne sont PAS`);
      console.log("  idempotentes. Les inscrire au journal ferait échouer la prochaine");
      console.log("  migration sur « column already exists » :");
      for (const b of dangereuses) console.log(`    ${b.m.fichier}`);
      console.log("  Il faudrait d'abord les rendre idempotentes (ADD COLUMN IF NOT EXISTS).");
    }
    if (absentes.length === 0 && partielles.length === 0 && dangereuses.length === 0) {
      console.log("\nTout est en base et tout est idempotent : inscrire les six entrées au");
      console.log("journal est sans risque, et rendra une base neuve complète.");
    }

    console.log("\nRappel : quel que soit l'état de CETTE base, une base NEUVE (nouvel");
    console.log("environnement, instance de test) n'aura jamais ces six migrations tant");
    console.log("qu'elles ne sont pas au journal.\n");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  // Une erreur de connexion pg arrive parfois avec un `message` vide : l'afficher
  // tel quel ne disait rien. On assemble ce qui est disponible, et à défaut on
  // nomme la piste la plus probable plutôt que de laisser une ligne muette.
  const err = e as { name?: string; message?: string; code?: string; cause?: unknown };
  const detail = [err?.name, err?.message, err?.code && `code ${err.code}`]
    .filter((x) => typeof x === "string" && x.length > 0)
    .join(" · ");
  console.error(`\nÉchec de la vérification : ${detail || "aucun détail — connexion refusée, réseau ou TLS ?"}`);
  if (err?.cause) console.error(`  cause : ${String(err.cause)}`);
  console.error("  Vérifiez DIRECT_URL (ou DATABASE_URL) et que la base accepte les");
  console.error("  connexions depuis cette machine. Alternative sans Node :");
  console.error("  coller scripts/verifier-migrations.sql dans l'éditeur SQL de Neon.");
  process.exit(1);
});
