import { describe, expect, it } from "vitest";
import { CONTROLER_LES_COMPTES, SOLUTION_DU_RAPPROCHEMENT, controleDesComptes, rapprochementDuLaboratoire } from "../../src/config/cours/chapitres/controler-les-comptes";
import { LE_RELEVE_DU_FOURNISSEUR, releveDuFournisseur } from "../../src/config/cours/situations/par-chapitre/le-releve-du-fournisseur";
import { bilanDuLycee, exerciceDe } from "../../src/config/cours/monde/comptes-du-lycee";
import { BALANCE_AVANT_INVENTAIRE } from "../../src/config/cours/monde/exercice-de-nova";
import { deMois } from "../../src/config/cours/monde/systeme-d-information-comptable";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, etape, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte } from "./gardes-du-lycee";

/**
 * CONTRÔLER LES COMPTES, SUR LE 31 DÉCEMBRE DU PREMIER EXERCICE DE NOVA DU MONDE DU COURS, ET SON
 * CAS : LE RELEVÉ DU FOURNISSEUR.
 *
 * Refait à la main : les factures de CampusTech à 22 656 € ; le compte bancaire de la fiche,
 * 115 734,87 € ; le loyer de 19 700 € et le virement de CampusTech, que le comptable n'a pas encore
 * saisis ; les 60 enceintes payées par carte le 31 décembre, 60 × 59 € × 1,2 ; les factures
 * d'Électro-Composants d'octobre (2 470 jeux), de novembre (2 070) et de décembre (1 500), à 22 €.
 */

const ch = chapitreDuCas(CONTROLER_LES_COMPTES, NOVA);
const c = (x: number) => Math.round(x * 100) / 100 + 0;
const FACTURE = c(320 * 59 * 1.2);
const BANQUE = 115_734.87;
const CARTES = c(60 * 59 * 1.2);

