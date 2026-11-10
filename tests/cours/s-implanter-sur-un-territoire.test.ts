import { describe, expect, it } from "vitest";
import { S_IMPLANTER_SUR_UN_TERRITOIRE as CH } from "../../src/config/cours/chapitres/s-implanter-sur-un-territoire";
import { demenager, rejoindreLeCluster } from "../../src/config/cours/monde/implantation-de-nova";
import { REJOINDRE_LE_CLUSTER_DE_L_AUDIO } from "../../src/config/cours/situations/par-chapitre/rejoindre-le-cluster-de-l-audio";
import { gardeDuCasT, gardeDuLaboratoireT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « S'IMPLANTER SUR UN TERRITOIRE » (enseignement commun de terminale, 3.4, lot C STMG), ET SON CAS.
 *
 * Refait à la main : à 18 500 € de loyer, (19 700 − 18 500 − 900) × 36 + 30 000 − 25 000 = 15 800 € ;
 * à 19 000 €, − 200 × 36 + 5 000 = − 2 200 €. Le cas : 1 % de 520 598 € = 5 205,98 €, − 1 800 =
 * 3 405,98 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 3 de la partie commune, se joue chez NOVA", () => {
    gardeDuProgrammeT(CH, "STMG Thème 3 · Les organisations et la société");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("le territoire et ses réseaux", () => {
  it("le laboratoire : déménager jusqu'à 18 500 € de loyer", () => {
    const e = gardeDuLaboratoireT(CH, "le-laboratoire-de-l-implantation");
    expect(e.defi(null as never).solution).toEqual({ loyer: 18_500 });
    expect([demenager(18_500).gain, demenager(19_000).gain]).toEqual([15_800, -2_200]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "les-ressources-du-territoire"))).toEqual(["humaines", "financieres", "infrastructures", "accompagnement"]);
    expect(Object.values(triT(CH, "implanter-delocaliser-relocaliser"))).toEqual(["implantation", "delocalisation", "relocalisation"]);
    expect(Object.values(triT(CH, "reconnaitre-les-ecosystemes"))).toEqual(["affaires", "cluster", "innovation"]);
    expect(justeT(CH, "les-pouvoirs-publics-locaux")[0]).toMatch(/numérique/);
  });
});

describe("le cas du chapitre", () => {
  it("le cluster : 5 205,98 € d'économie, 3 405,98 € de gain", () => {
    gardeDuCasT(REJOINDRE_LE_CLUSTER_DE_L_AUDIO, CH);
    expect(rejoindreLeCluster()).toMatchObject({ composants: 520_598, economie: 5_205.98, gain: 3_405.98 });
  });
});
