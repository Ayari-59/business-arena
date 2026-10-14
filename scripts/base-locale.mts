/**
 * UNE BASE POSTGRES, SANS RIEN INSTALLER.
 *
 * Le parcours en navigateur (`npm run test:e2e`) demande une base, et c'est la
 * seule chose du dépôt qui en demande une hors production. Jusqu'ici, il
 * fallait un Postgres installé sur la machine, un rôle qui existe et une base
 * créée à la main : sur un poste neuf, dans un conteneur d'intégration
 * continue ou dans un bac à sable, cela ne tient pas, et onze tests de
 * parcours restaient donc rouges faute de base plutôt que faute de code.
 *
 * PGlite est un Postgres complet compilé en WebAssembly, DÉJÀ dans le dépôt :
 * les tests d'intégration s'en servent en mémoire. Ce qui lui manquait, c'est
 * de parler par le réseau, puisque l'application se connecte par une URL.
 *
 * LE PONT EST ÉCRIT ICI PLUTÔT QU'INSTALLÉ. `@electric-sql/pglite-socket` fait
 * ce travail, mais épingle ses pairs : il aurait fait monter PGlite de 0.5.7 à
 * 0.5.8 pour toute l'équipe — donc pour les tests d'intégration, où la montée
 * a fait dépasser le délai d'un essai — et tiré sept extensions (pgvector,
 * age, pgtap…) dont ce dépôt n'a que faire. Un outil de développement ne
 * déplace pas la version d'une dépendance de production. Or PGlite expose
 * déjà le protocole brut (`execProtocolRaw`) : il ne restait qu'à découper les
 * messages et à rendre les octets.
 *
 * L'application ne fait donc aucune différence : même schéma, mêmes
 * migrations, même pilote que devant un Postgres ordinaire. Ce n'est pas la
 * production, qui tourne sur Neon avec son pilote HTTP ; c'est de quoi voir
 * l'application tourner et jouer le parcours.
 *
 * Usage :
 *   npm run base:locale                 # démarre, migre, sème, et reste ouverte
 *   npm run base:locale -- --neuve      # repart d'une base vide
 *   npm run base:locale -- --sans-semis
 *   PORT_BASE_LOCALE=5435 npm run base:locale
 */
import { PGlite } from "@electric-sql/pglite";
import { createServer, type Socket } from "node:net";
import { readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const PORT = Number(process.env.PORT_BASE_LOCALE ?? 5434);
const DOSSIER = join(process.cwd(), ".pglite");
const MIGRATIONS = join(process.cwd(), "drizzle");

const neuve = process.argv.includes("--neuve");
const sansSemis = process.argv.includes("--sans-semis");

if (neuve) {
  rmSync(DOSSIER, { recursive: true, force: true });
  console.log("· base remise à zéro");
}

const db = await PGlite.create({ dataDir: DOSSIER });
await db.waitReady;

/**
 * Les migrations du dépôt, dans l'ordre, et une seule fois. On reconnaît une
 * base déjà migrée à la présence de `games` : c'est plus simple et plus sûr
 * que de tenir un journal à part, qui finirait par diverger de `drizzle/`.
 */
const dejaLa = await db
  .query<{ n: number }>(
    "select count(*)::int as n from information_schema.tables where table_name = 'games'",
  )
  .catch(() => ({ rows: [{ n: 0 }] }));

if (!dejaLa.rows[0]?.n) {
  const fichiers = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const f of fichiers) {
    for (const instruction of readFileSync(join(MIGRATIONS, f), "utf8").split(
      "--> statement-breakpoint",
    )) {
      const t = instruction.trim();
      if (t) await db.exec(t);
    }
  }
  console.log(`· ${fichiers.length} migrations appliquées`);
}

/* ── Le pont : du protocole Postgres sur un port ──────────────────────────── */

const SSL_REQUEST = 80877103;
const CANCEL_REQUEST = 80877102;
const VERSION_PROTOCOLE = 196608; // 3.0, celle du message de démarrage

/**
 * UNE SEULE REQUÊTE À LA FOIS. PGlite est mono-tâche : deux messages traités
 * en même temps mélangeraient leurs réponses. La file est une simple chaîne de
 * promesses, ce qui suffit pour un poste de développement.
 */
let file: Promise<unknown> = Promise.resolve();
const aLaSuite = <T>(travail: () => Promise<T>): Promise<T> => {
  const resultat = file.then(travail, travail);
  file = resultat.catch(() => {});
  return resultat;
};

/**
 * La longueur d'un message du protocole. Le message de DÉMARRAGE n'a pas
 * d'octet de type : sa longueur est ses quatre premiers octets, et sa version
 * les quatre suivants. Tous les autres commencent par un octet de type, suivi
 * de leur longueur. Confondre les deux coupe le flux au mauvais endroit.
 */