describe("le lettrage du compte de CampusTech", () => {
  const k = controleDesComptes(NOVA);

  it("avant le rapprochement : les factures de juillet et d'août lettrées, quatre factures dues", () => {
    const tri = etape(ch, "lettrer", "tri").elements(NOVA);
    expect(tri.map((x) => x.categorie)).toEqual(["lettree", "lettree", "lettree", "lettree", "non-lettree", "non-lettree", "non-lettree", "non-lettree"]);
    expect(etape(ch, "ce-que-doit-le-client", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([4 * FACTURE]);
    expect(k.moisDeLaFactureReglee).toBe("septembre");
    expect(k.echeanceDeLaFacture).toEqual({ jour: 20, mois: 11 });
  });

  it("après : trois factures dues, ce que la fiche porte pour CampusTech au 31 décembre", () => {
    expect(etape(ch, "le-compte-du-client-lettre", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([3 * FACTURE]);
    const f = exerciceDe("nova");
    expect(k.lettrageApres.resteDu).toBe(c(f.creances.filter((x) => x.client === "CampusTech").reduce((t, x) => t + x.ttc, 0)));
  });

  it("le mois s'élide : d'août, d'octobre, de juillet", () => {
    expect([deMois(8), deMois(10), deMois(7)]).toEqual(["d'août", "d'octobre", "de juillet"]);
  });
});

describe("le rapprochement bancaire du 31 décembre", () => {
  const k = controleDesComptes(NOVA);
  const r = k.r;

  it("les deux soldes de départ, et les deux soldes rapprochés : la banque de la fiche, au centime", () => {
    expect(r.compteAvant).toBe(c(BANQUE - FACTURE + 19_700));
    expect(r.releve).toBe(c(BANQUE - CARTES));
    expect([r.compteRapproche, r.releveRapproche]).toEqual([BANQUE, BANQUE]);
    expect(BALANCE_AVANT_INVENTAIRE.find((l) => l.compte === "512")!.debit).toBe(BANQUE);
    expect(bilanDuLycee(exerciceDe("nova")).poste("banque")).toBe(BANQUE);
  });

  it("le pointage : deux opérations des deux côtés, deux sur le relevé seul, une au compte seul", () => {
    const tri = etape(ch, "pointer", "tri").elements(NOVA);
    expect(tri.map((x) => [x.categorie, x.montant])).toEqual([
      ["deux", c(2_070 * 22 * 1.2)],
      ["releve", 19_700],
      ["releve", FACTURE],
      ["deux", c(4_050 + 750 + 121.27)],
      ["compte", CARTES],
    ]);
  });

  it("l'état de rapprochement est cohérent, et ses deux soldes rapprochés s'égalent", () => {
    const g = etape(ch, "l-etat-de-rapprochement", "a-completer").grille(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(g.lignes.at(-1)!.cellules.map((x) => x.valeur)).toEqual([BANQUE, BANQUE]);
  });

  it("les deux écritures sont équilibrées, et passent par la banque", () => {
    for (const id of ["le-virement-du-client", "le-prelevement-du-loyer"]) {
      const e = etape(ch, id, "ecriture").ecriture(NOVA);
      const cote = (s: "debit" | "credit") => c(e.lignes.filter((l) => l.sens === s).reduce((t, l) => t + l.montant, 0));
      expect(cote("debit"), id).toBe(cote("credit"));
      expect(e.lignes.some((l) => l.compte === "512"), id).toBe(true);
    }
  });

  it("le curseur : le plus gros virement du 31 décembre est ce que porte le relevé, pas le compte", () => {
    gardeDuCurseur(ch, "le-plus-gros-virement", Math.floor(BANQUE - CARTES));
    expect(k.virementPossible).toBe(111_486);
  });

  it("le laboratoire : une seule combinaison annule l'écart, la facture du fournisseur n'y entre pas", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-du-rapprochement");
    const nulles: string[] = [];
    for (let i = 0; i < 16; i++) {
      const p = { loyer: i & 1, campustech: (i >> 1) & 1, cartes: (i >> 2) & 1, facture: (i >> 3) & 1 };
      if (rapprochementDuLaboratoire(k, p).ecart === 0) nulles.push(JSON.stringify(p));
    }
    expect(nulles).toEqual([JSON.stringify(SOLUTION_DU_RAPPROCHEMENT)]);
    expect(rapprochementDuLaboratoire(k, { loyer: 0, campustech: 0, cartes: 0, facture: 0 }).ecart).toBe(c(r.compteAvant - r.releve));
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(CONTROLER_LES_COMPTES);
    for (const e of ch.etapes) {
      if (e.type !== "choix") continue;
      const o = e.options(NOVA, VIDE);
      expect(o.find((x) => x.juste)!.texte.length, e.id).toBeLessThan(Math.max(...o.filter((x) => !x.juste).map((x) => x.texte.length)));
    }
  });
});

describe("le cas : le relevé du fournisseur", () => {
  const r = releveDuFournisseur(NOVA);
  it("le relevé au 30 novembre réclame la facture de novembre, déjà payée le 1er décembre ; NOVA doit celle de décembre", () => {
    expect(r.lignes.map((l) => l.montant)).toEqual([c(2_470 * 22 * 1.2), c(2_470 * 22 * 1.2), c(2_070 * 22 * 1.2), c(2_070 * 22 * 1.2), c(1_500 * 22 * 1.2)]);
    expect(r.releve).toBe(54_648);
    expect(r.du).toBe(39_600);
    expect(r.ecart).toBe(15_048);
    expect(r.rapproche).toBe(r.du);
    expect(BALANCE_AVANT_INVENTAIRE.find((l) => l.compte === "401")!.credit).toBe(r.du);
  });
  it("les textes sont propres, une seule bonne réponse", () => {
    gardesDeTexte(LE_RELEVE_DU_FOURNISSEUR);
  });
});
