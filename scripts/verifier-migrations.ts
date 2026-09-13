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
 *
 * Le PILOTE suit l'URL, selon la même règle que `src/db/index.ts` : une URL
 * Neon passe par le pilote HTTP, toute autre URL Postgres par `pg`. Ce n'est
 * pas cosmétique — `pg` ouvre une connexion Postgres sur le port 5432, que
 * beaucoup de réseaux (proxys d'entreprise, conteneurs d'exécution à sortie
 * restreinte) ne laissent pas passer : le script y restait muet jusqu'au
 * délai d'attente. Le pilote HTTP de Neon, lui, ne fait que du HTTPS, et
 * traverse ce qu'un navigateur traverse.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { Client } from "pg";

/** Le journal du dépôt : ce que drizzle-kit CROIT devoir appliquer. */
const JOURNAL: { idx: number; when: number; tag: string }[] = JSON.parse(
  readFileSync(join(process.cwd(), "drizzle", "meta", "_journal.json"), "utf8"),
).entries;

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

/** Une ligne de résultat, sans hypothèse sur ses colonnes. */
type Ligne = Record<string, unknown>;

/** Interroger la base en lecture, quel que soit le pilote dessous. */
type Interroge = (texte: string, params?: unknown[]) => Promise<Ligne[]>;

/**
 * Ouvre la base avec le pilote qui convient à son URL, et rend de quoi
 * l'interroger puis la refermer. Les deux pilotes répondent la même chose :
 * un tableau de lignes, vide quand rien ne correspond.
 */
async function ouvrir(url: string): Promise<{ interroge: Interroge; fermer: () => Promise<void> }> {
  if (/\.neon\.tech|neon\.build|localtest\.me/.test(url)) {
    const sql = neon(url);
    // `sql.query` prend le texte et ses paramètres $1, $2… et rend les lignes.
    return { interroge: (texte, params = []) => sql.query(texte, params), fermer: async () => {} };
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  return {
    interroge: async (texte, params = []) => (await client.query(texte, params)).rows,
    fermer: () => client.end(),
  };
}

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

async function existe(interroge: Interroge, o: Objet): Promise<boolean> {
  const lignes =
    o.genre === "colonne"
      ? await interroge(REQUETES.colonne, [o.table, o.nom])
      : o.genre === "table"
        ? await interroge(REQUETES.table, [o.nom])
        : o.genre === "index"
          ? await interroge(REQUETES.index, [o.nom])
          : await interroge(REQUETES.enum, [o.type, o.nom]);
  return lignes.length > 0;
}

/** L'hôte d'une URL, sans les identifiants : on montre QUELLE base sans recopier un secret. */
function hoteDe(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return "(URL illisible)";
  }
}

/**
 * La base que désigne un hôte, le mode de connexion mis de côté.
 *
 * Chez Neon, une même base se joint par deux hôtes : l'endpoint direct
 * `ep-xxx.région.neon.tech` et son pooler `ep-xxx-pooler.région.neon.tech`.
 * Ce sont deux ROUTES vers la même base, pas deux bases — et c'est même la
 * configuration recommandée, l'application passant par le pooler et les
 * migrations par le direct. Comparer les hôtes tels quels faisait crier ce
 * script sur une installation parfaitement saine ; on compare donc ce qui
 * identifie la base, sans le suffixe de route.
 */
function baseDe(hote: string | null): string | null {
  return hote ? hote.replace(/-pooler(?=\.)/, "") : hote;
}

