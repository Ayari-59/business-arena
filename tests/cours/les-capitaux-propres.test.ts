import { describe, expect, it } from "vitest";
import {
  DEPART_DES_AUGMENTATIONS,
  LES_CAPITAUX_PROPRES,
  defiDesAugmentations,
  grilleDAffectation,
  solutionDesAugmentations,
} from "../../src/config/cours/chapitres/les-capitaux-propres";
import { DIVIDENDE_DEMANDE_PAR_ACTION, RESERVES_FACULTATIVES_PROPOSEES, affecter, beneficeAAffecter } from "../../src/config/cours/monde/affectation-du-resultat";
import { FACONS_D_AUGMENTER, affectationDeNova, augmentation, augmentationDuLaboratoire, constitution, perteDePixel } from "../../src/config/cours/monde/capitaux-propres";
import { AUGMENTATION_DE_CAPITAL } from "../../src/config/cours/monde/comptabilite-approfondie";
import { CLOTURE_DE_LA_FICHE, EXERCICE_DE_NOVA } from "../../src/config/cours/monde/exercice-de-nova";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { UN_DIVIDENDE_PLUS_GROS, dividendePlusGros } from "../../src/config/cours/situations/par-chapitre/un-dividende-plus-gros";
import { THEMES } from "../../src/config/cours/themes";
import type { EtapeEcriture } from "../../src/config/cours/types";
import { corriger } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * LES CAPITAUX PROPRES DE NOVA, refaits à la main : 150 000 € de capital en 15 000 actions de 10 € ;
 * le bénéfice de N, 79 225,96 €, affecté selon la version unique du cours (le bac STMG) : 5 % en
 * réserve légale (3 961,30 €), 2 € par action (30 000 €, dont 7 500 € d'intérêt statutaire à 5 % du
 * capital), 45 000 € de réserves facultatives, 264,66 € de report à nouveau ; l'augmentation du
 * 30 juin N + 1 (5 000 actions à 12 €). PIXEL & CO : 78 000 € de capital, 27 000 € de bénéfice de
 * N − 1 en réserves, 64 400 € de perte comptable, 9 000 € de créance de report en arrière.
 */

const ch = LES_CAPITAUX_PROPRES;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
const espaces = (t: string) => t.replace(/[\u00a0\u202f]/g, " ");

/** Les lignes attendues d'une écriture, saisies telles quelles : le correcteur doit les accepter. */
function ecritureJuste(id: string) {
  const e = etape(chapitreDuCas(ch, NOVA), id, "ecriture") as EtapeEcriture;
  const a = e.ecriture(NOVA);
  const saisie = a.lignes.map((l) => ({ compte: l.compte, debit: l.sens === "debit" ? String(l.montant).replace(".", ",") : "", credit: l.sens === "credit" ? String(l.montant).replace(".", ",") : "" }));
  expect(corriger(saisie, a).juste, id).toBe(true);
  for (const l of a.lignes) expect(compteDuPlan(l.compte), `${id} : ${l.compte}`).toBeTruthy();
  return a.lignes.map((l) => [l.compte, l.sens, l.montant]);
}

describe("les capitaux propres : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
  }, 60_000);

  it("est au registre, au programme de la comptabilité générale (palier 4), au thème, et cite le BTS CG P2", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.palier).toBe(4);
    expect(ch.blocs).toEqual(["BTS CG P2 · Contrôle et production de l'information financière"]);
    expect(THEMES.find((t) => t.code === "comptabilite")!.chapitres).toContain(ch.code);
    for (const code of [...ch.prerequis!, ...ch.ensuite!]) expect(CHAPITRES.some((x) => x.code === code), code).toBe(true);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    for (const i of ch.objectifs.keys()) expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true);
  });

  it("n'enseigne ni le droit de souscription ni le droit d'attribution, exclus du BTS", () => {
    const textes = JSON.stringify(chapitreDuCas(ch, NOVA).etapes.map((e) => e.id));
    expect(textes).not.toMatch(/droit/);
    const x = augmentation();
    expect(Object.keys(x)).not.toContain("droit");
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const s of [ch, UN_DIVIDENDE_PLUS_GROS]) {
      for (const e of chapitreDuCas(s, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });
});

