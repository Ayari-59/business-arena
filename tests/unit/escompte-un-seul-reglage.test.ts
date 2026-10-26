import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";

/**
 * L'ESCOMPTE A UN SEUL RÉGLAGE : CELUI QUE LE MOTEUR APPLIQUE (octobre 2026).
 *
 * Quatre scénarios portaient, dans `finance`, un taux d'escompte et une part escomptable
 * « exposés aux équipes » que rien n'affichait, et qui contredisaient ceux du moteur et de la
 * feuille de décision (`treasury.discountAnnualRate`, `treasury.discountMaxShare`) : chez NOVA,
 * 10 % et 80 % pour 6 % et 60 % appliqués. Le schéma les accepte encore, pour relire les
 * parties anciennes ; aucun scénario du registre ne les porte plus.
 */
describe("l'escompte", () => {
  it("ne se règle que dans `treasury`, dans chaque scénario du registre", () => {
    for (const d of SCENARIOS) {
      expect(d.scenario.finance.discountRate, d.code).toBeUndefined();
      expect(d.scenario.finance.discountableRatio, d.code).toBeUndefined();
    }
  });
});
