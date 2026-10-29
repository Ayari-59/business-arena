import { describe, expect, it } from "vitest";
import { FINANCER_L_ENTREPRISE, PRIX_DU_DEFI, SOLUTION_DU_FINANCEMENT, financementDuLaboratoire, financer, prixAutofinance } from "../../src/config/cours/chapitres/financer-l-entreprise";
import { L_ANNUITE_DU_PRET, annuiteDuPret } from "../../src/config/cours/situations/par-chapitre/l-annuite-du-pret";
import { LE_RENDEZ_VOUS_A_LA_BANQUE } from "../../src/config/cours/situations/le-rendez-vous-a-la-banque";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, etape, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte } from "./gardes-du-lycee";

/**
 * FINANCER L'ENTREPRISE, SUR LE PREMIER EXERCICE DE NOVA DU MONDE DU COURS, ET SES CAS : L'ANNUITÉ
 * DU PRÊT, LE RENDEZ-VOUS À LA BANQUE.
 *
 * Refait à la main : la capacité d'autofinancement, 79 225,96 € de résultat et 26 071,11 € de
 * dotations ; la deuxième ligne, 4 postes à 15 000 € ; l'emprunt de 68 000 € et les capitaux propres
 * de 229 225,96 € ; le taux de 5 %.
 */

const ch = chapitreDuCas(FINANCER_L_ENTREPRISE, NOVA);
const c = (x: number) => Math.round(x * 100) / 100 + 0;
const CAF = c(79_225.96 + 26_071.11);

describe("financer la deuxième ligne de NOVA", () => {
  const k = financer(NOVA);

  it("la capacité d'autofinancement, les intérêts et l'endettement se refont à la main", () => {
    expect(CAF).toBe(105_297.07);
    expect(k.montant).toBe(4 * 15_000);
    expect(etape(ch, "caf", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([CAF]);
    expect(etape(ch, "emprunt", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([3_000, 0.3, 0.56]);
    // 68 000 ÷ 229 225,96 = 0,297 ; 128 000 ÷ 229 225,96 = 0,558.
  });

  it("l'autofinancement suffit : une seule bonne réponse, partout", () => {
    expect(k.choix).toBe("autofinancement");
    expect(etape(ch, "suffit", "choix").options(NOVA, VIDE).filter((o) => o.juste).map((o) => o.texte)).toEqual(["Oui : sa capacité d'autofinancement couvre le prix"]);
    expect(etape(ch, "choisir", "choix").options(NOVA, VIDE).filter((o) => o.juste).map((o) => o.texte)).toEqual(["Par autofinancement"]);
  });

  it("le curseur : 105 297 €, le prix le plus haut que l'activité paie seule", () => {
    expect(prixAutofinance(k)).toBe(Math.floor(CAF));
    gardeDuCurseur(ch, "jusqu-ou-s-autofinancer", 105_297);
  });

  it("le laboratoire : 150 000 € empruntés tiennent la règle des banques, 170 000 € non", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-du-financement");
    expect(SOLUTION_DU_FINANCEMENT).toEqual({ prix: PRIX_DU_DEFI, source: 1 });
    const x = financementDuLaboratoire(k, SOLUTION_DU_FINANCEMENT);
    expect(x.interets).toBe(7_500);
    expect(x.endettement).toBe(0.95); // 218 000 ÷ 229 225,96
    const defi = etape(ch, "le-laboratoire-du-financement", "simulation").defi(NOVA);
    expect(defi.atteint({ prix: 160_000, source: 1 })).toBe(true); // 228 000 ÷ 229 225,96 = 0,99
    expect(defi.atteint({ prix: 170_000, source: 1 })).toBe(false); // 238 000 ÷ 229 225,96 = 1,04
    expect(defi.atteint({ prix: 150_000, source: 0 })).toBe(false); // l'autofinancement s'arrête à 105 297,07 €
    expect(defi.atteint({ prix: 150_000, source: 2 })).toBe(false); // l'apport est interdit par le défi
    expect(financementDuLaboratoire(k, { prix: 150_000, source: 0 }).manque).toBe(c(150_000 - CAF));
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(FINANCER_L_ENTREPRISE);
  });
});

describe("le cas : l'annuité du prêt", () => {
  const r = annuiteDuPret(NOVA);
  it("12 000 € de capital et 3 000 € d'intérêts la première année, la capacité d'autofinancement les couvre", () => {
    expect(r.capital).toBe(12_000);
    expect(r.annuite).toBe(15_000);
    expect(r.derniere).toBe(600);
    expect(r.resteDeLaCaf).toBe(c(CAF - 15_000));
    expect(r.couvre).toBe(true);
  });
  it("les textes sont propres, une seule bonne réponse", () => {
    gardesDeTexte(L_ANNUITE_DU_PRET);
    gardesDeTexte(LE_RENDEZ_VOUS_A_LA_BANQUE);
  });
});
