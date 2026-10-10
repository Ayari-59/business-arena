import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LA VOIX DU PRODUIT (lot P1) : L'ORANGE N'EST QUE L'ACTION, ET LES TITRES SE
 * POSENT.
 *
 * L'audit « cap premium » relevait que le produit parlait comme une affiche
 * de compétition : titres en condensé extra-gras italique capitale, pastille
 * de contexte orange inclinée, plus de cent libellés en capitales espacées,
 * et un orange employé à tout (la première pastille de progression de
 * l'ardoise, la catégorie et la question d'une situation, le lien « Lire »,
 * la capacité d'ATLAS, les chevrons des replis, les liens). Sur un écran
 * haut de gamme, la couleur d'action est rare, donc précieuse.
 *
 * LA RÈGLE, ET CE QUE CETTE GARDE FIGE, dans le périmètre du lot (tout ce que
 * dessinent l'arène, la vitrine, /jouer et le gabarit commun : la fermeture
 * des imports de ces routes, dans `src/components` et `src/app`) :
 *
 *   1. L'ORANGE (`amber-*`, `orange-*`, `--accent-plein`, `accent-arena`) ne
 *      sert qu'à quatre choses, et à la marque :
 *        · le BOUTON PRINCIPAL (la variante `principal` de `bouton()`) ;
 *        · l'ANNEAU DE FOCUS (les utilitaires `focus:`) ;
 *        · l'OPTION COCHÉE d'un formulaire (règle du lot 6E : une décision),
 *          dite par `has-[:checked]:` ou par une tuile `aria-pressed` ;
 *        · le CHAMP EN SAISIE, dont la couleur d'accent native (`accent-*`)
 *          peint la case cochée, le bouton radio choisi et la part parcourue
 *          d'un curseur ;
 *        · la MARQUE : le logo du pied de page (pictogramme et « ARENA »).
 *      Tout le reste passe à l'encre, à la teinte du métier ou à l'or.
 *   2. Les TITRES ne prennent ni le condensé, ni l'italique, ni les capitales,
 *      et la pastille de contexte (`.surtitre-arene`) n'est plus inclinée ni
 *      orange.
 *   3. Les CAPITALES ESPACÉES n'ont plus qu'un niveau, le surtitre
 *      (`.surtitre`) ; le reste est un libellé (`.libelle`). Les trois
 *      `uppercase` qui restent sont nommés ci-dessous, avec leur raison.
 */

const RACINE = process.cwd();
const SRC = join(RACINE, "src");

function tous(dossier: string): string[] {
  return readdirSync(dossier).flatMap((e) => {
    const c = join(dossier, e);
    return statSync(c).isDirectory() ? tous(c) : /\.tsx?$/.test(e) ? [c] : [];
  });
}

function resoudre(depuis: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(depuis), spec);
  else return null;
  for (const c of [`${base}.tsx`, `${base}.ts`, join(base, "index.tsx"), join(base, "index.ts")]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

/** Le périmètre : la fermeture des imports de l'arène, de la vitrine, de /jouer et du gabarit. */
function perimetre(): string[] {
  const departs = [
    ...tous(join(SRC, "app/arena")),
    join(SRC, "app/page.tsx"),
    ...tous(join(SRC, "app/jouer")),
    join(SRC, "app/layout.tsx"),
  ];
  const vus = new Set<string>();
  const pile = [...departs];
  while (pile.length) {
    const f = pile.pop()!;
    if (vus.has(f)) continue;
    vus.add(f);
    const s = readFileSync(f, "utf8");
    for (const m of s.matchAll(
      /(?:import|export)[\s\S]*?from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g,
    )) {
      const r = resoudre(f, (m[1] ?? m[2])!);
      if (r && !vus.has(r)) pile.push(r);
    }
  }
  return [...vus].filter((f) => /\/src\/(?:components|app)\//.test(f)).sort();
}

/** Le code sans ses commentaires : un commentaire qui raconte l'ancien orange n'est pas du style. */
const code = (source: string) =>
  source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

const PERIMETRE = perimetre().map((f) => ({
  nom: f.slice(SRC.length + 1),
  code: code(readFileSync(f, "utf8")),
}));

/** Une classe ou un jeton d'orange : l'échelle `amber` de la maison, l'orange de Tailwind, l'accent. */
const ORANGE = /[\w:[\]/-]*\b(?:amber|orange)-\d{2,3}\b[\w/[\]]*|accent-plein[\w-]*|\baccent-arena\b|--accent[\w-]*/g;

/**
 * LES CONTEXTES PERMIS, un par usage, et chacun dit pourquoi. Une occurrence
 * d'orange passe si elle répond à l'un d'eux ; toute autre fait tomber la garde.
 */
const PERMIS: { nom: string; fichier?: RegExp; classe: RegExp; ligne?: RegExp }[] = [
  {
    nom: "le bouton principal, et lui seul, dans la fonction des boutons",
    fichier: /^components\/bouton\.ts$/,
    classe: /^(?:bg-amber-400|hover:bg-amber-300)$/,
    ligne: /^\s*principal: "bouton-plein /,
  },
  {
    nom: "l'anneau de focus (le lien d'évitement n'existe qu'au focus clavier)",
    classe: /^focus:/,
  },
  {
    nom: "l'option cochée d'un formulaire : une décision (lot 6E)",
    classe: /^has-\[:checked\]:(?:border|bg)-amber-400\/\d+$/,
  },
  {
    nom: "le champ en saisie : la couleur d'accent native d'une case, d'un radio, d'un curseur",
    classe: /^accent-amber-[45]00$/,
  },
  {
    nom: "l'option choisie d'une tuile (bouton `aria-pressed` ou radio caché) : une décision",
    fichier: /^components\/(?:quick-config-form|team-name-form)\.tsx$/,
    classe: /^(?:border-amber-400(?:\/\d+)?|bg-amber-400\/10|ring-amber-400\/\d+)$/,
    ligne: /border-amber-400(?:\/\d+)? bg-amber-400\/10/,
  },
  {
    // Lot P2 : la carte photo d'une entreprise sur /jouer. Plus de voile
    // (`bg-amber-400/10`) : un filet orange plein (bord et anneau), sous ce
    // seul nom, posé sur un bouton `aria-pressed` (voir plus bas).
    nom: "l'option choisie d'une carte d'entreprise : son filet plein, sous un nom unique",
    fichier: /^components\/quick-config-form\.tsx$/,
    classe: /^(?:border-amber-400|ring-amber-400)$/,
    ligne: /^const OPTION_COCHEE_CARTE = "border-amber-400 ring-1 ring-amber-400";$/,
  },
  {
    // Lot P2, décision du propriétaire : la seconde ligne du héros de la
    // vitrine (« Apprenez à décider. ») retrouve l'orange de la marque.
    // EXCEPTION VOULUE ET NOMMÉE à « l'orange n'est que l'action » : un seul
    // élément, identifié par son attribut, et une seule fois dans le site.
    nom: "l'exception nommée : la seconde ligne du héros de la vitrine",
    fichier: /^app\/page\.tsx$/,
    classe: /^text-amber-400$/,
    ligne: /<span data-exception-orange="heros-de-la-vitrine" className="text-amber-400">/,
  },
  {
    nom: "la marque : le pictogramme et « ARENA » du logo, au pied de page",
    fichier: /^components\/pied-de-page\.tsx$/,
    classe: /^(?:text-amber-400|accent-arena)$/,
    ligne: /<BrandMark |<span className="accent-arena">ARENA<\/span>/,
  },
];

describe("l'orange n'est que l'action (lot P1)", () => {
  it("le périmètre est bien celui de l'arène, de la vitrine et de /jouer", () => {
    const noms = PERIMETRE.map((f) => f.nom);
    expect(noms.length, "le calcul du périmètre ne trouve plus ses fichiers").toBeGreaterThan(80);
    for (const attendu of [
      "app/arena/[gameId]/page.tsx",
      "app/page.tsx",
      "app/jouer/page.tsx",
      "components/decision-form.tsx",
      "components/situation-panel.tsx",
      "components/tableau-de-bord.tsx",
      "components/bilan-de-partie.tsx",
      "components/verdict-du-marche.tsx",
      "components/courrier.tsx",
      "components/site-header.tsx",
    ]) {
      expect(noms, attendu).toContain(attendu);
    }
  });

  it("chaque orange du périmètre répond à un contexte permis", () => {
    const fautes: string[] = [];
    let permis = 0;
    for (const { nom, code: source } of PERIMETRE) {
      source.split("\n").forEach((ligne, i) => {
        for (const m of ligne.matchAll(ORANGE)) {
          const classe = m[0];
          const ok = PERMIS.some(
            (p) =>
              (!p.fichier || p.fichier.test(nom)) &&
              p.classe.test(classe) &&
              (!p.ligne || p.ligne.test(ligne)),
          );
          if (ok) permis++;
          else fautes.push(`${nom}:${i + 1} ${classe}  ←  ${ligne.trim().slice(0, 110)}`);
        }
      });
    }
    expect(fautes, `orange hors de l'action :\n${fautes.join("\n")}`).toEqual([]);
    // La garde regarde vraiment quelque chose : le bouton, les cases, les tuiles.
    expect(permis).toBeGreaterThan(20);
  });

  it("l'exception orange du héros est unique, et la carte choisie est une option qu'on coche", () => {
    // Un seul porteur de l'attribut dans tout le périmètre.
    const exceptions = PERIMETRE.flatMap((f) =>
      (f.code.match(/data-exception-orange="([^"]+)"/g) ?? []).map((m) => `${f.nom} ${m}`),
    );
    expect(exceptions).toEqual(['app/page.tsx data-exception-orange="heros-de-la-vitrine"']);
    // Le filet plein de la carte choisie ne s'emploie que sur le bouton
    // `aria-pressed` des cartes d'entreprise.
    const config = PERIMETRE.find((f) => f.nom === "components/quick-config-form.tsx")!.code;
    const usages = config.match(/OPTION_COCHEE_CARTE/g) ?? [];
    expect(usages.length, "le filet de la carte choisie sert ailleurs").toBe(2);
    const bouton = config.slice(config.indexOf("data-carte-entreprise"), config.indexOf("OPTION_COCHEE_CARTE} bg-slate-950"));
    expect(bouton).toContain("aria-pressed={on}");
    // La coche est l'orange plein d'action, texte marine : une classe de la
    // feuille, qui ne sert qu'à elle.
    const css = readFileSync(join(SRC, "app/globals.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const coche = css.slice(css.indexOf("\n.coche-de-l-option {"));
    expect(coche.slice(0, coche.indexOf("}"))).toMatch(/background-color: var\(--accent-plein\);\s*color: var\(--accent-plein-texte\);/);
    const porteurs = PERIMETRE.filter((f) => f.code.includes("coche-de-l-option")).map((f) => f.nom);
    expect(porteurs).toEqual(["components/quick-config-form.tsx"]);
  });

  it("les tuiles qui gardent l'orange sont bien des options qu'on coche", () => {
    // Le choix du métier, du niveau et des réglages (boutons `aria-pressed`),
    // et l'emblème de l'équipe (un radio caché sous sa tuile).
    const options: Record<string, RegExp> = {
      "components/quick-config-form.tsx": /aria-pressed=/,
      "components/team-name-form.tsx": /type="radio"/,
    };
    for (const [nom, motif] of Object.entries(options)) {
      const source = PERIMETRE.find((f) => f.nom === nom)!.code;
      expect(source, `${nom} : une tuile orange qui n'est pas une option`).toMatch(motif);
    }
  });

  it("dans la feuille, plus d'orange hors de l'action là où le lot l'a retiré", () => {
    const css = readFileSync(join(SRC, "app/globals.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const regle = (selecteur: string) => {
      const i = css.indexOf(`\n${selecteur} {`);
      expect(i, `règle ${selecteur} introuvable`).toBeGreaterThan(-1);
      return css.slice(i, css.indexOf("}", i));
    };
    const SANS_ORANGE = /accent-plein|amber|#ff8a1f|--accent/;
    // La pastille de contexte, la ligne du joueur, le rail des cartes.
    expect(regle(".surtitre-arene")).not.toMatch(SANS_ORANGE);
    for (const m of css.matchAll(/\.ligne-moi[^{]*\{([^}]*)\}/g)) {
      expect(m[1], "la ligne du joueur est une position").not.toMatch(SANS_ORANGE);
    }
    expect(css, "la carte qui porte le bouton redisait l'action").not.toContain(
      ".carte:has(.bouton-plein)",
    );
  });
});

describe("les titres se posent (lot P1)", () => {
  it("aucun titre du périmètre ne force le condensé, l'italique ou les capitales", () => {
    const fautes: string[] = [];
    for (const { nom, code: source } of PERIMETRE) {
      for (const m of source.matchAll(/<h[1-4]\b[^>]*?className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
        const classes = m[1] ?? m[2] ?? "";
        if (/(?:^|[\s:])(?:font-display|italic|uppercase)\b/.test(classes)) {
          fautes.push(`${nom} : ${m[0].slice(0, 110)}`);
        }
      }
    }
    expect(fautes, `titres à l'ancienne voix :\n${fautes.join("\n")}`).toEqual([]);
  });

  it("la couche de base pose les titres droits, en casse de phrase, dans la voix des titres", () => {
    const css = readFileSync(join(SRC, "app/globals.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).toMatch(/--font-titre:\s*var\(--font-brand-sans\)/);
    const base = css.slice(css.indexOf("@layer base {"), css.indexOf("@layer components {"));
    expect(base, "la couche de base des titres a disparu").toMatch(/h1,\s*h2,\s*h3,\s*h4 \{/);
    expect(base).toMatch(/font-family: var\(--font-titre\)/);
    // Ni italique ni capitales sur un titre, où que ce soit dans la couche.
    for (const m of base.matchAll(/([^{}]*\bh[1-4]\b[^{}]*)\{([^}]*)\}/g)) {
      expect(m[2], `règle ${m[1]!.trim()}`).not.toMatch(/font-style:\s*italic|text-transform:\s*uppercase/);
      expect(m[2], `règle ${m[1]!.trim()}`).not.toMatch(/var\(--font-display\)/);
    }
    // La pastille de contexte ne penche plus ; le titre de carte parle comme un titre.
    const pastille = css.slice(css.indexOf("\n.surtitre-arene {"));
    expect(pastille.slice(0, pastille.indexOf("}"))).not.toMatch(/skew|rotate|(?<!text-)transform:/);
    const carte = css.slice(css.indexOf("\n.titre-carte {"));
    expect(carte.slice(0, carte.indexOf("}"))).toContain("var(--font-titre)");
    // Aucune italique condensée ne survit dans la feuille.
    expect(css, "une italique dans la feuille").not.toMatch(/font-style:\s*italic/);
  });
});

describe("un seul niveau de capitales : le surtitre (lot P1)", () => {
  /**
   * LES TROIS QUI RESTENT, et pourquoi :
   *   · la pastille de phase de la barre du téléphone (« BRIEFING · 2 SUR 4 ») :
   *     c'est la pastille de contexte de l'écran, le niveau de surtitre ;
   *   · deux marques postales de l'enveloppe (la bande de tranche
   *     « RECOMMANDÉ » et le tampon) : l'enveloppe est un OBJET, qui imite le
   *     courrier réel, et un tampon s'écrit en capitales.
   */
  const RESTANTS: Record<string, number> = {
    "components/barre-de-jeu.tsx": 1,
    "components/courrier.tsx": 2,
  };

  it("hors du surtitre, plus aucune capitale espacée dans le périmètre", () => {
    const compte: Record<string, number> = {};
    for (const { nom, code: source } of PERIMETRE) {
      const n = (source.match(/\buppercase\b/g) ?? []).length;
      if (n) compte[nom] = n;
    }
    expect(compte).toEqual(RESTANTS);
  });

  it("le surtitre et le libellé sont écrits une fois, dans la couche des composants", () => {
    const css = readFileSync(join(SRC, "app/globals.css"), "utf8");
    const composants = css.slice(css.indexOf("@layer components {"));
    const surtitre = composants.slice(composants.indexOf(".surtitre {"));
    expect(surtitre.slice(0, surtitre.indexOf("}"))).toMatch(/text-transform: uppercase/);
    const libelle = composants.slice(composants.indexOf(".libelle {"));
    const regle = libelle.slice(0, libelle.indexOf("}"));
    expect(regle).toMatch(/text-transform: none/);
    expect(regle).toMatch(/font-weight: 5\d\d/);
    expect(regle).toMatch(/font-family: var\(--font-sans\)/);
    // Le libellé sert vraiment : les champs de la feuille, les colonnes, les jauges.
    const libelles = PERIMETRE.reduce(
      (n, f) => n + (f.code.match(/\blibelle\b(?=[\s"`])/g) ?? []).length,
      0,
    );
    expect(libelles).toBeGreaterThan(30);
  });
});
