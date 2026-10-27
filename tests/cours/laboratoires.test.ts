import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import type { EtapeSimulation, LevierDeSimulation } from "../../src/config/cours/types";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";

/**
 * CHAQUE LABORATOIRE DU COURS A UN DÉFI QUI SE RELÈVE, ET QUI DEMANDE D'AGIR.
 *
 * Dans chaque chapitre, chaque cas et chaque entreprise où il se joue : les leviers ont des
 * bornes et un pas cohérents ; le départ et la solution sont sur le pas, dans les bornes ; la
 * solution relève le défi et le départ ne le relève pas (sinon l'élève n'aurait rien à faire) ;
 * la lecture ne sort que des nombres, et les textes ni NaN ni « undefined ».
 */

const laboratoires = [...CHAPITRES, ...SITUATIONS].flatMap((chapitre) =>
  ENTREPRISES_DU_COURS.filter((code) => !chapitre.entreprises || chapitre.entreprises.codes.includes(code)).flatMap((code) => {
    const cas = casDeLEntreprise(code);
    return chapitreDuCas(chapitre, cas)
      .etapes.filter((e): e is EtapeSimulation => e.type === "simulation")
      .map((etape) => ({ nom: `${chapitre.code} / ${etape.id} chez ${code}`, cas, etape }));
  }),
);

/** Une valeur est sur le pas du levier quand (valeur − min) ÷ pas est entier, au centième près. */
const surLePas = (l: LevierDeSimulation, v: number) => Math.abs((v - l.min) / l.pas - Math.round((v - l.min) / l.pas)) < 1e-6;

const propre = (t: string) => expect(t).not.toMatch(/undefined|NaN|Infinity|\[object/);

it("la garde voit les laboratoires du cours (aucun n'échappe au filtre)", () => {
  const declares = [...CHAPITRES, ...SITUATIONS].filter((c) => c.etapes.some((e) => e.type === "simulation")).map((c) => c.code);
  expect(new Set(laboratoires.map((x) => x.nom.split(" / ")[0]))).toEqual(new Set(declares));
});

describe.each(laboratoires)("$nom", ({ cas, etape }) => {
  const leviers = etape.leviers(cas);
  const defi = etape.defi(cas);
  const depart = Object.fromEntries(leviers.map((l) => [l.code, l.depart]));

  it("des leviers aux bornes et au pas cohérents, un départ et une solution sur le pas", () => {
    expect(leviers.length).toBeGreaterThan(0);
    expect(new Set(leviers.map((l) => l.code)).size).toBe(leviers.length);
    for (const l of leviers) {
      expect(l.pas, l.code).toBeGreaterThan(0);
      expect(l.max, l.code).toBeGreaterThan(l.min);
      expect(surLePas(l, l.max), `${l.code} : le maximum est sur le pas`).toBe(true);
      for (const v of [l.depart, defi.solution[l.code]!]) {
        expect(v, l.code).toBeGreaterThanOrEqual(l.min);
        expect(v, l.code).toBeLessThanOrEqual(l.max);
        expect(surLePas(l, v), `${l.code} : ${v} est sur le pas`).toBe(true);
      }
    }
    expect(Object.keys(defi.solution).sort()).toEqual(leviers.map((l) => l.code).sort());
  });

  it("la solution relève le défi, le départ ne le relève pas", () => {
    expect(defi.atteint(defi.solution)).toBe(true);
    expect(defi.atteint(depart)).toBe(false);
  });

  it("la lecture ne sort que des nombres, et les textes sont propres", () => {
    for (const p of [depart, defi.solution]) {
      const lignes = etape.lecture(cas, p);
      expect(lignes.length).toBeGreaterThan(0);
      for (const x of lignes) {
        expect(Number.isFinite(x.montant), x.libelle).toBe(true);
        if (x.reference !== undefined) expect(Number.isFinite(x.reference), x.libelle).toBe(true);
        propre(x.libelle);
      }
    }
    for (const t of [etape.question(cas), defi.consigne, defi.indice(depart), ...etape.explication(cas, defi.solution), ...leviers.flatMap((l) => [l.libelle, l.unite])]) propre(t);
  });
});
