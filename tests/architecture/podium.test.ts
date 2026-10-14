import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { metalDuRang } from "@/components/rang";

/**
 * L'OR SE GAGNE, L'ORANGE SE TOUCHE.
 *
 * Le podium d'un classement prend l'or, l'argent et le bronze ; l'action garde
 * l'orange. La règle ne tient que si les deux familles ne se mélangent jamais :
 * un bouton doré apprendrait à l'élève qu'une distinction se clique, et l'or
 * ne voudrait plus rien dire. Cette garde vérifie trois choses :
 *   · les jetons existent dans globals.css, et ils sont lisibles là où ils se
 *     posent (le chiffre marine sur le métal, l'or foncé sur le papier, l'or vif
 *     sur le marine, le filet sur le blanc) ;
 *   · le composant du rang s'en sert, et il est posé sur les classements ;
 *   · aucun bouton ni lien ne porte une classe ou un jeton du podium.
 */

const SRC = join(process.cwd(), "src");
const CSS = readFileSync(join(SRC, "app", "globals.css"), "utf8");

const MARINE = "#0b2545";
const MARINE_RELEVE = "#13355f";
const BLANC = "#ffffff";
const PAGE = "#f5f7fb";
/**
 * Le fond d'une ligne choisie (l'équipe du joueur), sur le clair : le voile
 * neutre, marine à 6 % dans le blanc. Il a été un voile pêche, #fff3ea.
 */