async function main() {
  // DEUX URL, ET C'EST LE PIÈGE. `drizzle.config.ts` migre DIRECT_URL ?? DATABASE_URL ;
  // l'application, elle, lit DATABASE_URL seul. Quand les deux pointent des
  // bases différentes, `drizzle-kit migrate` réussit — sur l'autre base — et
  // l'application tombe sur une colonne absente. C'est arrivé.
  const urlMigrations = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  const urlApplication = process.env.DATABASE_URL;
  const url = urlMigrations;
  if (!url) {
    console.error("DIRECT_URL ou DATABASE_URL manquant (voir .env.example).");
    process.exit(1);
  }
  const hote = hoteDe(urlMigrations) ?? "(inconnu)";
  const hoteApp = hoteDe(urlApplication);
  console.log(`Base MIGRÉE par drizzle-kit (DIRECT_URL ?? DATABASE_URL) : ${hote}`);
  console.log(`Base LUE par l'application (DATABASE_URL)                : ${hoteApp ?? "(absente)"}`);
  if (hoteApp && hoteApp !== hote && baseDe(hoteApp) === baseDe(hote)) {
    console.log("  (les deux hôtes désignent la même base : l'un est le pooler de l'autre)");
  }
  if (hoteApp && baseDe(hoteApp) !== baseDe(hote)) {
    console.log("");
    console.log("⚠ LES DEUX DIFFÈRENT. Vos migrations ne vont pas là où l'application lit :");
    console.log("  `drizzle-kit migrate` annoncera « applied successfully » et la colonne");
    console.log("  manquera quand même en production. Faites pointer DIRECT_URL sur la même");
    console.log("  base que DATABASE_URL, ou supprimez DIRECT_URL.");
  }
  console.log("\nLecture seule : aucune migration n'est jouée, rien n'est écrit.\n");

  const { interroge, fermer } = await ouvrir(url);

  try {
    // Ce que drizzle croit avoir appliqué.
    const suivi = await interroge(
      `select count(*)::text as n from information_schema.tables
       where table_schema = 'drizzle' and table_name = '__drizzle_migrations'`,
    );
    if ((suivi[0] as { n?: string } | undefined)?.n === "0") {
      console.log("Table de suivi drizzle.__drizzle_migrations : ABSENTE.");
      console.log("  → aucune migration n'a jamais été jouée par drizzle-kit sur cette base.\n");
    } else {
      const appliquees = await interroge(
        `select count(*)::text as n,
                to_char(to_timestamp(max(created_at) / 1000), 'YYYY-MM-DD HH24:MI') as derniere
         from drizzle.__drizzle_migrations`,
      );
      const l = appliquees[0] as { n?: string; derniere?: string | null } | undefined;
      console.log(
        `Table de suivi drizzle : ${l?.n} migration(s) enregistrée(s), la dernière le ${l?.derniere ?? "?"}.`,
      );
      console.log(`  (le journal du dépôt en compte ${JOURNAL.length})`);

      // LE SECOND PIÈGE. `drizzle-kit migrate` ne rejoue que les entrées dont
      // l'horodatage dépasse le dernier enregistré. Une entrée du journal datée
      // AVANT ce dernier est ignorée en silence, et la commande annonce quand
      // même « applied successfully ».
      const dernierJournal = JOURNAL[JOURNAL.length - 1];
      const borne = await interroge(
        `select max(created_at)::text as max from drizzle.__drizzle_migrations`,
      );
      const maxEnBase = Number((borne[0] as { max?: string | null } | undefined)?.max ?? 0);
      if (dernierJournal && maxEnBase >= dernierJournal.when) {
        console.log("");
        console.log(`⚠ La dernière entrée du journal (${dernierJournal.tag}) est datée`);
        console.log(`  ${new Date(dernierJournal.when).toISOString()}, or la table de suivi est déjà`);
        console.log(`  à ${new Date(maxEnBase).toISOString()}. drizzle-kit la considère appliquée et`);
        console.log("  ne la jouera JAMAIS. Il faut la rejouer à la main, ou redater l'entrée.");
      }
      console.log("");
    }

    const bilan: { m: Migration; presents: number; total: number; manquants: string[] }[] = [];

    for (const m of ORPHELINES) {
      const manquants: string[] = [];
      let presents = 0;
      for (const o of m.ceQuElleCree) {
        if (await existe(interroge, o)) presents += 1;
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
    await fermer();
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
  console.error("  connexions depuis cette machine. Sur une base NON Neon, le pilote `pg`");
  console.error("  a besoin du port 5432 ouvert en sortie ; sur Neon, de l'hôte d'API en");
  console.error("  HTTPS. Alternative sans Node :");
  console.error("  coller scripts/verifier-migrations.sql dans l'éditeur SQL de Neon.");
  process.exit(1);
});
