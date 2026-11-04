import { describe, expect, it } from "vitest";
import {
  COMPTES_DU_TRI,
  DEPART_DE_LA_SAUVEGARDE,
  LE_SYSTEME_D_INFORMATION_COMPTABLE,
  SOLUTION_DE_LA_SAUVEGARDE,
  economieDeLaFactureElectronique,
  informationComptable,
  sauvegardeDuLaboratoire,
} from "../../src/config/cours/chapitres/le-systeme-d-information-comptable";
import { LA_BALANCE_QUI_NE_TOMBE_PAS_JUSTE, balanceRecopiee, inverserDeuxChiffres } from "../../src/config/cours/situations/par-chapitre/la-balance-qui-ne-tombe-pas-juste";
import { bilanDuLycee, exerciceDe } from "../../src/config/cours/monde/comptes-du-lycee";
import { BALANCE_AVANT_INVENTAIRE } from "../../src/config/cours/monde/exercice-de-nova";
import { JOURS_DE_SAISIE_DE_L_ANNEE, documentDuCompte, grandLivreDesClients } from "../../src/config/cours/monde/systeme-d-information-comptable";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, etape, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte } from "./gardes-du-lycee";

/**
 * LE SYSTÈME D'INFORMATION COMPTABLE, SUR LE PREMIER EXERCICE DE NOVA DU MONDE DU COURS, ET SON CAS :
 * LA BALANCE QUI NE TOMBE PAS JUSTE.
 *
 * Refait à la main : la facture d'octobre de CampusTech, 320 enceintes à 59 € et 20 % de TVA ; le
 * compte des clients de l'année, 12 factures de CampusTech dont 9 réglées, les deux factures de
 * Sonora dont la première réglée ; la balance avant inventaire de la fiche ; le seuil de la facture
 * électronique, 480 € d'abonnement pour 6 € économisés par facture.
 */

const ch = chapitreDuCas(LE_SYSTEME_D_INFORMATION_COMPTABLE, NOVA);
const c = (x: number) => Math.round(x * 100) / 100 + 0;
const CAMPUSTECH = c(320 * 59 * 1.2);