const VOILE = "#f0f2f4";

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contraste(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Le corps du premier bloc CSS dont le sélecteur est exactement `selecteur`. */
function bloc(selecteur: string, contenant: string): string {
  let depuis = 0;
  for (;;) {
    const i = CSS.indexOf(`${selecteur} {`, depuis);
    if (i < 0) throw new Error(`bloc « ${selecteur} » contenant ${contenant} introuvable`);
    const corps = CSS.slice(i, CSS.indexOf("}", i));
    if (corps.includes(contenant)) return corps;
    depuis = i + 1;
  }
}

function jeton(corps: string, nom: string): string {
  const m = corps.match(new RegExp(`--${nom}:\\s*(#[0-9a-f]{6})\\s*;`, "i"));
  expect(m, `jeton --${nom} absent`).not.toBeNull();
  return m![1]!.toLowerCase();
}

const SOMBRE = bloc('[data-theme="clair"] .ardoise', "--or-texte");
const CLAIR = bloc('[data-theme="clair"]', "--or-texte");
const OR = jeton(bloc(":root", "--or-distinction"), "or-distinction");

describe("les jetons du podium", () => {
  it("existent : or, or en texte, argent, bronze, et leurs filets", () => {
    expect(OR).toBe("#f4b400");
    for (const nom of [
      "or-texte",
      "or-filet",
      "argent",
      "argent-filet",
      "bronze",
      "bronze-filet",
    ]) {
      jeton(SOMBRE, nom);
    }
    jeton(CLAIR, "or-texte");
    jeton(CLAIR, "or-filet");
  });

  it("le chiffre du rang, en marine, se lit sur chaque métal", () => {
    for (const fond of [OR, jeton(SOMBRE, "argent"), jeton(SOMBRE, "bronze")]) {
      expect(contraste(MARINE, fond), `chiffre marine sur ${fond}`).toBeGreaterThanOrEqual(4.5);
      // Et la pastille ressort du marine d'une projection ou d'une bande.
      expect(contraste(fond, MARINE), `${fond} sur le marine`).toBeGreaterThanOrEqual(3);
    }
  });

  it("le bronze est un métal saturé, plus un abricot pâle", () => {
    // Il a été #e8b48a, que l'œil prenait pour une pêche à côté de l'or :
    // la clarté (HSL) d'un métal reste sous 60 %, sa saturation au-dessus de
    // 50 %, et le chiffre marine y tient toujours (mesuré plus haut).
    const [r, g, b] = [1, 3, 5].map(
      (i) => parseInt(jeton(SOMBRE, "bronze").slice(i, i + 2), 16) / 255,
    );
    const [max, min] = [Math.max(r!, g!, b!), Math.min(r!, g!, b!)];
    const clarte = (max + min) / 2;
    const saturation = (max - min) / (1 - Math.abs(2 * clarte - 1));
    expect(clarte, "clarté du bronze").toBeLessThan(0.6);
    expect(saturation, "saturation du bronze").toBeGreaterThan(0.5);
  });

  it("chaque filet détache sa pastille du blanc et de la page", () => {
    for (const nom of ["argent-filet", "bronze-filet"]) {
      const filet = jeton(SOMBRE, nom);
      for (const fond of [BLANC, PAGE]) {
        expect(contraste(filet, fond), `${nom} sur ${fond}`).toBeGreaterThanOrEqual(3);
      }
      expect(contraste(filet, MARINE), `${nom} sur le marine`).toBeGreaterThanOrEqual(3);
    }
    const filetOr = jeton(CLAIR, "or-filet");
    for (const fond of [BLANC, PAGE]) {
      expect(contraste(filetOr, fond), `or-filet sur ${fond}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("l'or vif ne s'écrit pas sur le papier : le texte doré y est l'or foncé", () => {
    // Le piège que ce jeton évite : #f4b400 sur le blanc, 1,9 pour 1.
    expect(contraste(OR, BLANC)).toBeLessThan(3);
    const texte = jeton(CLAIR, "or-texte");
    for (const fond of [BLANC, PAGE, VOILE]) {
      expect(contraste(texte, fond), `or-texte sur ${fond}`).toBeGreaterThanOrEqual(4.5);
    }
    const texteSombre = jeton(SOMBRE, "or-texte");
    for (const fond of [MARINE, MARINE_RELEVE]) {
      expect(contraste(texteSombre, fond), `or-texte sur ${fond}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("les classes du podium lisent les jetons, et rien d'écrit à la main", () => {
    const regle = (sel: string) => {
      const i = CSS.lastIndexOf(`${sel} {`);
      expect(i, `règle ${sel} absente`).toBeGreaterThan(0);
      return CSS.slice(i, CSS.indexOf("}", i));
    };
    expect(regle(".pastille-rang-1")).toContain("var(--or-distinction)");
    expect(regle(".pastille-rang-2")).toContain("var(--argent)");
    expect(regle(".pastille-rang-3")).toContain("var(--bronze)");
    expect(regle(".ligne-rang-1")).toContain("var(--or-filet)");
    expect(regle(".texte-or")).toContain("var(--or-texte)");
  });
});

function fichiers(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin));
    else if (/\.(tsx|ts)$/.test(entree)) trouves.push(chemin);
  }
  return trouves;
}

const SOURCES = fichiers(SRC).map((f) => ({ f, s: readFileSync(f, "utf8") }));

/** Ce qui, posé sur un élément, le dore. */
const DORURE = /texte-or|filet-or|pastille-rang|ligne-rang|--or-|--argent|--bronze|#f4b400/i;

/**
 * Les balises ouvrantes d'un élément qu'on touche, accolades équilibrées : un
 * `=>` dans une expression de classe ne ferme pas la balise.
 */
function balisesDAction(source: string): string[] {
  const sortie: string[] = [];
  for (const m of source.matchAll(/<(button|Link|a|SubmitButton|GuardedSubmit)\b/g)) {
    let profondeur = 0;
    let i = m.index! + m[0].length;
    for (; i < source.length; i += 1) {
      const c = source[i];
      if (c === "{") profondeur += 1;
      else if (c === "}") profondeur -= 1;
      else if (c === ">" && profondeur === 0) break;
    }
    sortie.push(source.slice(m.index!, i + 1));
  }
  return sortie;
}

describe("le rang prend le métal, l'action jamais", () => {
  it("le métal s'arrête au podium", () => {
    expect([1, 2, 3, 4, 0].map(metalDuRang)).toEqual(["or", "argent", "bronze", null, null]);
  });

  it("le rang est posé sur les classements du site", () => {
    const poses = SOURCES.filter(({ s }) => s.includes("<PastilleDeRang")).map(({ f }) =>
      f.slice(SRC.length + 1),
    );
    for (const attendu of [
      "components/competition-board.tsx",
      "components/period-dashboard.tsx",
      // La projection dévoile son classement par la révélation du marché,
      // qui pose les rangs ; le podium, lui, sert aux deux (lot 4B).
      "components/revelation-du-marche.tsx",
      "components/podium.tsx",
      "app/teacher/games/[gameId]/page.tsx",
    ]) {
      expect(poses, `${attendu} n'affiche plus son rang en pastille`).toContain(attendu);
    }
    // LE BILAN DE PARTIE (lot P2) dit le rang du joueur UNE fois, en toutes
    // lettres et en or (« 2e sur 3 ») ; la pastille « 2 » posée à côté en
    // était une redite. Ses pastilles de métal sont celles de son podium,
    // qu'il pose toujours.
    const bilan = SOURCES.find(({ f }) => f.endsWith(join("components", "bilan-de-partie.tsx")))!.s;
    expect(bilan, "le bilan ne pose plus son podium").toContain("<PodiumDesEquipes");
    expect(bilan).toMatch(/texte-or[^"]*"[^>]*>\{ordinal\(place\.rang\)\}/);
  });

  it("le rang est écrit une seule fois, sans médaille qui le double (lot P5)", () => {
    // DÉCISION DU PROPRIÉTAIRE. Au verdict (rituel), sur le verdict d'un tour
    // clos et sur l'ardoise, la pastille « 2 » était posée à côté de « 2e sur
    // 3 » : le rang dit deux fois. Ces écrans l'écrivent en or, une fois ; ils
    // ne posent plus de médaille. La médaille ne reste que là où elle est
    // SEULE à dire le rang : le podium, les classements en liste.
    const source = (fichier: string) =>
      SOURCES.find(({ f }) => f.endsWith(join("components", fichier)))!.s;
    for (const fichier of [
      "verdict-du-marche.tsx",
      "revelation-du-tour.tsx",
      "tableau-de-bord.tsx",
      "bilan-de-partie.tsx",
      "barre-de-jeu.tsx",
    ]) {
      expect(source(fichier), `${fichier} pose une médaille à côté du rang écrit`).not.toContain(
        "<PastilleDeRang",
      );
      // Ni le mot, pour le lecteur d'écran : il n'y a plus de médaille à annoncer.
      if (fichier !== "bilan-de-partie.tsx")
        expect(source(fichier), `${fichier} annonce une médaille`).not.toMatch(/médaille d'or|médaille de/);
    }
    // Le rang écrit, en or, reste sur chacun d'eux.
    expect(source("verdict-du-marche.tsx")).toMatch(/texte-or[^>]*>\s*\{ordinal\(rang\.place\)\} sur \{rang\.sur\}/);
    expect(source("tableau-de-bord.tsx")).toMatch(/texte-or[^>]*>\s*\{ordinal\(rang\.place\)\}/);
    expect(source("revelation-du-tour.tsx")).toContain("Au classement révélé : {rang.place}");
    // Le podium seul garde une pastille « doublon » (le lecteur d'écran y
    // entend la marche en toutes lettres) ; il n'écrit plus la place à côté.
    const doublons = SOURCES.filter(({ s }) => /<PastilleDeRang[^>]*\bdoublon\b/.test(s)).map(({ f }) =>
      f.slice(SRC.length + 1),
    );
    expect(doublons).toEqual(["components/podium.tsx"]);
    expect(source("podium.tsx"), "le podium réécrit la place sous sa médaille").not.toContain("ordinal(");
  });

  it("aucun bouton ni lien ne porte l'or, l'argent ou le bronze", () => {
    const balises = SOURCES.flatMap(({ f, s }) =>
      balisesDAction(s).map((b) => ({ f: f.slice(SRC.length + 1), b })),
    );
    expect(
      balises.length,
      "aucune balise d'action trouvée : la garde ne garde rien",
    ).toBeGreaterThan(100);
    const dorees = balises.filter(({ b }) => DORURE.test(b)).map(({ f, b }) => `${f} : ${b}`);
    expect(dorees, `boutons ou liens dorés :\n${dorees.join("\n")}`).toEqual([]);
  });

  it("la fonction du bouton et l'aplat d'action ne connaissent pas l'or", () => {
    const bouton = readFileSync(join(SRC, "components", "bouton.ts"), "utf8");
    expect(bouton).not.toMatch(DORURE);
    // Les règles de globals.css qui peignent l'action : le bouton plein, le
    // focus, la pastille penchée, l'aplat d'accent.
    const sansCommentaires = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of sansCommentaires.matchAll(
      /([^{}]*(?:bouton|button|focus-visible|surtitre-arene)[^{}]*)\{([^}]*)\}/g,
    )) {
      expect(m[2], `règle ${m[1]!.trim()}`).not.toMatch(DORURE);
    }
    for (const nom of ["accent-plein", "accent-plein-survol", "accent-plein-ombre"]) {
      const valeur = jeton(bloc(":root", "--accent-plein:"), nom);
      expect(valeur, `--${nom}`).not.toBe(OR);
    }
  });
});
