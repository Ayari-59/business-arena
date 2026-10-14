import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Icone, NOMS_D_ICONE } from "@/components/icone";

/**
 * DES ICÔNES DESSINÉES, ET UNE DEUXIÈME MESURE SUR L'OBSERVATION.
 *
 * Deux pistes de la revue visuelle, côté enseignant.
 *
 * · Les titres de section portaient des emoji, que le système dessine à sa
 *   façon : différents d'un appareil à l'autre, en couleurs étrangères au
 *   site, et brouillés au vidéoprojecteur — ce qui arrive à ces pages à
 *   chaque séance.
 * · La participation seule ne dit pas POURQUOI une classe décroche. Le temps
 *   médian d'un tour le dit souvent, et il n'existait qu'en moyenne, dans une
 *   tuile.
 */

const lire = (c: string) => readFileSync(join(process.cwd(), c), "utf8");
const EMOJI = /[\u{1F300}-\u{1FAFF}]/u;

describe("les pictogrammes du site", () => {
  // Partis de l'espace enseignant, ils sont devenus le jeu de pictogrammes de
  // tout le site : la garde porte donc sur la liste entière, pas sur les
  // quatorze du début.
  const NOMS = NOMS_D_ICONE;

  it("forment un jeu resserré : un dessin par sens, pas un par emoji", () => {
    // Plus de quarante, et l'œil ne retrouve plus rien ; moins de vingt, et
    // un même dessin finit par dire deux choses.
    expect(NOMS.length).toBeGreaterThanOrEqual(20);
    expect(NOMS.length).toBeLessThanOrEqual(48);
  });

  it("existent, et aucune ne ressemble à une autre", () => {
    const dessins = NOMS.map((n) => renderToStaticMarkup(createElement(Icone, { nom: n })));
    for (const d of dessins) expect(d).toContain("<svg");
    expect(new Set(dessins).size).toBe(NOMS.length);
  });

  it("prennent l'encre de la ligne qui les porte", () => {
    for (const n of NOMS) {
      const d = renderToStaticMarkup(createElement(Icone, { nom: n }));
      expect(d, n).toContain('stroke="currentColor"');
      expect(d, n).not.toMatch(/(?:fill|stroke)="#/);
      expect(d, n).toContain("aria-hidden");
    }
  });

  it("ont remplacé les emoji dans les titres de tiroir de la page de partie", () => {
    const page = lire("src/app/teacher/games/[gameId]/page.tsx");
    const titres = [...page.matchAll(/titre="([^"]*)"/g)].map((m) => m[1]!);
    expect(titres.length).toBeGreaterThan(4);
    for (const t of titres) expect(t, t).not.toMatch(EMOJI);
    // Et le tiroir sait porter une icône.
    expect(lire("src/components/tiroir.tsx")).toContain("icone");
  });

  it("ont remplacé les emoji des liens du ticket", () => {
    const page = lire("src/app/teacher/games/[gameId]/page.tsx");
    const ticket = page.slice(page.indexOf('aria-label="Code d'), page.indexOf("planCapped"));
    expect(ticket).not.toMatch(EMOJI);
    expect(ticket).toContain("<Icone");
  });
});

describe("l'observation de séance", () => {
  const page = lire("src/app/teacher/games/[gameId]/observation/page.tsx");

  it("montre la durée à côté de la participation, tour par tour", () => {
    expect(page).toContain("minutesMax");
    expect(page).toContain("Participation et durée, tour par tour");
  });

  it("ne mélange pas des équipes et des minutes sur une même échelle", () => {
    // Deux mesures, deux pistes : la participation sur l'effectif de la
    // classe, la durée sur le tour le plus long.
    expect(page).toContain("part(tour.validees, equipes)");
    expect(page).toContain("(100 * minutes) / minutesMax");
  });

  it("nomme les deux pistes, au lieu de les distinguer par la seule couleur", () => {
    expect(page).toContain("équipes ayant validé");
    expect(page).toContain("minutes médianes du tour");
    // Et chaque piste porte son chiffre en clair, à droite.
    expect(page).toContain("{minutes === null ? \"—\" : `${minutes} min`}");
  });
});
