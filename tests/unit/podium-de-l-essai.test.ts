import { describe, expect, it } from "vitest";
import { essaiArchiveALaUne, PODIUM_DE_L_ESSAI } from "@/config/tour-d-essai";

describe("le podium du tour d'essai", () => {
  it("l'essai archivé reste à la une tant que la vraie partie n'a clos aucun tour", () => {
    expect(essaiArchiveALaUne({ essai: { phase: "fini" }, vraiTourClos: false })).toBe(true);
    expect(essaiArchiveALaUne({ essai: { phase: "fini" }, vraiTourClos: true })).toBe(false);
  });

  it("pendant l'essai, son classement est celui de la partie : pas d'archive à relire", () => {
    for (const phase of ["en_cours", "termine", "bascule"] as const) {
      expect(essaiArchiveALaUne({ essai: { phase }, vraiTourClos: false })).toBe(false);
    }
    expect(essaiArchiveALaUne({ essai: null, vraiTourClos: false })).toBe(false);
  });

  it("les textes disent que l'essai ne compte pas, et qui révèle", () => {
    expect(PODIUM_DE_L_ESSAI.titre).toBe("Podium du tour d'essai · ne compte pas");
    expect(PODIUM_DE_L_ESSAI.surtitre).toBe("Tour d'essai · ne compte pas");
    expect(PODIUM_DE_L_ESSAI.rideau).toContain("révélé par votre enseignant");
  });
});
