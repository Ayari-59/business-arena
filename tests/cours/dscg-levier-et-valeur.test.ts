import { describe, expect, it } from "vitest";
import { anneeJouee, casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import {
  APPORT_QUI_DESENDETTE,
  ENTREPRISES_DU_LEVIER,
  L_EFFET_DE_LEVIER,
  TRIMESTRE_DE_L_APPORT,
  anneeAvecLApport,
  effetDeLevier,
} from "../../src/config/cours/chapitres/l-effet-de-levier";
import {
  BETA_DE_L_ACTIF,
  LA_CREATION_DE_VALEUR,
  PRIME_DE_RISQUE_DU_MARCHE,
  TAUX_SANS_RISQUE,
  anneeAvecLEquipement,
  creationDeValeur,
} from "../../src/config/cours/chapitres/la-creation-de-valeur";
import { TRIMESTRE_DE_L_ACHAT, anneeAvecLaMachine, anneeSansInvestir, machineDuChapitre } from "../../src/config/cours/chapitres/croitre-en-investissant";
import {
  HAUSSE_DU_TAUX_VARIABLE,
  LE_LEVIER_FACE_A_LA_HAUSSE_DU_TAUX,
  anneeAuTauxReleve,
  levierFaceALaHausse,
} from "../../src/config/cours/situations/par-chapitre/le-levier-face-a-la-hausse-du-taux";
import {
  CE_QUE_DOIT_RAPPORTER_L_EXPLOITATION,
  TAUX_EXIGE_PAR_LE_FONDS,
  ceQueDoitRapporterLExploitation,
} from "../../src/config/cours/situations/par-chapitre/ce-que-doit-rapporter-l-exploitation";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { PROGRAMME } from "../../src/config/cours/registre";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { BalanceSheet, CompanyRoundResult } from "../../src/engine/types";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * DSCG FINANCE : L'EFFET DE LEVIER ET LA CRÉATION DE VALEUR, ET LEURS CAS.
 *
 * « L'effet de levier » lit l'année du cours au 31 décembre et la rejoue avec un apport qui
 * rembourse de l'emprunt ; « La création de valeur » y ajoute le coût des capitaux propres et la
 * rejoue avec un équipement de plus ; leurs cas rejouent l'année au taux relevé, ou posent
 * l'exigence d'un fonds. Ces gardes refont les calculs à partir du moteur, par un autre chemin
 * (le bilan brut du dernier trimestre, les intérêts recomposés trimestre par trimestre),
 * vérifient que le moteur fait ce que les textes disent qu'il fait (l'impôt suit le taux, les
 * intérêts courent sur la dette d'ouverture, la caisse ne rapporte rien, la relation du levier
 * tombe juste), que les entreprises retenues sont celles où le calcul a un objet, que les
 * verdicts se lisent dans les chiffres, et que les textes se lisent.
 */

const pres = (a: number, b: number, ecart = 0.02) => expect(Math.abs(a - b), `${a} et ${b}`).toBeLessThanOrEqual(ecart);
const tauxIS = (code: string) => scenarioByCode(code).scenario.finance.taxRate;
const tauxDuPret = (code: string) => scenarioByCode(code).scenario.finance.loanAnnualRate;
const somme = (tours: readonly CompanyRoundResult[], f: (r: CompanyRoundResult) => number) => tours.reduce((t, r) => t + f(r), 0);
const anneeDuCours = (code: string) => anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!);
const exploitation = (r: CompanyRoundResult) => r.incomeStatement.operatingIncome;
const interets = (r: CompanyRoundResult) => r.incomeStatement.interest;
const net = (r: CompanyRoundResult) => r.incomeStatement.netIncome;

/** Le même bilan, relu sans passer par le chapitre : l'actif économique, l'endettement net. */
function relu(b: BalanceSheet) {
  const bfr = b.inventoryValue + b.receivables - b.payables - (b.vatLiability ?? 0);
  return {
    actif: b.fixedAssetsNet + (b.goodwill ?? 0) + bfr,
    bfr,
    dette: b.financialDebt + b.overdraft - b.cash - (b.shortTermInvestment ?? 0),
    cp: b.equity,
  };
}

/** Les rentabilités exactes d'une année du moteur, en pour cent. */
function rentabilitesExactes(code: string, tours: readonly CompanyRoundResult[]) {
  const t = tauxIS(code);
  const b = relu(tours.at(-1)!.balanceSheet);
  const re = (somme(tours, exploitation) * (1 - t) * 100) / b.actif;
  const i = (somme(tours, interets) * (1 - t) * 100) / b.dette;
  const levier = b.dette / b.cp;
  const rcp = (somme(tours, net) * 100) / b.cp;
  return { ...b, re, i, levier, rcp };
}

