import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ACCESSIBILITÉ DE BASE : ZOOM LIBRE, TEXTES LISIBLES, LIEN D'ÉVITEMENT.
 *
 * Mesuré en production sur la page d'accueil : viewport avec maximum-scale=1
 * (zoom bloqué sur mobile, WCAG 1.4.4), 45 blocs de texte sous 12 px, aucun
 * lien « Aller au contenu ». Trois gardes sur la source, pour que ça ne
 * revienne pas par une classe utilitaire glissée dans un composant.
 */

const SRC = join(process.cwd(), "src");

function fichiers(racine: string, extensions: string[]): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin, extensions));
    else if (extensions.some((ext) => entree.endsWith(ext))) trouves.push(chemin);
  }
  return trouves;
}

const layout = readFileSync(join(SRC, "app", "layout.tsx"), "utf8");

describe("zoom mobile", () => {
  it("le viewport ne bloque ni l'échelle ni le zoom", async () => {
    const { viewport } = await import("@/app/layout");
    expect(viewport.maximumScale).toBeUndefined();
    expect(viewport.userScalable).not.toBe(false);
    expect(layout).not.toMatch(/maximumScale|userScalable:\s*false|maximum-scale|user-scalable/);
  });
});

describe("lien d'évitement", () => {
  it("est le premier élément focusable du layout et cible le contenu", () => {
    const lien = layout.indexOf('href="#main"');
    const entete = layout.indexOf("<SiteHeader");
    expect(lien).toBeGreaterThan(-1);
    expect(lien).toBeLessThan(entete);
    expect(layout).toContain("Aller au contenu");
    // Invisible hors focus, visible au focus : sans quoi il est soit gênant,
    // soit inutile.
    expect(layout).toMatch(/sr-only/);
    expect(layout).toMatch(/focus:not-sr-only/);
  });

  it("chaque page pose son <main> avec l'identifiant visé", () => {
    const pages = fichiers(join(SRC, "app"), [".tsx"]).filter((f) =>
      readFileSync(f, "utf8").includes("<main"),
    );
    expect(pages.length).toBeGreaterThan(20);
    for (const page of pages) {
      const source = readFileSync(page, "utf8");
      const mains = source.match(/<main\b[^>]*>/g) ?? [];
      for (const balise of mains) {
        expect(balise, `${page.slice(SRC.length)} : ${balise}`).toContain('id="main"');
      }
    }
  });
});