describe("la constitution, refaite à la main", () => {
  it("15 000 actions de 10 € ; à moitié libérée : 75 000 € appelés et versés, 75 000 € non appelés", () => {
    const k = constitution();
    expect(k.capital).toBe(EXERCICE_DE_NOVA.apport.montant);
    expect(k.capital).toBe(15_000 * 10);
    expect(attendus(ch, "la-liberation-partielle")).toEqual([150_000, 75_000, 75_000]);
  });

  it("les écritures : 4561 contre 1013 ; puis 109 et 4562 contre 1011 et 1012", () => {
    expect(ecritureJuste("la-souscription-de-nova")).toEqual([["4561", "debit", 150_000], ["1013", "credit", 150_000]]);
    expect(ecritureJuste("la-souscription-partielle")).toEqual([["109", "debit", 75_000], ["4562", "debit", 75_000], ["1011", "credit", 75_000], ["1012", "credit", 75_000]]);
  });

  it("les frais de constitution, montant donné : 1 700 € de charges, 300 € de TVA, 340 € par an s'ils sont amortis sur 5 ans", () => {
    const f = constitution().frais;
    expect([f.charges, f.tva, f.paye, f.amortissementAnnuel]).toEqual([1_700, 300, 2_000, 340]);
    expect(juste(ch, "les-frais-de-constitution").map(espaces)).toEqual(["En charges de N, 1 700 € : c'est la règle"]);
  });
});

describe("l'affectation du bénéfice de N : la version unique du cours", () => {
  it("le bénéfice est celui de la clôture figée, et l'affectation celle du bac STMG (D2)", () => {
    const x = affectationDeNova();
    const stmg = affecter(beneficeAAffecter(EXERCICE_DE_NOVA), { dividendeParAction: DIVIDENDE_DEMANDE_PAR_ACTION, reservesFacultatives: RESERVES_FACULTATIVES_PROPOSEES });
    expect(x.benefice).toBe(CLOTURE_DE_LA_FICHE.resultatNet);
    expect(x.dividendes).toBe(stmg.dividendes);
    expect(x.reportANouveau).toBe(stmg.reportANouveau);
    expect(x.capitauxPropresApres).toBe(stmg.capitauxPropres);
  });

  it("réserve légale 3 961,30 €, distribuable 75 264,66 €, intérêt statutaire 7 500 €, superdividende 22 500 €, report 264,66 €", () => {
    expect(attendus(ch, "le-projet-d-affectation")).toEqual([3_961.3, 75_264.66, 7_500, 22_500, 264.66]);
    expect(c(3_961.3 + 45_000 + 30_000 + 264.66)).toBe(79_225.96);
  });

  it("le tableau d'affectation tient ses totaux ; l'écriture solde le 120 vers 1061, 1068, 457 et 110 ; le paiement vide le 457", () => {
    expect(incoherencesDuTableau(grilleDAffectation())).toEqual([]);
    expect(ecritureJuste("l-ecriture-d-affectation")).toEqual([
      ["120", "debit", 79_225.96],
      ["1061", "credit", 3_961.3],
      ["1068", "credit", 45_000],
      ["457", "credit", 30_000],
      ["110", "credit", 264.66],
    ]);
    expect(ecritureJuste("la-mise-en-paiement")).toEqual([["457", "debit", 30_000], ["512", "credit", 30_000]]);
  });

  it("le bilan après répartition : 48 961,30 € de réserves, 199 225,96 € de capitaux propres, 30 000 € de dettes envers les associés", () => {
    expect(attendus(ch, "le-bilan-apres-repartition")).toEqual([48_961.3, 199_225.96, 30_000]);
  });
});

describe("la perte de PIXEL & CO", () => {
  it("78 000 € de capital, 1 350 € et 25 650 € de réserves, 55 400 € de perte nette : 49 600 € de capitaux propres, au-dessus de 39 000 €", () => {
    const p = perteDePixel();
    expect([p.capital, p.reserveLegale, p.autresReserves, p.perteComptable, p.creance, p.perte]).toEqual([78_000, 1_350, 25_650, 64_400, 9_000, 55_400]);
    expect([p.capitauxPropres, p.seuil, p.sousLaMoitie]).toEqual([49_600, 39_000, false]);
    expect(juste(ch, "predire-la-perte")).toEqual(["Non, ils restent au-dessus"]);
  });

  it("le curseur s'arrête à 66 000 € de perte ; l'écriture passe 119 contre 129", () => {
    gardeDuCurseur(ch, "la-perte-au-curseur", 66_000);
    expect(ecritureJuste("l-affectation-de-la-perte")).toEqual([["119", "debit", 55_400], ["129", "credit", 55_400]]);
  });

  it("l'assemblée suivante : 30 000 € moins 750 € d'impôt font 29 250 € ; 26 150 € de report débiteur restent, rien à doter ni à distribuer", () => {
    const p = perteDePixel();
    expect([p.impotSuivant, p.beneficeSuivant]).toEqual([750, 29_250]);
    expect(attendus(ch, "le-report-qui-attend")).toEqual([26_150, 0, 0]);
  });
});

