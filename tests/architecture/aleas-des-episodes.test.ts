import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { EPISODES } from "../../src/pedagogy/episodes/registre";
import { FICHES } from "../../src/config/episodes/fiches";
import { NAVIGATION } from "../../src/config/navigation";
import { lectureDuTirage } from "../../src/pedagogy/profil/retour";

/**
 * DANS LES ÉPISODES, ON PARLE D'ALÉAS, PAS DE HASARD.
 *
 * Demande du propriétaire : « Dans les épisodes, remplacer le mot hasard par
 * le mot aléas. » Relevé avant le changement : 416 occurrences de « hasard »
 * dans le texte affiché du périmètre des épisodes (jeu, bilan, réflexes,
 * mesures, fiches enseignant, débrief, profil décisionnel, pages joueur et
 * animateur) ; il en reste 25 dans les chaînes, toutes paramètre d'adresse,
 * ancre ou clé.
 * Cette garde empêche le mot de revenir dans un texte AFFICHÉ.
 *
 * CE QUI RESTE PERMIS, parce que ce n'est pas du texte lu : les identifiants
 * (`hasard(graine)`, `hasardDuDebrief`, `Hasard`), le paramètre d'adresse
 * `?hasard=12` (des liens déjà distribués aux classes le portent), les ancres
 * (`#hasard-titre`), les noms de fichiers, et les commentaires.
 *
 * DEUX RELEVÉS. (1) Le contenu évalué : chaque épisode du registre, chaque
 * fiche enseignant et les liens de menu vers les épisodes sont parcourus en
 * profondeur, et chaque chaîne est lue. (2) Le source : dans les fichiers du
 * périmètre, l'analyseur de TypeScript donne les seules chaînes (littéraux,
 * morceaux de gabarits, texte JSX) — les textes composés par une fonction,
 * que le premier relevé ne voit pas, sont pris ici.
 *
 * Hors épisodes (arène, ateliers, scénarios, fiches de l'arène, accueil), le
 * mot reste ce qu'il est : cette garde ne les lit pas.
 */

const RACINE = process.cwd();

/** Le périmètre des épisodes : dossiers entiers, et pages qui ne parlent que d'eux. */
const DOSSIERS = [
  "src/config/episodes",
  "src/engine/episodes",
  "src/pedagogy/episodes",
  "src/pedagogy/profil",
  "src/components/episode",
  "src/app/entreprises/episode",
  "src/app/enseignants/episodes",
];
/** La page des écoles présente les épisodes : ses phrases sur le bilan en font partie. */
const FICHIERS = ["src/app/ecoles/page.tsx"];

/**
 * « hasard » ou « hasards » en mot de texte : ni collé à un identifiant (`hasardDuDebrief`,
 * `cheminAuHasard`), ni paramètre (`?hasard=`), ni ancre (`#hasard-titre`).
 */
const MOT = /(?<![\p{L}\p{N}_?&#/-])hasards?(?![\p{L}\p{N}_=-])/giu;

/** Une chaîne qui n'est qu'un identifiant (`"hasard"`, une clé, un id) n'est pas du texte. */
const IDENTIFIANT = /^[a-z][\w-]*$/;

function fautes(texte: string): number {
  if (IDENTIFIANT.test(texte)) return 0;
  return texte.match(MOT)?.length ?? 0;
}

function fichiers(dossier: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(dossier)) {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin));
    else if (/\.(ts|tsx)$/.test(entree)) trouves.push(chemin);
  }
  return trouves;
}

/** Les chaînes du source : littéraux, gabarits, texte JSX ; pas les chemins d'import. */
function chainesDuSource(chemin: string): { ligne: number; texte: string }[] {
  const source = readFileSync(chemin, "utf8");
  const fichier = ts.createSourceFile(
    chemin,
    source,
    ts.ScriptTarget.Latest,
    true,
    chemin.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const sortie: { ligne: number; texte: string }[] = [];
  const visiter = (n: ts.Node) => {
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) return;
    if (
      ts.isStringLiteral(n) ||
      ts.isNoSubstitutionTemplateLiteral(n) ||
      ts.isTemplateHead(n) ||
      ts.isTemplateMiddle(n) ||
      ts.isTemplateTail(n) ||
      ts.isJsxText(n)
    ) {
      const debut = ts.isJsxText(n) ? n.pos : n.getStart(fichier);
      sortie.push({
        ligne: fichier.getLineAndCharacterOfPosition(debut).line + 1,
        texte: n.text,
      });
    }
    ts.forEachChild(n, visiter);
  };
  visiter(fichier);
  return sortie;
}

