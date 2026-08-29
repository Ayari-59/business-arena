import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { genererThemeClair, FICHIER_GENERE, SOURCE_TAILWIND } from "../../scripts/generer-theme-clair";
import { CLE_THEME, estCodeTheme, THEMES, THEME_PAR_DEFAUT } from "../../src/config/themes";

/**
 * Les thèmes tiennent en deux moitiés qui ne se parlent pas : la liste, en
 * TypeScript, et les couleurs, dans les feuilles de style, parce que Tailwind
 * ne lit pas le TypeScript. Rien dans le langage n'oblige les deux à
 * correspondre, et une moitié sans l'autre ne casse rien de visible : un thème
 * proposé dans le menu qui ne change aucune couleur, ou un jeu de couleurs que
 * personne ne peut choisir.
 */
const GLOBALS = readFileSync("src/app/globals.css", "utf-8");
const CLAIR = readFileSync(FICHIER_GENERE, "utf-8");
const LAYOUT = readFileSync("src/app/layout.tsx", "utf-8");
const SELECTEUR = readFileSync("src/components/theme-switcher.tsx", "utf-8");

/** Les thèmes déclarés dans les feuilles, dans l'ordre où on les y trouve. */
const declaresEnCss = [...(GLOBALS + CLAIR).matchAll(/\[data-theme="([a-z]+)"\]/g)].map(
  (m) => m[1]!,
);

describe("les thèmes", () => {
  it("chaque thème du registre a ses couleurs, sauf celui d'origine", () => {
    for (const theme of THEMES) {
      const present = declaresEnCss.includes(theme.code);
      if (theme.code === THEME_PAR_DEFAUT) {
        // Le thème par défaut est l'échelle de Tailwind telle quelle : lui
        // écrire un bloc reviendrait à recopier ce qui existe déjà, avec le
        // risque que la copie diverge.
        expect(present, `${theme.code} ne devrait pas avoir de bloc`).toBe(false);
      } else {
        expect(present, `${theme.code} est proposé au choix mais ne change aucune couleur`).toBe(
          true,
        );
      }
    }
  });

  it("aucun jeu de couleurs ne traîne sans être proposé", () => {
    for (const code of new Set(declaresEnCss)) {
      expect(estCodeTheme(code), `« ${code} » est habillé mais absent du registre`).toBe(true);
    }
  });

  it("chaque thème a un nom et une pastille", () => {
    for (const theme of THEMES) {
      expect(theme.nom.length, `${theme.code} sans nom`).toBeGreaterThan(2);
      expect(theme.description.length, `${theme.code} sans description`).toBeGreaterThan(15);
      expect(theme.apercu.fond, `${theme.code} : fond`).toMatch(/^#[0-9a-f]{6}$/);
      expect(theme.apercu.accent, `${theme.code} : accent`).toMatch(/^#[0-9a-f]{6}$/);
    }
    const noms = THEMES.map((t) => t.nom);
    expect(new Set(noms).size, `noms en double : ${noms.join(", ")}`).toBe(noms.length);
  });

  it("le script d'amorçage et le sélecteur écrivent au même endroit", () => {
    // S'ils divergeaient, le choix serait bien enregistré et jamais relu : le
    // thème reviendrait à l'ardoise à chaque page, sans erreur nulle part.
    expect(LAYOUT, "le script d'amorçage n'utilise pas la clé du registre").toContain("CLE_THEME");
    expect(SELECTEUR, "le sélecteur n'utilise pas la clé du registre").toContain("CLE_THEME");
    expect(CLE_THEME.length).toBeGreaterThan(3);
  });

  it("le sélecteur propose la liste du registre, sans la recopier", () => {
    expect(SELECTEUR).toContain("THEMES.map");
    for (const theme of THEMES) {
      expect(SELECTEUR, `${theme.nom} est écrit en dur dans le sélecteur`).not.toContain(
        `>${theme.nom}<`,
      );
    }
  });

  it("l'attribut de thème est posé dès le rendu du serveur", () => {
    // Sans valeur initiale, la première image de la page n'aurait pas de thème
    // du tout et le sélecteur afficherait un choix qui n'est pas celui appliqué.
    expect(LAYOUT).toMatch(/<html[^>]*data-theme=\{THEME_PAR_DEFAUT\}/);
  });
});

describe("le thème clair", () => {
  it("le fichier engendré est à jour", () => {
    // Il est versionné pour que la compilation n'ait pas besoin du script ;
    // versionner une sortie, c'est accepter qu'elle vieillisse en silence.
    const attendu = genererThemeClair(readFileSync(SOURCE_TAILWIND, "utf-8"));
    expect(
      CLAIR,
      `${FICHIER_GENERE} n'est plus à jour : npx tsx scripts/generer-theme-clair.ts`,
    ).toBe(attendu);
  });

  it("renverse bien le clair et le sombre", () => {
    const valeur = (palier: string) =>
      CLAIR.match(new RegExp(`--color-slate-${palier}: ([^;]+);`))?.[1];
    // Le fond le plus sombre du site prend la valeur du gris le plus clair.
    expect(valeur("950")).toBeDefined();
    expect(valeur("950")).toBe(
      readFileSync(SOURCE_TAILWIND, "utf-8").match(/--color-slate-50: ([^;]+);/)?.[1],
    );
  });

  it("laisse le papier blanc à l'impression", () => {
    // Les fiches d'atelier s'impriment avec print:bg-white et print:text-black.
    // Sur le thème clair, où le blanc et le noir sont échangés, elles
    // sortiraient en noir sur noir.
    const impression = CLAIR.slice(CLAIR.indexOf("@media print"));
    expect(impression, "aucune règle d'impression").toContain("--color-white: #fff");
    expect(impression).toContain("--color-black: #000");
  });
});
