import { describe, expect, it } from "vitest";
import { LE_DIALOGUE_SOCIAL as CH } from "../../src/config/cours/chapitres/le-dialogue-social";
import { accordDuDimanche, coutDeLaMajoration } from "../../src/config/cours/monde/dialogue-social-de-l-escale";
import { UN_ACCORD_SANS_DELEGUE_SYNDICAL } from "../../src/config/cours/situations/par-chapitre/un-accord-sans-delegue-syndical";
import { THEMES_DES_RESSOURCES_HUMAINES, gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « LE DIALOGUE SOCIAL » (ressources humaines et communication de terminale, 3.2, lot E STMG), ET SON CAS,
 * CHEZ L'ESCALE.
 *
 * Refait à la main : 2 100 heures du dimanche × 18,90 € = 39 690 € ; à 20 %, 7 938 €, dans l'enveloppe de
 * 8 000 € ; à 21 %, 8 334,90 €, au-dessus. Le cas : 18,90 × 20 % = 3,78 € par heure, 2 100 × 3,78 = 7 938 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 3 de ressources humaines, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DES_RESSOURCES_HUMAINES[2]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });

  it("emploie le terme à jour, BDESE, et dit que le programme écrit BDES", () => {
    const textes = JSON.stringify(CH, (_k, v) => (typeof v === "function" ? v({ entreprise: "L'ESCALE" }) : v));
    expect(textes).toMatch(/BDESE/);
    expect(CH.titre).toMatch(/BDESE/);
  });
});

describe("acteurs, CSE et négociation", () => {
  it("le curseur : 20 % de majoration au plus dans l'enveloppe", () => {
    gardeDuCurseurT(CH, "le-curseur-du-dimanche", 20);
    expect([coutDeLaMajoration(20), coutDeLaMajoration(21)]).toEqual([7_938, 8_334.9]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "les-acteurs"))).toEqual(["employeur", "elus", "syndicats", "etat"]);
    expect(Object.values(triT(CH, "les-formes"))).toEqual(["information", "consultation", "negociation"]);
    expect(Object.values(triT(CH, "les-niveaux"))).toEqual(["interprofessionnel", "branche", "entreprise"]);
    expect(justeT(CH, "le-seuil-du-cse")[0]).toMatch(/11 salariés/);
    expect(justeT(CH, "bdes-ou-bdese")[0]).toMatch(/environnement/);
  });
});

describe("le cas du chapitre", () => {
  it("3,78 € par heure, 7 938 € sur l'année", () => {
    gardeDuCasT(UN_ACCORD_SANS_DELEGUE_SYNDICAL, CH);
    expect(accordDuDimanche()).toMatchObject({ taux: 20, parHeure: 3.78, annee: 7_938 });
  });
});