describe("tailles de texte", () => {
  const PX_INTERDIT = /text-\[(?:[0-9]|1[01])(?:\.\d+)?px\]/g;
  const REM_INTERDIT = /text-\[0?\.(?:[0-6]\d*|7[0-4]\d*)rem\]/g;

  it("aucune classe utilitaire ne descend sous 12 px", () => {
    const fautes: string[] = [];
    for (const f of fichiers(SRC, [".tsx", ".ts"])) {
      const source = readFileSync(f, "utf8");
      for (const m of source.matchAll(PX_INTERDIT)) fautes.push(`${f.slice(SRC.length)} : ${m[0]}`);
      for (const m of source.matchAll(REM_INTERDIT)) fautes.push(`${f.slice(SRC.length)} : ${m[0]}`);
    }
    expect(fautes).toEqual([]);
  });

  it("aucune feuille de style ne fixe une taille sous 12 px", () => {
    const fautes: string[] = [];
    for (const f of fichiers(join(SRC, "app"), [".css"])) {
      const source = readFileSync(f, "utf8");
      for (const m of source.matchAll(/font-size:\s*([0-9.]+)(px|rem)/g)) {
        const valeur = Number(m[1]);
        const px = m[2] === "rem" ? valeur * 16 : valeur;
        if (px < 12) fautes.push(`${f.slice(SRC.length)} : ${m[0]}`);
      }
    }
    expect(fautes).toEqual([]);
  });

  it("les textes d'aide sous les champs de décision sont à 13 px", () => {
    const form = readFileSync(join(SRC, "components", "decision-form.tsx"), "utf8");
    const aides = form.match(/\{hint \? <span className="[^"]*">\{hint\}<\/span> : null\}/g) ?? [];
    // Il y en avait deux tant que le plan de trésorerie avait son champ
    // facultatif ; il ne reste que celui des champs de décision. Ce qui
    // compte est qu'aucun ne descende sous 13 px, pas combien il y en a.
    expect(aides.length).toBeGreaterThanOrEqual(1);
    for (const aide of aides) expect(aide).toContain("text-[13px]");
  });
});

/**
 * L'ESPACE EST UNE QUALITÉ, PAS UN RESTE.
 *
 * Quatre-vingt-une cartes portaient `p-1.5` — SIX pixels de padding sur
 * téléphone. C'était un arbitrage assumé (gagner de la largeur utile) qui avait
 * gagné partout, y compris là où rien ne l'imposait : le texte touchait la
 * bordure et l'écran donnait l'impression d'un brouillon.
 *
 * Le plancher est maintenant de 12 px (`p-3`, `px-3`) pour tout ce qui CONTIENT
 * quelque chose. Les pastilles gardent leur compacité : `px-1.5 py-0.5` est une
 * étiquette, pas un contenant, et l'élargir la déformerait.
 */
describe("respiration des cartes", () => {
  const FICHIERS = fichiers(SRC, [".tsx"]);

  it("aucun conteneur ne descend sous 12 px de padding", () => {
    const fautifs: string[] = [];
    for (const f of FICHIERS) {
      const source = readFileSync(f, "utf8");
      // `p-1.5` ou `px-1.5` suivi d'un padding vertical d'au moins 2 (py-2, py-3…)
      // : c'est un contenant. `px-1.5 py-0.5` ne correspond pas.
      for (const m of source.match(/\bp-1\.5\b(?!\s*sm:p-1)|px-1\.5 (?:py|pb|pt)-(?:[1-9]|1\.5)/g) ?? []) {
        fautifs.push(`${f} : ${m}`);
      }
    }
    expect(fautifs, `cartes trop serrées :\n${fautifs.join("\n")}`).toEqual([]);
  });
});

/**
 * LE CONTRASTE SE CALCULE, IL NE SE SUPPOSE PAS.
 *
 * Mesuré sur l'échelle réellement employée : `text-slate-500` donnait 3,75:1
 * sur une carte et 4,24:1 sur un bloc, `text-slate-600` 2,36:1 — c'est-à-dire
 * sous le seuil non textuel. Quatre-vingt-six textes étaient dans ce cas :
 * étiquettes de chiffrage, mentions de l'assistant, libellés d'étapes à venir.
 * En classe, sur un vidéoprojecteur en fin de journée ou sur un téléphone près
 * d'une fenêtre, ces textes n'existent pas.
 *
 * `text-slate-400` tient 6,96:1 sur slate-900 et 7,87:1 sur slate-950 : c'est
 * le plancher de l'encre secondaire sur fond sombre.
 *
 * LES PAGES À FOND CLAIR SONT UNE AUTRE AFFAIRE. Le manuel, les fiches
 * imprimables et les animations posent `data-theme="clair"` et `bg-white` :
 * l'échelle y est renversée, `text-slate-600` y est du gris foncé sur blanc,
 * et l'y remplacer par slate-400 ferait exactement le défaut qu'on corrige.
 * Ces fichiers sont donc nommés, un par un, plutôt que devinés.
 */
describe("contraste de l'encre sur fond sombre", () => {
  /** Luminance relative d'une couleur sRGB (WCAG 2.1, §relative luminance). */
  function luminance(hex: string): number {
    const canal = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const [r, g, b] = [1, 3, 5].map((i) => canal(parseInt(hex.slice(i, i + 2), 16) / 255));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  }
  function contraste(a: string, b: string): number {
    const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
    return (x! + 0.05) / (y! + 0.05);
  }

  const SLATE = {
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    900: "#0f172a", // la carte
    950: "#020617", // le bloc intérieur
  } as const;

  /** Les pages qui imposent un fond clair : l'échelle y est renversée. */
  const FOND_CLAIR = [
    "/components/manuel-imprimable.tsx",
    "/training/components/glossary-panel.tsx",
    "/training/components/tutorial-overlay.tsx",
    "/app/teacher/courriers/print/page.tsx",
    "/app/teacher/games/[gameId]/fiches/page.tsx",
    "/app/animations/[code]/page.tsx",
  ];

  it("le plancher retenu tient le seuil AA, celui qu'on a retiré ne le tenait pas", () => {
    // La garde mesure ce qu'elle exige : si un jour la palette bouge, c'est ce
    // test qui le dira, pas une lecture à l'œil.
    for (const fond of [SLATE[900], SLATE[950]]) {
      expect(contraste(SLATE[400], fond)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(SLATE[500], fond)).toBeLessThan(4.5);
      expect(contraste(SLATE[600], fond)).toBeLessThan(3);
    }
  });

  it("aucune encre sous le plancher sur une page à fond sombre", () => {
    const fautifs: string[] = [];
    for (const f of fichiers(SRC, [".tsx"])) {
      const court = f.slice(SRC.length);
      if (FOND_CLAIR.includes(court)) continue;
      for (const m of readFileSync(f, "utf8").match(/\btext-slate-[56]00\b/g) ?? []) {
        fautifs.push(`${court} : ${m}`);
      }
    }
    expect(
      fautifs,
      `sous 4,5:1 sur fond sombre, à passer en text-slate-400 :\n${fautifs.join("\n")}`,
    ).toEqual([]);
  });
});
