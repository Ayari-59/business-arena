import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import * as schema from "@/db/schema";
import { RESTENT_A_LA_PARTIE, SUIVENT_L_ESSAI } from "@/services/archives-d-essai";

/**
 * LE TOUR D'ESSAI NE COMPTE NULLE PART : LE RECENSEMENT QUI LE PROUVE.
 *
 * La conception (services/tour-d-essai.service.ts) joue l'essai dans la partie puis le
 * DÉPLACE, en bloc, dans une partie d'archive. Elle ne demande rien aux lecteurs d'une
 * partie, à deux conditions que ce test tient :
 *
 *  1. LES TABLES. Toute table qui pointe vers une partie, une équipe ou un tour est
 *     rangée : elle suit l'essai dans l'archive (`SUIVENT_L_ESSAI`), ou elle reste à la
 *     partie (`RESTENT_A_LA_PARTIE`). Une table ajoutée demain, qui porterait un
 *     résultat d'équipe sans être rangée, laisserait l'essai sous la partie après la
 *     bascule : le test rougit tant qu'on ne l'a pas rangée.
 *
 *  2. LES LECTEURS. Chaque fichier qui lit une table de jeu est recensé, avec sa
 *     portée : il lit UNE partie (par son identifiant, ses équipes ou ses tours), il lit
 *     ce qu'un ÉLÈVE joue (par ses équipes : l'archive n'en a aucun), ou il est
 *     TRANSVERSAL (plusieurs parties à la fois) et écarte alors les archives par l'un
 *     des filtres de services/archives-d-essai.ts. Et chaque requête, prise une à une,
 *     épingle une partie, une équipe, un tour ou un élève, ou passe par un filtre.
 */

const TABLES = Object.entries(schema as Record<string, unknown>).filter(
  (e): e is [string, PgTable] => e[1] instanceof PgTable,
);
const nomSql = (t: PgTable) => getTableConfig(t).name;
const DE_JEU = new Set(["games", "teams", "rounds"]);

