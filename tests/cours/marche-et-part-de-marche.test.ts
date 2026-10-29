import { describe, expect, it } from "vitest";
import { ENTREPRISES_DE_LA_PART_DE_MARCHE, MARCHES, MARCHE_ET_PART_DE_MARCHE } from "../../src/config/cours/chapitres/marche-et-part-de-marche";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { PROGRAMME } from "../../src/config/cours/registre";
import { GARDER_SA_PART_DE_MARCHE, garderSaPart } from "../../src/config/cours/situations/par-chapitre/garder-sa-part-de-marche";
import { NOVA, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte, juste } from "./gardes-du-marche";

/**
 * LE MARCHÉ ET LA PART DE MARCHÉ (bac STMG mercatique, palier 1), SUR LE MARCHÉ DE NOVA DU MONDE DU
 * COURS, ET SON CAS : GARDER SA PART DE MARCHÉ.
 *
 * Refait à la main sur nova-gestion.ts : le marché de toutes les enceintes, 6 000 + 5 600 + 6 500 =
 * 18 100 de janvier à mars, 7 400 + 8 300 + 9 200 = 24 900 d'avril à juin ; NOVA, 1 270 + 1 130 + 1 418
 * aux particuliers et 3 × 320 à CampusTech (4 778), puis 1 580 + 1 710 + 1 831 + 960 (6 081) ; SoundBox
 * et Auris dans les proportions de l'année type du marché à trois (33 808 et 14 616 pour 21 576).
 */

const d = (x: number) => Math.round(x * 10) / 10;
const [M1, M2, N1, N2] = [6_000 + 5_600 + 6_500, 7_400 + 8_300 + 9_200, 1_270 + 1_130 + 1_418 + 960, 1_580 + 1_710 + 1_831 + 960];
const SOUNDBOX = Math.round((N1 * 33_808) / 21_576);
const AURIS = Math.round((N1 * 14_616) / 21_576);

describe("le marché et la part de marché", () => {
  it("au programme du bac STMG, chez NOVA seule ; la liste des marchés reste celle des autres chapitres", () => {
    expect([MARCHE_ET_PART_DE_MARCHE.parcours, MARCHE_ET_PART_DE_MARCHE.palier]).toEqual(["stmg", 1]);
    expect(PROGRAMME.stmg[1]).toContain(MARCHE_ET_PART_DE_MARCHE.titre);
    expect([...ENTREPRISES_DE_LA_PART_DE_MARCHE]).toEqual(["nova"]);
    expect(MARCHES).toEqual(ENTREPRISES_DU_COURS.filter((c) => c !== "fitness"));
    gardeDuCas(GARDER_SA_PART_DE_MARCHE, MARCHE_ET_PART_DE_MARCHE);
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(MARCHE_ET_PART_DE_MARCHE);
  });

  it("le premier trimestre : NOVA 26,4 %, SoundBox 41,4 % (7 487), une part relative de 0,64 ; challenger ; le moins cher vend le plus", () => {
    expect([M1, N1, SOUNDBOX, AURIS]).toEqual([18_100, 4_778, 7_487, 3_237]);
    expect(attendus(MARCHE_ET_PART_DE_MARCHE, "parts")).toEqual([d((N1 / M1) * 100), d((SOUNDBOX / M1) * 100), Math.round((26.4 / 41.4) * 100) / 100]);
    expect(juste(MARCHE_ET_PART_DE_MARCHE, "position")).toEqual(["Le challenger : deuxième, elle cherche à prendre la place du leader"]);
    expect(juste(MARCHE_ET_PART_DE_MARCHE, "prix")).toEqual(["L'enseigne la moins chère est celle qui vend le plus"]);
  });

  it("le semestre : le marché +37,6 %, NOVA +27,3 %, sa part −2 points", () => {
    expect(attendus(MARCHE_ET_PART_DE_MARCHE, "evolution")).toEqual([d((M2 / M1 - 1) * 100), d((N2 / N1 - 1) * 100), d(d((N2 / M2) * 100) - d((N1 / M1) * 100))]);
  });

  it("le curseur : 6 225 enceintes d'avril à juin tiennent le seuil d'alerte de 25 % ; NOVA en a vendu 6 081", () => {
    const e = gardeDuCurseur(MARCHE_ET_PART_DE_MARCHE, "le-seuil-d-alerte", 24_900 / 4);
    expect(e.droites(NOVA).cout(0)).toBe(24_900 * 0.25 * 59);
    expect(N2).toBe(6_081);
  });

  it("le laboratoire : 6 574 enceintes gardent les 26,4 % du premier trimestre ; 6 573 n'y suffisent pas", () => {
    const e = gardeDuLaboratoire(MARCHE_ET_PART_DE_MARCHE, "le-laboratoire-de-la-part");
    expect(e.defi(NOVA).solution).toEqual({ ventes: Math.ceil((N1 * M2) / M1) });
    expect(Math.ceil((N1 * M2) / M1)).toBe(6_574);
  });
});

describe("garder sa part de marché", () => {
  it("le marché du deuxième trimestre grandit de 8 % : 26 892 enceintes, 22,6 % sans ventes en plus, 6 568 pour garder 24,4 %", () => {
    const r = garderSaPart(NOVA);
    expect([r.marche, r.ventes, r.part, r.marchePrevu]).toEqual([M2, N2, d((N2 / M2) * 100), Math.round(M2 * 1.08)]);
    expect([r.partSansEffort, r.ventesNecessaires]).toEqual([d((N2 / 26_892) * 100), Math.ceil((N2 * 26_892) / M2)]);
    expect(r.ventesNecessaires).toBe(6_568);
  });
});
