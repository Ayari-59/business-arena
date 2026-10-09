import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PAPIER, TABLEAU } from "../../scripts/generer-theme-clair";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { teinteDuMetier } from "../../src/config/scenarios/presentation";
import { SECTEURS, teinteDuMetierDeLEpisode } from "../../src/config/episodes/familles";
import { EPISODES } from "../../src/pedagogy/episodes/registre";

/**
 * LA PALETTE DES DONNÉES, ET LA TEINTE DU MÉTIER (lot 5A).
 *
 * Deux couleurs ne font pas une palette : `--donnee` et `--donnee-2` étaient
 * un bleu et un gris, et tout graphique à plus de deux séries devenait
 * illisible. Cinq CRÉNEAUX D'IDENTITÉ s'ajoutent, `--serie-1` à `--serie-5`,
 * et la série de l'entreprise du joueur prend la teinte de son métier.
 *
 * Cette garde recalcule ce que le validateur de la compétence dataviz mesure
 * (`scripts/validate_palette.js` de la compétence) : bande de clarté OKLCH,
 * plancher de chroma, écart perçu en protanopie et en deutéranopie (modèle de
 * Machado, Oliveira et Fernandes 2009, sévérité 1), plancher en vision
 * normale, contraste sur chaque surface. Elle le refait ICI pour que la
 * palette ne puisse pas dériver sans qu'un test tombe : une couleur changée à
 * la main dans `globals.css` casse la garde, pas le navigateur d'un élève.
 *
 * Elle vérifie aussi ce que la charte ajoute : les créneaux restent SOUS la
 * chroma de l'orange de l'action, de l'or du verdict, du vert et du rouge des
 * résultats, et aucun graphique n'écrit une couleur en dur.
 */

const CSS = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");

// --- colorimétrie ---------------------------------------------------------
const srgb = (hex: string): number[] =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const versLineaire = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lineaire = (hex: string) => srgb(hex).map(versLineaire);

