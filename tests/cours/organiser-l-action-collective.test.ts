import { describe, expect, it } from "vitest";
import { ORGANISER_L_ACTION_COLLECTIVE } from "../../src/config/cours/chapitres/organiser-l-action-collective";
import { PROGRAMME } from "../../src/config/cours/registre";
import { DEUX_ATELIERS_OU_UN_SEUL } from "../../src/config/cours/situations/par-chapitre/deux-ateliers-ou-un-seul";
import { attendus, gardeDuCas, gardeDuCurseur, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { bonneReponseJamaisLaPlusLongue } from "./gardes-du-management";

/**
 * ORGANISER L'ACTION COLLECTIVE (management de première, 1.1, lot B STMG), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : seul, le fondateur monte 75 heures par mois à 0,4 heure l'enceinte, 187,5 par mois
 * et 562 par trimestre ; un opérateur de la ligne, 150 heures à 0,25 heure, 600 par mois et 1 800 par
 * trimestre ; l'équipe, la plus petite de 4 × 1 800 et de la ligne de 7 000. L'apport de 150 000 € et
 * l'emprunt de 80 000 €.
 */

describe("le chapitre et son cas, dans leur parcours", () => {
  it("porte le titre du programme, au palier 1, chez NOVA seule, et son cas lui est dédié", () => {
    gardeDuProgramme(ORGANISER_L_ACTION_COLLECTIVE, PROGRAMME["stmg-management"][1]!);
    expect(ORGANISER_L_ACTION_COLLECTIVE.blocs[0]).toBe("STMG Thème 1 · À la rencontre du management des organisations");
    gardeDuCas(DEUX_ATELIERS_OU_UN_SEUL, ORGANISER_L_ACTION_COLLECTIVE);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, servis par le serveur", () => {
    gardesDeTexte(ORGANISER_L_ACTION_COLLECTIVE);
    bonneReponseJamaisLaPlusLongue(ORGANISER_L_ACTION_COLLECTIVE);
    bonneReponseJamaisLaPlusLongue(DEUX_ATELIERS_OU_UN_SEUL);
  });
});

describe("seul ou organisé", () => {
  it("187,5 enceintes par mois seul, 600 sur la ligne : 3,2 fois plus", () => {
    expect(attendus(ORGANISER_L_ACTION_COLLECTIVE, "seul-ou-organise")).toEqual([75 / 0.4, 150 / 0.25, Math.round((600 / 187.5) * 10) / 10]);
    expect(attendus(ORGANISER_L_ACTION_COLLECTIVE, "seul-ou-organise")).toEqual([187.5, 600, 3.2]);
  });

  it("le curseur : 13 personnes seules montent 7 306 enceintes, 12 n'en montent que 6 744, sous les 7 000 de l'équipe", () => {
    gardeDuCurseur(ORGANISER_L_ACTION_COLLECTIVE, "combien-de-personnes-seules", 13);
    expect([13 * Math.floor(187.5 * 3), 12 * Math.floor(187.5 * 3), Math.min(4 * 1_800, 7_000)]).toEqual([7_306, 6_744, 7_000]);
  });

  it("les intérêts, le cadre juridique et les cinq familles de ressources", () => {
    expect(Object.values(triDe(ORGANISER_L_ACTION_COLLECTIVE, "interets")).sort()).toEqual(["collectif", "collectif", "individuel", "individuel", "individuel"]);
    expect(juste(ORGANISER_L_ACTION_COLLECTIVE, "cadre-juridique")).toEqual(["Une existence propre : la société signe, emprunte et possède en son nom"]);
    expect(new Set(Object.values(triDe(ORGANISER_L_ACTION_COLLECTIVE, "familles-de-ressources")))).toEqual(new Set(["humaines", "financieres", "materielles", "immaterielles", "technologiques"]));
    expect(attendus(ORGANISER_L_ACTION_COLLECTIVE, "part-des-associes")).toEqual([230_000, Math.round((150_000 / 230_000) * 1000) / 10]);
  });
});

describe("le cas du chapitre", () => {
  it("deux ateliers : 2 × 562 = 1 124 enceintes seuls, 1 800 associés, 676 de plus et 14 196 € de marge", () => {
    expect(attendus(DEUX_ATELIERS_OU_UN_SEUL, "les-deux-facons")).toEqual([1_124, 1_800, (1_800 - 1_124) * 21]);
    expect(juste(DEUX_ATELIERS_OU_UN_SEUL, "reponse")).toEqual(["S'associer : 676 enceintes de plus par trimestre"]);
    expect((1_800 - 1_124) * 21).toBe(14_196);
  });
});
