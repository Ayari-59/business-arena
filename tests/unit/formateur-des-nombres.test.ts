import { describe, expect, it } from "vitest";
import {
  MOINS,
  compter,
  formatDecimal,
  formatEuro,
  formatEuroCents,
  formatPercent,
  formatUnits,
  ordinal,
} from "@/lib/format";

/**
 * UN SEUL FORMATEUR DE NOMBRES.
 *
 * L'arène écrivait « -294 € » avec un trait d'union quand les épisodes
 * écrivaient « −10,6 % » ; l'IPG sortait en « 64.1 » ; le rang se lisait
 * « 1ᵉ sur 3 » ; le profil disait « Les 1 observations ». Le formateur de
 * `lib/format` tient la typographie française une fois pour toutes.
 */
describe("le formateur des nombres", () => {
  it("écrit le signe moins typographique, jamais un trait d'union", () => {
    expect(MOINS).toBe("−");
    for (const s of [
      formatEuro(-294),
      formatEuroCents(-9.5),
      formatUnits(-12),
      formatPercent(-0.106),
      formatDecimal(-4.25),
    ]) {
      expect(s.startsWith(MOINS), s).toBe(true);
      expect(s, s).not.toContain("-");
    }
    expect(formatEuro(294)).not.toContain(MOINS);
  });

  it("met une virgule décimale à l'IPG", () => {
    expect(formatDecimal(64.1)).toBe("64,1");
    expect(formatDecimal(48)).toBe("48,0");
    expect(formatDecimal(61.4, 0)).toBe("61");
  });

  it("écrit les ordinaux à la française", () => {
    expect(ordinal(1)).toBe("1re");
    expect(ordinal(1, "m")).toBe("1er");
    expect(ordinal(2)).toBe("2e");
    expect(ordinal(3, "m")).toBe("3e");
  });

  it("accorde le nom au nombre, le pluriel commençant à deux", () => {
    expect(compter(1, "observation")).toBe("1 observation");
    expect(compter(0, "observation")).toBe("0 observation");
    expect(compter(2, "observation")).toBe("2 observations");
  });
});
