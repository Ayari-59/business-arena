import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { dessinerQr, urlDeJonction, MARGE_QR } from "@/lib/qr";
import { normaliserCodeDePartie } from "@/lib/code-de-partie";
import { CodeQr } from "@/components/code-qr";

/**
 * LE QR DE LA PARTIE.
 *
 * Un QR ne se relit pas : il se scanne, ou il ne sert à rien. Ce fichier
 * vérifie donc les trois choses qui décident de cela.
 *
 * · CE QU'IL ENCODE. L'adresse doit être celle de l'écran d'entrée, avec le
 *   code dedans, et cette adresse doit être acceptée à l'arrivée : c'est le
 *   même code qui ressort de `normaliserCodeDePartie`.
 *
 * · SON DESSIN, AU MODULE PRÈS. Le QR de référence ci-dessous est celui de
 *   `…/join?code=CBZAAT`. Il a été DÉCODÉ pour de vrai, une fois, avant d'être
 *   figé ici : chaque module rendu en carré de 8×8 pixels, l'image donnée à un
 *   décodeur, et le texte lu comparé à l'adresse de départ (quatre codes
 *   essayés, quatre lectures exactes). Ce qui est écrit là est donc un QR qui
 *   scanne, et non un QR que nous croyons juste. Une mise à jour de la
 *   bibliothèque, une transposition ligne/colonne ou une zone de silence
 *   rabotée le feront tomber.
 *
 * · SA PLAQUE CLAIRE. Le site est sombre ; un QR sombre sur fond sombre n'est
 *   pas lu par tous les appareils.
 */

/** Le QR de `https://www.business-arena.fr/join?code=CBZAAT`, zone de silence comprise. */
const REFERENCE = [
  ".........................................",
  ".........................................",
  ".........................................",
  ".........................................",
  "....#######.#..##.##.##...##..#######....",
  "....#.....#....#.....#.#....#.#.....#....",
  "....#.###.#..#.#.#..#...##....#.###.#....",
  "....#.###.#.#.....##.#####.#..#.###.#....",
  "....#.###.#.#..#..#...###.#...#.###.#....",
  "....#.....#.###.....#.##..#...#.....#....",
  "....#######.#.#.#.#.#.#.#.#.#.#######....",
  "............#.#.#.#####..#.#.............",
  "....#...#.###.##....##.####.######..#....",
  ".........#..#.#.#####...#.##.#...###.....",
  "..........##.##....###..##.#.#...#.#.....",
  "....###.#..###....#..###.##.##.....#.....",
  "....###..###..#####...###..####.##.#.....",
  "....#.###..#.#......#..#.......#.#.......",
  "....#.##.###.#..#.#.#..#..##.#######.....",
  ".......#.......##.#..#.###...##.##.......",
  "....#...#.###....#.#.#...####.#.##.#.....",
  "....##.##.......#.#####..#.##....###.....",
  ".....#..#.##..#..#.##.#.#..#####.#.#.....",
  "....#.#....###.........#..#.##.#...##....",
  "....#..#.##...###..##..#..#...#.##.......",
  "....#.#.....#..#.##...####...###.#.#.....",
  "......##.##.#.#..###.##.####.#....##.....",
  ".......#.#.##.###..####..#...##.....#....",
  "....###...#...##.....#.#.##.#####........",
  "............#.###.##..#....##...#.##.....",
  "....#######.#.#..#.#.#..###.#.#.##.#.....",
  "....#.....#..##..#.####.##..#...#...#....",
  "....#.###.#.#..###....###...######.#.....",
  "....#.###.#..#..##..##.#.###..###.##.....",
  "....#.###.#.....#...#.##.....####.#......",
  "....#.....#..#.###...#.#####.............",
  "....#######.##..#..#.#..#####.......#....",
  ".........................................",
  ".........................................",
  ".........................................",
  ".........................................",
];

/** Le dessin, relu comme une grille de caractères : lisible et comparable. */
function grille(texte: string): string[] {
  const { cote, chemin } = dessinerQr(texte);
  const lignes = Array.from({ length: cote }, () => Array(cote).fill("."));
  for (const m of chemin.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
    lignes[Number(m[2])]![Number(m[1])] = "#";
  }
  return lignes.map((l) => l.join(""));
}

describe("l'adresse encodée", () => {
  it("mène à l'écran d'entrée, code compris", () => {
    expect(urlDeJonction("CBZAAT")).toBe("https://www.business-arena.fr/join?code=CBZAAT");
  });

  it("met le code en capitales et le débarrasse de ses espaces", () => {
    expect(urlDeJonction("  cbzaat ")).toBe("https://www.business-arena.fr/join?code=CBZAAT");
  });

  it("est acceptée à l'arrivée : le code qui en ressort est celui qui y est entré", () => {
    const code = "K7M2PR";
    const parametre = new URL(urlDeJonction(code)).searchParams.get("code");
    expect(normaliserCodeDePartie(parametre)).toBe(code);
  });
});