/** Les intérêts de l'arène, recomposés : la dette due à l'ouverture de chaque trimestre, au taux, sur un quart d'année. */
function interetsRecomposes(code: string, tours: readonly CompanyRoundResult[], taux: number) {
  const ouvertures = [anneeJouee(code).depart.finance.financialDebt, ...tours.slice(0, -1).map((r) => r.balanceSheet.financialDebt)];
  return { ouvertures, interets: ouvertures.map((d) => (d * taux) / 4) };
}

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).colonnes, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.titre, e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    default:
      return [e.titre];
  }
}

const permises = (ch: Chapitre) => ENTREPRISES_DU_COURS.filter((x) => !ch.entreprises || ch.entreprises.codes.includes(x));
const AFFICHENT_LEUR_TABLEAU: readonly Etape["type"][] = ["lecture", "choix", "montants", "tri"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas. */
function textesPropres(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculin = new RegExp(`\\bun ${u}\\b|\\b${u}s? (vendu|fabriqué|produit|servi|jeté|retourné)s?\\b(?!e)`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [AEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])ne [aeiouyéèê]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-ZÉ] [A-ZÉ] [A-ZÉ]\b/);
      // Un négatif prend le signe moins, et retranché, il va entre parenthèses ; jamais « −0 € ».
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\+ −|−0 €|−0 %/);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculin);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
    if (e.tableau) {
      expect(AFFICHENT_LEUR_TABLEAU, `${e.id} (${e.type})`).toContain(e.type);
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) {
        expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
        // L'élève tape au centime : une valeur attendue n'a pas plus de deux décimales.
        expect(Math.round(c.attendu * 100) / 100, `${e.id} : ${c.libelle}`).toBe(c.attendu);
      }
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      for (const o of options) for (const p of options) if (o !== p) expect(p.texte.includes(o.texte), `${e.id} : ${o.texte}`).toBe(false);
    }
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
  expect(new Set(ch.etapes.map((e) => e.id)).size, ch.code).toBe(ch.etapes.length);
}

/** Les valeurs attendues des champs d'une étape de montants, dans l'ordre. */
function attendus(ch: Chapitre, id: string, cas: Cas): number[] {
  const e = ch.etapes.find((x) => x.id === id)!;
  if (e.type !== "montants") throw new Error(`${ch.code} / ${id} n'est pas une étape de montants`);
  return e.champs(cas, { soldes: {} }).map((c) => c.attendu);
}

/** La bonne option d'une étape de choix. */
function juste(ch: Chapitre, id: string, cas: Cas): string {
  const e = ch.etapes.find((x) => x.id === id)!;
  if (e.type !== "choix") throw new Error(`${ch.code} / ${id} n'est pas une étape de choix`);
  return e.options(cas, { soldes: {} }).find((o) => o.juste)!.texte;
}

