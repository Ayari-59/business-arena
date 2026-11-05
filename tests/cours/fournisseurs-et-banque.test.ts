import { describe, expect, it } from "vitest";
import { FOURNISSEURS_ET_BANQUE, fournisseursEtBanque } from "../../src/config/cours/chapitres/fournisseurs-et-banque";
import { bilanDeLaBoutique, compteDeResultat } from "../../src/config/cours/monde/comptes-de-la-boutique";
import { echelleDInterets } from "../../src/config/cours/monde/fournisseurs-et-banque-de-la-boutique";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LE_CHEQUE_QUI_N_EST_PAS_PASSE } from "../../src/config/cours/situations/par-chapitre/le-cheque-qui-n-est-pas-passe";
import { THEMES } from "../../src/config/cours/themes";
import type { Chapitre } from "../../src/config/cours/types";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { BOUTIQUE, VIDE, attendus, etape, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-la-boutique";

/**
 * FOURNISSEURS ET BANQUE (MAILLE & CO, janvier et février N) : chaque chiffre refait à la main, à partir
 * de la fiche (les livraisons de janvier du façonnier de référence et leurs coûts d'achat, les délais des
 * façonniers, la paie de l'équipe, l'entretien), des comptes de la boutique (les achats de N − 1, la dette
 * fournisseurs du 31 décembre, la TVA de décembre, le découvert à 7,5 %) et des hypothèses du chapitre.
 */

const ch = FOURNISSEURS_ET_BANQUE;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
const lignesDe = (x: Chapitre, id: string) => etape(chapitreDuCas(x, BOUTIQUE), id, "ecriture").ecriture(BOUTIQUE).lignes.map((l) => [l.compte, l.sens, l.montant]);
const grille = (id: string) => etape(chapitreDuCas(ch, BOUTIQUE), id, "a-completer").grille(BOUTIQUE);

function gardeDesEcritures(x: Chapitre) {
  let n = 0;
  for (const e of chapitreDuCas(x, BOUTIQUE).etapes) {
    if (e.type !== "ecriture") continue;
    n++;
    const a = e.ecriture(BOUTIQUE);
    expect(equilibree(enEcriture(a)), e.id).toBe(true);
    for (const l of a.lignes) {
      expect(compteDuPlan(l.compte), `${e.id} ${l.compte}`).toBeDefined();
      expect(l.montant, `${e.id} ${l.compte}`).toBeGreaterThan(0);
    }
    expect(corriger(enSaisie(a), a), e.id).toEqual({ juste: true, remarques: [], notes: [] });
  }
  return n;
}

describe("fournisseurs et banque : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, chez MAILLE & CO, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme de la comptabilité générale (palier 4), au thème, et cite le BTS CG P1", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!, () => "bts-cg", /^BTS CG /);
    expect(ch.blocs).toEqual(["BTS CG P1 · Contrôle et traitement comptable des opérations commerciales"]);
    expect([ch.parcours, ch.palier]).toEqual(["comptabilite-generale", 4]);
    expect(THEMES.find((t) => t.code === "comptabilite")!.chapitres).toContain(ch.code);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    ch.objectifs.forEach((_, i) => expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true));
  });

  it("« Le compte client » y mène, par « Et ensuite »", () => {
    expect(suitesDuChapitre("le-compte-client").ensuite).toEqual([{ code: ch.code, titre: ch.titre }]);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const x of [ch, LE_CHEQUE_QUI_N_EST_PAS_PASSE]) {
      for (const e of chapitreDuCas(x, BOUTIQUE).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(BOUTIQUE, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });

  it("chaque écriture est équilibrée, au plan du cours, et passe son correcteur ; chaque tableau tombe juste", () => {
    expect(gardeDesEcritures(ch)).toBe(5);
    expect(gardeDesEcritures(LE_CHEQUE_QUI_N_EST_PAS_PASSE)).toBe(2);
    for (const id of ["l-echeancier", "l-echelle-d-interets", "l-etat-de-rapprochement"]) expect(incoherencesDuTableau(grille(id)), id).toEqual([]);
  });
});