/** L'espace OKLab, où une distance euclidienne vaut un écart perçu. */
function oklab([r, g, b]: number[]): number[] {
  const l = Math.cbrt(0.4122214708 * r! + 0.5363325363 * g! + 0.0514459929 * b!);
  const m = Math.cbrt(0.2119034982 * r! + 0.6806995451 * g! + 0.1073969566 * b!);
  const s = Math.cbrt(0.0883024619 * r! + 0.2817188376 * g! + 0.6299787005 * b!);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function oklch(hex: string): { L: number; C: number } {
  const [L, a, b] = oklab(lineaire(hex));
  return { L: L!, C: Math.hypot(a!, b!) };
}
const MACHADO: Record<string, number[][]> = {
  protanopie: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopie: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
};
function simule(hex: string, type: string): number[] {
  const lin = lineaire(hex);
  return oklab(MACHADO[type]!.map((rangee) => rangee.reduce((s, k, i) => s + k * lin[i]!, 0)));
}
const distance = (a: number[], b: number[]) =>
  100 * Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
/** L'écart perçu entre deux couleurs : en vision normale, et au pire des deux déficiences. */
function ecart(x: string, y: string): { normal: number; dvc: number } {
  return {
    normal: distance(oklab(lineaire(x)), oklab(lineaire(y))),
    dvc: Math.min(
      distance(simule(x, "protanopie"), simule(y, "protanopie")),
      distance(simule(x, "deuteranopie"), simule(y, "deuteranopie")),
    ),
  };
}
function luminance(hex: string): number {
  const [r, g, b] = lineaire(hex);
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function contraste(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}
function jeton(source: string, nom: string): string {
  const trouve = source.match(new RegExp(`--${nom}:\\s*(#[0-9a-f]{6})\\s*;`, "i"));
  expect(trouve, `--${nom} absent`).not.toBeNull();
  return trouve![1]!.toLowerCase();
}

// --- les seuils de la méthode dataviz ------------------------------------
const BANDE = { clair: [0.43, 0.77], marine: [0.48, 0.67] };
const PLANCHER_CHROMA = 0.1;
const CIBLE_DVC = 8;
const PLANCHER_NORMAL = 15;
const CONTRASTE_MARQUE = 3;
/** Les surfaces où un graphique se pose : la carte et la page, de chaque côté. */
const SURFACES = {
  clair: [PAPIER[900]!, PAPIER[950]!],
  marine: [TABLEAU[900]!, TABLEAU[950]!],
};

const BLOC = CSS.slice(CSS.indexOf("LA DONNÉE : UNE SEULE PALETTE"));
const SUR_MARINE = BLOC.slice(0, BLOC.indexOf('[data-theme="clair"] {'));
const SUR_PAPIER = BLOC.slice(BLOC.indexOf('[data-theme="clair"] {'));
const CRENEAUX = ["serie-1", "serie-2", "serie-3", "serie-4", "serie-5"];
const PALETTE = {
  clair: CRENEAUX.map((n) => jeton(SUR_PAPIER, n)),
  marine: CRENEAUX.map((n) => jeton(SUR_MARINE, n)),
};

describe("cinq créneaux d'identité, mesurés comme dataviz les mesure", () => {
  it("la palette existe des deux côtés, et le papier ne reprend pas le marine", () => {
    expect(PALETTE.clair).toHaveLength(5);
    expect(PALETTE.marine).toHaveLength(5);
    expect(PALETTE.clair).not.toEqual(PALETTE.marine);
  });

  for (const mode of ["clair", "marine"] as const) {
    it(`sur le ${mode} : bande de clarté, plancher de chroma, contraste sur chaque surface`, () => {
      const [bas, haut] = BANDE[mode];
      for (const hex of PALETTE[mode]) {
        const { L, C } = oklch(hex);
        expect(L, `${hex} hors de la bande de clarté`).toBeGreaterThanOrEqual(bas!);
        expect(L, `${hex} hors de la bande de clarté`).toBeLessThanOrEqual(haut!);
        expect(C, `${hex} lit comme un gris`).toBeGreaterThanOrEqual(PLANCHER_CHROMA);
        for (const fond of SURFACES[mode]) {
          expect(contraste(hex, fond), `${hex} sur ${fond}`).toBeGreaterThanOrEqual(
            CONTRASTE_MARQUE,
          );
        }
      }
    });

    it(`sur le ${mode} : deux créneaux voisins se distinguent, déficience de vision comprise`, () => {
      for (let i = 0; i + 1 < PALETTE[mode].length; i += 1) {
        const [a, b] = [PALETTE[mode][i]!, PALETTE[mode][i + 1]!];
        const e = ecart(a, b);
        expect(e.dvc, `${a} et ${b}, en protanopie ou deutéranopie`).toBeGreaterThanOrEqual(
          CIBLE_DVC,
        );
        expect(e.normal, `${a} et ${b}, en vision normale`).toBeGreaterThanOrEqual(PLANCHER_NORMAL);
      }
    });

    it(`sur le ${mode} : aucun créneau n'est aussi coloré qu'un accent de la charte`, () => {
      // L'orange de l'action, l'or du verdict, le vert et le rouge des
      // résultats : un graphique ne rivalise jamais avec eux. Le papier a ses
      // propres encres (l'orange brûlé, l'or foncé), moins colorées : c'est
      // elles qui fixent le plafond de ce côté.
      const accents =
        mode === "marine"
          ? ["#ff8a1f", "#f4b400", "#3ccf7e", "#ff7070"]
          : ["#a35200", "#8a6400", "#a07c00"];
      const plafond = Math.min(...accents.map((a) => oklch(a).C));
      for (const hex of PALETTE[mode]) {
        expect(oklch(hex).C, `${hex} est plus coloré qu'un accent`).toBeLessThan(plafond);
      }
    });
  }

  it("l'encre de la donnée et le neutre de référence se lisent comme du texte", () => {
    // `--donnee` n'est PAS un créneau : c'est l'encre d'un chiffre annoncé, et
    // elle doit tenir 4,5 pour 1. Le texte ne porte jamais une couleur de
    // série (règle dataviz) : c'est ce qui sépare les deux jetons.
    for (const [source, fonds] of [
      [SUR_PAPIER, SURFACES.clair],
      [SUR_MARINE, SURFACES.marine],
    ] as const) {
      const encre = jeton(source, "donnee");
      for (const fond of fonds) {
        expect(contraste(encre, fond), `encre ${encre} sur ${fond}`).toBeGreaterThanOrEqual(4.5);
      }
      const neutre = jeton(source, "donnee-2");
      expect(oklch(neutre).C, `${neutre} doit rester un gris`).toBeLessThan(PLANCHER_CHROMA);
    }
  });
});

/** Les sources de l'application, pour les gardes qui lisent les classes. */
function sourcesDe(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...sourcesDe(chemin));
    else if (/\.(ts|tsx)$/.test(entree)) trouves.push(chemin);
  }
  return trouves;
}

