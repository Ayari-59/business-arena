import { describe, expect, it } from "vitest";
import { BUREAUX, bureauParCode, bureauxDuChapitre } from "../../src/config/cours/bureaux";
import { LE_TABLEAU_DE_FINANCEMENT_DE_NOVA as b, grilleDeLaPartieDeux, grilleDeLaPartieUn } from "../../src/config/cours/bureaux/le-tableau-de-financement-de-nova";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { etapeDe, verifierLaLangue, verifierLaTailleDuBureau, verifierLEnregistrement, verifierLeClassement, verifierLeTableau, verifierLesQuestions } from "../helpers/activites-du-lot-d";

/**
 * LE BUREAU DU TABLEAU DE FINANCEMENT DE NOVA (bureaux/le-tableau-de-financement-de-nova.ts) : les deux
 * parties refaites à la main, à partir d'un bilan d'ouverture vide ; elles retombent sur la même variation.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const total = (g: ReturnType<typeof grilleDeLaPartieUn>, libelle: string) => g.lignes.find((l) => l.libelle.startsWith(libelle))!.cellules[0]!.valeur;

describe("le tableau de financement de N, à la main", () => {
  it("partie I : 105 297,07 + 150 000 + 80 000 − (60 000 + 12 000) = 263 297,07 €", () => {
    const g = grilleDeLaPartieUn();
    expect(total(g, "Total des emplois")).toBe(c(60_000 + 12_000));
    expect(total(g, "Total des ressources")).toBe(c(105_297.07 + 150_000 + 80_000));
    expect(total(g, "Variation du fonds")).toBe(c(335_297.07 - 72_000));
  });

  it("partie II : 13 500 + (115 758 + 6 900 + 4 500) − (81 000 + 4 921,27 + 15 456 + 7 080), − (20 742 + 831,11), + 252 669,45", () => {
    const g = grilleDeLaPartieDeux();
    expect(total(g, "Variation des créances")).toBe(c(115_758 + 6_900 + 4_500));
    expect(total(g, "Variation des dettes d'exploitation")).toBe(c(81_000 + 4_921.27 + 15_456 + 7_080));
    expect(total(g, "Variation du besoin d'exploitation")).toBe(c(13_500 + 127_158 - 108_457.27));
    expect(total(g, "Variation du besoin hors")).toBe(c(-(20_742 + 831.11)));
    expect(total(g, "Variation des disponibilités")).toBe(c(115_734.87 + 136_934.58));
    expect(total(g, "Variation du fonds")).toBe(c(32_200.73 - 21_573.11 + 252_669.45));
    expect(total(g, "Variation du fonds")).toBe(263_297.07);
  });
});

describe("le bureau du tableau de financement de NOVA", () => {
  it("est enregistré, réservé, repris du chapitre « Le tableau de financement »", () => {
    verifierLEnregistrement(b, "le-tableau-de-financement", BUREAUX, bureauParCode, bureauxDuChapitre);
    verifierLaTailleDuBureau(b);
  });

  it("le tri : ce qui n'entre pas dans le tableau, la TVA, les intérêts, la dépréciation, le dividende de N+1", () => {
    const e = etapeDe(b, "le-tri", "classement");
    verifierLeClassement(e);
    expect(e.elements.filter((x) => x.categorie === "rien").map((x) => x.code).sort()).toEqual(["depreciation", "dividende", "interets", "tva-ligne"]);
    expect(new Set(e.elements.map((x) => x.categorie)).size).toBe(e.categories.length);
  });

  it("les deux parties : cohérentes et justes", () => {
    for (const id of ["la-partie-un", "la-partie-deux"]) verifierLeTableau(etapeDe(b, id, "etat"));
  });

  it("répondre à l'expert-comptable", () => {
    const q = etapeDe(b, "la-reponse", "reponse");
    verifierLesQuestions(q);
    expect(espacesOrdinaires(q.questions[0]!.options.find((o) => o.juste)!.retour)).toContain("96 %");
  });

  it("la langue de la maison", () => {
    verifierLaLangue(b);
  });
});
