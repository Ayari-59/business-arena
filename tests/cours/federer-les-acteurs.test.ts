import { describe, expect, it } from "vitest";
import { FEDERER_LES_ACTEURS as CH } from "../../src/config/cours/chapitres/federer-les-acteurs";
import { qualiteDeVie } from "../../src/config/cours/monde/cohesion-de-nova";
import { LA_SALLE_DE_REPOS, laSalleDeRepos } from "../../src/config/cours/situations/par-chapitre/la-salle-de-repos";
import { gardeDuCasT, gardeDuLaboratoireT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « FÉDÉRER LES ACTEURS » (enseignement commun de terminale, 2.1, lot C STMG), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main, à 400 € le jour d'absence : 8 × 400 − 2 400 = 800 € ; 13 × 400 − 4 000 = 1 200 € ;
 * 15 × 400 − 4 600 = 1 400 € ; 18 × 400 − 7 600 = − 400 €. Le cas : 3 × 400 − 3 000 = − 1 800 € pour la
 * salle, 800 € pour les sièges.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 2 de la partie commune, se joue chez NOVA", () => {
    gardeDuProgrammeT(CH, "STMG Thème 2 · Les organisations et les acteurs");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("culture, styles, motivation et qualité de vie", () => {
  it("les tris", () => {
    expect(Object.values(triT(CH, "les-styles"))).toEqual(["paternaliste", "autoritaire", "consultatif", "participatif"]);
    expect(Object.values(triT(CH, "lire-la-culture"))).toEqual(["valeur", "rite", "symbole", "mythe"]);
    expect(Object.values(triT(CH, "converger-ou-diverger"))).toEqual(["convergent", "convergent", "divergent", "divergent"]);
  });

  it("les choix", () => {
    expect(justeT(CH, "le-bon-style")[0]).toMatch(/^Autoritaire pour la fumée/);
    expect(justeT(CH, "decider-en-groupe")[0]).toMatch(/influence/);
  });

  it("le laboratoire : les 3 premières actions laissent 1 400 €", () => {
    const e = gardeDuLaboratoireT(CH, "le-laboratoire-de-la-qualite-de-vie");
    expect(e.defi(null as never).solution).toEqual({ actions: 3 });
    expect([1, 2, 3, 4].map((n) => qualiteDeVie(n).gain)).toEqual([800, 1_200, 1_400, -400]);
  });
});

describe("le cas du chapitre", () => {
  it("la salle de repos coûte 1 800 € de plus qu'elle n'évite ; les sièges laissent 800 €", () => {
    gardeDuCasT(LA_SALLE_DE_REPOS, CH);
    const { salle, sieges } = laSalleDeRepos();
    expect([salle.gain, sieges.gain]).toEqual([-1_800, 800]);
  });
});
