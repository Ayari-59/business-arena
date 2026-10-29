import { describe, expect, it } from "vitest";
import { bilanDeLExercice } from "../../src/config/cours/chapitres/bilan-fonctionnel";
import { rentabilite } from "../../src/config/cours/chapitres/rentabilite";
import { soldesDeNova } from "../../src/config/cours/chapitres/soldes-intermediaires";
import { cloture } from "../../src/config/cours/monde/cloture";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE, bilanDuLycee, compteDuLycee, coutVariableDeLEnceinte, enceintesDeLAnnee, exerciceDe } from "../../src/config/cours/monde/comptes-du-lycee";

/**
 * LES COMPTES DE NOVA LUS AU LYCÉE (monde/comptes-du-lycee.ts), la source des six chapitres de
 * gestion et finance du Bac STMG et de leurs cas.
 *
 * Les lignes du compte de résultat et les postes du bilan sont épinglés, et leurs totaux refaits à
 * la main ; ils doivent redonner la clôture du cours au centime (le résultat, les soldes, la
 * trésorerie nette du bilan fonctionnel), sans qu'aucun compte de gestion ne reste hors des lignes.
 * Les variantes sont refaites à la main : un prix, une quantité, une hausse des salaires, des
 * intérêts de plus (l'impôt au barème : 15 % jusqu'à 42 500 €, 25 % au-delà, arrondi à l'euro) ;
 * un délai, un équipement, un dividende, un emprunt.
 */

const f = exerciceDe("nova");
const c = (x: number) => Math.round(x * 100) / 100 + 0;
const impot = (r: number) => (r <= 0 ? 0 : Math.round(c(0.15 * Math.min(r, 42_500) + 0.25 * Math.max(0, r - 42_500))));

const LIGNES = {
  ventes: 1_390_276,
  placement: 3_934.58,
  composants: 520_598,
  emballage: 377_744,
  loyer: 236_400,
  assurance: 1_500,
  personnel: 127_800,
  usure: 9_861.11,
  risques: 16_210,
  interets: 3_681.11,
  escompte: 448.4,
  impot: 20_742,
};

describe("le compte de résultat de NOVA, au lycée", () => {
  const k = compteDuLycee(f);

  it("NOVA seule a un exercice dans le monde du cours", () => {
    expect(ENTREPRISES_DES_COMPTES_DU_LYCEE).toEqual(["nova"]);
    expect(() => exerciceDe("boutique")).toThrow();
  });

  it("chaque ligne est épinglée, et aucun compte de gestion ne reste hors des lignes", () => {
    expect(Object.fromEntries(k.lignes.map((l) => [l.code, l.montant]))).toEqual(LIGNES);
    expect(k.nonRange).toBe(0);
  });

  it("les totaux se refont à la main, et redonnent la clôture au centime", () => {
    const L = LIGNES;
    const activite = c(L.composants + L.emballage + L.loyer + L.assurance + L.personnel + L.usure + L.risques);
    expect(activite).toBe(1_290_113.11);
    expect(k.activite).toBe(activite);
    expect(k.produits).toBe(c(L.ventes + L.placement));
    expect(k.financement).toBe(c(L.interets + L.escompte));
    expect(k.resultatDActivite).toBe(c(L.ventes - activite));
    expect(k.resultatDActivite).toBe(100_162.89);
    expect(k.resultatAvantImpot).toBe(99_967.96);
    expect(impot(99_967.96)).toBe(L.impot);
    expect(k.charges).toBe(1_314_984.62);
    expect(k.resultatNet).toBe(79_225.96);
    const x = cloture(f);
    expect(k.resultatNet).toBe(x.resultatNet);
    expect(k.impot).toBe(x.impot.impot);
    expect(k.resultatDActivite).toBe(x.sig.resultatDExploitation);
    expect(k.valeurAjoutee).toBe(x.sig.valeurAjoutee);
    expect(k.valeurAjoutee).toBe(c(L.ventes - L.composants - L.emballage - L.loyer - L.assurance));
    expect(k.caf).toBe(x.caf.additive);
    expect(k.caf).toBe(c(79_225.96 + L.usure + L.risques));
    expect(soldesDeNova({ code: "nova" }).resultatNet).toBe(k.resultatNet);
  });

  it("les enceintes de l'année et leur coût variable viennent de la fiche", () => {
    expect(enceintesDeLAnnee(f)).toBe(23_564);
    expect(23_564 * 59).toBe(LIGNES.ventes);
    expect(coutVariableDeLEnceinte(f)).toBe(22 + 16);
  });

  it("une variante rejoue les ventes, les coûts variables, les salaires, les intérêts et l'impôt", () => {
    // Le même prix et la même quantité, écrits : rien ne bouge.
    expect(compteDuLycee(f, { prix: 59, quantite: 23_564 }).resultatNet).toBe(79_225.96);
    // L'enceinte à 62 € : 3 € de plus sur 23 564 enceintes.
    const p = compteDuLycee(f, { prix: 62 });
    expect(p.ventes).toBe(23_564 * 62);
    expect(p.resultatDActivite).toBe(c(100_162.89 + 3 * 23_564));
    expect(p.impot).toBe(impot(c(99_967.96 + 3 * 23_564)));
    expect(p.impot).toBe(38_415);
    expect(p.resultatNet).toBe(132_244.96);
    // 1 000 enceintes de moins : 59 € de ventes et 38 € de coûts variables en moins chacune.
    const q = compteDuLycee(f, { quantite: 22_564 });
    expect(q.ligne("composants")).toBe(520_598 - 22_000);
    expect(q.ligne("emballage")).toBe(377_744 - 16_000);
    expect(q.resultatDActivite).toBe(c(100_162.89 - 21_000));
    // 20 % de hausse des salaires et 4 000 € d'intérêts de plus.
    const h = compteDuLycee(f, { hausseDesSalaires: 0.2, interetsEnPlus: 4_000 });
    expect(h.personnel).toBe(153_360);
    expect(h.financement).toBe(c(4_129.51 + 4_000));
    expect(h.resultatAvantImpot).toBe(c(99_967.96 - 25_560 - 4_000));
    expect(h.impot).toBe(impot(c(99_967.96 - 25_560 - 4_000)));
  });
});

