import { describe, expect, it } from "vitest";
import { arrondi2 } from "../../src/pedagogy/cours/deux-decimales";
import { LA_STRATEGIE_D_UNE_ORGANISATION_PUBLIQUE } from "../../src/config/cours/chapitres/la-strategie-d-une-organisation-publique";
import { HAUT_VERDASSE } from "../../src/config/cours/monde/haut-verdasse";
import { ENTREES_DE_LA_PISCINE } from "../../src/config/cours/monde/strategie-du-haut-verdasse";
import { PROGRAMME } from "../../src/config/cours/registre";
import { LA_MEDIATHEQUE_LE_DIMANCHE } from "../../src/config/cours/situations/par-chapitre/la-mediatheque-le-dimanche";
import { NOVA, attendus, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { bonneReponseJamaisLaPlusLongue } from "./gardes-du-management";

/**
 * LA STRATÉGIE D'UNE ORGANISATION PUBLIQUE (management de première, 3.2, lot B STMG), ET SON CAS.
 *
 * Refait à la main sur la Communauté de communes du Haut-Verdasse : 14 agents à la piscine à 40 000 €,
 * 520 000 € de fonctionnement (hypothèse du cours), 410 000 € d'entrées, 52 000 entrées ; la
 * délégation, la contribution plus 30 000 € de contrôle ; la médiathèque le dimanche, 40 × 2 × 5 × 35 €.
 */

describe("le chapitre et son cas, dans leur parcours", () => {
  it("porte le titre du programme, au palier 1, chez NOVA, et son cas lui est dédié", () => {
    gardeDuProgramme(LA_STRATEGIE_D_UNE_ORGANISATION_PUBLIQUE, PROGRAMME["stmg-management"][1]!);
    expect(LA_STRATEGIE_D_UNE_ORGANISATION_PUBLIQUE.blocs[0]).toBe("STMG Thème 3 · Les choix stratégiques des organisations");
    gardeDuCas(LA_MEDIATHEQUE_LE_DIMANCHE, LA_STRATEGIE_D_UNE_ORGANISATION_PUBLIQUE);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, servis par le serveur", () => {
    gardesDeTexte(LA_STRATEGIE_D_UNE_ORGANISATION_PUBLIQUE);
    bonneReponseJamaisLaPlusLongue(LA_STRATEGIE_D_UNE_ORGANISATION_PUBLIQUE);
    bonneReponseJamaisLaPlusLongue(LA_MEDIATHEQUE_LE_DIMANCHE);
  });

  it("les entrées de la piscine sont celles que dit sa fiche", () => {
    const piscine = HAUT_VERDASSE.services.find((s) => s.code === "piscine")!;
    expect(piscine.description.replace(/\s/g, " ")).toContain(`${ENTREES_DE_LA_PISCINE.toLocaleString("fr-FR").replace(/\s/g, " ")} entrées par an`);
  });
});

describe("la piscine et sa délégation", () => {
  it("la régie : 560 000 + 520 000 − 410 000 = 670 000 € net, 12,88 € par entrée, 37,96 % payés par les usagers", () => {
    const net = 14 * 40_000 + 520_000 - 410_000;
    expect(attendus(LA_STRATEGIE_D_UNE_ORGANISATION_PUBLIQUE, "ce-que-coute-la-piscine")).toEqual([net, Math.round((net / 52_000) * 100) / 100, arrondi2((410_000 / 1_080_000) * 100)]);
    expect([net, Math.round((net / 52_000) * 100) / 100]).toEqual([670_000, 12.88]);
  });

  it("le laboratoire : la délégation coûte moins jusqu'à 630 000 € de contribution ; à 640 000 €, autant", () => {
    const e = gardeDuLaboratoire(LA_STRATEGIE_D_UNE_ORGANISATION_PUBLIQUE, "le-laboratoire-de-la-delegation");
    expect(e.defi(NOVA).solution).toEqual({ contribution: 630_000 });
    expect([630_000 + 30_000 < 670_000, 640_000 + 30_000 < 670_000]).toEqual([true, false]);
  });

  it("les principes, les niveaux, et les choix", () => {
    expect(Object.values(triDe(LA_STRATEGIE_D_UNE_ORGANISATION_PUBLIQUE, "les-principes"))).toEqual(["continuite", "continuite", "egalite", "egalite", "adaptabilite"]);
    expect(Object.values(triDe(LA_STRATEGIE_D_UNE_ORGANISATION_PUBLIQUE, "les-niveaux"))).toEqual(["central", "central", "territorial", "territorial", "europeen"]);
    expect(juste(LA_STRATEGIE_D_UNE_ORGANISATION_PUBLIQUE, "conflit-d-interets")).toEqual(["Ne pas prendre part au vote, ni au débat"]);
    expect(juste(LA_STRATEGIE_D_UNE_ORGANISATION_PUBLIQUE, "transparence-et-controle")).toEqual(["La chambre régionale des comptes, et les habitants, qui lisent son budget"]);
  });
});

describe("le cas du chapitre", () => {
  it("la médiathèque le dimanche : 14 000 €, 4 800 visites, 2,92 € la visite", () => {
    expect(attendus(LA_MEDIATHEQUE_LE_DIMANCHE, "le-cout")).toEqual([40 * 2 * 5 * 35, 40 * 120, Math.round((14_000 / 4_800) * 100) / 100]);
    expect(juste(LA_MEDIATHEQUE_LE_DIMANCHE, "reponse")).toEqual(["Ouvrir : le service s'adapte aux usagers, pour 2,92 € la visite"]);
  });
});
