import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * L'EXAMEN N'A QU'UNE PÉRIODICITÉ, ET ELLE NE S'ÉCRIT PAS DEUX FOIS.
 *
 * Le lot de graines (`pedagogy/examen/lot.ts`) mesure l'équivalence de difficulté en
 * SIMULANT la partie du candidat : il doit la simuler dans le monde que le candidat
 * jouera. Les deux sites posaient `periodicity: "quarter"` EN DUR, chacun pour soi — le
 * lot mesurait donc sur un monde trimestriel une copie qui, le jour où l'examen offrira
 * un sélecteur, se jouera au mois : l'équivalence annoncée à l'enseignant porterait sur
 * un autre jeu que celui passé par ses élèves.
 *
 * Une seule valeur, donc (`PERIODICITE_DE_L_EXAMEN`), lue par le lot comme par la
 * création de la partie, et aucun littéral de périodicité dans ces deux fichiers : c'est
 * la seule façon qu'ils ne puissent plus diverger en silence.
 */
const lire = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const sansCommentaires = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("la périodicité d'un examen : une seule valeur", () => {
  for (const fichier of ["src/pedagogy/examen/lot.ts", "src/services/examen.service.ts"]) {
    it(`${fichier} ne pose aucune périodicité en dur`, () => {
      const code = sansCommentaires(lire(fichier));
      expect(code).not.toMatch(/periodicity:\s*"(month|quarter|year)"/);
      expect(code).not.toMatch(/periodicite:\s*"(month|quarter|year)"/);
    });
  }

  it("la valeur est déclarée une fois, dans le domaine de l'examen", () => {
    expect(sansCommentaires(lire("src/pedagogy/examen/lot.ts"))).toMatch(
      /export const PERIODICITE_DE_L_EXAMEN/,
    );
    expect(sansCommentaires(lire("src/services/examen.service.ts"))).toMatch(
      /PERIODICITE_DE_L_EXAMEN/,
    );
  });
});