describe("le façonnier, refait à la main", () => {
  it("le délai moyen : 48 000 € ÷ (638 394 € × 1,2) × 360 = 22,56 jours, contre 45 jours convenus", () => {
    expect(compteDeResultat(f, "N-1").achats).toBe(638_394);
    expect(bilanDeLaBoutique(f).dettesFournisseurs).toBe(48_000);
    expect(attendus(ch, "le-delai-moyen")).toEqual([c(638_394 * 1.2), Math.round((48_000 / (638_394 * 1.2)) * 360 * 100) / 100]);
    expect(attendus(ch, "le-delai-moyen")[1]).toBe(22.56);
    expect(juste(ch, "critique-du-delai")).toEqual(["Les achats de fin d'année sont plus faibles que la moyenne"]);
  });

  it("les factures de janvier sont les livraisons de la fiche : 200 écharpes à 14 €, 500 cols ronds à 25 €, 240 cardigans à 34 €, 60 mérinos à 56 €", () => {
    const x = fournisseursEtBanque(BOUTIQUE);
    const livraisons = f.gamme.flatMap((r) => r.livraisons.map((l) => c(l.quantite * r.coutDAchat * 1.2)));
    expect(x.pointage.lignes.filter((l) => l.ou === "deux").map((l) => l.montant).sort()).toEqual(livraisons.sort());
    expect(x.pointage.lignes.filter((l) => l.ou === "deux").map((l) => l.montant)).toEqual([3_360, 15_000, 9_792, 4_032]);
  });

  it("le pointage : 41 976 € au compte 401, 31 982,40 € au relevé, 9 993,60 € d'écart = 9 792 € + 201,60 €", () => {
    expect(attendus(ch, "l-ecart-du-pointage")).toEqual([c(3_360 + 15_000 + 2 * 9_792 + 4_032), c(3_360 + 15_000 + 9_792 + 4_032 - 201.6), c(9_792 + 201.6)]);
    expect(lignesDe(ch, "annuler-la-facture-en-double")).toEqual([["401", "debit", 9_792], ["607", "credit", 8_160], ["44566", "credit", 1_632]]);
    expect(c(3_360 * 0.05)).toBe(168);
    expect(lignesDe(ch, "l-avoir-non-recu")).toEqual([["401", "debit", 201.6], ["6097", "credit", 168], ["44566", "credit", 33.6]]);
  });

  it("l'échéancier : février 28 152 € (22, 24 et 26 février), mars 5 221,20 € (le mérinos moins l'avoir, et 100 bonnets à 9,50 € × 1,22)", () => {
    const e = fournisseursEtBanque(BOUTIQUE).echeancier;
    expect(e.fevrier).toBe(c(3_360 + 15_000 + 9_792));
    expect(c(100 * 9.5 * 1.22 * 1.2)).toBe(1_390.8);
    expect(e.mars).toBe(c(4_032 - 201.6 + 1_390.8));
    expect(juste(ch, "l-ordre-des-reglements")).toEqual(["Un virement à chaque échéance de février"]);
  });
});

describe("la banque, refaite à la main", () => {
  it("l'échelle d'intérêts : −12 000 € pendant 3 jours, −1 478 € pendant 2 jours, 38 956 nombres, 8,12 € d'intérêts à 7,5 %", () => {
    const net = c((2_700 + 2_150 + 2_000 + 1_300 + 1_300 + 650) * 0.78);
    expect(net).toBe(7_878);
    const e = echelleDInterets(f);
    expect(e.periodes.map((p) => [p.solde, p.jours])).toEqual([[6_000, 1], [6_000 - 18_000, 3], [6_000 - 18_000 + 18_400, 4], [6_400 - 7_878, 2], [6_400 - 7_878 + 18_400, 1]]);
    expect(e.nombres).toBe(12_000 * 3 + 1_478 * 2);
    expect(attendus(ch, "les-agios")).toEqual([c((38_956 * 0.075) / 360), 3, c(8.12 + 15 + 3)]);
  });

  it("le laboratoire : 12 000 € le 21 janvier, la seule position qui ne laisse aucun jour débiteur au plus tard et au plus juste", () => {
    const e = gardeDuLaboratoire(ch, "le-laboratoire-du-decouvert");
    expect(e.defi(BOUTIQUE).solution).toEqual({ montant: 12_000, jour: 21 });
    expect(echelleDInterets(f, { montant: 11_000, jour: 21 }).joursDebiteurs).toBeGreaterThan(0);
    expect(echelleDInterets(f, { montant: 12_000, jour: 22 }).joursDebiteurs).toBe(1);
    expect(juste(ch, "predire-le-virement")).toEqual(["Ce montant, le jour du premier débit"]);
  });

  it("le rapprochement : 15 809 € au compte, 21 695,88 € au relevé, 20 591,88 € rectifiés des deux côtés", () => {
    const r = fournisseursEtBanque(BOUTIQUE).r;
    expect(r.compte).toBe(c(6_000 - 18_000 + 18_400 - 1_104 - 7_887 + 18_400));
    expect(r.releve).toBe(c(6_000 - 18_000 + 18_400 - 7_878 + 18_400 + 4_800 - 26.12));
    expect([r.compteRectifie, r.releveRectifie]).toEqual([20_591.88, 20_591.88]);
    expect(lignesDe(ch, "le-virement-du-comite")).toEqual([["512", "debit", 4_800], ["411", "credit", 4_800]]);
    expect(lignesDe(ch, "les-frais-de-l-arrete")).toEqual([["6616", "debit", 8.12], ["627", "debit", 15], ["44566", "debit", 3], ["512", "credit", 26.12]]);
    expect(lignesDe(ch, "l-erreur-de-saisie")).toEqual([["512", "debit", 9], ["421", "credit", 9]]);
  });
});

describe("le cas dédié : le chèque qui n'est pas passé", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LE_CHEQUE_QUI_N_EST_PAS_PASSE);
    gardeDuCas(LE_CHEQUE_QUI_N_EST_PAS_PASSE, ch);
  });

  it("21 400 € au compte, 20 686 € au relevé, 19 582 € rectifiés ; la publicité 1 500 € HT et la tenue de compte au journal", () => {
    const m = etape(chapitreDuCas(LE_CHEQUE_QUI_N_EST_PAS_PASSE, BOUTIQUE), "le-rapprochement", "montants").champs(BOUTIQUE, VIDE).map((x) => x.attendu);
    expect(c(21_400 + 1_104 - 1_800 - 18)).toBe(20_686);
    expect(m).toEqual([c(21_400 - 1_800 - 18), c(20_686 - 1_104)]);
    expect(lignesDe(LE_CHEQUE_QUI_N_EST_PAS_PASSE, "la-publicite")).toEqual([["623", "debit", 1_500], ["44566", "debit", 300], ["512", "credit", 1_800]]);
    const r = etape(LE_CHEQUE_QUI_N_EST_PAS_PASSE, "reponse", "choix").options(BOUTIQUE, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte)).toEqual(["Le garder au compte : il passera à sa présentation"]);
  });
});
