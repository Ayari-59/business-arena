import { describe, expect, it } from "vitest";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import type { Etape } from "../../src/config/cours/types";

/**
 * LE TABLEAU D'UNE ÉTAPE SE MONTRE.
 *
 * Toute étape peut porter un `tableau`, mais la page ne le montre qu'avec les étapes qui
 * l'affichent (chapitre-guide.tsx). Un tableau posé sur une autre étape ne se verrait pas,
 * alors que son texte y renvoie : l'étape « stratégies » de « Lire la stratégie des
 * concurrents », un tri, l'a été jusqu'à ce que le tri montre le sien.
 */

const AFFICHENT_LEUR_TABLEAU: readonly Etape["type"][] = ["lecture", "choix", "montants", "tri"];

describe("le tableau d'une étape", () => {
  for (const ch of [...CHAPITRES, ...SITUATIONS]) {
    it(`${ch.code} : ne se pose que sur une étape qui le montre`, () => {
      for (const e of ch.etapes) {
        if (e.tableau) expect(AFFICHENT_LEUR_TABLEAU, `${e.id} (${e.type})`).toContain(e.type);
      }
    });
  }
});
