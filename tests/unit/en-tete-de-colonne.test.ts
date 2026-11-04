import { describe, expect, it } from "vitest";
import { classeDEmpilement, COLONNES_POUR_EMPILER, COLONNES_POUR_EMPILER_A_COMPLETER, intituleCourt } from "@/components/cours/en-tete-de-colonne";

/** Les formes courtes des intitulés de colonne, sur téléphone (components/cours/en-tete-de-colonne.tsx). */
describe("l'intitulé court d'une colonne", () => {
  it("abrège les mois longs et les intitulés qui reviennent", () => {
    expect(intituleCourt("janvier")).toBe("janv.");
    expect(intituleCourt("Février")).toBe("févr.");
    expect(intituleCourt("Chiffre d'affaires")).toBe("CA");
    expect(intituleCourt("Quantités prévisionnelles")).toBe("qté prév.");
  });

  it("laisse tels quels les intitulés déjà courts", () => {
    for (const t of ["mars", "mai", "juin", "août", "Total", "Écart"]) expect(intituleCourt(t)).toBe(t);
  });
});

describe("l'empilement d'un tableau sur téléphone", () => {
  it("s'empile plus tôt quand il est à compléter", () => {
    expect(classeDEmpilement(COLONNES_POUR_EMPILER - 1)).toBe("");
    expect(classeDEmpilement(COLONNES_POUR_EMPILER)).toBe("tableau-empilable");
    expect(classeDEmpilement(COLONNES_POUR_EMPILER_A_COMPLETER, true)).toBe("tableau-empilable");
    expect(classeDEmpilement(COLONNES_POUR_EMPILER_A_COMPLETER - 1, true)).toBe("");
  });
});
