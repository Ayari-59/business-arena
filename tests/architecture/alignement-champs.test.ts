import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * DEUX DÉFAUTS D'ALIGNEMENT QUI NE SE VOIENT QU'À L'ÉCRAN.
 *
 * Constatés sur téléphone, sur le formulaire d'une gamme :
 *
 * 1. LE SUFFIXE SORTAIT DU CADRE. Un `<input>` a une largeur intrinsèque
 *    (`min-width: auto`) que ni `w-full` ni `flex-1` ne franchissent : dans un
 *    cadre étroit, il poussait « € » et « articles » dehors, à droite du
 *    cadre. `min-w-0` autorise le champ à rétrécir, `shrink-0` garde le
 *    suffixe entier.
 *
 * 2. LES CADRES SE DÉCALAIENT D'UNE LIGNE. Dans une grille à deux colonnes,
 *    « Prix de vente » tient sur une ligne et « Articles à mettre en rayon »
 *    sur deux : le cadre de gauche montait d'une ligne. `leading-4` fige la
 *    ligne à 16 px, `min-h-8` en réserve deux, quelle que soit la longueur.
 *
 * Aucun rendu ne révèle ça — c'est de la mise en page, pas du contenu. Ce test
 * garde les deux règles là où elles s'appliquent : les champs chiffrés.
 */

const FORM = join("src", "components", "decision-form.tsx");
const CONTEXTE = join("src", "components", "decision-context.tsx");
const source = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("les champs chiffrés restent dans leur cadre", () => {
  const form = source(FORM);

  it("aucun champ de saisie ne refuse de rétrécir", () => {
    const fautifs = form.match(/(?:w-full|(?<!min-w-0 )flex-1) bg-transparent/g) ?? [];
    expect(fautifs, `champs sans min-w-0 : ${fautifs.join(", ")}`).toEqual([]);
  });

  it("chaque cadre chiffré a son suffixe, et ce suffixe ne se fait pas écraser", () => {
    // Un cadre = un champ transparent + son unité. Les deux comptes doivent
    // coïncider : un suffixe en moins voudrait dire qu'un cadre a perdu son
    // unité, un en trop qu'il en a deux.
    const champs = form.match(/min-w-0 flex-1 bg-transparent/g) ?? [];
    const suffixes = form.match(/<span className="shrink-0 text-xs text-slate-400">/g) ?? [];
    expect(champs.length).toBeGreaterThan(0);
    expect(suffixes.length).toBe(champs.length);
  });
});

describe("les intitulés réservent deux lignes, pour que les valeurs s'alignent", () => {
  it("formulaire : tous les intitulés de champ", () => {
    // `font-medium uppercase … text-slate-400` est la signature d'un intitulé
    // de champ. On écarte deux voisins qui lui ressemblent :
    //   · les titres de section (`font-semibold`), seuls sur leur ligne, qui
    //     n'ont rien à aligner ;
    //   · « Acheter » / « Vendre » du parc machines (emerald et red), deux mots
    //     d'une seule ligne côte à côte dans un cadre compact : ils s'alignent
    //     déjà, et leur réserver deux lignes n'ajouterait que du vide.
    const intitules =
      source(FORM).match(
        /className="[^"]*font-medium uppercase tracking-wide text-slate-400"/g,
      ) ?? [];
    expect(intitules.length).toBeGreaterThan(0);
    for (const i of intitules) {
      expect(i, `intitulé sans hauteur réservée : ${i}`).toContain("min-h-8");
      expect(i, `intitulé sans interligne figé : ${i}`).toContain("leading-4");
    }
  });

  it("panneaux de cadrage : l'intitulé d'un chiffre", () => {
    const s = source(CONTEXTE);
    expect(s).toContain("min-h-8 text-xs uppercase leading-4");
  });
});
