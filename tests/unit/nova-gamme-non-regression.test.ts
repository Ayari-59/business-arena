import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { jouerNovaGamme, NIVEAUX_GAMME } from "../helpers/partie-nova-gamme";

/**
 * NOVA EN GAMME NE BOUGE PAS D'UN CENTIME AUX NIVEAUX 4 À 6.
 *
 * Le niveau 7 (« Groupe ») se joue sur la variante en gamme de NOVA. Il ne doit
 * rien changer aux niveaux qui la jouent déjà : le témoin a été enregistré sur
 * `main` (62358d33) AVANT la première ligne du niveau 7, au trimestre et au
 * mois, aux niveaux 4, 5 et 6. Il ne se régénère pas.
 */
const TEMOIN = JSON.parse(
  readFileSync(new URL("../fixtures/parties-nova-gamme.json", import.meta.url), "utf8"),
) as Record<string, unknown[]>;

describe("NOVA en gamme garde ses résultats d'avant le niveau 7, au centime", () => {
  for (const niveau of NIVEAUX_GAMME) {
    for (const periodicity of ["quarter", "month"] as const) {
      it(`niveau ${niveau}, tour au ${periodicity === "quarter" ? "trimestre" : "mois"}`, () => {
        const attendu = TEMOIN[`niveau${niveau}.${periodicity}`]!;
        expect(attendu.length).toBeGreaterThan(0);
        expect(jouerNovaGamme({ niveau, periodicity })).toEqual(attendu);
      });
    }
  }

  it("le témoin a de la matière : trois références vendues, des niveaux qui diffèrent", () => {
    const t4 = TEMOIN["niveau4.quarter"] as Record<string, { incomeStatement: { revenue: number } }>[];
    const t6 = TEMOIN["niveau6.quarter"] as Record<string, { incomeStatement: { revenue: number } }>[];
    expect(t4).toHaveLength(6);
    expect(t4[0]!.e0!.incomeStatement.revenue).toBeGreaterThan(0);
    expect(JSON.stringify(t4)).not.toEqual(JSON.stringify(t6));
  });
});
