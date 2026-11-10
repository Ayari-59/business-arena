import { describe, expect, it } from "vitest";
import { champJuste, montantEcrit } from "../../src/pedagogy/cours/correcteur";
import { aLUnite, arrondi, arrondi2, eur, nombreAuCentieme, partDe2, pct, produit2, qte, quotient2, somme2, taux2 } from "../../src/pedagogy/cours/deux-decimales";

/**
 * L'OUTIL D'ARRONDI DU COURS (décision du propriétaire, 10 novembre 2026 : les calculs se font à deux
 * chiffres après la virgule). L'arrondi se fait la moitié loin de zéro, sans erreur de flottant, et le
 * corrigé écrit deux décimales dès qu'un montant ou un pourcentage n'est pas entier.
 */

/** Les espaces fines de `toLocaleString`, ramenées à des espaces ordinaires pour se lire ici. */
const lu = (t: string) => t.replace(/[\u00a0\u202f]/g, " ");

describe("arrondi2 : au centième, sans erreur de flottant", () => {
  it("arrondit la moitié loin de zéro, là où Math.round se trompe", () => {
    // 1,005 × 100 vaut 100,49999… en machine : Math.round en fait 1 ; 2,675 s'écrit 2,67499… et toFixed en fait 2,67.
    expect(Math.round(1.005 * 100) / 100).toBe(1);
    expect((2.675).toFixed(2)).toBe("2.67");
    expect(arrondi2(2.675)).toBe(2.68);
    expect(arrondi2(1.005)).toBe(1.01);
    expect(arrondi2(0.285)).toBe(0.29);
    expect(arrondi2(10.075)).toBe(10.08);
    expect(arrondi2(1_234.565)).toBe(1_234.57);
    expect(arrondi2(-2.675)).toBe(-2.68);
    expect(arrondi2(-0.005)).toBe(-0.01);
    expect(arrondi2(0.1 + 0.2)).toBe(0.3);
    expect(arrondi2(412.5)).toBe(412.5);
    expect(arrondi2(55.263157894)).toBe(55.26);
  });

  it("ne rend jamais −0, ni un nombre qui n'en est pas un", () => {
    expect(Object.is(arrondi2(-0.000001), 0)).toBe(true);
    expect(Object.is(arrondi2(-0), 0)).toBe(true);
    expect(arrondi2(Number.NaN)).toBeNaN();
    expect(arrondi2(1e16 + 0.5)).toBe(1e16);
  });

  it("arrondit à d'autres précisions : l'unité d'une quantité, le dix-millième d'un coefficient", () => {
    expect(aLUnite(648.6)).toBe(649);
    expect(aLUnite(2.5)).toBe(3);
    expect(aLUnite(-2.5)).toBe(-3);
    expect(arrondi(0.95675, 4)).toBe(0.9568);
    expect(arrondi(1_234.5, 0)).toBe(1_235);
  });
});

describe("chaque ligne arrondie", () => {
  it("chaque ligne part des lignes déjà arrondies", () => {
    expect(produit2(1_875, 0.22)).toBe(412.5);
    expect(somme2(1_875, -412.5)).toBe(1_462.5);
    expect(quotient2(7_500, 4)).toBe(1_875);
    expect(taux2(21, 38)).toBe(55.26);
    expect(taux2(21, 59)).toBe(35.59);
    expect(partDe2(13_629, 60)).toBe(8_177.4);
    // 1 961,715 € ÷ 0,98 : la ligne arrondie (1 961,72 €) donne 2 001,76 €, le calcul exact 2 001,75 €,
    // à un centime : la tolérance d'un centième accepte les deux copies.
    expect(quotient2(arrondi2(1_961.715), 0.98)).toBe(2_001.76);
    expect(champJuste("2001,75", { attendu: 2_001.76 })).toBe(true);
    expect(champJuste("2001,74", { attendu: 2_001.76 })).toBe(false);
  });
});

describe("l'écriture du corrigé : deux décimales pour un nombre qui n'est pas entier", () => {
  it("un montant", () => {
    expect(lu(montantEcrit(1_234.567))).toBe("1 234,57 €");
    expect(lu(montantEcrit(12.5))).toBe("12,50 €");
    expect(lu(montantEcrit(2_207))).toBe("2 207 €");
    // Un reste de calcul ne fait ni « ,00 » ni « -0 ».
    expect(lu(montantEcrit(1_234.999))).toBe("1 235 €");
    expect(lu(montantEcrit(-0.000001))).toBe("0 €");
    expect(lu(montantEcrit(2.675))).toBe("2,68 €");
    expect(lu(eur(-22.5))).toBe("−22,50 €");
  });

  it("un pourcentage, une grandeur, une quantité", () => {
    expect(lu(pct(55.26))).toBe("55,26 %");
    expect(lu(pct(12.5))).toBe("12,50 %");
    expect(lu(pct(0.22 * 100))).toBe("22 %");
    expect(lu(nombreAuCentieme(3.7919))).toBe("3,79");
    expect(lu(nombreAuCentieme(-1_000.1))).toBe("−1 000,10");
    expect(lu(qte(1_590))).toBe("1 590");
    expect(lu(qte(-3))).toBe("−3");
  });
});
