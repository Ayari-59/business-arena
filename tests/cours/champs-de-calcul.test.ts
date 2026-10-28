import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import { champJuste, lireNombre } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * CHAQUE CHAMP DE CALCUL SE REMPLIT JUSTE.
 *
 * Dans chaque chapitre, chaque cas et chaque entreprise où il se joue, la réponse attendue d'un
 * champ, écrite à la française comme l'élève la tape, est acceptée par le correcteur. Un champ
 * qui demande un coefficient au dix-millième (0,9568) ne doit pas être refusé parce que la
 * saisie serait arrondie au centime (défaut relevé par l'e2e du bilan fonctionnel, octobre 2026).
 */

const aLaFrancaise = (x: number) => String(x).replace(".", ",");

const champs = [...CHAPITRES, ...SITUATIONS].flatMap((chapitre) =>
  ENTREPRISES_DU_COURS.filter((code) => !chapitre.entreprises || chapitre.entreprises.codes.includes(code)).flatMap((code) => {
    const cas = casDeLEntreprise(code);
    const deroule = chapitreDuCas(chapitre, cas);
    return deroule.etapes.flatMap((etape, i) =>
      etape.type === "montants" ? etape.champs(cas, etatAvant(deroule, cas, i)).map((c) => ({ nom: `${chapitre.code} / ${etape.id} chez ${code} : ${c.libelle}`, c })) : [],
    );
  }),
);

it("la lecture d'un champ garde les décimales, et le centime reste la tolérance par défaut", () => {
  expect(lireNombre("0,9568")).toBe(0.9568);
  expect(lireNombre("−1 234,5")).toBe(-1234.5);
  expect(lireNombre("12,5 %")).toBe(12.5);
  expect(champJuste("0,9568", { attendu: 0.9568, tolerance: 0.001 })).toBe(true);
  expect(champJuste("0,96", { attendu: 0.9568, tolerance: 0.001 })).toBe(false);
  expect(champJuste("10,01", { attendu: 10 })).toBe(true);
  expect(champJuste("10,02", { attendu: 10 })).toBe(false);
});

describe("la réponse attendue de chaque champ est acceptée", () => {
  it(`${champs.length} champs, tous justes`, () => {
    expect(champs.length).toBeGreaterThan(500);
    const refuses = champs.filter(({ c }) => !champJuste(aLaFrancaise(c.attendu), c)).map(({ nom }) => nom);
    expect(refuses).toEqual([]);
  });
});
