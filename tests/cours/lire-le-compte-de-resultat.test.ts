import { describe, expect, it } from "vitest";
import { LIRE_LE_COMPTE_DE_RESULTAT, SOLUTION_DU_COMPTE, TAUX_DU_DEFI, compteDeResultat, compteDuLaboratoire, seuilDeLActivite } from "../../src/config/cours/chapitres/lire-le-compte-de-resultat";
import { LA_HAUSSE_DES_SALAIRES, hausseDesSalaires } from "../../src/config/cours/situations/par-chapitre/la-hausse-des-salaires";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, etape, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte } from "./gardes-du-lycee";

/**
 * LE COMPTE DE RÉSULTAT, SUR LE PREMIER EXERCICE DE NOVA DU MONDE DU COURS, ET SON CAS : LA HAUSSE
 * DES SALAIRES.
 *
 * Chaque attendu est refait à la main sur les lignes du compte (épinglées dans
 * tests/cours/comptes-du-lycee.test.ts) : 1 390 276 € de ventes et 3 934,58 € de revenus du compte à
 * terme ; 1 290 113,11 € de charges de l'activité, 4 129,51 € de financement, 20 742 € d'impôt.
 * L'enceinte se vend 59 € et coûte 38 € de coûts variables : 21 € de plus par enceinte vendue.
 */

const ch = chapitreDuCas(LIRE_LE_COMPTE_DE_RESULTAT, NOVA);
const c = (x: number) => Math.round(x * 100) / 100 + 0;

describe("le compte de résultat de NOVA", () => {
  const k = compteDeResultat(NOVA);

  it("les totaux et le résultat se refont à la main", () => {
    expect(k.produits).toBe(c(1_390_276 + 3_934.58));
    expect(k.charges).toBe(c(1_290_113.11 + 4_129.51 + 20_742));
    expect(k.resultatNet).toBe(c(1_394_210.58 - 1_314_984.62));
    expect(k.resultatNet).toBe(79_225.96);
    expect(k.resultatDActivite).toBe(c(1_390_276 - 1_290_113.11));
  });

  it("les taux se refont au dixième, et les champs les attendent", () => {
    expect(k.tauxDeResultat).toBe(5.7); // 79 225,96 ÷ 1 390 276 = 5,699 %
    expect(k.partDuPersonnel).toBe(9.7); // 127 800 ÷ 1 314 984,62 = 9,719 %
    const champs = etape(ch, "resultat", "montants").champs(NOVA, VIDE);
    expect(champs.map((x) => x.attendu)).toEqual([1_394_210.58, 1_314_984.62, 79_225.96]);
    expect(etape(ch, "taux", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([5.7, 9.7]);
  });

  it("la nature des charges : neuf lignes, sept de l'activité, deux du financement, l'impôt", () => {
    const el = etape(ch, "ranger", "tri").elements(NOVA);
    expect(el.map((x) => x.categorie)).toEqual(["exploitation", "exploitation", "exploitation", "exploitation", "exploitation", "exploitation", "exploitation", "financiere", "financiere", "impot"]);
    expect(el.every((x) => x.pourquoi.length > 0)).toBe(true);
  });

  it("l'activité est rentable : la bonne réponse le dit", () => {
    const juste = etape(ch, "activite-ou-financement", "choix").options(NOVA, VIDE).filter((o) => o.juste);
    expect(juste.map((o) => o.texte)).toEqual(["L'activité est rentable : ce sont le financement et l'impôt qui réduisent le résultat"]);
  });

  it("le curseur : 18 795 enceintes, la plus petite quantité où l'activité ne perd pas d'argent", () => {
    // 23 564 − 100 162,89 ÷ 21 = 18 794,34 : il faut 18 795 enceintes.
    expect(seuilDeLActivite(k)).toBe(18_795);
    const e = gardeDuCurseur(ch, "le-seuil-de-l-activite", 18_795);
    const lu = e.lecture(NOVA, 18_795);
    expect(lu.map((l) => l.montant)).toEqual([18_795 * 59, c(1_290_113.11 - 38 * (23_564 - 18_795)), c(100_162.89 - 21 * (23_564 - 18_795))]);
    expect(lu[2]!.montant).toBe(13.89);
    expect(e.lecture(NOVA, 18_794)[2]!.montant).toBe(-7.11);
  });

  it("le laboratoire : 8 % de résultat net dès 62 €, ou en vendant 20 % d'enceintes de plus", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-du-compte");
    expect(SOLUTION_DU_COMPTE).toEqual({ prix: 62, ventes: 0 });
    // À 62 € : 3 × 23 564 de plus avant impôt, 170 659,96 € ; l'impôt 6 375 + 25 % × 128 159,96 = 38 415 €.
    const a62 = compteDuLaboratoire(k, { prix: 62, ventes: 0 });
    expect(a62.resultatNet).toBe(c(170_659.96 - 38_415));
    expect(a62.tauxDeResultat).toBeCloseTo(132_244.96 / 1_460_968, 10);
    expect(a62.tauxDeResultat >= TAUX_DU_DEFI).toBe(true);
    // À 61 € : 7,97 %, juste sous le défi.
    const a61 = compteDuLaboratoire(k, { prix: 61, ventes: 0 });
    expect(a61.resultatNet).toBe(c(147_095.96 - 32_524));
    expect(a61.tauxDeResultat < TAUX_DU_DEFI).toBe(true);
    // 59 € et 20 % d'enceintes de plus : 28 277 enceintes, 4 713 × 21 € de plus.
    const v20 = compteDuLaboratoire(k, { prix: 59, ventes: 20 });
    expect(v20.quantite).toBe(28_277);
    expect(v20.resultatDActivite).toBe(c(100_162.89 + 4_713 * 21));
    expect(v20.tauxDeResultat >= TAUX_DU_DEFI).toBe(true);
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(LIRE_LE_COMPTE_DE_RESULTAT);
  });
});

describe("le cas : la hausse des salaires", () => {
  const r = hausseDesSalaires(NOVA);
  it("4 % de 127 800 €, retranchés du résultat avant impôt", () => {
    expect(r.avantImpot).toBe(c(100_162.89 + 3_934.58 - 4_129.51));
    expect(r.cout).toBe(5_112);
    expect(r.apres).toBe(c(99_967.96 - 5_112));
    expect(r.tauxApres).toBe(6.8); // 94 855,96 ÷ 1 390 276 = 6,82 %
    expect(r.surLeResultat).toBe(c(99_967.96 * 0.96));
  });
  it("les textes sont propres, une seule bonne réponse", () => {
    gardesDeTexte(LA_HAUSSE_DES_SALAIRES);
  });
});
