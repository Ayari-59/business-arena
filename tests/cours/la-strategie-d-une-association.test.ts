import { describe, expect, it } from "vitest";
import { arrondi2 } from "../../src/pedagogy/cours/deux-decimales";
import { LA_STRATEGIE_D_UNE_ASSOCIATION } from "../../src/config/cours/chapitres/la-strategie-d-une-association";
import { PROGRAMME } from "../../src/config/cours/registre";
import { LE_PARRAIN_QUI_VEUT_CHOISIR_L_ENTRAINEUR } from "../../src/config/cours/situations/par-chapitre/le-parrain-qui-veut-choisir-l-entraineur";
import { NOVA, attendus, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { bonneReponseJamaisLaPlusLongue } from "./gardes-du-management";

/**
 * LA STRATÉGIE D'UNE ASSOCIATION (management de première, 3.3, lot B STMG), ET SON CAS.
 *
 * Refait à la main sur le Handball Club du Haut-Verdasse : 30 000 + 18 000 + 12 000 + 8 000 € de
 * recettes, 42 000 + 11 000 + 9 000 + 4 000 € de dépenses, 240 adhérents, 3 500 heures de bénévolat au
 * SMIC horaire du cours (12,31 €), le gymnase prêté 6 × 32 × 25 € ; la subvention réduite de 6 000 €
 * (hypothèse) ; le garage, 6 000 € (hypothèse).
 */

describe("le chapitre et son cas, dans leur parcours", () => {
  it("porte le titre du programme, au palier 1, chez NOVA, et son cas lui est dédié", () => {
    gardeDuProgramme(LA_STRATEGIE_D_UNE_ASSOCIATION, PROGRAMME["stmg-management"][1]!);
    expect(LA_STRATEGIE_D_UNE_ASSOCIATION.blocs[0]).toBe("STMG Thème 3 · Les choix stratégiques des organisations");
    gardeDuCas(LE_PARRAIN_QUI_VEUT_CHOISIR_L_ENTRAINEUR, LA_STRATEGIE_D_UNE_ASSOCIATION);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, servis par le serveur", () => {
    gardesDeTexte(LA_STRATEGIE_D_UNE_ASSOCIATION);
    bonneReponseJamaisLaPlusLongue(LA_STRATEGIE_D_UNE_ASSOCIATION);
    bonneReponseJamaisLaPlusLongue(LE_PARRAIN_QUI_VEUT_CHOISIR_L_ENTRAINEUR);
  });
});

describe("le budget et les ressources du club", () => {
  it("68 000 € de recettes, 66 000 € de dépenses, 2 000 € d'excédent, 26,47 % de subvention", () => {
    expect(attendus(LA_STRATEGIE_D_UNE_ASSOCIATION, "le-budget")).toEqual([68_000, 66_000, 2_000, arrondi2((18_000 / 68_000) * 100)]);
  });

  it("le bénévolat : 3 500 × 12,31 = 43 085 €, sur 115 885 € de ressources, 37,18 %", () => {
    const benevolat = 3_500 * 12.31;
    const total = 68_000 + 6 * 32 * 25 + benevolat;
    expect(attendus(LA_STRATEGIE_D_UNE_ASSOCIATION, "ce-qui-ne-passe-pas-par-la-caisse")).toEqual([benevolat, total, arrondi2((benevolat / total) * 100)]);
    expect([benevolat, total]).toEqual([43_085, 115_885]);
  });

  it("le laboratoire : 17 € de hausse par adhérent équilibrent, 16 € non", () => {
    const e = gardeDuLaboratoire(LA_STRATEGIE_D_UNE_ASSOCIATION, "le-laboratoire-de-la-subvention");
    expect(e.defi(NOVA).solution).toEqual({ hausse: 17 });
    expect([68_000 - 6_000 + 17 * 240 - 66_000, 68_000 - 6_000 + 16 * 240 - 66_000]).toEqual([80, -160]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triDe(LA_STRATEGIE_D_UNE_ASSOCIATION, "privee-ou-publique"))).toEqual(["privee", "privee", "privee", "publique", "publique"]);
    expect(Object.values(triDe(LA_STRATEGIE_D_UNE_ASSOCIATION, "perenniser"))).toEqual(["humaines", "humaines", "humaines", "financieres", "financieres"]);
    expect(juste(LA_STRATEGIE_D_UNE_ASSOCIATION, "un-excedent")).toEqual(["Oui, s'il sert son objet ; elle ne le partage pas entre ses membres"]);
  });
});

describe("le cas du chapitre", () => {
  it("le parrain : les sponsors passent de 17,65 % à 24,32 % des recettes, 8 000 € d'excédent", () => {
    expect(attendus(LE_PARRAIN_QUI_VEUT_CHOISIR_L_ENTRAINEUR, "le-poids-du-parrain")).toEqual([arrondi2((12_000 / 68_000) * 100), arrondi2((18_000 / 74_000) * 100), 74_000 - 66_000]);
    expect(juste(LE_PARRAIN_QUI_VEUT_CHOISIR_L_ENTRAINEUR, "reponse")).toEqual(["Accepter le parrainage et le nom sur les maillots, refuser le choix de l'entraîneur"]);
  });
});