const POSTES = {
  equipement: 50_138.89,
  stocks: 13_500,
  clients: 104_548,
  autresCreances: 11_400,
  placement: 136_934.58,
  banque: 115_734.87,
  capitauxPropres: 229_225.96,
  provision: 5_000,
  emprunt: 68_000,
  fournisseurs: 81_000,
  etat: 41_119.27,
  autresDettes: 7_911.11,
  decouvert: 0,
};

describe("le bilan de NOVA au 31 décembre, au lycée", () => {
  const b = bilanDuLycee(f);

  it("chaque poste est épinglé, et les totaux se refont à la main", () => {
    const P = POSTES;
    expect(Object.fromEntries(b.postes.map((x) => [x.code, x.montant]))).toEqual(P);
    const actif = c(P.equipement + P.stocks + P.clients + P.autresCreances + P.placement + P.banque);
    const passif = c(P.capitauxPropres + P.provision + P.emprunt + P.fournisseurs + P.etat + P.autresDettes + P.decouvert);
    expect(actif).toBe(432_256.34);
    expect(passif).toBe(actif);
    expect(b.actif).toBe(actif);
    expect(b.passif).toBe(passif);
    expect(b.dettes).toBe(203_030.38);
  });

  it("le fonds de roulement, le besoin et la trésorerie se refont, et sont ceux du bilan fonctionnel du supérieur", () => {
    const P = POSTES;
    expect(b.ressourcesDurables).toBe(c(P.capitauxPropres + 21_071.11 + P.provision + P.emprunt));
    expect(b.equipementBrut).toBe(60_000);
    expect(b.fondsDeRoulement).toBe(263_297.07);
    expect(b.besoinsDuCycle).toBe(c(P.stocks + 115_758 + P.autresCreances));
    expect(b.dettesDuCycle).toBe(c(P.fournisseurs + P.etat + P.autresDettes));
    expect(b.besoin).toBe(10_627.62);
    expect(b.tresorerie).toBe(252_669.45);
    expect(c(b.fondsDeRoulement - b.besoin)).toBe(b.tresorerie);
    expect(b.autonomie).toBeCloseTo(229_225.96 / 432_256.34, 10);
    expect(b.endettement).toBeCloseTo(68_000 / 229_225.96, 10);
  });

  it("le lycée et le supérieur disent les mêmes grandeurs : fonds de roulement, besoin, trésorerie", () => {
    const sup = bilanDeLExercice({ code: "nova" });
    const fo = cloture(f).fonctionnel;
    for (const x of [b, bilanDuLycee(f, { delaiCampusTech: 60 }), bilanDuLycee(f, { delaiFournisseur: 40 })]) {
      expect(x.fondsDeRoulement).toBe(x.fonctionnel.fondsDeRoulement);
      expect(x.besoin).toBe(x.fonctionnel.besoinEnFondsDeRoulement);
      expect(x.tresorerie).toBe(x.fonctionnel.tresorerieNette);
      expect(x.ressourcesDurables).toBe(x.fonctionnel.ressourcesStables.total);
    }
    expect(b.fondsDeRoulement).toBe(sup.fondsDeRoulement);
    expect(b.besoin).toBe(sup.besoin);
    expect(b.tresorerie).toBe(sup.tresorerieNette);
    expect(b.besoin).toBe(fo.besoinEnFondsDeRoulement);
    // Les capitaux investis du lycée sont l'actif économique du supérieur : immobilisations nettes + besoin.
    expect(c(rentabilite({ code: "nova" }).capitauxInvestis)).toBe(c(b.poste("equipement") + sup.besoin));
  });

  it("CampusTech qui paie à l'échéance convenue : une facture TTC de moins chez le client, autant en banque", () => {
    const facture = c(320 * 59 * 1.2);
    expect(facture).toBe(22_656);
    const x = bilanDuLycee(f, { delaiCampusTech: 60 });
    expect(x.poste("clients")).toBe(c(104_548 - facture));
    expect(x.poste("banque")).toBe(c(115_734.87 + facture));
    expect(x.fondsDeRoulement).toBe(b.fondsDeRoulement);
    expect(x.besoin).toBe(c(10_627.62 - facture));
    expect(x.tresorerie).toBe(c(252_669.45 + facture));
  });

  it("un équipement, un dividende, un apport, un emprunt du 31 décembre, et le découvert", () => {
    const x = bilanDuLycee(f, { equipement: 100_000, dividende: 30_000 });
    expect(x.poste("banque")).toBe(0);
    expect(x.decouvert).toBe(c(130_000 - 115_734.87));
    expect(x.capitauxPropres).toBe(c(229_225.96 - 30_000));
    expect(x.actif).toBe(x.passif);
    expect(x.disponible).toBe(136_934.58);
    expect(x.aCourtTerme).toBe(c(130_030.38 + 14_265.13));
    const y = bilanDuLycee(f, { apport: 10_000, emprunt: 20_000 });
    expect(y.poste("banque")).toBe(c(115_734.87 + 30_000));
    expect(y.poste("emprunt")).toBe(88_000);
    expect(y.capitauxPropres).toBe(239_225.96);
    expect(y.actif).toBe(y.passif);
  });
});