/** Tout ce qui dessine une donnée : graphiques, jauges, barres, comparatifs. */
const GRAPHIQUES = [
  "src/components/charts.tsx",
  "src/components/bpi-panel.tsx",
  "src/components/tableau-de-bord.tsx",
  "src/components/sales-history.tsx",
  "src/components/competitive-benchmark.tsx",
  "src/components/episode/courbe-des-semaines.tsx",
  "src/components/episode/tableau-de-bord.tsx",
  "src/components/episode/bilan-de-l-episode.tsx",
];

describe("la palette des données vient des jetons, jamais d'une couleur écrite", () => {
  it("aucun graphique n'écrit une couleur en dur", () => {
    for (const chemin of GRAPHIQUES) {
      const texte = readFileSync(join(process.cwd(), chemin), "utf8");
      // Le code seul : les commentaires racontent les couleurs d'avant.
      const code = texte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      expect(code.match(/#[0-9a-f]{3,8}\b/gi) ?? [], `${chemin} : couleur écrite`).toEqual([]);
      expect(
        code.match(/\b(?:rgba?|hsla?|oklch|color-mix)\(/g) ?? [],
        `${chemin} : couleur calculée à la main`,
      ).toEqual([]);
    }
  });

  it("chaque couleur de série d'un graphique est un jeton de la palette", () => {
    const connus = new Set([
      ...CRENEAUX,
      "donnee",
      "donnee-2",
      "metier",
      "metier-texte",
      "filet-carte",
      "point-etat",
      "voile-neutre",
      "or-texte",
      "or-filet",
      "accent-plein",
      "accent-plein-texte",
      "fond-du-tableau",
      "haut-collant",
      "barre-bas",
    ]);
    for (const chemin of GRAPHIQUES) {
      const texte = readFileSync(join(process.cwd(), chemin), "utf8");
      const code = texte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      for (const m of code.matchAll(/var\(--([a-z0-9-]+)/g)) {
        const nom = m[1]!;
        if (nom.startsWith("color-")) continue;
        expect(connus.has(nom), `${chemin} : jeton inconnu --${nom}`).toBe(true);
      }
    }
  });

  it("l'ordre des créneaux ne se cycle pas : la sixième série passe au neutre", () => {
    const charts = readFileSync(join(process.cwd(), "src/components/charts.tsx"), "utf8");
    const code = charts.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(code, "un modulo recyclerait la première teinte").not.toMatch(/%\s*\w*CRENEAUX/);
    expect(code).toMatch(/CRENEAUX\[i\]\s*\?\?\s*NEUTRE/);
  });
});

describe("la teinte du métier est le fil d'une partie", () => {
  const DECLAREES = [...CSS.matchAll(/^\[data-metier="([a-z-]+)"\],$/gm)].map((m) => m[1]!);

  it("globals.css déclare les quinze métiers, et chacun renvoie à son jeton", () => {
    expect(DECLAREES).toHaveLength(15);
    for (const nom of DECLAREES) {
      const debut = CSS.indexOf(`\n[data-metier="${nom}"],`);
      expect(debut, `[data-metier="${nom}"] absent`).toBeGreaterThan(0);
      const regle = CSS.slice(debut, CSS.indexOf("}", debut));
      // Pas de valeur recopiée : la règle RENVOIE au jeton du métier.
      expect(regle).toContain(`--metier: var(--secteur-${nom})`);
      expect(regle, `[data-metier="${nom}"] recopie une couleur`).not.toMatch(/#[0-9a-f]{3,8}/i);
      // Elle se redéclare sur l'ardoise et sur la bande à contre-jour, pour
      // que la teinte se retourne avec le fond.
      expect(regle).toContain(":is(.ardoise, .contre-jour)");
    }
  });

  it("chaque scénario du registre trouve une teinte que la feuille déclare", () => {
    expect(SCENARIOS.length).toBeGreaterThan(10);
    for (const d of SCENARIOS) {
      const teinte = teinteDuMetier(d);
      expect(DECLAREES, `${d.code} : ${teinte} absent de globals.css`).toContain(teinte);
    }
  });

  it("chaque épisode trouve la teinte de son secteur", () => {
    expect(EPISODES.length).toBeGreaterThan(100);
    for (const ep of EPISODES) {
      const teinte = teinteDuMetierDeLEpisode(ep.code);
      expect(teinte, `${ep.code} sans teinte`).toBeDefined();
      expect(DECLAREES).toContain(teinte!);
    }
    // Cinq secteurs, cinq teintes distinctes : deux entreprises d'épisode ne
    // se confondent pas sur la page de choix.
    expect(new Set(SECTEURS.map((s) => s.teinte)).size).toBe(SECTEURS.length);
  });

  it("la teinte du métier se lit comme du texte, et se distingue du premier créneau", () => {
    const sombre = CSS.slice(CSS.indexOf("LES MÉTIERS : DES TEINTES DÉSATURÉES"));
    const papier = CSS.slice(CSS.indexOf('[data-theme="clair"] {\n  /* Même remarque'));
    for (const [source, fonds, creneau] of [
      [papier, SURFACES.clair, PALETTE.clair[0]!],
      [sombre, SURFACES.marine, PALETTE.marine[0]!],
    ] as const) {
      for (const nom of DECLAREES) {
        const teinte = jeton(source, `secteur-${nom}`);
        for (const fond of fonds) {
          expect(contraste(teinte, fond), `${nom} (${teinte}) sur ${fond}`).toBeGreaterThanOrEqual(
            4.5,
          );
        }
        // La série du joueur côtoie le premier créneau. Les teintes des
        // métiers sont très désaturées : elles ne tiennent pas le plancher de
        // 15 de dataviz, et c'est pourquoi la série du joueur porte TOUJOURS
        // une étiquette directe et un trait plus épais (charts.tsx). On tient
        // ici le seuil atteignable, pour qu'il ne se dégrade pas.
        expect(ecart(teinte, creneau).normal, `${nom} et ${creneau}`).toBeGreaterThanOrEqual(13);
        expect(ecart(teinte, creneau).dvc, `${nom} et ${creneau}, en DVC`).toBeGreaterThanOrEqual(
          10,
        );
      }
    }
  });

  it("l'encre posée sur un aplat de métier se lit, des deux côtés", () => {
    const sombre = CSS.slice(CSS.indexOf("LES MÉTIERS : DES TEINTES DÉSATURÉES"));
    const papier = CSS.slice(CSS.indexOf('[data-theme="clair"] {\n  /* Même remarque'));
    const bloc = CSS.slice(CSS.indexOf("LOT 5A : LA COULEUR DU MÉTIER"));
    expect(bloc).toContain("--metier-texte: #0b2545");
    expect(bloc).toContain("--metier-texte: #ffffff");
    for (const [source, encre] of [
      [papier, "#ffffff"],
      [sombre, "#0b2545"],
    ] as const) {
      for (const nom of DECLAREES) {
        expect(
          contraste(jeton(source, `secteur-${nom}`), encre),
          `${nom} sous ${encre}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("la teinte du métier ne prend ni l'orange, ni l'or, ni le vert, ni le rouge", () => {
    const sources = sourcesDe(join(process.cwd(), "src"));
    const fautes: string[] = [];
    for (const chemin of sources) {
      const texte = readFileSync(chemin, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      // Un bouton, un aplat d'action, un mot d'or : jamais en teinte de métier.
      for (const m of texte.matchAll(/bouton\(\{[^}]*var\(--metier/g)) {
        fautes.push(`${chemin.slice(process.cwd().length + 1)} : ${m[0]}`);
      }
    }
    expect(fautes, `la teinte du métier colore une action :\n${fautes.join("\n")}`).toEqual([]);
    // Et la feuille ne mélange jamais la teinte du métier à un accent.
    const bloc = CSS.slice(CSS.indexOf("LOT 5A : LA COULEUR DU MÉTIER"));
    expect(bloc).not.toMatch(/--metier:\s*var\(--(?:accent|or)-/);
  });
});
