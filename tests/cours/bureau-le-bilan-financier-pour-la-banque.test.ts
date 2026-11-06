import { describe, expect, it } from "vitest";
import { BUREAUX, bureauParCode, bureauxDuChapitre } from "../../src/config/cours/bureaux";
import { LE_BILAN_FINANCIER_POUR_LA_BANQUE as b, grilleDesRatios, grilleDuBilanFinancier } from "../../src/config/cours/bureaux/le-bilan-financier-pour-la-banque";
import { etapeDe, verifierLaLangue, verifierLaTailleDuBureau, verifierLEnregistrement, verifierLeClassement, verifierLeTableau, verifierLesQuestions } from "../helpers/activites-du-lot-d";

/**
 * LE BUREAU DU BILAN FINANCIER POUR LA BANQUE (bureaux/le-bilan-financier-pour-la-banque.ts) : le bilan
 * financier et ses ratios refaits à la main, chaque reclassement à la place que sa pièce lui donne.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const r = (v: number) => Math.round(v * 100) / 100 + 0;
const valeur = (g: ReturnType<typeof grilleDuBilanFinancier>, libelle: string) => g.lignes.find((l) => l.libelle === libelle)!.cellules[0]!.valeur;

describe("le bilan financier de NOVA, à la main", () => {
  const g = grilleDuBilanFinancier();
  it("l'actif : la ligne à 75 % de 60 000 €, et 13 500 + 115 948 + 136 934,58 + 115 734,87 à moins d'un an", () => {
    expect(valeur(g, "Actif à plus d'un an")).toBe(0.75 * 60_000);
    expect(valeur(g, "Actif à moins d'un an")).toBe(c(13_500 + (104_548 + 6_900 + 4_500) + 136_934.58 + 115_734.87));
  });

  it("le passif : 229 225,96 − 30 000 − 5 138,89 de capitaux propres ; 52 000 à plus d'un an ; 16 000 + 5 000 + 130 030,38 + 30 000 à moins d'un an", () => {
    expect(valeur(g, "Capitaux propres")).toBe(c(229_225.96 - 30_000 - (50_138.89 - 45_000)));
    expect(valeur(g, "Dettes à plus d'un an")).toBe(c(68_000 - 16_000));
    expect(valeur(g, "Dettes à moins d'un an")).toBe(c(16_000 + 5_000 + (831.11 + 81_000 + 41_119.27 + 7_080) + 30_000));
    expect(valeur(g, "Total du passif")).toBe(427_117.45);
    expect(valeur(g, "Fonds de roulement financier")).toBe(c(194_087.07 + 52_000 - 45_000));
  });

  it("les ratios, au centième", () => {
    const v = grilleDesRatios().lignes.map((l) => l.cellules[0]!.valeur);
    expect(v).toEqual([r(382_117.45 / 181_030.38), r(115_734.87 / 181_030.38), r((194_087.07 / 427_117.45) * 100), r((255_297.07 / 323_297.07) * 100), r(68_000 / 229_225.96), r(68_000 / 105_297.07)]);
  });
});

describe("le bureau du bilan financier pour la banque", () => {
  it("est enregistré, réservé, repris du chapitre « Ratios de structure et bilan financier »", () => {
    verifierLEnregistrement(b, "ratios-de-structure-et-bilan-financier", BUREAUX, bureauParCode, bureauxDuChapitre);
    verifierLaTailleDuBureau(b);
  });

  it("le reclassement : chaque masse sert, et les pièges sont à moins d'un an", () => {
    const e = etapeDe(b, "le-reclassement", "classement");
    verifierLeClassement(e);
    expect(new Set(e.elements.map((x) => x.categorie)).size).toBe(e.categories.length);
    const cat = (code: string) => e.elements.find((x) => x.code === code)!.categorie;
    expect([cat("dividende"), cat("provision"), cat("echeances"), cat("compte-a-terme"), cat("reste")]).toEqual(["dettes-moins", "dettes-moins", "dettes-moins", "actif-moins", "dettes-plus"]);
  });

  it("le bilan financier et les ratios : cohérents et justes ; les questions", () => {
    for (const id of ["le-bilan-financier", "les-ratios"]) verifierLeTableau(etapeDe(b, id, "etat"));
    verifierLesQuestions(etapeDe(b, "la-reponse", "reponse"));
  });

  it("la langue de la maison", () => {
    verifierLaLangue(b);
  });
});