function longueurDuMessage(tampon: Buffer): number | null {
  if (tampon.length >= 8 && tampon.readInt32BE(4) === VERSION_PROTOCOLE) {
    const n = tampon.readInt32BE(0);
    return tampon.length >= n ? n : null;
  }
  if (tampon.length >= 5) {
    const n = 1 + tampon.readInt32BE(1);
    return tampon.length >= n ? n : null;
  }
  return null;
}

function servir(socket: Socket): void {
  socket.setNoDelay(true);
  let tampon = Buffer.alloc(0);

  socket.on("data", (morceau) => {
    tampon = Buffer.concat([tampon, morceau]);
    void traiter();
  });
  socket.on("error", () => socket.destroy());

  async function traiter(): Promise<void> {
    while (tampon.length > 0) {
      // Demande de chiffrement : on répond « non », le client continue en clair.
      if (tampon.length >= 8 && tampon.readInt32BE(0) === 8 && tampon.readInt32BE(4) === SSL_REQUEST) {
        tampon = tampon.subarray(8);
        socket.write(Buffer.from("N"));
        continue;
      }
      // Demande d'annulation : sans effet ici, et elle arrive sur une AUTRE
      // connexion, donc on la consomme sans rien répondre.
      if (
        tampon.length >= 16 &&
        tampon.readInt32BE(0) === 16 &&
        tampon.readInt32BE(4) === CANCEL_REQUEST
      ) {
        tampon = tampon.subarray(16);
        continue;
      }
      const n = longueurDuMessage(tampon);
      if (n === null) return; // message incomplet : on attend la suite
      const message = new Uint8Array(tampon.subarray(0, n));
      tampon = tampon.subarray(n);
      const reponse = await aLaSuite(() => db.execProtocolRaw(message)).catch(() => null);
      if (reponse && socket.writable) socket.write(Buffer.from(reponse));
    }
  }
}

const serveur = createServer(servir);
const URL_BASE = `postgres://postgres@127.0.0.1:${PORT}/postgres`;

await new Promise<void>((resoudre, rejeter) => {
  serveur.once("error", (e: NodeJS.ErrnoException) => {
    // Le cas courant : une base locale tourne déjà dans un autre terminal. Une
    // trace Node de quinze lignes ne le dit pas ; une phrase, si.
    if (e.code === "EADDRINUSE") {
      console.error(
        `\nLe port ${PORT} est déjà pris : une base locale tourne sans doute déjà.\n` +
          `Arrêtez-la (Ctrl+C dans son terminal), ou choisissez un autre port :\n` +
          `  PORT_BASE_LOCALE=5435 npm run base:locale\n`,
      );
      process.exit(1);
    }
    rejeter(e);
  });
  serveur.listen(PORT, "127.0.0.1", resoudre);
});

/* ── Le monde de démonstration ────────────────────────────────────────────── */

if (!sansSemis) {
  // `seedDemoWorld` importe `@/db`, qui lit `DATABASE_URL` au chargement du
  // module : la variable doit donc être posée AVANT l'import, et le pont doit
  // déjà écouter. D'où l'import dynamique, ici et pas en tête de fichier.
  process.env.DATABASE_URL ??= URL_BASE;
  const { seedDemoWorld } = await import("../src/services/demo.service.ts");
  const monde = await seedDemoWorld();
  console.log(
    monde.created ? "· monde de démonstration semé" : "· monde de démonstration déjà en place",
  );
  // Sur un monde DÉJÀ en place, le service ne rend pas les codes de jonction :
  // il ne les a pas créés ce coup-ci. On n'écrit donc pas « code partie null »,
  // qui ferait chercher une panne là où il n'y en a pas.
  const lignes: [string, string | null | undefined][] = [
    ["enseignant   ", `${monde.teacherEmail} / ${monde.password}`],
    ["code partie  ", monde.gameJoinCode],
    ["code concours", monde.competitionJoinCode],
  ];
  for (const [quoi, valeur] of lignes) if (valeur) console.log(`   ${quoi} ${valeur}`);
  if (!monde.gameJoinCode) {
    console.log("   (les codes sont dans l'espace enseignant, avec le compte ci-dessus)");
  }
}

console.log(`\nBase prête sur ${URL_BASE}\n`);
console.log("Dans un autre terminal :");
console.log(`  export DATABASE_URL=${URL_BASE}`);
console.log("  export DIRECT_URL=$DATABASE_URL AUTH_SECRET=de-quoi-signer-les-sessions");
console.log("  npm run dev          # puis http://localhost:3030/join avec le code ci-dessus");
console.log("\nCtrl+C pour arrêter (les données restent dans .pglite/).");

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    serveur.close();
    void db.close().finally(() => process.exit(0));
  });
}
