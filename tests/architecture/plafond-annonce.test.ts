import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * LE PLAFOND ANNONCÉ EST CELUI QUI SERA APPLIQUÉ.
 *
 * Le découvert consenti se calcule à trois endroits : le moteur, qui
 * l'applique ; la vue, qui l'annonce au formulaire de décision ; et le panneau
 * de trésorerie, qui le redit. Trois calculs séparés finissent par diverger, et
 * l'élève lit alors un seuil que la banque n'applique pas — il fait son calcul
 * juste et dépasse quand même.
 *
 * La faute a failli revenir avec le financement vert : le moteur a commencé à
 * servir à la banque une confiance augmentée du standing RSE, quand la vue
 * annonçait encore le plafond de la confiance nue. L'équipe engagée aurait vu
 * 30 000 € et disposé de 32 600 €.
 *
 * D'où la règle : une seule fonction dit la confiance servie, et personne ne
 * compose les conditions bancaires à partir d'autre chose.
 */

const VUE = readFileSync("src/services/game-view.service.ts", "utf-8");
const MOTEUR = readFileSync("src/engine/simulation/index.ts", "utf-8");

describe("les conditions bancaires se calculent d'une seule source", () => {
  it("la vue compose ses conditions à partir de la confiance SERVIE", () => {
    // Autant d'appels à conditionsBancaires que de confiances servies.
    const conditions = (VUE.match(/conditionsBancaires\(/g) ?? []).length;
    const servies = (VUE.match(/confianceServie\(/g) ?? []).length;
    expect(conditions, "la vue n'annonce plus aucun plafond ?").toBeGreaterThan(0);
    expect(servies).toBe(conditions);
  });

  it("la vue n'utilise plus la confiance nue pour annoncer un plafond", () => {
    // `confianceInitiale` ignore la prime verte : s'en servir ici rouvrirait
    // l'écart entre l'annoncé et l'appliqué.
    expect(VUE).not.toContain("confianceInitiale(");
  });

  it("le moteur sert à la banque cette même confiance", () => {
    expect(MOTEUR).toContain("confianceServie(");
    // L'ancien écrasement de la prime verte ne doit pas revenir.
    expect(MOTEUR).not.toMatch(/Math\.min\(1,\s*confiance/);
  });
});
