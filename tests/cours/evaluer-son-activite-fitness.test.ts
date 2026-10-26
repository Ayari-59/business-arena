import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { EVALUER_SON_ACTIVITE } from "../../src/config/cours/chapitres/evaluer-son-activite";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";

/**
 * CHEZ VOLT FITNESS, LE CHIFFRE D'AFFAIRES DIVISÉ PAR LES VENTES NE FAIT PAS UN PRIX : il compte
 * aussi les abonnés gardés, que les ventes du trimestre ne comptent pas. « Évaluer son activité »
 * n'y fait donc pas lire de prix moyen ; ailleurs, l'étape reste.
 */
describe("« Évaluer son activité » et le prix moyen", () => {
  it("l'étape du prix moyen ne se joue pas chez VOLT FITNESS, et se joue ailleurs", () => {
    const ids = (code: string) => chapitreDuCas(EVALUER_SON_ACTIVITE, casDeLEntreprise(code)).etapes.map((e) => e.id);
    expect(ids("fitness")).not.toContain("le-prix-moyen");
    expect(ids("nova")).toContain("le-prix-moyen");
  });
});
