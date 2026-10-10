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
 *
 * LES QUINZE TEINTES DE MÉTIER, FRANCHES. Le lot 5A les avait laissées
 * délavées (chroma 0,023 à 0,096, sous le plancher où une couleur se voit
 * encore) : l'arène virait au sépia et les quinze se ressemblaient. Elles sont
 * refaites, et la règle qui les tient tient en quatre lignes :
 *   - NEUF ENTREPRISES, NEUF UNIVERS, NEUF COULEURS : six jetons sont des
 *     VARIANTES de scénario — la même entreprise jouée en gamme — et
 *     reprennent la couleur de leur entreprise, à l'identique.
 *   - franches : chroma dans [0,105 ; 0,166[, au-dessus du plancher de
 *     `dataviz` et sous l'or, le moins coloré des quatre accents réservés.
 *   - hors des teintes prises : plus de 20° et plus de 10 d'écart perçu de
 *     chacun de ces accents.
 *   - les neuf familles, dans un ORDRE FIXE, tiennent la porte de la
 *     compétence entre voisins : 15 en vision normale, 8 en déficience.
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
function oklch(hex: string): { L: number; C: number; h: number } {
  const [L, a, b] = oklab(lineaire(hex));
  const h = (Math.atan2(b!, a!) * 180) / Math.PI;
  return { L: L!, C: Math.hypot(a!, b!), h: h < 0 ? h + 360 : h };
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
/** La valeur DÉCLARÉE d'un jeton, telle qu'elle est écrite : une couleur, ou un renvoi. */
function brut(source: string, nom: string): string {
  const trouve = source.match(new RegExp(`--${nom}:\\s*([^;]+);`, "i"));
  expect(trouve, `--${nom} absent`).not.toBeNull();
  return trouve![1]!.trim().toLowerCase();
}

/**
 * La couleur d'un jeton. La gamme d'une entreprise renvoie au jeton de son
 * entreprise (`var(--secteur-…)`) : on suit le renvoi, une fois, pour que
 * chaque mesure porte sur la couleur réellement affichée.
 */
function jeton(source: string, nom: string): string {
  const valeur = brut(source, nom);
  const renvoi = valeur.match(/^var\(\s*--([a-z0-9-]+)\s*\)$/);
  const couleur = renvoi ? brut(source, renvoi[1]!) : valeur;
  expect(couleur, `--${nom} n'est pas une couleur : ${couleur}`).toMatch(/^#[0-9a-f]{6}$/);
  return couleur;
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

/** Les deux tables des teintes de métier, de chaque côté de la composition. */
const SUR_MARINE_METIERS = CSS.slice(
  CSS.indexOf("LES MÉTIERS : NEUF ENTREPRISES, NEUF UNIVERS, NEUF COULEURS"),
);
const SUR_PAPIER_METIERS = CSS.slice(CSS.indexOf('[data-theme="clair"] {\n  /* Même remarque'));
/** Les quatre accents que la charte réserve, par côté (le papier a ses encres). */
const ACCENTS_RESERVES = {
  marine: ["#ff8a1f", "#f4b400", "#3ccf7e", "#ff7070"],
  clair: ["#a35200", "#8a6400", "#a07c00"],
};
/** L'or, le moins coloré des quatre accents : le plafond de la charte. */
const PLAFOND_CHROMA = 0.166;
/**
 * L'ordre fixe des neuf familles, et les six variantes avec leur famille.
 * Lot P6 : services et abonnement échangent leur place. Le glacier des
 * services (#12f8fe) tombait à 1,5 d'écart du mauve de l'e-commerce en
 * deutéranopie ; l'ordre a été ré-dérivé en énumérant les 9! ordres (méthode
 * de la compétence dataviz), et c'est le plus proche de l'ancien qui tient
 * la porte : 16,1 / 8,1 sur le marine, 18,2 / 10,5 sur le papier.
 */
const ORDRE_DES_FAMILLES = [
  "hotellerie",
  "batiment",
  "ecommerce",
  "abonnement",
  "transport",
  "commerce",
  "services",
  "restauration",
  "industrie",
];
const VARIANTES: Record<string, string> = {
  "nova-gamme": "industrie",
  "hotel-gamme": "hotellerie",
  "conseil-gamme": "services",
  "bistrot-gamme": "restauration",
  "ecommerce-gamme": "ecommerce",
  "boutique-mono": "commerce",
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

  it("la teinte du métier se lit comme du texte, et reste FRANCHE sans rivaliser", () => {
    for (const [source, fonds, mode] of [
      [SUR_PAPIER_METIERS, SURFACES.clair, "clair"],
      [SUR_MARINE_METIERS, SURFACES.marine, "marine"],
    ] as const) {
      for (const nom of DECLAREES) {
        const teinte = jeton(source, `secteur-${nom}`);
        for (const fond of fonds) {
          expect(contraste(teinte, fond), `${nom} (${teinte}) sur ${fond}`).toBeGreaterThanOrEqual(
            4.5,
          );
        }
        // FRANCHE : au-dessus du plancher de dataviz, sous le moins coloré des
        // quatre accents que la charte réserve. C'est la correction du lot 5A,
        // dont les quinze teintes étaient toutes SOUS le plancher.
        // Le PLAFOND est celui de la charte : la chroma du moins coloré des
        // quatre accents, l'or (0,166), devant le vert de résultat (0,169), le
        // rouge (0,175) et l'orange d'action (0,176). Il vaut des DEUX côtés :
        // les encres du papier sont moins colorées parce qu'elles sont
        // foncées, et s'en servir de plafond rendrait les métiers grisâtres —
        // l'erreur même du lot 5A.
        const { C } = oklch(teinte);
        expect(C, `${nom} (${teinte}) lit comme un gris`).toBeGreaterThanOrEqual(PLANCHER_CHROMA);
        expect(C, `${nom} (${teinte}) est plus coloré que l'or`).toBeLessThan(PLAFOND_CHROMA);
        // HORS DES TEINTES PRISES : l'orange de l'action, l'or du verdict, le
        // vert et le rouge des résultats. Un métier franc ne doit pas pouvoir
        // se lire comme un verdict ou un résultat.
        for (const accent of ACCENTS_RESERVES[mode]) {
          expect(
            ecart(teinte, accent).normal,
            `${nom} (${teinte}) trop près de l'accent ${accent}`,
          ).toBeGreaterThanOrEqual(10);
        }
        // DISTINCTE DES CINQ CRÉNEAUX DE DONNÉES, à côté desquels elle sert de
        // série du joueur. Le lot 5A ne mesurait que le PREMIER créneau, et à
        // 13 : des teintes délavées sont loin d'un bleu franc dans le plan
        // a-b, ce seuil ne coûtait rien. Des teintes FRANCHES s'en approchent
        // fatalement — les cinq créneaux occupent déjà le bleu, le prune, le
        // bleu-vert, l'indigo et le bleu acier. La garde couvre donc
        // maintenant les CINQ créneaux, au seuil réellement atteint, et la
        // série du joueur porte TOUJOURS une étiquette directe et un trait
        // plus épais (charts.tsx) : l'encodage secondaire que la compétence
        // dataviz exige dans la bande plancher.
        for (const creneau of PALETTE[mode]) {
          const e = ecart(teinte, creneau);
          expect(e.normal, `${nom} et le créneau ${creneau}`).toBeGreaterThanOrEqual(10);
          expect(e.dvc, `${nom} et le créneau ${creneau}, en DVC`).toBeGreaterThanOrEqual(6.5);
        }
      }
    }
  });

  it("les neuf familles, dans leur ordre fixe, tiennent la porte de la compétence", () => {
    // Quinze couleurs franches ne peuvent pas être deux à deux à 15 d'écart :
    // c'est le PLAFOND DE SÉRIES que la compétence dataviz décrit, et le lot 5A
    // n'avait même pas tenté la porte. On la tient là où elle a un sens : les
    // NEUF familles, rangées dans un ordre fixe, deux voisins à 15 en vision
    // normale et 8 en protanopie comme en deutéranopie.
    expect(ORDRE_DES_FAMILLES).toHaveLength(9);
    expect(new Set(ORDRE_DES_FAMILLES).size).toBe(9);
    for (const nom of ORDRE_DES_FAMILLES) expect(DECLAREES).toContain(nom);
    for (const [source, mode] of [
      [SUR_PAPIER_METIERS, "clair"],
      [SUR_MARINE_METIERS, "marine"],
    ] as const) {
      void mode;
      for (let i = 0; i + 1 < ORDRE_DES_FAMILLES.length; i += 1) {
        const a = jeton(source, `secteur-${ORDRE_DES_FAMILLES[i]}`);
        const b = jeton(source, `secteur-${ORDRE_DES_FAMILLES[i + 1]}`);
        const e = ecart(a, b);
        const quoi = `${ORDRE_DES_FAMILLES[i]} et ${ORDRE_DES_FAMILLES[i + 1]}`;
        expect(e.normal, `${quoi}, en vision normale`).toBeGreaterThanOrEqual(PLANCHER_NORMAL);
        expect(e.dvc, `${quoi}, en protanopie ou deutéranopie`).toBeGreaterThanOrEqual(CIBLE_DVC);
      }
    }
    // Et l'ordre est écrit dans la feuille, pour qu'il ne se reperde pas.
    expect(CSS, "globals.css ne dit pas l'ordre fixe des neuf familles").toContain(
      "LES NEUF FAMILLES, DANS UN ORDRE FIXE",
    );
  });

  it("lot P6 : les neuf teintes sont deux à deux distinctes, et les trois verts n'en font plus un", () => {
    // LE RETOUR DU PROPRIÉTAIRE : « services, abonnement et bâtiment ont la
    // même couleur ». Ils tenaient dans 12° de teinte (5,6 à 11,8 d'écart
    // perçu sur le marine, 7,0 sur le papier). L'abonnement garde le vert,
    // les services prennent un glacier, le bâtiment un sable. La garde
    // calcule l'écart (OKLab ×100, comme le validateur de `dataviz`) sur les
    // 36 paires, des deux côtés, avec des seuils RÉGLÉS SUR LA MESURE :
    //   · les trois teintes refaites sont à 15 au moins (le plancher de
    //     `dataviz` en vision normale) de chacune des huit autres sur le
    //     marine — mesuré : 17,0 (glacier / transport) ;
    //   · sur le papier, à 10,5 au moins — mesuré : 11,0 (sable / vert). 15
    //     n'y est pas atteignable : avec les six encres foncées existantes et
    //     les gardes de ce fichier, aucun trio de teintes nouvelles ne
    //     dépasse 9,8 (recherche exhaustive du lot) ;
    //   · entre elles trois, 10 au moins aussi en protanopie et en
    //     deutéranopie, des deux côtés — mesuré : 16,2 et 10,1 ;
    //   · et AUCUNE des 36 paires ne descend sous le plancher actuel : 5 sur le
    //     marine (pervenche / bleu, 5,1, inchangés depuis le lot 5A) et 8 sur
    //     le papier (8,4). Les paires des six teintes que ce lot ne touche
    //     pas restent sous 15 (le plafond de séries de la charte) : le métier
    //     porte toujours son nom écrit.
    const REFAITES = ["services", "abonnement", "batiment"];
    const SEUILS = {
      marine: { refaites: 15, plancher: 5 },
      clair: { refaites: 10.5, plancher: 8 },
    } as const;
    for (const [source, mode] of [
      [SUR_MARINE_METIERS, "marine"],
      [SUR_PAPIER_METIERS, "clair"],
    ] as const) {
      const teinte = (nom: string) => jeton(source, `secteur-${nom}`);
      for (let i = 0; i < ORDRE_DES_FAMILLES.length; i += 1) {
        for (let j = i + 1; j < ORDRE_DES_FAMILLES.length; j += 1) {
          const [a, b] = [ORDRE_DES_FAMILLES[i]!, ORDRE_DES_FAMILLES[j]!];
          const e = ecart(teinte(a), teinte(b));
          const quoi = `${a} (${teinte(a)}) et ${b} (${teinte(b)}), sur le ${mode}`;
          expect(e.normal, `${quoi} : sous le plancher`).toBeGreaterThanOrEqual(SEUILS[mode].plancher);
          if (REFAITES.includes(a) || REFAITES.includes(b)) {
            expect(e.normal, `${quoi} : une teinte refaite trop proche`).toBeGreaterThanOrEqual(
              SEUILS[mode].refaites,
            );
          }
          if (REFAITES.includes(a) && REFAITES.includes(b)) {
            expect(e.dvc, `${quoi}, en protanopie ou deutéranopie`).toBeGreaterThanOrEqual(10);
          }
        }
      }
      // Un seul vert : des neuf, une seule teinte entre 120° et 150° (le vert
      // de résultat est à 154° ; sous 120°, c'est l'olive et le sable : le
      // bâtiment est à 106° sur le marine, 116° sur le papier), des deux côtés.
      // Avant le lot : trois (123°, 128°, 133° sur le marine).
      const verts = ORDRE_DES_FAMILLES.filter((nom) => {
        const { h } = oklch(teinte(nom));
        return h >= 120 && h <= 150;
      });
      expect(verts, `sur le ${mode}, plus d'un vert`).toEqual(["abonnement"]);
    }
  });

  it("une variante de scénario EST la couleur de son entreprise, pas une dixième", () => {
    // NEUF ENTREPRISES, NEUF UNIVERS, NEUF COULEURS. Le joueur choisit parmi
    // neuf entreprises ; les six autres codes sont la MÊME entreprise jouée en
    // gamme à partir d'un certain niveau. Changer de niveau ne doit pas changer
    // d'univers : la variante renvoie au jeton de son entreprise, au caractère
    // près, et ne porte donc aucune couleur à elle.
    for (const [source, mode] of [
      [SUR_PAPIER_METIERS, "clair"],
      [SUR_MARINE_METIERS, "marine"],
    ] as const) {
      void mode;
      for (const [variante, famille] of Object.entries(VARIANTES)) {
        expect(
          brut(source, `secteur-${variante}`),
          `${variante} doit renvoyer à var(--secteur-${famille}), sans recopier de couleur`,
        ).toBe(`var(--secteur-${famille})`);
        expect(
          jeton(source, `secteur-${variante}`),
          `${variante} ne se résout pas sur la couleur de ${famille}`,
        ).toBe(jeton(source, `secteur-${famille}`));
      }
    }
  });

  it("l'encre posée sur un aplat de métier se lit, des deux côtés", () => {
    const bloc = CSS.slice(CSS.indexOf("LOT 5A : LA COULEUR DU MÉTIER"));
    expect(bloc).toContain("--metier-texte: #0b2545");
    expect(bloc).toContain("--metier-texte: #ffffff");
    for (const [source, encre] of [
      [SUR_PAPIER_METIERS, "#ffffff"],
      [SUR_MARINE_METIERS, "#0b2545"],
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
