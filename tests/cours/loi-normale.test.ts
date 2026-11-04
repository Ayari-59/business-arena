import { describe, expect, it } from "vitest";
import {
  T_DE_LA_TABLE,
  coefficientDeConfiance,
  densiteNormale,
  lectureDeLaTable,
  probabiliteEntre,
  probabiliteSous,
  quantileNormal,
  repartitionNormale,
} from "../../src/config/cours/monde/loi-normale";

/**
 * LA LOI NORMALE DU COURS (monde/loi-normale.ts), confrontée à la table du cours du propriétaire
 * (chapitre 6, « Table de la loi normale centrée réduite », à quatre décimales, et sa table des
 * grandes valeurs de t, à cinq) et à des valeurs connues au millionième de millionième.
 */

/** Des lignes de la table du cours : t, puis Π(t) pour t, t + 0,01, …, t + 0,09. */
const LIGNES_DE_LA_TABLE: readonly [number, readonly number[]][] = [
  [0, [0.5, 0.504, 0.508, 0.512, 0.516, 0.5199, 0.5239, 0.5279, 0.5319, 0.5359]],
  [0.5, [0.6915, 0.695, 0.6985, 0.7019, 0.7054, 0.7088, 0.7123, 0.7157, 0.719, 0.7224]],
  [0.7, [0.758, 0.7611, 0.7642, 0.7673, 0.7704, 0.7734, 0.7764, 0.7794, 0.7823, 0.7852]],
  [1, [0.8413, 0.8438, 0.8461, 0.8485, 0.8508, 0.8531, 0.8554, 0.8577, 0.8599, 0.8621]],
  [1.2, [0.8849, 0.8869, 0.8888, 0.8907, 0.8925, 0.8944, 0.8962, 0.898, 0.8997, 0.9015]],
  [1.6, [0.9452, 0.9463, 0.9474, 0.9484, 0.9495, 0.9505, 0.9515, 0.9525, 0.9535, 0.9545]],
  [1.9, [0.9713, 0.9719, 0.9726, 0.9732, 0.9738, 0.9744, 0.975, 0.9756, 0.9761, 0.9767]],
  [2, [0.9772, 0.9778, 0.9783, 0.9788, 0.9793, 0.9798, 0.9803, 0.9808, 0.9812, 0.9817]],
  [2.5, [0.9938, 0.994, 0.9941, 0.9943, 0.9945, 0.9946, 0.9948, 0.9949, 0.9951, 0.9952]],
  [2.9, [0.9981, 0.9982, 0.9982, 0.9983, 0.9984, 0.9984, 0.9985, 0.9985, 0.9986, 0.9986]],
];

/** La table des grandes valeurs de t, à cinq décimales. */
const GRANDES_VALEURS: readonly [number, number][] = [
  [3, 0.99865],
  [3.1, 0.99904],
  [3.2, 0.99931],
  [3.3, 0.99952],
  [3.4, 0.99966],
  [3.5, 0.99977],
  [3.6, 0.99984],
  [3.8, 0.99993],
  [4, 0.99997],
];

