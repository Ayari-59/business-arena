import { describe, expect, it } from "vitest";
import { formatNombre, MOINS } from "@/lib/format";

/**
 * Les corrigés des fiches enseignant s'écrivent à la française, avec le signe moins
 * typographique : Intl `fr-FR` rend un trait d'union (vu en production sur la fiche de
 * « La promotion qui remplit les caddies », octobre 2026).
 */
describe("formatNombre", () => {
  it("écrit un négatif avec le signe moins, la virgule et deux décimales au plus", () => {
    expect(formatNombre(-27.12)).toBe(`${MOINS}27,12`);
    expect(formatNombre(-27.116)).toBe(`${MOINS}27,12`);
    expect(formatNombre(-27.12)).not.toContain("-");
  });

  it("n'ajoute rien à un positif, ni zéro inutile", () => {
    expect(formatNombre(910)).toBe("910");
    expect(formatNombre(22.5)).toBe("22,5");
  });
});
