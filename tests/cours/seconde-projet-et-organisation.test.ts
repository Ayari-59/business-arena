import { describe, expect, it } from "vitest";
import { LE_PROJET_D_ENTREPRISE } from "../../src/config/cours/chapitres/le-projet-d-entreprise";
import { MOIS_DE_CHARGES_A_COUVRIR } from "../../src/config/cours/monde/direction-de-nova";
import { PROGRAMME } from "../../src/config/cours/registre";
import { UN_EQUIPEMENT_DE_PLUS_AU_DEPART, equipementDePlus } from "../../src/config/cours/situations/par-chapitre/un-equipement-de-plus-au-depart";
import type { Situation } from "../../src/config/cours/situations/types";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, triDe } from "./gardes-de-nova";

/**
 * LE PROJET D'ENTREPRISE SUR LE MONDE DU COURS (lot M6), ET SON CAS, CHEZ NOVA. « Organiser
 * l'activité », l'autre chapitre de ce fichier, est passé sur le monde du cours avec le lot M5.
 *
 * Refait à la main sur la création de NOVA : l'apport de 150 000 €, l'emprunt de 80 000 € (20
 * échéances de 4 000 € de capital, 5 %), la ligne à 60 000 € hors taxes et 12 000 € de TVA, les
 * 133 000 € placés le 6 janvier, 19 700 € de loyer et 10 650 € de personnel par mois, le mois de 30
 * jours du cours ; le cinquième poste à 15 000 € hors taxes.
 */

const c2 = (x: number) => Math.round(x * 100) / 100 + 0;

function reponseSansIndice(s: Situation) {
  const e = etape(chapitreDuCas(s, NOVA), s.etapes.at(-1)!.id, "choix");
  const options = e.options(NOVA, VIDE);
  const bonne = options.find((o) => o.juste)!;
  expect(bonne.texte.length, `${s.code} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
}

describe("le chapitre et son cas, dans leur parcours", () => {
  it("porte le titre du programme, au palier 1, chez NOVA seule, et son cas lui est dédié", () => {
    gardeDuProgramme(LE_PROJET_D_ENTREPRISE, PROGRAMME["seconde-mg"][1]!);
    gardeDuCas(UN_EQUIPEMENT_DE_PLUS_AU_DEPART, LE_PROJET_D_ENTREPRISE);
    reponseSansIndice(UN_EQUIPEMENT_DE_PLUS_AU_DEPART);
  });

  it("textes propres, une seule bonne réponse, notions existantes, servis par le serveur", () => {
    gardesDeTexte(LE_PROJET_D_ENTREPRISE);
  });
});

describe("le projet d'entreprise", () => {
  it("230 000 € de besoins et de ressources ; 65,2 % des associés, 34,8 % de la banque, 20 trimestres de remboursement", () => {
    expect(triDe(LE_PROJET_D_ENTREPRISE, "ranger")).toEqual({
      "Ligne de montage, hors taxes": "besoin",
      "TVA payée sur la ligne, que l'État rendra": "besoin",
      "Argent placé sur un compte à terme": "besoin",
      "Argent sur le compte courant": "besoin",
      "Apport des associés": "ressource",
      "Emprunt bancaire": "ressource",
    });
    expect(attendus(LE_PROJET_D_ENTREPRISE, "equilibre")).toEqual([60_000 + 12_000 + 133_000 + (230_000 - 72_000 - 133_000), 150_000 + 80_000]);
    expect(attendus(LE_PROJET_D_ENTREPRISE, "qui-paie")).toEqual([65.2, 34.8, 80_000 / 4_000]);
  });

  it("la trésorerie : 30 350 € de charges par mois, 1 011,67 € par jour, 156 jours ; le compte courant seul, 24", () => {
    expect(attendus(LE_PROJET_D_ENTREPRISE, "tresorerie")).toEqual([19_700 + 10_650, c2(30_350 / 30), Math.floor(158_000 / (30_350 / 30))]);
    expect(Math.floor(25_000 / (30_350 / 30))).toBe(24);
  });

  it("le curseur : 83 050 € d'apport gardent les trois mois de charges, 91 050 €", () => {
    expect(MOIS_DE_CHARGES_A_COUVRIR).toBe(3);
    gardeDuCurseur(LE_PROJET_D_ENTREPRISE, "le-plus-petit-apport", 3 * 30_350 - 80_000 + 72_000);
  });

  it("le laboratoire : 127 000 € placés laissent 31 000 € au compte courant, un mois de charges", () => {
    const e = gardeDuLaboratoire(LE_PROJET_D_ENTREPRISE, "le-laboratoire-de-la-reserve");
    expect(e.defi(NOVA).solution).toEqual({ placement: Math.floor((158_000 - 30_350) / 1_000) * 1_000 });
  });
});

describe("le cas du chapitre", () => {
  it("un équipement de plus au départ : 18 000 € comptant laissent 140 000 €, 138 jours ; emprunté, 60,5 % des associés, 1 125 € la première échéance", () => {
    const k = equipementDePlus();
    expect([k.comptant.tresorerie, k.comptant.jours, k.partApres, k.premiereEcheance, k.verdict]).toEqual([
      158_000 - 15_000 * 1.2,
      Math.floor(140_000 / (30_350 / 30)),
      Math.round((150_000 / 248_000) * 1000) / 10,
      18_000 / 20 + (18_000 * 0.05) / 4,
      "comptant",
    ]);
  });
});