describe("la loi normale centrée réduite", () => {
  it("retrouve chaque case des lignes de la table du cours, à quatre décimales", () => {
    for (const [t, valeurs] of LIGNES_DE_LA_TABLE) {
      valeurs.forEach((v, j) => {
        const x = Math.round((t + j / 100) * 100) / 100;
        expect(Math.round(repartitionNormale(x) * 1e4) / 1e4, `Π(${x})`).toBe(v);
        expect(lectureDeLaTable(x), `table ${x}`).toBe(v);
      });
    }
  });

  it("retrouve la table des grandes valeurs, à cinq décimales près", () => {
    // La table du cours écrit 0,99904 pour 3,1 (0,999032…), 0,99976 pour 3,5 et 0,99992 pour 3,8 : des
    // arrondis d'une décimale de trop près. Le centième de millième suffit à les reconnaître.
    for (const [t, v] of GRANDES_VALEURS) expect(Math.abs(repartitionNormale(t) - v), `Π(${t})`).toBeLessThanOrEqual(1e-5);
  });

  it("vaut les valeurs exactes connues, au millionième de millionième", () => {
    expect(repartitionNormale(0)).toBe(0.5);
    expect(repartitionNormale(1)).toBeCloseTo(0.8413447460685429, 12);
    expect(repartitionNormale(1.96)).toBeCloseTo(0.9750021048517795, 12);
    expect(repartitionNormale(-2.5)).toBeCloseTo(0.006209665325776132, 12);
    expect(repartitionNormale(3)).toBeCloseTo(0.9986501019683699, 12);
    expect(repartitionNormale(6)).toBeCloseTo(0.9999999990134123, 12);
    // Au fond de la queue, la précision relative reste celle d'un nombre.
    expect(repartitionNormale(-5) / 2.866515718791939e-7).toBeCloseTo(1, 12);
    expect(repartitionNormale(-10) / 7.619853024160527e-24).toBeCloseTo(1, 10);
    expect(repartitionNormale(-40)).toBe(0);
    expect(repartitionNormale(40)).toBe(1);
    expect(densiteNormale(0)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 15);
  });

  it("est symétrique et croissante : Π(−t) = 1 − Π(t)", () => {
    let avant = 0;
    for (let i = -800; i <= 800; i++) {
      const t = i / 100;
      const p = repartitionNormale(t);
      expect(p, `Π(${t})`).toBeGreaterThanOrEqual(avant);
      expect(Math.abs(repartitionNormale(-t) - (1 - p)), `symétrie en ${t}`).toBeLessThan(1e-14);
      avant = p;
    }
  });

  it("la dérivée de Π est la densité", () => {
    for (const t of [-2.3, -1, 0, 0.7, 1.645, 2.8]) {
      const h = 1e-5;
      expect((repartitionNormale(t + h) - repartitionNormale(t - h)) / (2 * h)).toBeCloseTo(densiteNormale(t), 8);
    }
  });

  it("lit la table comme à l'examen : t arrondi au centième, le complément à l'unité pour t négatif", () => {
    expect(lectureDeLaTable(-0.7006)).toBe(0.242);
    expect(lectureDeLaTable(0.8867)).toBe(0.8133);
    expect(lectureDeLaTable(-1)).toBe(0.1587);
    expect(lectureDeLaTable(-2.5)).toBe(0.0062);
  });
});

describe("les lois normales N(m ; σ), et la réciproque de Π", () => {
  it("centre et réduit : P(X ≤ x) = Π((x − m) ÷ σ)", () => {
    expect(probabiliteSous(1_440, 1_590, 150)).toBeCloseTo(repartitionNormale(-1), 15);
    expect(probabiliteEntre(1_440, 1_740, 1_590, 150)).toBeCloseTo(0.6826894921370859, 12);
    // L'application 22 du cours : un chiffre d'affaires N(12 000 ; 1 500), P(10 500 < CA < 13 500) = 2Π(1) − 1.
    expect(probabiliteEntre(10_500, 13_500, 12_000, 1_500)).toBeCloseTo(2 * repartitionNormale(1) - 1, 15);
    expect(() => probabiliteSous(1, 0, 0)).toThrow();
  });

  it("la réciproque de Π retrouve les coefficients de la table : 1,28, 1,645, 1,96, 2,575", () => {
    expect(quantileNormal(0.5)).toBeCloseTo(0, 12);
    expect(quantileNormal(0.975)).toBeCloseTo(1.959963984540054, 10);
    expect(quantileNormal(0.95)).toBeCloseTo(1.6448536269514722, 10);
    expect(coefficientDeConfiance(0.99)).toBeCloseTo(2.5758293035489004, 10);
    expect(Math.round(quantileNormal(0.9) * 100) / 100).toBe(T_DE_LA_TABLE.unCoteA90);
    expect(Math.round(quantileNormal(0.95) * 1000) / 1000).toBe(T_DE_LA_TABLE.unCoteA95);
    expect(Math.round(coefficientDeConfiance(0.95) * 100) / 100).toBe(T_DE_LA_TABLE.centreA95);
    expect(Math.abs(coefficientDeConfiance(0.99) - T_DE_LA_TABLE.centreA99)).toBeLessThan(0.001);
    for (const p of [0.001, 0.2, 0.5, 0.8, 0.999]) expect(repartitionNormale(quantileNormal(p))).toBeCloseTo(p, 12);
    expect(() => quantileNormal(1)).toThrow();
  });
});
