import { describe, expect, it } from "vitest";
import { agregerParNiveau, mediane, type LigneAnalyse } from "../../src/pedagogy/mesure-analyse";

/**
 * LA MESURE DE L'ANALYSE : des agrégats simples, vérifiés à la main.
 */
const ligne = (p: Partial<LigneAnalyse>): LigneAnalyse => ({
  niveau: 1,
  rendue: true,
  minutes: 2,
  indices: 0,
  score: 1,
  ...p,
});

describe("médiane", () => {
  it("nulle sans mesure, centrale sinon, moyenne des deux du milieu si pair", () => {
    expect(mediane([])).toBeNull();
    expect(mediane([5, 1, 3])).toBe(3);
    expect(mediane([1, 2, 3, 10])).toBe(2.5);
  });
});

describe("agrégation par niveau", () => {
  it("compte les situations laissées de côté et range les niveaux", () => {
    const m = agregerParNiveau([
      ligne({ niveau: 4 }),
      ligne({ niveau: 1, rendue: true, minutes: 2 }),
      ligne({ niveau: 1, rendue: true, minutes: 4 }),
      ligne({ niveau: 1, rendue: false, minutes: null, score: 0 }),
    ]);
    expect(m.map((n) => n.niveau)).toEqual([1, 4]);
    const n1 = m[0]!;
    expect(n1.situations).toBe(3);
    expect(n1.rendues).toBe(2);
    expect(n1.tauxDeRendu).toBeCloseTo(2 / 3, 6);
    expect(n1.medianeMinutes).toBe(3);
  });

  it("isole les rendus tardifs (une pause n'est pas un temps d'analyse)", () => {
    const [n] = agregerParNiveau([
      ligne({ minutes: 2 }),
      ligne({ minutes: 3 }),
      ligne({ minutes: 240 }),
      ligne({ minutes: 5 }),
    ]);
    expect(n!.medianeMinutes).toBe(4);
    expect(n!.partDeRendusTardifs).toBe(0.25);
  });

  it("sans aucun rendu : pas de temps, pas de part tardive, pas de score", () => {
    const [n] = agregerParNiveau([ligne({ rendue: false, minutes: null, score: null })]);
    expect(n!.tauxDeRendu).toBe(0);
    expect(n!.medianeMinutes).toBeNull();
    expect(n!.partDeRendusTardifs).toBeNull();
    expect(n!.scoreMoyen).toBeNull();
  });

  it("moyenne les indices sur toutes les situations, rendues ou non", () => {
    const [n] = agregerParNiveau([ligne({ indices: 4 }), ligne({ rendue: false, minutes: null, indices: 0 })]);
    expect(n!.indicesParSituation).toBe(2);
  });
});