describe("du document au bilan, chez NOVA", () => {
  const k = informationComptable(NOVA);

  it("la facture d'octobre, et son écriture en partie double", () => {
    expect([k.facture.ht, k.facture.tva, k.facture.ttc]).toEqual([320 * 59, c(320 * 59 * 0.2), CAMPUSTECH]);
    const e = etape(ch, "au-journal", "ecriture").ecriture(NOVA);
    const cote = (s: "debit" | "credit") => c(e.lignes.filter((l) => l.sens === s).reduce((t, l) => t + l.montant, 0));
    expect(cote("debit")).toBe(cote("credit"));
    expect(e.lignes.map((l) => [l.compte, l.sens, l.montant])).toEqual([
      ["411", "debit", 22_656],
      ["701", "credit", 18_880],
      ["44571", "credit", 3_776],
    ]);
  });

  it("le compte des clients au grand livre retombe sur la balance de la fiche, et sur les créances dues", () => {
    const debit = c(12 * CAMPUSTECH + 26_365.92 + 33_630);
    const credit = c(9 * CAMPUSTECH + 26_365.92);
    expect(etape(ch, "au-grand-livre", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([debit, credit, c(debit - credit)]);
    expect(c(debit - credit)).toBe(101_598);
    expect(BALANCE_AVANT_INVENTAIRE.find((l) => l.compte === "411")!.debit).toBe(101_598);
    const f = exerciceDe("nova");
    expect(grandLivreDesClients(f).solde).toBe(c(f.creances.reduce((t, x) => t + x.ttc, 0)));
  });

  it("la balance s'équilibre à 1 661 173,27 €", () => {
    expect(etape(ch, "la-balance", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([1_661_173.27, 1_661_173.27]);
  });

  it("le tri : les classes 1 à 5 au bilan, 6 et 7 au compte de résultat", () => {
    const el = etape(ch, "vers-les-documents-de-synthese", "tri").elements(NOVA);
    expect(el.map((x) => x.libelle.split(" ")[0])).toEqual([...COMPTES_DU_TRI]);
    expect(el.filter((x) => x.categorie === "resultat").map((x) => x.libelle.split(" ")[0])).toEqual(["601", "6132", "641", "6611", "701"]);
    expect(documentDuCompte("4455")).toBe("bilan");
    expect(documentDuCompte("6132")).toBe("resultat");
  });

  it("une seule bonne réponse aux choix, et elle n'est jamais la plus longue", () => {
    for (const e of ch.etapes) {
      if (e.type !== "choix") continue;
      const o = e.options(NOVA, VIDE);
      const juste = o.find((x) => x.juste)!;
      expect(juste.texte.length, e.id).toBeLessThan(Math.max(...o.filter((x) => !x.juste).map((x) => x.texte.length)));
    }
  });

  it("le curseur : 80 factures par an paient l'abonnement (480 € ÷ 6 €), NOVA en échange 27", () => {
    gardeDuCurseur(ch, "a-partir-de-combien", 480 / (9 - 3));
    expect(economieDeLaFactureElectronique(80)).toBe(0);
    expect(economieDeLaFactureElectronique(79)).toBe(-6);
    expect(k.factures).toEqual({ emises: 12 + 2, recues: 12 + 1, total: 27 });
  });

  it("le laboratoire : seule une copie hors de l'entreprise, refaite chaque jour, relève le défi", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-de-la-sauvegarde");
    expect(sauvegardeDuLaboratoire(DEPART_DE_LA_SAUVEGARDE).pertes).toEqual({ panne: 5, incendie: JOURS_DE_SAISIE_DE_L_ANNEE, rancongiciel: JOURS_DE_SAISIE_DE_L_ANNEE });
    expect(sauvegardeDuLaboratoire(SOLUTION_DE_LA_SAUVEGARDE)).toMatchObject({ pire: 1, prixParAn: 360 });
    const defi = etape(ch, "le-laboratoire-de-la-sauvegarde", "simulation").defi(NOVA);
    const reussies: string[] = [];
    for (let frequence = 1; frequence <= 30; frequence++) for (const lieu of [0, 1, 2]) if (defi.atteint({ frequence, lieu })) reussies.push(`${frequence}/${lieu}`);
    expect(reussies).toEqual(["1/2"]);
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(LE_SYSTEME_D_INFORMATION_COMPTABLE);
  });

  it("une seule NOVA : la balance du chapitre est celle de la clôture, la banque celle du bilan", () => {
    expect(k.balance).toBe(BALANCE_AVANT_INVENTAIRE);
    expect(bilanDuLycee(exerciceDe("nova")).poste("banque")).toBe(BALANCE_AVANT_INVENTAIRE.find((l) => l.compte === "512")!.debit);
  });
});

describe("le cas : la balance qui ne tombe pas juste", () => {
  const b = balanceRecopiee(NOVA);
  it("101 598 € recopiés 110 598 € : 9 000 € d'écart, et la ligne 411 est la seule fausse", () => {
    expect(inverserDeuxChiffres(101_598)).toBe(110_598);
    expect(inverserDeuxChiffres(1_234.5)).toBe(1_324.5);
    expect(b.recopie).toBe(110_598);
    expect(b.totauxFaux).toEqual({ debit: c(1_661_173.27 + 9_000), credit: 1_661_173.27, ecart: 9_000 });
    expect(b.clients.solde).toBe(101_598);
    expect(c(b.recopie - b.clients.solde)).toBe(b.ecart);
  });
  it("les textes sont propres, une seule bonne réponse", () => {
    gardesDeTexte(LA_BALANCE_QUI_NE_TOMBE_PAS_JUSTE);
  });
});