describe("l'augmentation de capital et ses variantes", () => {
  it("celle du DCG, sans droit : 5 000 actions à 12 €, 50 000 € de capital, 10 000 € de prime ; le capital passe à 200 000 €", () => {
    const a = augmentation();
    expect(a.nouvelles).toBe(15_000 / AUGMENTATION_DE_CAPITAL.parite);
    expect([a.fonds, a.capital, a.prime, a.capitalApres, a.capitauxPropresApres]).toEqual([60_000, 50_000, 10_000, 200_000, c(199_225.96 + 60_000)]);
    expect(ecritureJuste("l-augmentation-en-numeraire")).toEqual([["512", "debit", 60_000], ["1013", "credit", 50_000], ["1041", "credit", 10_000]]);
  });

  it("les frais sur la prime : 2 000 € et 400 € de TVA ; l'incorporation de 45 000 € de réserves au nominal de 13 €", () => {
    expect(ecritureJuste("les-frais-d-augmentation")).toEqual([["1041", "debit", 2_000], ["44566", "debit", 400], ["512", "credit", 2_400]]);
    expect(ecritureJuste("l-incorporation-de-reserves")).toEqual([["1068", "debit", 45_000], ["1013", "credit", 45_000]]);
    expect(augmentation().incorporation.reservesRestantes).toBe(0);
  });

  it("le laboratoire : seul le numéraire à 5 000 actions porte le capital à 200 000 € avec de l'argent ; l'incorporation ne change pas les capitaux propres", () => {
    expect(solutionDesAugmentations()).toEqual([{ facon: FACONS_D_AUGMENTER.numeraire, actions: 5_000 }]);
    expect(defiDesAugmentations(DEPART_DES_AUGMENTATIONS.facon, DEPART_DES_AUGMENTATIONS.actions)).toBe(false);
    expect(augmentationDuLaboratoire(FACONS_D_AUGMENTER.incorporation, 4_000).capitauxPropres).toBe(199_225.96);
    expect(augmentationDuLaboratoire(FACONS_D_AUGMENTER.incorporation, 5_000).possible).toBe(false);
    expect(augmentationDuLaboratoire(FACONS_D_AUGMENTER.nature, 5_000).tresorerie).toBe(0);
    gardeDuLaboratoire(ch, "le-laboratoire-des-augmentations");
  });
});

describe("le cas dédié : un dividende plus gros", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(UN_DIVIDENDE_PLUS_GROS);
    gardeDuCas(UN_DIVIDENDE_PLUS_GROS, ch);
  });

  it("2,50 € par action : 37 500 €, dont 30 000 € de superdividende ; il manque 7 235,34 € ; les réserves facultatives tombent à 37 764,66 €", () => {
    const n = dividendePlusGros();
    const montants = (id: string) => etape(chapitreDuCas(UN_DIVIDENDE_PLUS_GROS, NOVA), id, "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(montants("le-dividende-propose")).toEqual([37_500, 7_500, 2]);
    expect(montants("ce-qui-manque")).toEqual([75_264.66, 7_235.34, 37_764.66]);
    expect(n.corrige.reportANouveau).toBe(0);
    const e = etape(UN_DIVIDENDE_PLUS_GROS, "l-affectation-corrigee", "ecriture") as EtapeEcriture;
    const a = e.ecriture(NOVA);
    expect(a.lignes.map((l) => [l.compte, l.montant])).toEqual([["120", 79_225.96], ["1061", 3_961.3], ["1068", 37_764.66], ["457", 37_500]]);
    const saisie = a.lignes.map((l) => ({ compte: l.compte, debit: l.sens === "debit" ? String(l.montant) : "", credit: l.sens === "credit" ? String(l.montant) : "" }));
    expect(corriger(saisie, a).juste).toBe(true);
    const r = etape(UN_DIVIDENDE_PLUS_GROS, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => espaces(o.texte))).toEqual(["Impossible telle quelle : il manque 7 235,34 €"]);
  });
});
