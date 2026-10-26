import { describe, expect, it } from "vitest";
import { calculer, enSaisie } from "@/pedagogy/cours/calculatrice";

/**
 * LA CALCULATRICE DU COURS CALCULE COMME CELLE DU LYCÉE.
 *
 * Les priorités, les parenthèses, la virgule, le pourcentage d'une calculatrice
 * de lycée, et des erreurs dites en français plutôt qu'un résultat faux.
 */
const valeur = (e: string) => {
  const r = calculer(e);
  return r.ok ? enSaisie(r.valeur) : `erreur : ${r.erreur}`;
};

describe("la calculatrice du cours", () => {
  it("respecte les priorités et les parenthèses", () => {
    expect(valeur("2 + 3 × 4")).toBe("14");
    expect(valeur("(2 + 3) × 4")).toBe("20");
    expect(valeur("12 ÷ 4 × 3")).toBe("9");
    expect(valeur("10 − 4 − 3")).toBe("3");
    expect(valeur("-3 + 5")).toBe("2");
    expect(valeur("2 × (−3)")).toBe("-6");
  });

  it("lit la virgule, les espaces de milliers et les signes tapés au clavier", () => {
    expect(valeur("12,5 × 4")).toBe("50");
    expect(valeur("45 000 ÷ 5")).toBe("9000");
    expect(valeur("1 000 * 1,2")).toBe("1200");
    expect(valeur("7/2")).toBe("3,5");
    expect(valeur("0,1 + 0,2")).toBe("0,3");
  });

  it("traite le pourcentage comme une calculatrice de lycée", () => {
    expect(valeur("200 + 10 %")).toBe("220");
    expect(valeur("200 − 10 %")).toBe("180");
    expect(valeur("200 × 10 %")).toBe("20");
    expect(valeur("10 %")).toBe("0,1");
    expect(valeur("100 + (5 + 5) %")).toBe("110");
  });

  it("dit l'erreur au lieu de donner un résultat faux", () => {
    expect(valeur("1 ÷ 0")).toBe("erreur : Division par zéro");
    expect(valeur("2 +")).toBe("erreur : Calcul incomplet");
    expect(valeur("(1 + 2")).toBe("erreur : Calcul incomplet");
    expect(valeur("3,2,1")).toBe("erreur : Un nombre ou un signe mal écrit");
    expect(valeur("2 a 3")).toBe("erreur : Un nombre ou un signe mal écrit");
    expect(valeur("")).toBe("erreur : Rien à calculer");
  });
});