describe("1. les tables : chacune suit l'essai ou reste à la partie", () => {
  const suivent = new Map(SUIVENT_L_ESSAI.map((t) => [nomSql(t.table), t]));
  const restent = new Set(RESTENT_A_LA_PARTIE.map((r) => `${nomSql(r.table)}.${r.colonne.name}`));

  /** Les colonnes qui pointent vers une partie, une équipe ou un tour : clé étrangère ou nom. */
  const pointeurs = TABLES.flatMap(([, table]) => {
    const cfg = getTableConfig(table);
    const parCle = cfg.foreignKeys.flatMap((fk) => {
      const ref = fk.reference();
      const cible = nomSql(ref.foreignTable);
      return DE_JEU.has(cible)
        ? ref.columns.map((c) => ({ table: cfg.name, colonne: c.name, cible }))
        : [];
    });
    // Une colonne nommée comme un pointeur, sans clé étrangère, compte aussi : la
    // contrainte peut manquer, la donnée, elle, appartient bien à une partie.
    const parNom = cfg.columns
      .filter((c) => /^(game|team|round)_id$/.test(c.name))
      .filter((c) => !parCle.some((p) => p.colonne === c.name))
      .map((c) => ({
        table: cfg.name,
        colonne: c.name,
        cible: c.name === "game_id" ? "games" : c.name === "team_id" ? "teams" : "rounds",
      }));
    return [...parCle, ...parNom];
  });

  it("le schéma a bien des pointeurs à ranger (sinon le recensement ne voit rien)", () => {
    expect(pointeurs.length).toBeGreaterThan(20);
  });

  it("chaque pointeur vers une partie, une équipe ou un tour est rangé", () => {
    const fautes: string[] = [];
    for (const p of pointeurs) {
      const cle = `${p.table}.${p.colonne}`;
      const suit = suivent.get(p.table);
      if (p.cible === "rounds") {
        // Une ligne qui pointe vers un tour le suit dans l'archive : sa table doit être
        // de celles que la bascule déplace, pour que son équipe suive aussi.
        if (!suit) fautes.push(`${cle} : pointe vers un tour, sa table n'est pas dans SUIVENT_L_ESSAI`);
        continue;
      }
      const declaree = suit && [suit.partie?.name, suit.equipe?.name].includes(p.colonne);
      if (!declaree && !restent.has(cle)) {
        fautes.push(`${cle} : ni dans SUIVENT_L_ESSAI ni dans RESTENT_A_LA_PARTIE`);
      }
      if (declaree && restent.has(cle)) fautes.push(`${cle} : rangée deux fois`);
    }
    expect(fautes, fautes.join("\n")).toEqual([]);
  });

  it("aucune entrée ne désigne une colonne qui ne pointe vers rien (liste sans reste mort)", () => {
    const connus = new Set(pointeurs.map((p) => `${p.table}.${p.colonne}`));
    const fautes: string[] = [];
    for (const t of SUIVENT_L_ESSAI) {
      const nom = nomSql(t.table);
      if (!t.partie && !t.equipe) fautes.push(`${nom} : ni partie ni équipe`);
      for (const c of [t.partie, t.equipe]) {
        if (c && !connus.has(`${nom}.${c.name}`)) fautes.push(`${nom}.${c.name} : pas un pointeur`);
      }
      if (!t.raison.trim()) fautes.push(`${nom} : sans raison`);
    }
    for (const r of RESTENT_A_LA_PARTIE) {
      const cle = `${nomSql(r.table)}.${r.colonne.name}`;
      if (!connus.has(cle)) fautes.push(`${cle} : pas un pointeur`);
      if (!r.raison.trim()) fautes.push(`${cle} : sans raison`);
    }
    expect(fautes, fautes.join("\n")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. Les lecteurs
// ---------------------------------------------------------------------------

type Portee = "une partie" | "un élève" | "transversal";

/**
 * LE RECENSEMENT DES LECTEURS DE TOURS ET D'ÉTATS. Une ligne par fichier qui lit une
 * table de jeu, et la raison pour laquelle l'essai n'y compte pas.
 */
const LECTEURS: Record<string, { portee: Portee; raison: string }> = {
  "src/app/api/games/[gameId]/round-status/route.ts": {
    portee: "une partie",
    raison: "l'état du tour courant d'UNE partie, pour l'arène qui attend",
  },
  "src/app/api/games/[gameId]/submissions/route.ts": {
    portee: "une partie",
    raison: "qui a rendu, dans UNE partie, pour l'enseignant",
  },
  "src/app/lti/eleve/page.tsx": { portee: "une partie", raison: "la partie que l'activité LTI ouvre" },
  "src/lti/aiguillage.ts": { portee: "une partie", raison: "la partie que l'activité LTI ouvre" },
  "src/lti/liens.ts": { portee: "une partie", raison: "la partie reliée à l'activité, jamais son archive" },
  "src/lti/ags/envois.ts": {
    portee: "une partie",
    raison: "la progression d'UNE partie reliée à l'activité, vers le carnet de notes ; rien pendant l'essai",
  },
  "src/saml/parties.ts": { portee: "un élève", raison: "les parties d'un étudiant, par ses équipes" },
  "src/services/acces.service.ts": {
    portee: "transversal",
    raison: "les parties en cours d'un établissement, pour le plafond de la licence",
  },
  "src/services/admin.service.ts": {
    portee: "transversal",
    raison: "les comptes de l'administration, par établissement",
  },
  "src/services/affectation.service.ts": { portee: "une partie", raison: "la composition des équipes d'une partie" },
  "src/services/cockpit.service.ts": { portee: "une partie", raison: "le cockpit d'une partie" },
  "src/services/competition.service.ts": {
    portee: "une partie",
    raison: "les parties d'une étape de concours : jamais de tour d'essai",
  },
  "src/services/debrief.service.ts": { portee: "une partie", raison: "le débrief d'une partie" },
  "src/services/examen.service.ts": {
    portee: "une partie",
    raison: "les copies d'un examen : des parties solo, jamais de tour d'essai",
  },
  "src/services/game-creation.service.ts": {
    portee: "transversal",
    raison: "le plafond des parties publiques par adresse ; le reste lit UNE partie",
  },
  "src/services/game-view.service.ts": { portee: "une partie", raison: "l'arène d'une partie : son classement, son bilan" },
  "src/services/game.service.ts": {
    portee: "transversal",
    raison: "la liste des parties de l'enseignant ; le reste lit UNE partie",
  },
  "src/services/gazette.service.ts": { portee: "une partie", raison: "la Gazette d'une partie, lue dans son profil" },
  "src/services/inscrits.service.ts": {
    portee: "transversal",
    raison: "le nombre de parties de classe de chaque enseignant (administration)",
  },
  "src/services/merite.service.ts": {
    portee: "une partie",
    raison: "« mérite ou chance » rejoue UNE partie, depuis sa graine et ses états de départ",
  },
  "src/services/mesure-analyse.service.ts": {
    portee: "transversal",
    raison: "les mesures d'analyse de toutes les parties solo",
  },
  "src/services/observation.service.ts": { portee: "une partie", raison: "l'observation de séance d'une partie" },
  "src/services/pairs.service.ts": {
    portee: "une partie",
    raison: "l'évaluation entre coéquipiers d'une partie ; aucun moment atteint pendant l'essai",
  },
  "src/services/partie-en-cours.service.ts": { portee: "un élève", raison: "la partie en cours d'un élève, par ses équipes" },
  "src/services/pedagogy-reporting.service.ts": {
    portee: "transversal",
    raison: "le carnet d'usage de l'enseignant ; le relevé et les situations lisent UNE partie",
  },
  "src/services/pedagogy.service.ts": {
    portee: "transversal",
    raison: "le carnet d'usage de l'enseignant ; le débrief lit UN tour",
  },
  "src/services/preuves-dusage.service.ts": {
    portee: "transversal",
    raison: "les comptes publics de la plateforme (tours, parties, décisions)",
  },
  "src/services/profile.service.ts": {
    portee: "un élève",
    raison: "le profil et le record d'un élève, par ses équipes",
  },
  "src/services/reprise.service.ts": { portee: "un élève", raison: "le code de reprise d'un élève dans une partie" },
  "src/services/round-resolution.service.ts": { portee: "une partie", raison: "la résolution du tour d'une partie" },
  "src/services/scoring.service.ts": { portee: "une partie", raison: "le score d'un tour et le classement d'une partie" },
  "src/services/situation-instance.service.ts": { portee: "une partie", raison: "les situations d'un tour" },
  "src/services/subvention.service.ts": { portee: "une partie", raison: "les subventions d'une partie" },
  "src/services/tour-d-essai.service.ts": { portee: "une partie", raison: "la bascule et la relecture de l'essai" },
};

const FILTRES = /\b(horsArchivesDEssai|partieQuiCompte|tourQuiCompte)\b/;

/** Les tables de jeu, sous le nom que le code TypeScript leur donne. */
const TABLES_DE_JEU = TABLES.filter(([, t]) => {
  const nom = nomSql(t);
  return (
    DE_JEU.has(nom) ||
    SUIVENT_L_ESSAI.some((s) => nomSql(s.table) === nom) ||
    // Ce que joue un élève, et ce qui suit les situations par cascade.
    ["players", "game_recoveries", "hint_usages", "model_choices"].includes(nom)
  );
}).map(([nom]) => nom);
const LECTURE = new RegExp(`\\.from\\((${TABLES_DE_JEU.join("|")})\\)|Join\\((${TABLES_DE_JEU.join("|")}),`, "g");

function sources(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...sources(chemin));
    else if (/\.tsx?$/.test(entree)) trouves.push(chemin);
  }
  return trouves;
}
const FICHIERS = sources("src").map((f) => f.replace(/\\/g, "/"));

describe("2. les lecteurs de tours et d'états sont recensés", () => {
  const lecteurs = FICHIERS.filter((f) => new RegExp(LECTURE.source).test(readFileSync(f, "utf8")));

  it("le recensement voit des lecteurs (sinon il ne garde rien)", () => {
    expect(TABLES_DE_JEU).toContain("roundResults");
    expect(lecteurs.length).toBeGreaterThan(20);
  });

  it("chaque fichier qui lit une table de jeu est recensé, avec sa portée", () => {
    const absents = lecteurs.filter((f) => !LECTEURS[f]);
    expect(
      absents,
      `lecteurs non recensés : dites s'ils lisent une partie, un élève, ou plusieurs parties\n${absents.join("\n")}`,
    ).toEqual([]);
  });

  it("le recensement ne garde pas de fichier qui ne lit plus rien", () => {
    const morts = Object.keys(LECTEURS).filter((f) => !lecteurs.includes(f));
    expect(morts, morts.join("\n")).toEqual([]);
  });

  it("chaque lecteur transversal écarte les archives d'essai", () => {
    const fautes = Object.entries(LECTEURS)
      .filter(([, l]) => l.portee === "transversal")
      .filter(([f]) => !FILTRES.test(readFileSync(f, "utf8")))
      .map(([f]) => f);
    expect(fautes, `ces lecteurs transversaux comptent les archives d'essai :\n${fautes.join("\n")}`).toEqual([]);
  });

  /**
   * LA GARDE REQUÊTE PAR REQUÊTE. Le recensement par fichier ne voit pas une requête
   * transversale ajoutée dans un fichier « une partie ». Chaque lecture d'une table de
   * jeu dit donc, dans son `where`, ce qu'elle épingle : une partie, une équipe, un
   * tour, une situation, un élève, une étape de concours, un examen. Sinon, elle passe
   * par un filtre des archives.
   */
  it("chaque requête épingle une partie, une équipe, un tour ou un élève, ou filtre les archives", () => {
    const EPINGLE =
      /\b\w+\.(id|gameId|teamId|roundId|joinCode|essaiDe|competitionStageId|situationInstanceId|userId|examenId|recoveryCode)\b/;
    const fautes: string[] = [];
    for (const f of lecteurs) {
      const source = readFileSync(f, "utf8");
      for (const m of source.matchAll(new RegExp(`\\.from\\((${TABLES_DE_JEU.join("|")})\\)`, "g"))) {
        const suite = source.slice(m.index! + m[0].length);
        const fin = Math.min(
          ...[suite.indexOf(";"), suite.search(/\n\s+db\b/)].filter((i) => i >= 0),
          600,
        );
        const requete = suite.slice(0, fin);
        const where = requete.includes(".where(") ? requete.slice(requete.indexOf(".where(")) : "";
        if (!EPINGLE.test(where) && !FILTRES.test(where)) {
          fautes.push(`${f} : ${m[0]}${requete.replace(/\s+/g, " ").slice(0, 120)}`);
        }
      }
    }
    expect(fautes, `requêtes qui lisent plusieurs parties sans filtre :\n${fautes.join("\n")}`).toEqual([]);
  });
});
