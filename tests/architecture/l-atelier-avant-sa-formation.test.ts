import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * UN ATELIER SE PRÉSENTE PAR SON NOM, PAS PAR SON DIPLÔME.
 *
 * CE QUI S'EST PASSÉ. Le modèle de données a changé — un atelier déclare
 * désormais les formations qu'il sert, zéro, une ou plusieurs — mais la
 * présentation est restée celle d'avant. Le tableau des ateliers ouvrait
 * chaque ligne par une colonne « Diplôme », la carte par une pastille ambre
 * portant le sigle, la fiche par un fil d'Ariane « ATELIERS / BTS CG ». On
 * lisait le diplôme avant de savoir ce que l'atelier fait faire.
 *
 * Le défaut survit au changement de données parce qu'il ne casse rien : la
 * page s'affiche, les tests passent, et c'est l'œil qui le voit.
 *
 * POURQUOI CE N'EST PLUS TENABLE. Une étiquette de diplôme ne peut pas tenir
 * lieu de nom quand un atelier en sert plusieurs — le tournoi inter-filières
 * ouvrirait sa ligne par quatre sigles — ni quand deux ateliers servent le
 * même : ils se présenteraient à l'identique.
 *
 * LA RÈGLE : partout où un atelier est listé ou présenté, son intitulé paraît
 * AVANT le rattachement. La page des parcours est l'exception assumée, et elle
 * n'est pas gardée ici : elle parle de référentiels, et c'est la formation qui
 * y est le sujet.
 */

const source = (chemin: string) =>
  readFileSync(join(process.cwd(), chemin), "utf8");

/** La source sans sa prose : un commentaire cite forcément ce qu'il interdit. */
const codeSeul = (chemin: string) =>
  source(chemin)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

/**
 * CE QUI OUVRE LA CARTE D'UN ATELIER.
 *
 * On ne compare pas les premières occurrences du fichier : une liste de
 * publics dérivée en tête de page viendrait avant tout le reste et ferait
 * échouer la règle sans rien dire de ce qu'on voit. On lit donc CHAQUE carte,
 * du moment où elle prend son atelier (`key={a.code}`) jusqu'à son titre.
 */
function cartes(chemin: string): string[] {
  const code = codeSeul(chemin);
  const morceaux: string[] = [];
  for (const m of code.matchAll(/key=\{a\.code\}/g)) {
    const titre = code.indexOf("{a.titre}", m.index);
    if (titre > -1) morceaux.push(code.slice(m.index, titre));
  }
  return morceaux;
}

describe("un atelier se présente par son nom", () => {
  it("le tableau des ateliers ouvre ses lignes par l'atelier", () => {
    const page = source("src/app/animations/page.tsx");
    const nu = page.replace(/\/\*[\s\S]*?\*\//g, " ");
    // L'en-tête dit ce que la colonne porte, et son ordre est celui des lignes.
    const entetes = [...nu.matchAll(/<th[^>]*>([^<]+)<\/th>/g)].map((m) =>
      m[1]!.trim(),
    );
    expect(entetes.length, "aucune colonne trouvée").toBeGreaterThan(3);
    expect(entetes[0], `l'ordre des colonnes : ${entetes.join(" | ")}`).toBe(
      "Atelier",
    );
    expect(
      entetes,
      "la colonne des rattachements se nomme au pluriel",
    ).toContain("Formations");
    expect(
      entetes,
      "« Diplôme » au singulier ne peut plus nommer la colonne",
    ).not.toContain("Diplôme");
  });

  it("la carte d'un atelier nomme l'atelier avant sa formation", () => {
    for (const chemin of [
      "src/app/animations/page.tsx",
      "src/app/enseignants/page.tsx",
    ]) {
      const morceaux = cartes(chemin);
      expect(
        morceaux.length,
        `${chemin} : aucune carte d'atelier trouvée`,
      ).toBeGreaterThan(0);
      for (const avantLeTitre of morceaux) {
        expect(
          avantLeTitre,
          `${chemin} : une carte annonce sa formation avant son intitulé`,
        ).not.toContain("publicDeLAtelier(a)");
      }
    }
  });

  it("la fiche d'un atelier s'annonce par son intitulé", () => {
    const fiche = source("src/app/animations/[code]/page.tsx");
    const nu = fiche
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ");
    // Le fil d'Ariane et le surtitre précèdent le h1 : ni l'un ni l'autre ne
    // doit nommer la formation, sans quoi elle est ce qu'on lit en premier.
    const avantLeTitre = nu.slice(0, nu.indexOf("{atelier.titre}"));
    expect(
      avantLeTitre,
      "la formation est nommée avant le titre de la fiche",
    ).not.toContain("publicDeLAtelier(atelier)");
    expect(avantLeTitre).not.toContain("formationsEnToutesLettres(atelier)");
    // Et la fiche technique les nomme au pluriel, puisqu'il peut y en avoir
    // plusieurs depuis le rattachement multiple.
    expect(nu).toContain('"Formations"');
    expect(
      nu,
      "« Diplôme » au singulier dans la fiche technique",
    ).not.toContain('"Diplôme"');
  });
});
