import { describe, expect, it } from "vitest";
import { DECIDER_ENSEMBLE } from "../../src/config/cours/chapitres/decider-ensemble";
import { UNE_INFORMATION_A_TEMPS } from "../../src/config/cours/chapitres/une-information-a-temps";
import { gardeDuProgrammeSgn, gardesDeTexteSgn, justeSgn, triSgn } from "./gardes-de-la-sgn";

/**
 * LE COMPLÉMENT DE « DÉCIDER ENSEMBLE » (SGN de première T2.2 : les rôles et les droits dans un espace
 * collaboratif, la communauté et le réseau social d'entreprise, l'intelligence artificielle), et
 * l'étiquette du thème 4 sur « Une information qui circule à temps » (T4.1, l'actualité de
 * l'information). Les chiffres de « Décider ensemble » restent gardés par
 * management-acteurs-et-decision.test.ts.
 */

describe("décider ensemble, complété", () => {
  it("reste au programme, sous le thème 2 de la SGN, en 20 étapes au plus", () => {
    gardeDuProgrammeSgn(DECIDER_ENSEMBLE, "STMG Thème 2 · Numérique et intelligence collective");
    expect(DECIDER_ENSEMBLE.etapes.map((e) => e.id).slice(-4)).toEqual(["roles-et-droits", "la-communaute", "l-intelligence-artificielle", "synthese"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteSgn(DECIDER_ENSEMBLE);
  });

  it("les droits suivent les rôles ; l'IA est un avis à croiser", () => {
    const t = triSgn(DECIDER_ENSEMBLE, "roles-et-droits");
    expect(t["L'atelier, sur les prévisions de ventes"]).toBe("lire");
    expect(t["Le président, sur la décision finale et les accès de chacun"]).toBe("valider");
    expect(justeSgn(DECIDER_ENSEMBLE, "l-intelligence-artificielle")[0]).toMatch(/un avis/);
  });
});

describe("une information qui circule à temps, sous deux thèmes", () => {
  it("cite le thème 2 en premier (la page la range là), et le thème 4 en second", () => {
    expect(UNE_INFORMATION_A_TEMPS.blocs).toEqual(["STMG Thème 2 · Numérique et intelligence collective", "STMG Thème 4 · Temps et risque"]);
    gardeDuProgrammeSgn(UNE_INFORMATION_A_TEMPS, "STMG Thème 2 · Numérique et intelligence collective");
  });
});
