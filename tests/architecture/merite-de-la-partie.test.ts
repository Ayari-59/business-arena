import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * MÉRITE OU CHANCE : deux règles que le code doit tenir sans qu'on y pense.
 *
 * 1. LE HASARD SE MESURE, IL NE SE MONTRE PAS TROP TÔT. Rejouer la partie sous
 *    d'autres graines, c'est savoir ce que d'autres tirages auraient donné :
 *    rien de cela ne doit paraître pendant la partie. Le verdict n'est lu que
 *    par le bilan d'une partie terminée (la page de l'arène, dans le bloc de
 *    fin), et calculé par la clôture du DERNIER tour.
 * 2. LA DISTRIBUTION SUIT LA PALETTE DES DONNÉES : aucune couleur écrite,
 *    seulement des jetons connus. C'est la règle de
 *    `palette-des-donnees.test.ts` ; elle est appliquée ici au nouveau
 *    graphique, le temps qu'il rejoigne la liste `GRAPHIQUES` de cette garde.
 */

const SRC = join(process.cwd(), "src");
const lire = (p: string) => readFileSync(join(SRC, p), "utf8");
const sansCommentaires = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

function sources(dossier: string): string[] {
  return readdirSync(dossier).flatMap((e) => {
    const c = join(dossier, e);
    return statSync(c).isDirectory() ? sources(c) : /\.tsx?$/.test(e) ? [c] : [];
  });
}

describe("le hasard se mesure au bilan, jamais pendant la partie", () => {
  it("seuls le bilan, la clôture du dernier tour et le service lisent le verdict", () => {
    const lecteurs = sources(SRC)
      .filter((f) => /\bmeriteDeLaPartie\b|MeriteDeLaPartieAuBilan\b/.test(sansCommentaires(readFileSync(f, "utf8"))))
      .map((f) => f.slice(SRC.length + 1))
      .sort();
    expect(lecteurs).toEqual([
      "app/arena/[gameId]/actions.ts",
      "app/arena/[gameId]/page.tsx",
      "components/merite-de-la-partie.tsx",
      // L'examen individuel note une copie REMISE (partie terminée) par ce verdict, après
      // la fin de la partie, et ne le montre au candidat que par sa note, une fois publiée.
      "services/examen.service.ts",
      "services/merite.service.ts",
    ]);
  });

  it("la page ne le pose que dans le bilan de fin de partie, en solo, derrière Suspense", () => {
    const page = sansCommentaires(lire("app/arena/[gameId]/page.tsx"));
    const i = page.indexOf("<MeriteDeLaPartieAuBilan");
    expect(i).toBeGreaterThan(-1);
    expect(page.indexOf("<MeriteDeLaPartieAuBilan", i + 1), "posé deux fois").toBe(-1);
    const avant = page.slice(0, i);
    // Dans le bloc `finished ? … : null` du bilan, et nulle part ailleurs.
    expect(avant.lastIndexOf("{finished")).toBeGreaterThan(avant.lastIndexOf("<BilanDePartie") - 4000);
    expect(avant.lastIndexOf("<BilanDePartie")).toBeGreaterThan(-1);
    expect(avant.slice(avant.lastIndexOf("merite={")), "hors du bilan").toMatch(/view\.kind === "solo"/);
    expect(avant.slice(avant.lastIndexOf("merite={"))).toContain("<Suspense fallback={<MeriteEnAttente />}>");
  });

  it("la clôture ne le lance qu'à la fin de la partie", () => {
    const actions = sansCommentaires(lire("app/arena/[gameId]/actions.ts"));
    expect(actions).toMatch(/if \(finished\) after\(\(\) => meriteDeLaPartie\(gameId\)/);
  });
});

describe("la distribution des marchés suit la palette des données", () => {
  const code = sansCommentaires(lire("components/merite-de-la-partie.tsx"));

  it("aucune couleur écrite", () => {
    expect(code.match(/#[0-9a-f]{3,8}\b/gi) ?? []).toEqual([]);
    expect(code.match(/\b(?:rgba?|hsla?|oklch|color-mix)\(/g) ?? []).toEqual([]);
  });

  it("chaque couleur est un jeton de la palette", () => {
    const connus = new Set(["donnee", "donnee-2", "metier", "fond-du-tableau"]);
    const vus = [...code.matchAll(/var\(--([a-z0-9-]+)/g)].map((m) => m[1]!);
    expect(vus.length).toBeGreaterThan(0);
    for (const nom of vus) expect(connus.has(nom), `jeton inconnu --${nom}`).toBe(true);
    // Vos décisions dans la teinte du métier, la référence au neutre.
    expect(code).toContain("bg-[color:var(--metier,var(--donnee))]");
    expect(code).toContain("bg-[var(--donnee-2)]");
  });

  it("pas d'orange hors du bouton : le lien de la suite est secondaire", () => {
    expect(code).not.toMatch(/\b(?:bg|text|border)-amber-/);
    expect(code).toMatch(/bouton\(\{ variante: "secondaire"/);
  });
});
