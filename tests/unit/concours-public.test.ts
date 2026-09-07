import { describe, expect, it } from "vitest";
import {
  ACCENTS_CONCOURS,
  ACCENT_PAR_DEFAUT,
  accentConcours,
} from "../../src/config/concours-public";

describe("concours-public : palette d'accent", () => {
  it("l'accent par défaut existe dans la palette", () => {
    expect(ACCENTS_CONCOURS.some((a) => a.cle === ACCENT_PAR_DEFAUT)).toBe(true);
  });

  it("une clé connue renvoie sa teinte", () => {
    const a = accentConcours("emeraude");
    expect(a.cle).toBe("emeraude");
    expect(a.vif).toMatch(/^#[0-9a-f]{6}$/i);
    expect(a.doux).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("une clé inconnue, vide ou nulle retombe sur le laiton (premier accent)", () => {
    for (const cle of ["", null, undefined, "arc-en-ciel"]) {
      expect(accentConcours(cle).cle).toBe(ACCENTS_CONCOURS[0]!.cle);
    }
  });

  it("chaque accent porte des teintes hexadécimales valides", () => {
    for (const a of ACCENTS_CONCOURS) {
      expect(a.vif, a.cle).toMatch(/^#[0-9a-f]{6}$/i);
      expect(a.doux, a.cle).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
