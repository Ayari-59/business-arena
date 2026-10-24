import { expect, it } from "vitest";
import { CHAPITRES, PALIERS, PARCOURS, chapitreParCode } from "../../src/config/cours/registre";

/**
 * LA CARTE DU COURS EST COMPLÈTE.
 *
 * Chaque palier de chaque parcours ouvre au moins un chapitre (la page /cours n'affiche plus
 * « En préparation ») ; chaque chapitre a un code unique ; le premier, le seul libre, est le
 * chapitre pilote.
 */

it("chaque palier de chaque parcours ouvre au moins un chapitre", () => {
  for (const p of PARCOURS) {
    for (const pa of PALIERS) {
      expect(CHAPITRES.some((c) => c.parcours === p.code && c.palier === pa.palier), `${p.code}, palier ${pa.palier}`).toBe(true);
    }
  }
});

it("chaque chapitre a un code unique, et seul le premier est libre", () => {
  expect(new Set(CHAPITRES.map((c) => c.code)).size).toBe(CHAPITRES.length);
  for (const c of CHAPITRES) expect(chapitreParCode(c.code)).toBe(c);
  expect(CHAPITRES.filter((c) => c.libre)).toEqual([CHAPITRES[0]]);
});
