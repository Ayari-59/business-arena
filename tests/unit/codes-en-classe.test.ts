import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MAX_CODES_FAUX_PAR_ADRESSE, MAX_ECHECS_REPRISE } from "../../src/config/reprise";

/**
 * Toute une classe sort souvent par la même adresse : la limite des codes faux ne doit pas
 * fermer la porte à une classe dont quelques élèves se trompent d'une lettre.
 */
describe("la limite des codes faux tient compte d'une classe derrière une seule adresse", () => {
  it("laisse passer une classe de 35 élèves qui se trompent chacun une fois", () => {
    expect(MAX_CODES_FAUX_PAR_ADRESSE).toBeGreaterThan(35);
    expect(MAX_CODES_FAUX_PAR_ADRESSE).toBeGreaterThan(MAX_ECHECS_REPRISE);
  });

  it("est bien celle que la garde des codes applique", () => {
    const source = readFileSync("src/lib/garde-des-codes.ts", "utf8");
    expect(source).toMatch(/maxEchecs: MAX_CODES_FAUX_PAR_ADRESSE/);
    const reprise = readFileSync("src/services/reprise.service.ts", "utf8");
    expect(reprise).toMatch(/args\.maxEchecs \?\? MAX_ECHECS_REPRISE/);
  });
});
