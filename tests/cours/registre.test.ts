import { expect, it } from "vitest";
import { CHAPITRES, PALIERS, PARCOURS, PROGRAMME, chapitreParCode, paliersDuParcours } from "../../src/config/cours/registre";

/**
 * LA CARTE DU COURS DIT VRAI.
 *
 * Un parcours achevé ouvre un chapitre à chaque palier de sa carte (la page /cours n'affiche
 * plus « En préparation » pour lui) ; un parcours qui se construit le dit, et aucun chapitre
 * ne tombe sur un palier que sa carte ne montre pas. Chaque chapitre a un code unique ; le
 * premier, le seul libre, est le chapitre pilote.
 */

const ouvre = (code: string, palier: number) => CHAPITRES.some((c) => c.parcours === code && c.palier === palier);

it("un parcours achevé ouvre un chapitre à chaque palier de sa carte, et les deux premiers couvrent les quatre", () => {
  for (const p of PARCOURS.filter((x) => !x.enPreparation)) {
    for (const pa of paliersDuParcours(p.code)) expect(ouvre(p.code, pa.palier), `${p.code}, palier ${pa.palier}`).toBe(true);
  }
  for (const code of ["comptabilite-generale", "controle-de-gestion"] as const) {
    expect(paliersDuParcours(code)).toEqual(PALIERS);
  }
});

it("un parcours en préparation a encore des chapitres à écrire, et aucun chapitre hors de sa carte", () => {
  const ouverts = (code: string, palier: number) => CHAPITRES.filter((c) => c.parcours === code && c.palier === palier).length;
  for (const p of PARCOURS.filter((x) => x.enPreparation)) {
    const restants = paliersDuParcours(p.code).some((pa) => ouverts(p.code, pa.palier) < (PROGRAMME[p.code][pa.palier] ?? []).length);
    expect(restants, `${p.code} : tout son programme a un chapitre, il n'est plus en préparation`).toBe(true);
  }
  for (const c of CHAPITRES) expect(PROGRAMME[c.parcours][c.palier], `${c.code} : palier ${c.palier} de ${c.parcours}`).toBeDefined();
});

it("chaque chapitre a un code unique, et seul le premier est libre", () => {
  expect(new Set(CHAPITRES.map((c) => c.code)).size).toBe(CHAPITRES.length);
  for (const c of CHAPITRES) expect(chapitreParCode(c.code)).toBe(c);
  expect(CHAPITRES.filter((c) => c.libre)).toEqual([CHAPITRES[0]]);
});