describe("le dessin", () => {
  it("est exactement le QR décodé une fois pour toutes", () => {
    expect(grille("https://www.business-arena.fr/join?code=CBZAAT")).toEqual(REFERENCE);
  });

  it("porte la zone de silence de quatre modules que la norme exige", () => {
    const g = grille(urlDeJonction("K7M2PR"));
    const vide = ".".repeat(g.length);
    for (let i = 0; i < MARGE_QR; i += 1) {
      expect(g[i], `ligne ${i}`).toBe(vide);
      expect(g[g.length - 1 - i], `ligne ${g.length - 1 - i}`).toBe(vide);
      for (const ligne of g) {
        expect(ligne[i]).toBe(".");
        expect(ligne[ligne.length - 1 - i]).toBe(".");
      }
    }
  });

  it("place les trois repères d'angle, sans quoi rien ne se cale", () => {
    const g = grille(urlDeJonction("K7M2PR"));
    const n = g.length - MARGE_QR * 2;
    // Un repère : sept modules sombres en bordure, un anneau clair, un cœur.
    const repere = (ligne0: number, colonne0: number) => {
      for (let i = 0; i < 7; i += 1) {
        expect(g[ligne0 + MARGE_QR]![colonne0 + MARGE_QR + i]).toBe("#");
        expect(g[ligne0 + MARGE_QR + 6]![colonne0 + MARGE_QR + i]).toBe("#");
      }
      expect(g[ligne0 + MARGE_QR + 1]![colonne0 + MARGE_QR + 1]).toBe(".");
      expect(g[ligne0 + MARGE_QR + 3]![colonne0 + MARGE_QR + 3]).toBe("#");
    };
    repere(0, 0);
    repere(0, n - 7);
    repere(n - 7, 0);
  });

  it("ne dessine que des modules sombres : le reste est la plaque", () => {
    const { chemin } = dessinerQr(urlDeJonction("K7M2PR"));
    expect(chemin.replace(/M\d+ \d+h1v1h-1z/g, "")).toBe("");
  });
});

describe("le composant", () => {
  const html = renderToStaticMarkup(
    createElement(CodeQr, {
      valeur: urlDeJonction("CBZAAT"),
      description: "QR code d'entrée dans la partie, code CBZAAT",
    }),
  );

  it("pose une plaque claire sous les modules sombres", () => {
    // L'ordre compte : la plaque d'abord, les modules par-dessus.
    expect(html.indexOf('fill="#ffffff"')).toBeLessThan(html.indexOf('fill="#020617"'));
  });

  it("dit ce qu'il est à qui ne le voit pas, plutôt que de se cacher", () => {
    expect(html).toContain('role="img"');
    expect(html).toContain("aria-label=\"QR code d&#x27;entrée dans la partie, code CBZAAT\"");
    expect(html).not.toContain("aria-hidden");
  });

  it("tient dans un seul tracé : la page ne charge aucune image", () => {
    expect(html.match(/<path /g)).toHaveLength(1);
    expect(html).not.toContain("<img");
  });
});

describe("le code reçu par l'adresse", () => {
  it("garde un code bien formé, à la casse et aux espaces de bord près", () => {
    expect(normaliserCodeDePartie("CBZAAT")).toBe("CBZAAT");
    expect(normaliserCodeDePartie("cbzaat")).toBe("CBZAAT");
    expect(normaliserCodeDePartie(" cbzaat\n")).toBe("CBZAAT");
  });

  it("refuse tout le reste plutôt que de le montrer dans le champ", () => {
    for (const brut of [
      undefined,
      null,
      "",
      "ABC",
      "<script>alert(1)</script>",
      "ABCDE!",
      "  ",
      "cb-zaat",
      "CBZAAT CBZAAT",
    ]) {
      expect(normaliserCodeDePartie(brut), JSON.stringify(brut)).toBeNull();
    }
  });

  it("ne fabrique pas un code d'allure juste avec ce qui traîne autour", () => {
    // « SCRIPT » : ce que rendait la version qui nettoyait au lieu de refuser.
    expect(normaliserCodeDePartie("<script>alert(1)</script>")).toBeNull();
    expect(normaliserCodeDePartie("CBZAATSUITE")).toBeNull();
  });
});

describe("le chemin complet, du QR au champ", () => {
  const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

  it("la page d'entrée lit le code de l'adresse et le filtre avant de l'afficher", () => {
    const page = lire("src/app/join/page.tsx");
    expect(page).toContain("searchParams");
    expect(page).toContain("normaliserCodeDePartie(code)");
    expect(page).toContain("codeInitial={codeInitial}");
  });

  it("le champ est rempli d'avance et le curseur va au prénom", () => {
    const form = lire("src/components/join-form.tsx");
    expect(form).toContain("defaultValue={codeInitial ?? undefined}");
    // Le prénom est alors la seule chose qui reste à écrire : on y va tout de
    // suite. Sans code pré-rempli, rien n'est mis au premier plan.
    expect(form).toContain("autoFocus={codeInitial !== null}");
  });

  it("les trois écrans qui portent le code portent aussi le QR", () => {
    for (const chemin of [
      "src/app/teacher/games/[gameId]/page.tsx",
      "src/app/teacher/games/[gameId]/projection/page.tsx",
      "src/app/teacher/games/[gameId]/fiches/page.tsx",
    ]) {
      const source = lire(chemin);
      expect(source, chemin).toContain("urlDeJonction(view.joinCode)");
      expect(source, chemin).toContain("CodeQr");
    }
  });

  it("aucun service extérieur ne fabrique le QR, et la page ne le pourrait pas", () => {
    // Le calcul est ici parce qu'il DOIT l'être : la politique de sécurité
    // n'autorise les images que depuis le site, `data:` et `blob:`. Un jour où
    // cette ligne s'ouvrirait, une image de QR pourrait revenir d'ailleurs —
    // et les codes de toutes les parties partiraient chez un tiers.
    const csp = lire("src/config/security-headers.ts");
    expect(csp).toContain("img-src 'self' data: blob:");
    for (const hote of ["qrserver", "quickchart", "chart.googleapis", "qrcode.tec-it", "goqr"]) {
      expect(lire("src/lib/qr.ts"), hote).not.toContain(hote);
      expect(lire("src/components/code-qr.tsx"), hote).not.toContain(hote);
    }
  });
});
