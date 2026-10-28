import { describe, expect, it } from "vitest";
import {
  FONDS_DE_ROULEMENT,
  GAIN_DU_DEFI,
  SOLUTION_DES_DELAIS,
  delaisDuLaboratoire,
  equipementPossible,
  factureDeCampusTech,
  fondsDeRoulement,
} from "../../src/config/cours/chapitres/fonds-de-roulement-et-tresorerie";
import { LE_FOURNISSEUR_RACCOURCIT_SES_DELAIS, fournisseurPresse } from "../../src/config/cours/situations/par-chapitre/le-fournisseur-raccourcit-ses-delais";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, etape, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte } from "./gardes-du-lycee";

/**
 * FONDS DE ROULEMENT, BESOIN ET TRÉSORERIE, AU 31 DÉCEMBRE DU PREMIER EXERCICE DE NOVA DU MONDE DU
 * COURS, ET SON CAS : LE FOURNISSEUR RACCOURCIT SES DÉLAIS.
 *
 * Refait à la main, avec les grandeurs du bilan fonctionnel du supérieur : les ressources
 * durables, 229 225,96 + 21 071,11 (amortissements et dépréciations) + 5 000 + 68 000 ; la ligne à
 * sa valeur d'origine, 60 000 € ; le cycle, 13 500 + 115 758 (clients bruts) + 11 400 € face à 81 000 + 41 119,27 + 7 911,11 € ; la
 * banque et le compte à terme, 252 669,45 €. Une facture de CampusTech : 320 enceintes à 59 €, TVA
 * de 20 % comprise.
 */

const ch = chapitreDuCas(FONDS_DE_ROULEMENT, NOVA);
const c = (x: number) => Math.round(x * 100) / 100 + 0;
const FR = c(229_225.96 + 21_071.11 + 5_000 + 68_000 - 60_000);
const BFR = c(13_500 + 115_758 + 11_400 - (81_000 + 41_119.27 + 7_911.11));

describe("le fonds de roulement de NOVA", () => {
  const k = fondsDeRoulement(NOVA);

  it("le fonds de roulement, le besoin et la trésorerie se refont à la main, et se tiennent", () => {
    expect(FR).toBe(263_297.07);
    expect(BFR).toBe(10_627.62);
    expect(etape(ch, "frng", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([323_297.07, FR]);
    expect(etape(ch, "bfr", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([140_658, 130_030.38, BFR]);
    expect(etape(ch, "tresorerie", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([252_669.45, c(FR - BFR)]);
    expect(c(FR - BFR)).toBe(k.tresorerie);
  });

  it("des clients plus rapides font monter la trésorerie : une seule bonne réponse", () => {
    const juste = etape(ch, "clients", "choix").options(NOVA, VIDE).filter((o) => o.juste);
    expect(juste.map((o) => o.texte)).toEqual(["Elle monterait : le besoin en fonds de roulement baisserait"]);
  });

  it("le curseur : un équipement de 252 669 € payé comptant au plus", () => {
    expect(equipementPossible(k)).toBe(Math.floor(FR - BFR));
    const e = gardeDuCurseur(ch, "un-equipement-paye-comptant", 252_669);
    expect(e.lecture(NOVA, 252_669)[2]!.montant).toBe(0.45);
    expect(e.lecture(NOVA, 252_670)[2]!.montant).toBe(-0.55);
  });

  it("le laboratoire : CampusTech à l'échéance convenue rend une facture, 22 656 €", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-des-delais");
    expect(factureDeCampusTech(k)).toBe(c(320 * 59 * 1.2));
    expect(SOLUTION_DES_DELAIS).toEqual({ campustech: 60, fournisseur: 22 });
    const x = delaisDuLaboratoire(k, SOLUTION_DES_DELAIS);
    expect(x.tresorerie).toBe(c(252_669.45 + 22_656));
    expect(x.fondsDeRoulement).toBe(FR);
    expect(x.besoin).toBe(c(BFR - 22_656));
    expect(x.tresorerie - k.tresorerie >= GAIN_DU_DEFI).toBe(true);
    // 70 jours ne changent rien au 31 décembre : la facture du 20 octobre est encaissée le 30 décembre.
    expect(delaisDuLaboratoire(k, { campustech: 70, fournisseur: 22 }).tresorerie).toBe(x.tresorerie);
    // Un CampusTech plus en retard, à 110 jours, immobilise une facture de plus.
    expect(delaisDuLaboratoire(k, { campustech: 110, fournisseur: 22 }).tresorerie).toBe(c(252_669.45 - 22_656));
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(FONDS_DE_ROULEMENT);
  });
});

describe("le cas : le fournisseur raccourcit ses délais", () => {
  const r = fournisseurPresse(NOVA);
  it("la moitié des 81 000 € de dettes fournisseurs passe dans le besoin", () => {
    expect(r.enMoins).toBe(40_500);
    expect(r.bfrApres).toBe(c(BFR + 40_500));
    expect(r.tnApres).toBe(c(FR - (BFR + 40_500)));
    expect(r.frFaux).toBe(c(FR - 40_500));
  });
  it("les textes sont propres, une seule bonne réponse", () => {
    gardesDeTexte(LE_FOURNISSEUR_RACCOURCIT_SES_DELAIS);
  });
});
