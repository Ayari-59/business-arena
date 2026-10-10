import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { EPISODES } from "../../src/pedagogy/episodes/registre";
import { FICHES } from "../../src/config/episodes/fiches";
import { NAVIGATION } from "../../src/config/navigation";
import { lectureDuTirage } from "../../src/pedagogy/profil/retour";

/**
 * DANS LES ÉPISODES, « HASARD » OU « ALÉAS » SELON LE SENS.
 *
 * Le propriétaire : « Aléas ou hasard, ce n'est pas une question de choix,
 * mais de savoir les utiliser selon le contexte. » Un remplacement global
 * avait mis « aléa(s) » partout ; chaque occurrence a été reprise :
 * - « le hasard » : la chance, la part de ce qui ne dépend pas de vous, et la
 *   locution de tirage (« ce qui relevait du hasard », « le hasard vous a
 *   coûté », « ne dépend pas du hasard », « trente tirages au hasard ») ;
 * - « les aléas » : les ÉVÉNEMENTS qui arrivent pendant le trimestre (« Ce que
 *   les aléas vous ont réservé », « les mêmes aléas », « rejouer avec
 *   d'autres aléas », « sous les aléas que vous avez joués ») ;
 * - « tirage n° 12 » : l'identifiant d'un tirage d'événements (ni « hasard
 *   n° 12 » ni « aléa n° 12 »).
 *
 * Cette garde tient le SENS, pas un mot : (1) le numéro de tirage s'écrit
 * « tirage » ; (2) chaque gabarit connu dit le mot de sa catégorie, et ses
 * formes fausses n'apparaissent nulle part ; (3) plus aucun « aléa n° ».
 *
 * CE QUI N'EST PAS DU TEXTE n'est jamais compté : les identifiants
 * (`hasard(graine)`, `hasardDuDebrief`, `Hasard`), le paramètre d'adresse
 * `?hasard=12` (des liens déjà distribués aux classes le portent), les ancres
 * (`#hasard-titre`), les noms de fichiers, et les commentaires.
 *
 * DEUX RELEVÉS. (1) Le contenu évalué : chaque épisode du registre, chaque
 * fiche enseignant, les liens de menu vers les épisodes et la lecture du
 * tirage du profil, parcourus en profondeur. (2) Le source : dans les fichiers
 * du périmètre, l'analyseur de TypeScript donne les seules chaînes (littéraux,
 * morceaux de gabarits, texte JSX) ; les textes composés par une fonction,
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

/** Le mot en texte : ni collé à un identifiant, ni paramètre (`?hasard=`), ni ancre (`#hasard-titre`). */
const AVANT = String.raw`(?<![\p{L}\p{N}_?&#/-])`;

/**
 * (1) Un numéro de tirage écrit « hasard » ou « aléa » : « hasard n° 12 », « l'aléa 2 »,
 * « · hasard n°{" "} » (en JSX, le numéro suit dans une expression). Le mot juste est « tirage ».
 */
const NUMERO_FAUX = new RegExp(`${AVANT}(?:hasards?|aléas?)\\s+(?:n°|\\d)`, "u");

/** (3) « aléa n° » sous toutes ses formes. */
const ALEA_NUMERO = /aléas?\s*n°/u;

/** Une chaîne qui n'est qu'un identifiant (`"hasard"`, une clé, un id) n'est pas du texte. */
const IDENTIFIANT = /^[a-z][\w-]*$/;

/** Le texte tel qu'on le lit : apostrophe JSX rendue, blancs (retours à la ligne JSX) réduits. */
function lu(texte: string): string {
  return texte.replace(/&apos;/g, "'").replace(/\s+/g, " ");
}

/** Occurrences d'un motif dans un texte lu, sans tenir compte de la casse. */
function compte(texte: string, motif: RegExp): number {
  if (IDENTIFIANT.test(texte)) return 0;
  return lu(texte).match(new RegExp(motif.source, "giu"))?.length ?? 0;
}

/**
 * (2) LES GABARITS CLASSÉS. Chacun : sa catégorie, sa forme juste (lue au moins `auMoins` fois
 * dans le relevé nommé ; `"episodes"` quand elle revient une fois par épisode) et ses formes
 * fausses (lues nulle part, dans aucun des deux relevés).
 */
type Gabarit = {
  nom: string;
  categorie: "ÉVÉNEMENTS" | "CHANCE" | "TIRAGE" | "TIRAGE AU SORT";
  juste: RegExp;
  faux: RegExp[];
  releve: "contenu" | "source";
  auMoins: number | "episodes";
};

