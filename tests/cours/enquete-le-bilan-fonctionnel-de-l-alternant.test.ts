import { describe, expect, it } from "vitest";
import { ENQUETES, enqueteParCode, enquetesDuChapitre } from "../../src/config/cours/enquetes";
import { LE_BILAN_FONCTIONNEL_DE_L_ALTERNANT as e, grilleDesMasses } from "../../src/config/cours/enquetes/le-bilan-fonctionnel-de-l-alternant";
import { bilanFonctionnelDeLAlternant, bilanFonctionnelJuste, postesDuBilanDeLAlternant } from "../../src/config/cours/monde/bilan-fonctionnel-de-l-alternant";
import { EXERCICE_DE_NOVA as f } from "../../src/config/cours/monde/exercice-de-nova";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { etapeDe, verifierLaLangue, verifierLaTailleDeLEnquete, verifierLEnregistrement, verifierLeClassement, verifierLeTableau, verifierLesQuestions } from "../helpers/activites-du-lot-d";

/**
 * L'ENQUÊTE DU BILAN FONCTIONNEL DE L'ALTERNANT (enquetes/le-bilan-fonctionnel-de-l-alternant.ts,
 * monde/bilan-fonctionnel-de-l-alternant.ts) : chaque masse refaite à la main, celles de l'alternant et
 * les justes ; chaque erreur garde l'égalité FRNG − BFR = TN.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;

describe("les postes et les masses, à la main", () => {
  const p = postesDuBilanDeLAlternant(f);
  it("les postes reclassés : la ligne, ses amortissements, le compte à terme, les intérêts courus, l'impôt, la provision", () => {
    expect([p.ligneBrute, p.amortissements, p.placement, p.interetsCourus, p.impot, p.provision]).toEqual([60_000, 9_861.11, c(133_000 + 3_934.58), 831.11, 20_742, 5_000]);
    expect([p.tvaSurFactureNonParvenue, p.chargeConstateeDAvance, p.produitConstateDAvance]).toEqual([6_900, 4_500, 7_080]);
  });

  it("le bon bilan : 263 297,07 € de fonds de roulement, 32 200,73 € de besoin d'exploitation, −21 573,11 € hors exploitation, 252 669,45 € de trésorerie", () => {
    const j = bilanFonctionnelJuste(f);
    expect(c(323_297.07 - 60_000)).toBe(j.fondsDeRoulement);
    expect(c(140_658 - 108_457.27)).toBe(j.besoinDExploitation);
    expect(c(0 - (20_742 + 831.11))).toBe(j.besoinHorsExploitation);
    expect(c(263_297.07 - 32_200.73 + 21_573.11)).toBe(j.tresorerieNette);
  });

  it("celui de l'alternant : chaque erreur déplace un poste, et l'égalité tient quand même", () => {
    const a = bilanFonctionnelDeLAlternant(f);
    expect(a.emploisStables).toBe(c(60_000 - 9_861.11 + 136_934.58));
    expect(a.ressourcesStables).toBe(c(323_297.07 - 9_861.11 + 831.11 - 5_000));
    expect(a.fondsDeRoulement).toBe(122_193.6);
    expect(a.passifDExploitation).toBe(c(108_457.27 + 20_742 + 5_000));
    expect(a.passifHorsExploitation).toBe(0);
    expect(a.tresorerieNette).toBe(115_734.87);
    expect(c(a.fondsDeRoulement - a.besoinDExploitation - a.besoinHorsExploitation)).toBe(a.tresorerieNette);
  });
});

describe("l'enquête du bilan fonctionnel de l'alternant", () => {
  it("est enregistrée, réservée, reprise du chapitre « Bilan fonctionnel et BFR »", () => {
    verifierLEnregistrement(e, "bilan-fonctionnel-et-bfr", ENQUETES, enqueteParCode, enquetesDuChapitre);
  });

  it("le contrôle : huit reclassements, trois justes, cinq erreurs de natures différentes", () => {
    const k = etapeDe(e, "le-controle", "classement");
    verifierLeClassement(k);
    verifierLaTailleDeLEnquete(e, k);
    expect(k.elements.filter((x) => x.categorie === "juste").map((x) => x.code)).toEqual(["tva", "charge", "produit"]);
  });

  it("les masses corrigées : cohérentes chez l'alternant comme dans le juste", () => {
    verifierLeTableau(etapeDe(e, "les-masses", "etat"));
    const g = grilleDesMasses();
    expect(g.lignes.at(-1)!.cellules.map((x) => x.valeur)).toEqual([115_734.87, 252_669.45]);
  });

  it("répondre au président", () => {
    const q = etapeDe(e, "la-reponse", "reponse");
    verifierLesQuestions(q);
    expect(espacesOrdinaires(q.questions[0]!.options.find((o) => o.juste)!.texte)).toBe("263 297,07 €");
  });

  it("la langue de la maison", () => {
    verifierLaLangue(e);
  });
});
