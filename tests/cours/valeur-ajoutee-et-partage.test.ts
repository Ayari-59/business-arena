import { describe, expect, it } from "vitest";
import {
  HAUSSE_DU_DEFI,
  PART_GARDEE_DU_DEFI,
  SOLUTION_DU_PARTAGE,
  VALEUR_AJOUTEE,
  enceintesQuiPaientLEquipe,
  partageDuLaboratoire,
  valeurAjoutee,
} from "../../src/config/cours/chapitres/valeur-ajoutee-et-partage";
import { CONTRAT_D_ENTRETIEN_ANNUEL, UN_TECHNICIEN_PLUTOT_QU_UN_PRESTATAIRE, technicien } from "../../src/config/cours/situations/par-chapitre/un-technicien-plutot-qu-un-prestataire";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, etape, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte } from "./gardes-du-lycee";

/**
 * LA VALEUR AJOUTÉE ET SON PARTAGE, SUR LE PREMIER EXERCICE DE NOVA DU MONDE DU COURS, ET SON CAS :
 * UN TECHNICIEN PLUTÔT QU'UN PRESTATAIRE.
 *
 * Refait à la main : la production est les ventes, 1 390 276 € ; les consommations sont les
 * composants (520 598 €), l'emballage, le transport et l'énergie (377 744 €), le loyer (236 400 €) et
 * l'assurance (1 500 €). Le partage : le personnel (127 800 €), les prêteurs (4 129,51 €), l'État
 * (20 742 €), et l'entreprise, le reste.
 */

const ch = chapitreDuCas(VALEUR_AJOUTEE, NOVA);
const c = (x: number) => Math.round(x * 100) / 100 + 0;
const VA = 1_390_276 - (520_598 + 377_744 + 236_400 + 1_500);

describe("la valeur ajoutée de NOVA", () => {
  const v = valeurAjoutee(NOVA);

  it("la valeur ajoutée, son taux et son partage se refont à la main", () => {
    expect(VA).toBe(254_034);
    expect(v.consommations).toBe(1_136_242);
    expect(v.va).toBe(VA);
    expect(v.tauxDeValeurAjoutee).toBe(18.3); // 254 034 ÷ 1 390 276 = 18,27 %
    expect(v.entreprise).toBe(c(VA - 127_800 - 4_129.51 - 20_742));
    expect(v.entreprise).toBe(101_362.49);
    // Ce que l'entreprise garde : ses dotations et son résultat, moins les revenus du compte à terme.
    expect(v.entreprise).toBe(c(26_071.11 + 79_225.96 - 3_934.58));
    expect(v.parts.map((p) => p.part)).toEqual([50.3, 1.6, 8.2, 39.9]);
    expect(etape(ch, "va", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([1_136_242, 254_034, 18.3]);
    expect(etape(ch, "partage", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([50.3, 39.9]);
  });

  it("la plus grosse part revient aux salariés", () => {
    const juste = etape(ch, "premiere-part", "choix").options(NOVA, VIDE).filter((o) => o.juste);
    expect(juste.map((o) => o.texte)).toEqual(["Les salariés"]);
  });

  it("le curseur : 17 553 enceintes pour que la valeur ajoutée paie l'équipe", () => {
    // 23 564 − (254 034 − 127 800) ÷ 21 = 17 552,86.
    expect(enceintesQuiPaientLEquipe(v)).toBe(17_553);
    const e = gardeDuCurseur(ch, "la-richesse-qui-paie-l-equipe", 17_553);
    expect(e.lecture(NOVA, 17_553)[0]!.montant).toBe(254_034 - 21 * (23_564 - 17_553));
    expect(e.lecture(NOVA, 17_553)[2]!.montant).toBe(3);
  });

  it("le laboratoire : 20 % de hausse et un tiers gardé demandent 5 % de ventes en plus", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-du-partage");
    expect(SOLUTION_DU_PARTAGE).toEqual({ hausse: HAUSSE_DU_DEFI, ventes: 5 });
    // 20 % sans vendre plus : 153 360 € de personnel, 74 407,96 € avant impôt, 14 352 € d'impôt.
    const sans = partageDuLaboratoire(v, { hausse: 20, ventes: 0 });
    expect(sans.entreprise).toBe(c(254_034 - 153_360 - 4_129.51 - 14_352));
    expect(sans.partGardee < PART_GARDEE_DU_DEFI).toBe(true);
    // Et 5 % d'enceintes de plus : 24 742 enceintes, 1 178 × 21 € de valeur ajoutée en plus.
    const avec = partageDuLaboratoire(v, { hausse: 20, ventes: 5 });
    expect(avec.va).toBe(254_034 + 1_178 * 21);
    expect(avec.k.impot).toBe(20_536); // 6 375 + 25 % × (99 145,96 − 42 500), arrondi
    expect(avec.entreprise).toBe(c(278_772 - 153_360 - 4_129.51 - 20_536));
    expect(avec.partGardee >= PART_GARDEE_DU_DEFI).toBe(true);
    // Une hausse de 19 % ne relève pas le défi, même en vendant beaucoup plus.
    expect(etape(ch, "le-laboratoire-du-partage", "simulation").defi(NOVA).atteint({ hausse: 19, ventes: 20 })).toBe(false);
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(VALEUR_AJOUTEE);
  });
});

describe("le cas : un technicien plutôt qu'un prestataire", () => {
  const r = technicien(NOVA);
  it("le contrat de la fiche, douze mois à 1 562 €, sort des consommations et entre dans la valeur ajoutée", () => {
    expect(CONTRAT_D_ENTRETIEN_ANNUEL).toBe(18_744);
    expect(r.consommations).toBe(1_136_242 + 18_744);
    expect(r.va).toBe(254_034 - 18_744);
    expect(r.partAvant).toBe(54.3); // 127 800 ÷ 235 290
    expect(r.salaire).toBe(c(18_744 * 0.9));
    expect(r.vaApres).toBe(254_034);
    expect(r.partApres).toBe(56.9); // 144 669,60 ÷ 254 034
  });
  it("les textes sont propres, une seule bonne réponse", () => {
    gardesDeTexte(UN_TECHNICIEN_PLUTOT_QU_UN_PRESTATAIRE);
  });
});