const GABARITS: Gabarit[] = [
  // ÉVÉNEMENTS → « aléas »
  {
    nom: "réflexe « Rejouez l'épisode avec d'autres aléas et les mêmes décisions »",
    categorie: "ÉVÉNEMENTS",
    juste: /Rejouez l'épisode avec d'autres aléas et les mêmes décisions/,
    faux: [/sous un autre (?:hasard|aléa)(?!\p{L})/u, /avec un autre (?:hasard|aléa)(?!\p{L})/u],
    releve: "source", // l'axe de travail est composé par une fonction de chaque épisode
    auMoins: "episodes",
  },
  {
    nom: "note des barres « sous les aléas que vous avez joués »",
    categorie: "ÉVÉNEMENTS",
    juste: /sous les aléas que vous avez joués/,
    faux: [/(?:le|du) hasard que vous avez/, /l'aléa que vous avez/, /les aléas que vous avez joué(?!\p{L})/u],
    releve: "contenu",
    auMoins: "episodes",
  },
  {
    nom: "fiche enseignant « toute la classe joue le même trimestre, sous les mêmes aléas »",
    categorie: "ÉVÉNEMENTS",
    juste: /joue le même trimestre, sous les mêmes aléas\./,
    faux: [/sous le même (?:hasard|aléa)(?!\p{L})(?! \(n°)/u, /le même aléa(?!\p{L})/u],
    releve: "contenu",
    // 15 des 18 fiches ; les trois autres ne parlent que du « même trimestre ».
    auMoins: 15,
  },
  {
    nom: "bilan « Ce que les aléas vous ont réservé »",
    categorie: "ÉVÉNEMENTS",
    juste: /Ce que les aléas vous ont réservé/,
    faux: [/Ce que le hasard vous a réservé/],
    releve: "source",
    auMoins: 1,
  },
  {
    nom: "bilan « Le même trimestre, les mêmes aléas, d'autres manières de décider »",
    categorie: "ÉVÉNEMENTS",
    juste: /Le même trimestre, les mêmes aléas, d'autres manières de décider/,
    faux: [/le même hasard, d'autres manières/],
    releve: "source",
    auMoins: 1,
  },
  {
    nom: "boutons « Rejouer avec d'autres aléas » et « Recommencer avec les mêmes aléas »",
    categorie: "ÉVÉNEMENTS",
    juste: /Rejouer avec d'autres aléas|Recommencer avec les mêmes aléas/,
    faux: [/Recommencer avec le même (?:hasard|aléa)(?!\p{L})/u],
    releve: "source",
    auMoins: 2,
  },
  {
    nom: "comparaison « Mêmes aléas pour les deux parties »",
    categorie: "ÉVÉNEMENTS",
    juste: /Mêmes aléas pour les deux parties|n'ont pas eu les mêmes aléas/,
    faux: [/Même (?:hasard|aléa) pour les deux parties/, /n'ont pas eu le même (?:hasard|aléa)(?!\p{L})/u],
    releve: "source",
    auMoins: 2,
  },
  // CHANCE → « hasard »
  {
    nom: "fiches enseignant « ne dépend pas du hasard »",
    categorie: "CHANCE",
    juste: /ne dépend (?:pas|ni) du hasard/,
    faux: [/ne dépend (?:pas|ni) des aléas/],
    releve: "contenu",
    auMoins: 15,
  },
  {
    nom: "bilan « le hasard vous a apporté / coûté », « pas ce hasard »",
    categorie: "CHANCE",
    juste: /le hasard vous a |pas ce hasard\./,
    faux: [/les aléas vous ont (?!réservé)/, /pas ces aléas/],
    releve: "source",
    auMoins: 2,
  },
  {
    nom: "bilan « ce qui relevait du choix, ce qui relevait du hasard »",
    categorie: "CHANCE",
    juste: /ce qui relevait du choix, ce qui relevait du hasard/,
    faux: [/ce qui relevait des aléas/],
    releve: "source",
    auMoins: 1,
  },
  {
    nom: "menu et page « un bilan qui sépare la qualité des décisions du hasard »",
    categorie: "CHANCE",
    juste: /sépare la qualité des décisions du hasard/,
    faux: [/sépare la qualité des décisions des aléas/],
    releve: "source",
    auMoins: 1,
  },
  {
    nom: "robustesse « quand le hasard tourne mal » (profil, retour, familles d'options)",
    categorie: "CHANCE",
    juste: /quand le hasard tourne mal/,
    faux: [/quand les aléas tournent mal/],
    releve: "source",
    auMoins: 3,
  },
  {
    nom: "fiches enseignant « le hasard pèse lourd »",
    categorie: "CHANCE",
    juste: /le hasard pèse (?:très )?lourd/,
    faux: [/les aléas pèsent/],
    releve: "contenu",
    auMoins: 4,
  },
  {
    nom: "fiches enseignant « dû à vos décisions ou au hasard », « quel que soit le hasard »",
    categorie: "CHANCE",
    juste: /décisions ou au hasard|quel que soit le hasard/,
    faux: [/ou aux aléas \?/, /quels que soient les aléas/],
    releve: "contenu",
    auMoins: 2,
  },
  // TIRAGE numéroté ou identifié → « tirage »
  {
    nom: "numéro de tirage « tirage n° » (bilan, fiche enseignant)",
    categorie: "TIRAGE",
    juste: /· tirage n°|sous le même tirage \(n°/,
    faux: [/sous le même (?:hasard|aléa) \(n°/],
    releve: "source",
    auMoins: 3,
  },
  {
    nom: "fiches enseignant « sous le tirage de la classe », « sous ce tirage »",
    categorie: "TIRAGE",
    juste: /sous le tirage de la classe|sous ce tirage/,
    faux: [/sous (?:le |l')(?:hasard|aléa) de la classe/, /sous (?:ce hasard|cet aléa)(?!\p{L})/u],
    releve: "contenu",
    auMoins: 10,
  },
  // TIRAGE AU SORT → « au hasard »
  {
    nom: "« trente tirages au hasard » (bilan, profil, présentation)",
    categorie: "TIRAGE AU SORT",
    juste: /tirages? au hasard/,
    faux: [/tirages? des (?:mêmes )?aléas/, /tirages? du (?:même )?hasard/],
    releve: "source",
    auMoins: 7,
  },
];

function fichiers(dossier: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(dossier)) {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin));
    else if (/\.(ts|tsx)$/.test(entree)) trouves.push(chemin);
  }
  return trouves;
}

type Chaine = { ou: string; texte: string };

/** Les chaînes du source : littéraux, gabarits, texte JSX ; pas les chemins d'import. */
function chainesDuSource(chemin: string): Chaine[] {
  const source = readFileSync(chemin, "utf8");
  const fichier = ts.createSourceFile(
    chemin,
    source,
    ts.ScriptTarget.Latest,
    true,
    chemin.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const nom = relative(RACINE, chemin).split(sep).join("/");
  const sortie: Chaine[] = [];
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
        ou: `${nom}:${fichier.getLineAndCharacterOfPosition(debut).line + 1}`,
        texte: n.text,
      });
    }
    ts.forEachChild(n, visiter);
  };
  visiter(fichier);
  return sortie;
}

/** Toutes les chaînes d'une valeur, en profondeur (les fonctions sont lues par le relevé du source). */
function chainesDe(valeur: unknown, chemin: string, vues = new WeakSet<object>()): Chaine[] {
  const sortie: Chaine[] = [];
  if (typeof valeur === "string") sortie.push({ ou: chemin, texte: valeur });
  else if (valeur && typeof valeur === "object") {
    if (vues.has(valeur)) return sortie;
    vues.add(valeur);
    for (const [cle, v] of Object.entries(valeur)) sortie.push(...chainesDe(v, `${chemin}.${cle}`, vues));
  }
  return sortie;
}

function releveDuContenu(): Chaine[] {
  const liensEpisodes = NAVIGATION.flatMap((g) => g.liens).filter((l) =>
    /^\/(entreprises\/episode|enseignants\/episodes)/.test(l.href),
  );
  return [
    ...EPISODES.flatMap((ep) => chainesDe(ep, `épisode ${ep.code}`)),
    ...FICHES.flatMap((f) => chainesDe(f, `fiche ${f.code}`)),
    ...chainesDe(liensEpisodes, "menu"),
    ...Array.from({ length: 30 }, (_, i) => ({
      ou: `lectureDuTirage(${i + 1}, 30)`,
      texte: lectureDuTirage(i + 1, 30),
    })),
  ];
}

const CHEMINS = [
  ...DOSSIERS.flatMap((d) => fichiers(join(RACINE, d))),
  ...FICHIERS.map((f) => join(RACINE, f)),
];
const RELEVES = { contenu: releveDuContenu(), source: CHEMINS.flatMap(chainesDuSource) };

function fautifs(motif: RegExp): string[] {
  return [...RELEVES.contenu, ...RELEVES.source]
    .filter((c) => compte(c.texte, motif) > 0)
    .map((c) => `${c.ou} : ${lu(c.texte).trim().slice(0, 140)}`);
}

describe("« hasard » ou « aléas » selon le sens, dans le texte affiché des épisodes", () => {
  it("les deux relevés lisent vraiment le périmètre", () => {
    expect(EPISODES.length).toBeGreaterThanOrEqual(108);
    expect(RELEVES.contenu.length).toBeGreaterThan(10_000);
    expect(CHEMINS.length).toBeGreaterThan(300);
  });

  it("(1) le numéro de tirage s'écrit « tirage n° », jamais « hasard n° » ni « aléa n° »", () => {
    expect(fautifs(NUMERO_FAUX)).toEqual([]);
    // Et le mot juste est bien là, dans les fiches enseignant.
    const justes = RELEVES.contenu.filter((c) => compte(c.texte, /tirage n° \d/) > 0);
    expect(justes.length).toBeGreaterThan(10);
  });

  it.each(GABARITS.map((g) => [`${g.categorie} : ${g.nom}`, g] as const))("(2) %s", (_, g) => {
    const attendu = g.auMoins === "episodes" ? EPISODES.length : g.auMoins;
    const lus = RELEVES[g.releve].reduce((n, c) => n + compte(c.texte, g.juste), 0);
    expect(lus, `forme juste « ${g.juste.source} »`).toBeGreaterThanOrEqual(attendu);
    for (const faux of g.faux) expect(fautifs(faux), `forme fausse « ${faux.source} »`).toEqual([]);
  });

  it("(3) plus aucun « aléa n° »", () => {
    expect(fautifs(ALEA_NUMERO)).toEqual([]);
  });

  it("le filtre voit les formes fausses quand elles sont du texte, et seulement alors", () => {
    expect(compte("Bilan de l'épisode · niveau Standard · hasard n° 11", NUMERO_FAUX)).toBe(1);
    expect(compte("Bilan de l&apos;épisode · niveau Standard · aléa n°", NUMERO_FAUX)).toBe(1);
    expect(compte("L'aléa 2 est ordinaire", NUMERO_FAUX)).toBe(1);
    expect(compte("Sous le hasard 12, la bonne méthode", NUMERO_FAUX)).toBe(1);
    expect(compte("comparer au résultat sous l'aléa n° 12", ALEA_NUMERO)).toBe(1);
    expect(compte("Ce que les aléas vous ont réservé", ALEA_NUMERO)).toBe(0);
    // Ce qui n'est pas du texte : paramètre d'adresse, ancre, identifiant.
    expect(compte("Envoyez le lien /entreprises/episode/x?hasard=12 : toute la classe", NUMERO_FAUX)).toBe(0);
    expect(compte("#hasard-titre", NUMERO_FAUX)).toBe(0);
    expect(compte("hasard", NUMERO_FAUX)).toBe(0);
    // Le juste numéro passe.
    expect(compte("Bilan de l'épisode · niveau Standard · tirage n° 11", NUMERO_FAUX)).toBe(0);
    // Les gabarits voient leurs formes fausses, retours à la ligne JSX compris, et pas les justes.
    const reflexe = GABARITS[0]!;
    expect(compte("Rejouez l'épisode sous un autre\n  hasard avec les mêmes décisions.", reflexe.faux[0]!)).toBe(1);
    expect(compte("Rejouez l'épisode avec d'autres aléas et les mêmes décisions.", reflexe.faux[0]!)).toBe(0);
    expect(compte("Rejouez l'épisode avec d'autres aléas et les mêmes décisions.", reflexe.juste)).toBe(1);
    const chance = GABARITS.find((g) => g.juste.source.includes("relevait du hasard"))!;
    expect(compte("ce qui relevait du choix, ce qui relevait\n          des aléas", chance.faux[0]!)).toBe(1);
    const evenements = GABARITS.find((g) => g.juste.source.startsWith("Ce que les aléas"))!;
    expect(compte("Ce que le hasard vous a réservé", evenements.faux[0]!)).toBe(1);
  });
});