/** Toutes les chaînes d'une valeur, en profondeur (les fonctions sont lues par le relevé du source). */
function chainesDe(valeur: unknown, chemin: string, vues = new WeakSet<object>()) {
  const sortie: { ou: string; texte: string }[] = [];
  if (typeof valeur === "string") sortie.push({ ou: chemin, texte: valeur });
  else if (valeur && typeof valeur === "object") {
    if (vues.has(valeur)) return sortie;
    vues.add(valeur);
    for (const [cle, v] of Object.entries(valeur)) sortie.push(...chainesDe(v, `${chemin}.${cle}`, vues));
  }
  return sortie;
}

describe("le mot « hasard » dans le texte affiché des épisodes", () => {
  it("n'apparaît dans aucune chaîne du contenu évalué : épisodes, fiches enseignant, menu", () => {
    const liensEpisodes = NAVIGATION.flatMap((g) => g.liens).filter((l) =>
      /^\/(entreprises\/episode|enseignants\/episodes)/.test(l.href),
    );
    const chaines = [
      ...EPISODES.flatMap((ep) => chainesDe(ep, `épisode ${ep.code}`)),
      ...FICHES.flatMap((f) => chainesDe(f, `fiche ${f.code}`)),
      ...chainesDe(liensEpisodes, "menu"),
      ...Array.from({ length: 30 }, (_, i) => ({
        ou: `lectureDuTirage(${i + 1}, 30)`,
        texte: lectureDuTirage(i + 1, 30),
      })),
    ];
    // Le relevé lit vraiment le contenu : les 108 épisodes et leurs milliers de chaînes.
    expect(EPISODES.length).toBeGreaterThanOrEqual(108);
    expect(chaines.length).toBeGreaterThan(10_000);
    const fautifs = chaines
      .filter((c) => fautes(c.texte) > 0)
      .map((c) => `${c.ou} : ${c.texte.slice(0, 120)}`);
    expect(fautifs).toEqual([]);
  });

  it("n'apparaît dans aucune chaîne du source du périmètre (littéraux, gabarits, texte JSX)", () => {
    const chemins = [
      ...DOSSIERS.flatMap((d) => fichiers(join(RACINE, d))),
      ...FICHIERS.map((f) => join(RACINE, f)),
    ];
    expect(chemins.length).toBeGreaterThan(300);
    const fautifs: string[] = [];
    for (const chemin of chemins) {
      for (const { ligne, texte } of chainesDuSource(chemin)) {
        if (fautes(texte) > 0) {
          const nom = relative(RACINE, chemin).split(sep).join("/");
          fautifs.push(`${nom}:${ligne} : ${texte.trim().slice(0, 120)}`);
        }
      }
    }
    expect(fautifs).toEqual([]);
  });

  it("la garde voit bien le mot quand il est du texte, et seulement alors", () => {
    expect(fautes("Rejouez l'épisode sous un autre hasard.")).toBe(1);
    expect(fautes("Le hasard pèse lourd")).toBe(1);
    expect(fautes("Hasard")).toBe(1);
    expect(fautes("sous deux hasards différents")).toBe(1);
    expect(fautes("hasard")).toBe(0); // un paramètre lu par `searchParams.get`
    expect(fautes("hasard-titre")).toBe(0);
    expect(fautes("#hasard-titre")).toBe(0);
    expect(fautes("Envoyez le lien /entreprises/episode/x?hasard=12 : sous le même aléa.")).toBe(0);
    expect(fautes("Rejouez l'épisode sous un autre aléa.")).toBe(0);
  });
});