/** Ce qu'un cas dédié doit tenir, en plus de ses textes (tests/cours/situations.test.ts). */
function casDedie(s: Situation, ch: Chapitre) {
  expect(s.reprend).toEqual([ch.code]);
  expect(s.palier).toBe(ch.palier);
  expect(s.parcours).toBe(ch.parcours);
  expect(s.entreprises?.codes).toEqual(ch.entreprises?.codes);
  expect(s.libre).toBe(false);
  expect(s.blocs).toEqual([]);
  expect(s.code).not.toBe(ch.code);
  expect(s.commanditaire.length).toBeGreaterThan(3);
  expect(s.etapes[0]!.type).toBe("lecture");
  expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
  expect(s.etapes.at(-1)!.type).toBe("choix");
  for (const code of permises(s)) {
    const cas = casDeLEntreprise(code);
    for (const e of s.etapes) {
      if (e.type !== "choix") continue;
      const options = e.options(cas, { soldes: {} });
      expect(options.filter((o) => o.juste), `${s.code} / ${code}`).toHaveLength(1);
      const bonne = options.find((o) => o.juste)!;
      const plusLongue = Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length));
      expect(bonne.texte.length, `${s.code} / ${code} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(plusLongue);
    }
  }
}

/** L'année se joue sans défaillance ni découvert : les sommes et le coût de la dette se lisent tels quels. */
function anneeSaine(tours: readonly CompanyRoundResult[], quoi: string) {
  expect(tours, quoi).toHaveLength(4);
  for (const r of tours) {
    expect(r.defaillant ?? false, quoi).toBe(false);
    expect(r.balanceSheet.overdraft, quoi).toBe(0);
    expect(r.incomeStatement.financialIncome ?? 0, quoi).toBe(0);
    expect((r.incomeStatement.exceptionalIncome ?? 0) + (r.incomeStatement.exceptionalCharge ?? 0) + (r.incomeStatement.rescueSubsidy ?? 0), quoi).toBe(0);
  }
}

describe("les deux chapitres et leur place au programme", () => {
  it("leurs titres sont ceux du programme du DSCG finance, au palier 4, et leur bloc se résout vers l'UE2", () => {
    for (const ch of [L_EFFET_DE_LEVIER, LA_CREATION_DE_VALEUR]) {
      expect(PROGRAMME["dscg-finance"][4]).toContain(ch.titre);
      expect(ch.parcours).toBe("dscg-finance");
      expect(ch.palier).toBe(4);
      expect(ch.libre).toBe(false);
      expect(ch.blocs).toEqual(["DSCG UE2 · Finance"]);
      for (const b of ch.blocs) {
        const r = referentielDeCitation(b);
        expect(r, b).not.toBeNull();
        expect(r!.code).toBe("dscg");
        expect(r!.referentiel.entrees).toContain("UE2 · Finance");
        expect(blocOfficiel(b, r!.code), b).toBe("UE2 · Finance");
      }
    }
  });

  it("le levier se lit là où l'année finit en bénéfice, sans découvert, avec un endettement net positif, et là seulement", () => {
    const retenues = ENTREPRISES_DU_COURS.filter((code) => {
      const tours = anneeDuCours(code);
      return somme(tours, (r) => r.incomeStatement.pretaxIncome) > 0 && tours.every((r) => r.balanceSheet.overdraft === 0) && relu(tours.at(-1)!.balanceSheet).dette > 0;
    });
    expect([...ENTREPRISES_DU_LEVIER]).toEqual(retenues);
    expect(L_EFFET_DE_LEVIER.entreprises!.codes).toEqual(ENTREPRISES_DU_LEVIER);
    expect(LA_CREATION_DE_VALEUR.entreprises!.codes).toEqual(ENTREPRISES_DU_LEVIER);
    // Le « pourquoi » nomme les entreprises retenues, et dit vrai des autres.
    for (const ch of [L_EFFET_DE_LEVIER, LA_CREATION_DE_VALEUR]) {
      for (const code of ENTREPRISES_DU_COURS) expect(ch.entreprises!.pourquoi, code).toContain(casDeLEntreprise(code).entreprise);
    }
    // Toutes les entreprises finissent l'année en bénéfice.
    for (const code of ENTREPRISES_DU_COURS) expect(somme(anneeDuCours(code), net), code).toBeGreaterThan(0);
    // NOVA finit l'année en bénéfice, mais à découvert : un découvert ouvert au dernier trimestre, qui n'a encore porté aucun agio.
    const nova = anneeDuCours("nova");
    expect(somme(nova, net)).toBeGreaterThan(0);
    expect(nova.at(-1)!.balanceSheet.overdraft).toBeGreaterThan(0);
    expect(nova.slice(0, -1).every((r) => r.balanceSheet.overdraft === 0)).toBe(true);
    expect(anneeJouee("nova").depart.finance.overdraft ?? 0).toBe(0);
    for (const code of ["boutique", "bistrot", "conseil", "ecommerce", "batiment", "transport"]) {
      expect(somme(anneeDuCours(code), net), code).toBeGreaterThan(0);
      expect(relu(anneeDuCours(code).at(-1)!.balanceSheet).dette, code).toBeLessThan(0);
    }
  });

  it("les hypothèses du cours sont celles que disent leurs commentaires", () => {
    expect(TAUX_SANS_RISQUE).toBe(0.03);
    expect(PRIME_DE_RISQUE_DU_MARCHE).toBe(0.06);
    expect(BETA_DE_L_ACTIF).toBe(1);
    expect(APPORT_QUI_DESENDETTE).toBe(50_000);
    expect(HAUSSE_DU_TAUX_VARIABLE).toBe(0.03);
    expect(TAUX_EXIGE_PAR_LE_FONDS).toBe(0.15);
    for (const code of ENTREPRISES_DU_LEVIER) {
      const f = scenarioByCode(code).scenario.finance;
      // L'apport tient sous l'enveloppe des associés et sous l'emprunt dû au premier trimestre.
      expect(APPORT_QUI_DESENDETTE).toBeLessThanOrEqual(f.maxCapitalIncreaseTotal!);
      expect(APPORT_QUI_DESENDETTE).toBeLessThan(anneeDuCours(code)[0]!.balanceSheet.financialDebt);
    }
  });
});

describe.each([...ENTREPRISES_DU_LEVIER])("l'effet de levier chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const t = tauxIS(code);
  const taux = tauxDuPret(code);
  const tours = anneeDuCours(code);
  const x = rentabilitesExactes(code, tours);

  it("le moteur fait ce que le chapitre dit : l'impôt suit le taux, les intérêts courent sur la dette d'ouverture", () => {
    anneeSaine(tours, code);
    // Sur une année en bénéfice, le résultat net vaut exactement (RE − charges financières) × (1 − t).
    pres(somme(tours, net), (somme(tours, exploitation) - somme(tours, interets)) * (1 - t), 1e-6);
    const { ouvertures, interets: recomposes } = interetsRecomposes(code, tours, taux);
    tours.forEach((r, k) => pres(r.incomeStatement.interest, recomposes[k]!, 1e-6));
    const l = effetDeLevier(cas);
    // La dette moyenne du texte est la moyenne des dettes d'ouverture, plus que la dette de clôture.
    pres(l.detteMoyenne, ouvertures.reduce((a, b) => a + b, 0) / 4, 0.01);
    expect(l.detteMoyenne).toBeGreaterThan(l.s.emprunts);
    // Et le coût de l'endettement net dépasse le taux du contrat après impôt, comme le texte le dit.
    expect(l.r.exact.i).toBeGreaterThan(taux * (1 - t) * 100);
    expect(l.s.disponibilites).toBeGreaterThan(0);
  });

  it("l'actif économique vaut les capitaux propres plus l'endettement net, et la relation du levier tombe juste", () => {
    pres(x.actif, x.cp + x.dette, 1e-6);
    // Rcp = Re + (Re − i) × D/CP, sur les valeurs exactes.
    pres(x.re + (x.re - x.i) * x.levier, x.rcp, 1e-9);
    const l = effetDeLevier(cas);
    pres(l.r.exact.re, x.re, 1e-6);
    pres(l.r.exact.i, x.i, 1e-6);
    pres(l.r.exact.rcp, x.rcp, 1e-6);
  });

  it("les champs demandent ces chiffres-là", () => {
    const b = tours.at(-1)!.balanceSheet;
    const [bfr, actif, dette] = attendus(L_EFFET_DE_LEVIER, "actif-economique", cas);
    pres(bfr!, x.bfr);
    pres(actif!, x.actif);
    pres(dette!, x.dette);
    pres(actif!, b.equity + dette!, 0.02);
    const [exploitationApresImpot, re] = attendus(L_EFFET_DE_LEVIER, "rentabilite-economique", cas);
    pres(exploitationApresImpot!, somme(tours, exploitation) * (1 - t));
    pres(re!, x.re, 0.005);
    const [chargesApresImpot, i, contrat] = attendus(L_EFFET_DE_LEVIER, "cout-de-la-dette", cas);
    pres(chargesApresImpot!, somme(tours, interets) * (1 - t));
    pres(i!, x.i, 0.005);
    pres(contrat!, taux * (1 - t) * 100, 0.005);
    const [levier, parLaFormule, rcp] = attendus(L_EFFET_DE_LEVIER, "la-relation", cas);
    pres(levier!, x.levier * 100, 0.005);
    pres(rcp!, x.rcp, 0.005);
    // Sur les taux arrondis, la relation tombe à l'arrondi près : dans la tolérance du champ.
    pres(parLaFormule!, re! + ((re! - i!) * levier!) / 100, 0.005);
    pres(parLaFormule!, rcp!, 0.02);
    const [seuil, ecart] = attendus(L_EFFET_DE_LEVIER, "seuil-de-massue", cas);
    // Au seuil, la rentabilité économique égale exactement le coût de l'endettement net.
    pres((seuil! * (1 - t) * 100) / x.actif, x.i, 1e-6);
    pres(ecart!, somme(tours, exploitation) - seuil!);
    expect(ecart! > 0).toBe(x.re > x.i);
  });

  it("levier ou massue : la bonne réponse se lit dans Re et i", () => {
    expect(effetDeLevier(cas).verdict).toBe(x.re > x.i ? "levier" : "massue");
    expect(juste(L_EFFET_DE_LEVIER, "levier-ou-massue", cas)).toMatch(x.re > x.i ? /^Elle l'augmente/ : /^Elle la réduit/);
    // Le levier joue pour les associés quand la Rcp dépasse Re, contre eux sinon.
    expect(x.rcp > x.re).toBe(x.re > x.i);
  });

  it("l'apport qui rembourse : l'exploitation ne bouge pas, la Rcp va vers Re", () => {
    const avec = anneeAvecLApport(code);
    anneeSaine(avec, `${code} avec l'apport`);
    // Le moteur passe l'apport et le remboursement, au premier trimestre, en entier.
    const k = TRIMESTRE_DE_L_APPORT - 1;
    expect(avec[k]!.capital?.applied).toBe(APPORT_QUI_DESENDETTE);
    expect(avec[k]!.debt?.earlyRepayment).toBe(APPORT_QUI_DESENDETTE);
    // Au trimestre de l'apport seulement : le bon gestionnaire, qui part de la décision jouée au tour d'avant, ne le reconduit pas.
    expect(avec.map((r) => r.capital?.applied ?? 0)).toEqual(avec.map((_, j) => (j === k ? APPORT_QUI_DESENDETTE : 0)));
    expect(avec.map((r) => r.debt?.earlyRepayment ?? 0)).toEqual(avec.map((_, j) => (j === k ? APPORT_QUI_DESENDETTE : 0)));
    expect(avec.map(exploitation)).toEqual(tours.map(exploitation));
    const y = rentabilitesExactes(code, avec);
    pres(y.actif, x.actif, 0.02);
    pres(y.re, x.re, 1e-6);
    pres(somme(avec, net), (somme(avec, exploitation) - somme(avec, interets)) * (1 - t), 1e-6);
    pres(y.re + (y.re - y.i) * y.levier, y.rcp, 1e-9);
    const { interets: recomposes } = interetsRecomposes(code, avec, taux);
    avec.forEach((r, j) => pres(r.incomeStatement.interest, recomposes[j]!, 1e-6));
    const [levier, rcp, variation] = attendus(L_EFFET_DE_LEVIER, "apport", cas);
    pres(levier!, y.levier * 100, 0.005);
    pres(rcp!, y.rcp, 0.005);
    pres(variation!, rcp! - attendus(L_EFFET_DE_LEVIER, "la-relation", cas)[2]!, 0.005);
    // Moins de dette : la Rcp baisse quand la dette jouait pour les associés, monte quand elle jouait contre.
    expect(y.rcp < x.rcp).toBe(x.re > x.i);
    expect(y.levier).toBeLessThan(x.levier);
    expect(juste(L_EFFET_DE_LEVIER, "moins-de-dette", cas)).toMatch(x.re > x.i ? /^Elle baisse/ : /^Elle monte/);
    // Le texte dit que le coût de l'endettement net monte : la trésorerie oisive reste.
    expect(y.i).toBeGreaterThan(x.i);
  });

  it("la création de valeur : le CMPC, l'EVA et le résultat résiduel", () => {
    const v = creationDeValeur(cas);
    const betaExact = BETA_DE_L_ACTIF * (1 + ((1 - t) * x.dette) / x.cp);
    const kcpExact = TAUX_SANS_RISQUE + betaExact * PRIME_DE_RISQUE_DU_MARCHE;
    const [beta, kcp] = attendus(LA_CREATION_DE_VALEUR, "cout-des-capitaux-propres", cas);
    pres(beta!, betaExact, 0.005);
    pres(kcp!, (TAUX_SANS_RISQUE + beta! * PRIME_DE_RISQUE_DU_MARCHE) * 100, 0.005);
    pres(kcp!, kcpExact * 100, 0.04);
    // Le texte dit si les associés exigent plus ou moins que le coût de l'endettement net ; moins, c'est la trésorerie oisive qui le renchérit, au-dessus du contrat.
    const explication = (LA_CREATION_DE_VALEUR.etapes.find((e) => e.id === "cout-des-capitaux-propres") as Extract<Etape, { type: "montants" }>).explication(cas, { soldes: {} });
    expect(explication[1]).toMatch(kcpExact * 100 > x.i ? /^C'est plus que/ : /^C'est moins que/);
    if (kcpExact * 100 <= x.i) {
      expect(taux * (1 - t) * 100).toBeLessThan(kcpExact * 100);
      // Sans les disponibilités déduites, les mêmes charges après impôt coûteraient moins que les associés n'exigent.
      const b = tours.at(-1)!.balanceSheet;
      expect((somme(tours, interets) * (1 - t) * 100) / (x.dette + b.cash + (b.shortTermInvestment ?? 0))).toBeLessThan(kcpExact * 100);
    }
    const [poidsCP, poidsD, cmpc] = attendus(LA_CREATION_DE_VALEUR, "cmpc", cas);
    pres(poidsCP!, (x.cp / x.actif) * 100, 0.005);
    pres(poidsD!, (x.dette / x.actif) * 100, 0.005);
    pres(poidsCP! + poidsD!, 100, 0.01);
    const cmpcExact = ((kcpExact * x.cp) / x.actif) * 100 + (x.i * x.dette) / x.actif;
    pres(cmpc!, cmpcExact, 0.03);
    // Le chapitre calcule sur le bilan arrondi au centime : à 1e-6 point près.
    pres(v.k.exact.cmpc, cmpcExact, 1e-6);
    const [ecart, eva] = attendus(LA_CREATION_DE_VALEUR, "eva", cas);
    pres(ecart!, x.re - cmpcExact, 0.04);
    // L'EVA exacte est le résultat résiduel exact : le résultat net moins l'exigence des associés.
    const evaExacte = ((x.re - cmpcExact) / 100) * x.actif;
    pres(evaExacte, somme(tours, net) - kcpExact * x.cp, 1e-6);
    pres(v.k.exact.eva, evaExacte, 0.01);
    pres(eva!, evaExacte, v.k.toleranceEva);
    const [exigence, residuel] = attendus(LA_CREATION_DE_VALEUR, "residuel", cas);
    pres(exigence!, (kcp! / 100) * x.cp, 0.01);
    pres(residuel!, somme(tours, net) - exigence!, 0.01);
    pres(residuel!, eva!, v.k.toleranceEva);
    expect(v.verdict).toBe(evaExacte > 0 ? "cree" : "detruit");
    // Créer de la valeur, c'est rapporter aux associés plus qu'ils n'exigent.
    expect(x.rcp > kcpExact * 100).toBe(evaExacte > 0);
    expect(juste(LA_CREATION_DE_VALEUR, "verdict", cas)).toMatch(evaExacte > 0 ? /^Elle crée/ : /^Elle détruit/);
  });

  it("l'équipement de plus : la même année que « Croître en investissant », et la valeur qu'il crée ou détruit", () => {
    const m = machineDuChapitre(code);
    const avec = anneeAvecLEquipement(code);
    anneeSaine(avec, `${code} avec l'équipement`);
    // L'année rejouée est celle du chapitre de croissance, et l'année sans équipement, celle du cours.
    expect(avec.map(net)).toEqual(anneeAvecLaMachine(code, m, "emprunt").map(net));
    expect(anneeSansInvestir(code).map(net)).toEqual(tours.map(net));
    expect(avec[TRIMESTRE_DE_L_ACHAT - 1]!.debt?.newLoan).toBe(m.costPerUnit);
    // L'achat et son emprunt ne se jouent qu'au trimestre de l'achat.
    expect(avec.map((r) => r.debt?.newLoan ?? 0)).toEqual(avec.map((_, j) => (j === TRIMESTRE_DE_L_ACHAT - 1 ? m.costPerUnit : 0)));
    pres(avec[TRIMESTRE_DE_L_ACHAT]!.balanceSheet.fixedAssetsNet - tours[TRIMESTRE_DE_L_ACHAT]!.balanceSheet.fixedAssetsNet, m.costPerUnit - (m.costPerUnit / m.depreciationRounds) * (TRIMESTRE_DE_L_ACHAT), 0.01);
    const v = creationDeValeur(cas);
    const etapes = chapitreDuCas(LA_CREATION_DE_VALEUR, cas).etapes.map((e) => e.id);
    // L'équipement ne se lit que si l'année qu'il fait jouer finit en bénéfice ; sinon le chapitre ne joue pas ses étapes.
    expect(v.lEquipementSeLit).toBe(somme(avec, (r) => r.incomeStatement.pretaxIncome) > 0);
    expect(etapes.includes("l-equipement")).toBe(v.lEquipementSeLit);
    expect(etapes.includes("l-equipement-cree-t-il")).toBe(v.lEquipementSeLit);
    if (!v.lEquipementSeLit) {
      // Une perte : l'arène ne prélève pas d'impôt, et le résultat net ne suit plus le taux.
      expect(somme(avec, net)).toBeLessThan(0);
      expect(somme(avec, (r) => r.incomeStatement.tax)).toBe(0);
      return;
    }
    pres(somme(avec, net), (somme(avec, exploitation) - somme(avec, interets)) * (1 - t), 1e-6);
    const y = rentabilitesExactes(code, avec);
    expect(y.dette).toBeGreaterThan(0);
    const kcp2 = TAUX_SANS_RISQUE + BETA_DE_L_ACTIF * (1 + ((1 - t) * y.dette) / y.cp) * PRIME_DE_RISQUE_DU_MARCHE;
    const eva2 = somme(avec, net) - kcp2 * y.cp;
    const kcp1 = TAUX_SANS_RISQUE + BETA_DE_L_ACTIF * (1 + ((1 - t) * x.dette) / x.cp) * PRIME_DE_RISQUE_DU_MARCHE;
    const eva1 = somme(tours, net) - kcp1 * x.cp;
    pres(v.k2.exact.eva, eva2, 0.01);
    const [evaAvec, variation] = attendus(LA_CREATION_DE_VALEUR, "l-equipement", cas);
    pres(evaAvec!, eva2, v.k2.toleranceEva);
    pres(variation!, eva2 - eva1, v.k.toleranceEva + v.k2.toleranceEva);
    expect(v.lEquipementCree).toBe(eva2 > eva1);
    expect(juste(LA_CREATION_DE_VALEUR, "l-equipement-cree-t-il", cas)).toMatch(eva2 > eva1 ? /^Oui/ : /^Non : l'EVA baisse/);
  });

  it("le cas du taux relevé : l'exploitation ne bouge pas, les intérêts suivent le taux, et le verdict se lit", () => {
    const releve = anneeAuTauxReleve(code);
    anneeSaine(releve, `${code} au taux relevé`);
    expect(releve.map(exploitation)).toEqual(tours.map(exploitation));
    const { interets: recomposes } = interetsRecomposes(code, releve, taux + HAUSSE_DU_TAUX_VARIABLE);
    releve.forEach((r, j) => pres(r.incomeStatement.interest, recomposes[j]!, 1e-6));
    // L'année finit encore en bénéfice : l'impôt suit le taux, la relation du levier tient.
    expect(somme(releve, net)).toBeGreaterThan(0);
    pres(somme(releve, net), (somme(releve, exploitation) - somme(releve, interets)) * (1 - t), 1e-6);
    const y = rentabilitesExactes(code, releve);
    pres(y.re + (y.re - y.i) * y.levier, y.rcp, 1e-9);
    const [re, i, rcp] = attendus(LE_LEVIER_FACE_A_LA_HAUSSE_DU_TAUX, "au-taux-releve", cas);
    pres(re!, y.re, 0.005);
    pres(i!, y.i, 0.005);
    pres(rcp!, y.rcp, 0.005);
    expect(y.rcp).toBeLessThan(x.rcp);
    const [iActuel, limite] = attendus(LE_LEVIER_FACE_A_LA_HAUSSE_DU_TAUX, "taux-limite", cas);
    pres(iActuel!, x.i, 0.005);
    pres(limite!, (taux * 100 * x.re) / x.i, 0.03);
    const h = levierFaceALaHausse(cas);
    const verdict = x.re <= x.i ? "deja" : y.re < y.i ? "s-inverse" : "tient";
    expect(h.verdict).toBe(verdict);
    // Le taux limite dit la même chose que l'année rejouée.
    if (verdict === "deja") expect(limite!).toBeLessThanOrEqual(taux * 100);
    if (verdict === "tient") expect(limite!).toBeGreaterThan((taux + HAUSSE_DU_TAUX_VARIABLE) * 100);
    expect(juste(LE_LEVIER_FACE_A_LA_HAUSSE_DU_TAUX, "reponse", cas)).toMatch({ deja: /^Le levier jouait déjà/, "s-inverse": /^Le levier s'inverse/, tient: /^Le levier tient/ }[verdict]);
  });

  it("le cas du fonds : le CMPC à son exigence, l'EVA et le résultat d'exploitation qui l'annule", () => {
    const f = ceQueDoitRapporterLExploitation(cas);
    const cmpcExact = TAUX_EXIGE_PAR_LE_FONDS * 100 * (x.cp / x.actif) + (x.i * x.dette) / x.actif;
    const [i, poidsCP, cmpc] = attendus(CE_QUE_DOIT_RAPPORTER_L_EXPLOITATION, "cmpc", cas);
    pres(i!, x.i, 0.005);
    pres(poidsCP!, (x.cp / x.actif) * 100, 0.005);
    pres(cmpc!, cmpcExact, 0.02);
    pres(f.exact.cmpc, cmpcExact, 1e-6);
    const [eva, minimal, marge] = attendus(CE_QUE_DOIT_RAPPORTER_L_EXPLOITATION, "exploitation-minimale", cas);
    const evaExacte = somme(tours, net) - TAUX_EXIGE_PAR_LE_FONDS * x.cp;
    pres(f.exact.eva, evaExacte, 0.01);
    pres(eva!, evaExacte, f.toleranceEva);
    const minimalExact = ((cmpcExact / 100) * x.actif) / (1 - t);
    pres(minimal!, minimalExact, f.toleranceExploitation);
    pres(marge!, somme(tours, exploitation) - minimal!, 0.01);
    expect(f.verdict).toBe(evaExacte > 0 ? "couvre" : "manque");
    expect(marge! > 0).toBe(evaExacte > 0);
    expect(juste(CE_QUE_DOIT_RAPPORTER_L_EXPLOITATION, "reponse", cas)).toMatch(evaExacte > 0 ? /^L'exploitation couvre/ : /^Il manque/);
  });

  it("chapitres et cas : des textes propres", () => {
    textesPropres(L_EFFET_DE_LEVIER, code);
    textesPropres(LA_CREATION_DE_VALEUR, code);
    textesPropres(LE_LEVIER_FACE_A_LA_HAUSSE_DU_TAUX, code);
    textesPropres(CE_QUE_DOIT_RAPPORTER_L_EXPLOITATION, code);
  });
});

describe("les verdicts varient avec l'entreprise", () => {
  it("l'année d'un bon élève : le levier et la valeur partout, la massue au seuil, l'équipement qui en crée et celui qui en détruit", () => {
    const cas = ENTREPRISES_DU_LEVIER.map((c) => casDeLEntreprise(c));
    // L'année que joue le bon gestionnaire finit partout en levier, crée de la valeur partout, tient au taux relevé et couvre
    // l'exigence du fonds : les textes de la massue, de la valeur détruite, du levier inversé et de l'exploitation qui manque
    // ne s'y lisent dans aucune entreprise. Ces gardes passeront au rouge le jour où l'une d'elles se lira : il faudra alors
    // revenir à des verdicts qui varient.
    expect(new Set(cas.map((c) => effetDeLevier(c).verdict))).toEqual(new Set(["levier"]));
    expect(new Set(cas.map((c) => effetDeLevier(c).rcpBaisse))).toEqual(new Set([true]));
    expect(new Set(cas.map((c) => creationDeValeur(c).verdict))).toEqual(new Set(["cree"]));
    expect(new Set(cas.map((c) => levierFaceALaHausse(c).verdict))).toEqual(new Set(["tient"]));
    expect(new Set(cas.map((c) => ceQueDoitRapporterLExploitation(c).verdict))).toEqual(new Set(["couvre"]));
    // L'équipement de plus, lui, crée de la valeur ici et en détruit là.
    expect(new Set(cas.filter((c) => creationDeValeur(c).lEquipementSeLit).map((c) => creationDeValeur(c).lEquipementCree))).toEqual(new Set([true, false]));
    for (const c of cas) {
      const l = effetDeLevier(c);
      const v = creationDeValeur(c);
      // La massue reste à la portée de l'année : son seuil est un résultat d'exploitation qui laisse encore un bénéfice, sous celui de l'année.
      expect(l.exploitationAuSeuil, c.code).toBeGreaterThan(l.s.chargesFinancieres);
      expect(l.margeAvantLaMassue, c.code).toBeGreaterThan(0);
      expect(l.margeAvantLaMassue, c.code).toBeLessThan(l.s.resultatDExploitation);
      // Le levier ne suffit pas à créer de la valeur : le capital coûte plus que la dette, et une rentabilité économique entre
      // les deux jouerait en levier tout en détruisant de la valeur.
      expect(v.k.exact.cmpc, c.code).toBeGreaterThan(l.r.exact.i);
    }
  });

  it("les deux cas tiennent ce qu'un cas dédié doit tenir", () => {
    casDedie(LE_LEVIER_FACE_A_LA_HAUSSE_DU_TAUX, L_EFFET_DE_LEVIER);
    casDedie(CE_QUE_DOIT_RAPPORTER_L_EXPLOITATION, LA_CREATION_DE_VALEUR);
  });
});
