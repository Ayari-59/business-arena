import { describe, expect, it } from "vitest";
import { BUREAUX, bureauParCode, bureauxDuChapitre } from "../../src/config/cours/bureaux";
import { LES_SOLDES_POUR_LA_BANQUE as b, grilleDeLaCaf, grilleDesSoldes } from "../../src/config/cours/bureaux/les-soldes-pour-la-banque";
import { cloture } from "../../src/config/cours/monde/cloture";
import { EXERCICE_DE_NOVA as f } from "../../src/config/cours/monde/exercice-de-nova";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { etapeDe, verifierLaLangue, verifierLaTailleDuBureau, verifierLEnregistrement, verifierLeClassement, verifierLeTableau, verifierLesQuestions } from "../helpers/activites-du-lot-d";

/**
 * LE BUREAU DES SOLDES POUR LA BANQUE (bureaux/les-soldes-pour-la-banque.ts) : chaque chiffre refait à la
 * main sur le compte de résultat de NOVA, compte par compte ; la cascade et la CAF tombent juste ; les
 * pièges sont rangés où il faut.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const s = cloture(f).soldes;

describe("les soldes de NOVA, à la main", () => {
  it("le compte de résultat : 15 comptes de gestion, et le 6031 au crédit", () => {
    expect(Object.keys(s).filter((k) => /^[67]/.test(k) && s[k] !== 0).length).toBe(15);
    expect(s["6031"]).toBe(-13_500);
  });

  it("la valeur ajoutée : 1 390 276 − (534 098 − 13 500 + 377 744 + 236 400 + 1 500) = 254 034 €", () => {
    const consommations = c(534_098 - 13_500 + 377_744 + 236_400 + 1_500);
    expect(consommations).toBe(1_136_242);
    expect(c(1_390_276 - consommations)).toBe(254_034);
  });

  it("l'excédent brut, le résultat d'exploitation, le financier, le courant, le net", () => {
    const ebe = c(254_034 - (90_000 + 37_800));
    expect(ebe).toBe(126_234);
    const dotations = c(9_861.11 + 5_000 + 11_210);
    expect(c(ebe - dotations)).toBe(100_162.89);
    const financier = c(3_934.58 - (3_681.11 + 448.4));
    expect(financier).toBe(-194.93);
    expect(c(100_162.89 + financier)).toBe(99_967.96);
    expect(c(99_967.96 - 20_742)).toBe(79_225.96);
  });

  it("la CAF deux fois : 79 225,96 + 26 071,11 = 126 234 + 3 934,58 − 4 129,51 − 20 742 = 105 297,07 €", () => {
    expect(c(79_225.96 + 26_071.11)).toBe(105_297.07);
    expect(c(126_234 + 3_934.58 - 4_129.51 - 20_742)).toBe(105_297.07);
  });

  it("les ratios de la banque : 18,27 % de valeur ajoutée ; la CAF vaut 6,58 fois les 16 000 € de capital de N+1", () => {
    expect(Math.round((254_034 / 1_390_276) * 10_000) / 100).toBe(18.27);
    expect(Math.round((105_297.07 / 16_000) * 100) / 100).toBe(6.58);
  });
});

describe("le bureau des soldes pour la banque", () => {
  it("est enregistré, réservé, repris du chapitre des soldes, hors des cas dédiés", () => {
    verifierLEnregistrement(b, "soldes-intermediaires-de-gestion", BUREAUX, bureauParCode, bureauxDuChapitre);
    verifierLaTailleDuBureau(b);
    expect(b.titre).toBe("Au bureau : les soldes pour la banque");
  });

  it("ranger les comptes : chacun des 15, les pièges à leur place", () => {
    const e = etapeDe(b, "les-comptes", "classement");
    verifierLeClassement(e);
    expect(e.elements.length).toBe(15);
    const cat = (compte: string) => e.elements.find((x) => x.code === `c-${compte}`)!.categorie;
    expect([cat("6031"), cat("665"), cat("6817"), cat("6815"), cat("764")]).toEqual(["consommations", "charges-financieres", "dotations", "dotations", "produits-financiers"]);
    expect(e.elements.find((x) => x.code === "c-6031")!.montant).toBe(-13_500);
  });

  it("la cascade et la CAF : cohérentes, justes, aux montants de la main", () => {
    for (const id of ["la-cascade", "la-caf"]) verifierLeTableau(etapeDe(b, id, "etat"));
    const total = (g: ReturnType<typeof grilleDesSoldes>, libelle: string) => g.lignes.find((l) => l.libelle === libelle)!.cellules[0]!.valeur;
    expect(total(grilleDesSoldes(), "Valeur ajoutée")).toBe(254_034);
    expect(total(grilleDesSoldes(), "Résultat net")).toBe(79_225.96);
    expect(total(grilleDeLaCaf(), "CAF, méthode additive")).toBe(105_297.07);
    expect(total(grilleDeLaCaf(), "CAF, méthode soustractive")).toBe(105_297.07);
  });

  it("répondre à la banque : une seule bonne option, jamais la plus longue, chiffrée", () => {
    const e = etapeDe(b, "la-reponse", "reponse");
    verifierLesQuestions(e);
    expect(espacesOrdinaires(e.questions[0]!.options.find((o) => o.juste)!.texte)).toBe("18,27 %");
    expect(espacesOrdinaires(e.questions[1]!.options.find((o) => o.juste)!.texte)).toContain("6,58 fois");
  });

  it("la langue de la maison", () => {
    verifierLaLangue(b);
  });
});
