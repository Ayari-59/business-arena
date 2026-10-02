import { describe, expect, it } from "vitest";
import { gesteDe, DISTANCE_MINIMALE, DUREE_MAXIMALE_MS } from "@/lib/glisser";

/**
 * LE GLISSEMENT, qui double les boutons « Continuer » et « Retour ».
 *
 * Il doit se laisser faire par un coup de pouce franc, et se taire dès que le doigt
 * fait autre chose : défiler la page, frôler l'écran, traîner sur un curseur.
 */
describe("gesteDe", () => {
  it("un coup de pouce vers la gauche avance, vers la droite revient", () => {
    expect(gesteDe(-120, 10, 200)).toBe("suivant");
    expect(gesteDe(120, -10, 200)).toBe("precedent");
  });

  it("un frôlement n'est pas un geste", () => {
    expect(gesteDe(-(DISTANCE_MINIMALE - 1), 0, 100)).toBeNull();
    expect(gesteDe(DISTANCE_MINIMALE - 1, 0, 100)).toBeNull();
  });

  it("un défilement en diagonale appartient à la page, pas à la carte", () => {
    // 100 px de côté, mais 90 de haut : l'utilisateur fait défiler.
    expect(gesteDe(-100, 90, 150)).toBeNull();
    expect(gesteDe(-100, 40, 150)).toBe("suivant");
  });

  it("un doigt qui traîne n'est plus un coup de pouce", () => {
    expect(gesteDe(-200, 0, DUREE_MAXIMALE_MS + 1)).toBeNull();
    expect(gesteDe(-200, 0, DUREE_MAXIMALE_MS)).toBe("suivant");
  });

  it("pas de déplacement, pas de geste", () => {
    expect(gesteDe(0, 0, 50)).toBeNull();
  });
});
