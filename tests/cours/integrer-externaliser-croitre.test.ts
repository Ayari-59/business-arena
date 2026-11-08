import { describe, expect, it } from "vitest";
import { INTEGRER_EXTERNALISER_CROITRE } from "../../src/config/cours/chapitres/integrer-externaliser-croitre";
import { PROGRAMME } from "../../src/config/cours/registre";
import { LE_DISTRIBUTEUR_BELGE } from "../../src/config/cours/situations/par-chapitre/le-distributeur-belge";
import { NOVA, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { bonneReponseJamaisLaPlusLongue } from "./gardes-du-management";

/**
 * INTÉGRER, EXTERNALISER, CROÎTRE (management de première, 3.1, lot B STMG), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : 38 € de coût variable (22 + 16 €), le sous-traitant à 52 € l'enceinte finie, la
 * paie de 10 650 € et l'usure de 833 € par mois, trois mois au trimestre ; la ligne de 7 000 ; Noël de
 * N + 1 à 7 800 enceintes demandées ; le distributeur belge, 1 500 enceintes par trimestre à 52 €, face
 * aux demandes de 5 800, 7 400, 6 200 et 7 800.
 */

const fixes = (10_650 + 833) * 3;

describe("le chapitre et son cas, dans leur parcours", () => {
  it("porte le titre du programme, au palier 1, chez NOVA seule, et son cas lui est dédié", () => {
    gardeDuProgramme(INTEGRER_EXTERNALISER_CROITRE, PROGRAMME["stmg-management"][1]!);
    expect(INTEGRER_EXTERNALISER_CROITRE.blocs[0]).toBe("STMG Thème 3 · Les choix stratégiques des organisations");
    gardeDuCas(LE_DISTRIBUTEUR_BELGE, INTEGRER_EXTERNALISER_CROITRE);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, servis par le serveur", () => {
    gardesDeTexte(INTEGRER_EXTERNALISER_CROITRE);
    bonneReponseJamaisLaPlusLongue(INTEGRER_EXTERNALISER_CROITRE);
    bonneReponseJamaisLaPlusLongue(LE_DISTRIBUTEUR_BELGE);
  });
});

describe("faire ou faire faire", () => {
  it("à pleine ligne : 300 449 € intégrés, 42,92 € l'enceinte, 63 551 € d'économie", () => {
    const integre = 38 * 7_000 + fixes;
    expect(attendus(INTEGRER_EXTERNALISER_CROITRE, "faire-ou-faire-faire")).toEqual([integre, Math.round((integre / 7_000) * 100) / 100, 52 * 7_000 - integre]);
    expect([integre, 52 * 7_000 - integre]).toEqual([300_449, 63_551]);
  });

  it("le curseur : à 2 461 enceintes, monter soi-même coûte moins ; à 2 460, non", () => {
    gardeDuCurseur(INTEGRER_EXTERNALISER_CROITRE, "le-volume-qui-decide", 2_461);
    expect([52 * 2_461 >= 38 * 2_461 + fixes, 52 * 2_460 >= 38 * 2_460 + fixes]).toEqual([true, false]);
  });

  it("le laboratoire : 800 enceintes au sous-traitant servent Noël, 5 600 € de marge en plus", () => {
    const e = gardeDuLaboratoire(INTEGRER_EXTERNALISER_CROITRE, "le-laboratoire-de-noel");
    expect(e.defi(NOVA).solution).toEqual({ sousTraitees: 7_800 - 7_000 });
    const lignes = e.lecture(NOVA, { sousTraitees: 800 });
    expect(lignes.find((l) => l.libelle === "Marge en plus du trimestre")!.montant).toBe(800 * (59 - 52));
  });

  it("les maillons et les modes de croissance", () => {
    expect(Object.values(triDe(INTEGRER_EXTERNALISER_CROITRE, "les-maillons")).sort()).toEqual(["externalise", "externalise", "externalise", "integre", "integre"]);
    expect(Object.values(triDe(INTEGRER_EXTERNALISER_CROITRE, "modes-de-croissance"))).toEqual(["interne", "interne", "externe", "partenariat", "partenariat"]);
    expect(juste(INTEGRER_EXTERNALISER_CROITRE, "pourquoi-racheter")).toEqual(["La rapidité : une boutique, ses clients, ses vendeurs, tout de suite"]);
  });
});

describe("le cas du chapitre", () => {
  it("le distributeur belge : 1 200 + 800 enceintes que la ligne peut monter, 14 € de marge, 28 000 €", () => {
    expect(attendus(LE_DISTRIBUTEUR_BELGE, "ce-que-la-ligne-peut")).toEqual([(7_000 - 5_800) + (7_000 - 6_200), 52 - 38, 2_000 * 14]);
    expect(juste(LE_DISTRIBUTEUR_BELGE, "reponse")).toEqual([`Accepter ${(2_000).toLocaleString("fr-FR")} enceintes, aux trimestres où la ligne a du jeu`]);
  });
});
