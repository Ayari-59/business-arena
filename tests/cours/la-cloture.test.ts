import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { CHARGE_DU_PARI, DEPART_DU_LABORATOIRE, LA_CLOTURE, TAUX_MOYEN_CHERCHE, TRAVAUX_DU_PALIER_SUIVANT } from "../../src/config/cours/chapitres/la-cloture";
import { cloture as clotureDuMonde } from "../../src/config/cours/monde/cloture";
import { EXERCICE_DE_NOVA as f } from "../../src/config/cours/monde/exercice-de-nova";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { ACHETER_AVANT_LA_CLOTURE, ECONOMIE_VISEE, MISE_EN_SERVICE_EN_DECEMBRE } from "../../src/config/cours/situations/par-chapitre/acheter-avant-la-cloture";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant, etatApres, indexDeLEtape, journalAvant } from "../../src/pedagogy/cours/deroule";
import { bilan, compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";

/**
 * LA CLÔTURE ET SON CAS (ACHETER AVANT LA CLÔTURE ?), SUR LE PREMIER EXERCICE DE NOVA DU MONDE DU COURS.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche (monde/exercice-de-nova.ts), sans les
 * fonctions du chapitre ni le modèle de clôture ; les valeurs absolues sont épinglées, les variantes
 * (le dégressif, le stock au dernier prix, le prix qui ferait économiser l'impôt visé) refaites comme
 * le reste, et les verdicts aussi. Le journal du chapitre est tenu pour de vrai : chaque écriture
 * s'équilibre, porte des comptes du plan et passe son correcteur ; le bilan s'équilibre à chaque
 * étape ; les écritures refont, compte par compte, la clôture du modèle. Puis les gardes de texte de
 * l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const cas = casDeLEntreprise("nova");
const c = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const solde = (compte: string) => {
  const l = f.balanceAvantInventaire.find((x) => x.compte === compte)!;
  return c(l.debit - l.credit);
};

// ─────────────────────────────────────────────────────────────────────────────
// LES GARDES DE L'ÉTALON
// ─────────────────────────────────────────────────────────────────────────────

function textesDe(ch: Chapitre, e: Etape, x: Cas, i: number): string[] {
  const etat = etatAvant(ch, x, i);
  const t = e.tableau?.(x);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(x), e.repere?.(x) ?? "", ...tableau];
    case "ecriture": {
      const a = e.ecriture(x);
      return [e.titre, e.evenement(x), ...e.indices(x), ...e.explication(x, etatApres(ch, x, i)), a.libelle, a.date, ...a.lignes.flatMap((l) => [l.role, l.indice])];
    }
    case "choix":
      return [e.titre, e.question(x, etat), ...e.options(x, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(x, etat), ...e.champs(x, etat).flatMap((y) => [y.libelle, y.calcul, String(y.attendu)]), ...e.explication(x, etat), ...tableau];
    case "curseur": {
      const k = e.cible(x);
      const g = e.grandeur?.(x);
      const r = e.rates?.(x);
      return [e.titre, e.question(x), ...e.explication(x), ...e.lecture(x, k.attendu).map((l) => l.libelle), ...e.droites(x).libelles, ...(e.zones ?? []), g?.libelle ?? "", g?.unite ?? "", r?.dessous ?? "", r?.dessus ?? "", e.montrer ?? ""];
    }
    case "simulation": {
      const d = e.defi(x);
      const depart = Object.fromEntries(e.leviers(x).map((l) => [l.code, l.depart]));
      return [
        e.titre,
        e.question(x),
        d.consigne,
        d.indice(depart),
        ...e.explication(x, d.solution),
        ...e.lecture(x, d.solution).map((l) => l.libelle),
        ...e.leviers(x).flatMap((l) => [l.libelle, l.unite, ...(l.choix ?? []).map((y) => y.libelle)]),
        ...(e.graphique?.(x).courbes.map((y) => y.libelle) ?? []),
      ];
    }
    default:
      return [e.titre];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "perdu"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas (celles de l'étalon). */
function verifierLesTextes(ch: Chapitre) {
  const chapitre = chapitreDuCas(ch, cas);
  expect(chapitre.etapes.length, `${ch.code} : une étape a disparu`).toBe(ch.etapes.length);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(chapitre, e, cas, i)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|heures?|trimestres?|jeux|jours|mois|travaux|échéances)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\bla moitié\b|\ble tiers\b|\ble quart\b/i);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
    }
    if (e.tableau) {
      expect(["lecture", "choix", "montants", "tri"], e.id).toContain(e.type);
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      for (const a of options) for (const b of options) if (a !== b) expect(a.texte.toLowerCase().includes(b.texte.toLowerCase()), `${e.id} : ${b.texte}`).toBe(false);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(new Set(champs.map((x) => x.libelle)).size, e.id).toBe(champs.length);
      for (const x of champs) {
        expect(Number.isFinite(x.attendu), `${e.id} : ${x.libelle}`).toBe(true);
        expect(Math.round(x.attendu * 100) / 100, `${e.id} : ${x.libelle}`).toBe(x.attendu);
      }
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.id)).size, ch.code).toBe(chapitre.etapes.length);
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
}

/** Le journal d'un chapitre à écritures : chaque écriture juste, au plan, et le bilan équilibré à chaque étape. */
function verifierLeJournal(ch: Chapitre) {
  const chapitre = chapitreDuCas(ch, cas);
  if (ch.ouverture) {
    const o = ch.ouverture(cas);
    expect(equilibree(o), `${ch.code} : l'ouverture`).toBe(true);
    for (const l of o.lignes) expect(compteDuPlan(l.compte), `${ch.code} : ouverture, ${l.compte}`).toBeDefined();
  }
  for (const e of chapitre.etapes) {
    if (e.type !== "ecriture") continue;
    const a = e.ecriture(cas);
    expect(equilibree(enEcriture(a)), e.id).toBe(true);
    for (const l of a.lignes) {
      expect(compteDuPlan(l.compte), `${e.id} : ${l.compte}`).toBeDefined();
      expect(l.montant, `${e.id} : ${l.compte}`).toBeGreaterThan(0);
    }
    expect(corriger(enSaisie(a), a), e.id).toEqual({ juste: true, remarques: [], notes: [] });
  }
  for (let i = 0; i <= chapitre.etapes.length; i++) {
    const b = bilan(etatAvant(chapitre, cas, i).soldes);
    expect(b.totalActif, `${ch.code} : le bilan avant l'étape ${i}`).toBeCloseTo(b.totalPassif, 2);
  }
}

/** Ce qu'un cas dédié doit tenir (tests/cours/situations.test.ts), et sa réponse qui ne se devine pas. */
function casDedie(s: Situation, ch: Chapitre) {
  expect(s.reprend).toEqual([ch.code]);
  expect(casDuChapitre(ch.code)).toBe(s);
  expect(s.palier).toBe(ch.palier);
  expect(s.parcours).toBe(ch.parcours);
  expect(s.entreprises?.codes).toEqual(ch.entreprises?.codes);
  expect(s.libre).toBe(false);
  expect(s.blocs).toEqual([]);
  expect(s.etapes[0]!.type).toBe("lecture");
  expect(s.etapes[0]!.tableau).toBeDefined();
  expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
  expect(s.etapes.at(-1)!.type).toBe("choix");
  for (const e of s.etapes) {
    if (e.type !== "choix") continue;
    const options = e.options(cas, etatVide);
    const juste = options.find((o) => o.juste)!;
    expect(juste.texte.length, `${s.code} / ${e.id} : la bonne réponse est la plus longue`).toBeLessThan(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, id: string): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  expect(e?.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

/** Un curseur : son attendu, sa position voisine, ses droites aux deux bornes, et sa lecture à l'attendu. */
function curseur(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeCurseur;
  expect(e.type, id).toBe("curseur");
  const k = e.cible(cas);
  const d = e.droites(cas);
  const min = k.min ?? 0;
  const couvre = (q: number) => d.produit(q) - d.cout(q) >= -1e-9;
  expect(couvre(k.attendu), `${id} : l'attendu couvre`).toBe(true);
  if (e.sens === "plus-grande") expect(couvre(k.attendu + 1), `${id} : la position suivante couvre encore`).toBe(false);
  else expect(couvre(k.attendu - 1), `${id} : la position d'avant couvre déjà`).toBe(false);
  return {
    attendu: k.attendu,
    bornes: [min, k.max],
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(c),
    lecture: Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant])),
  };
}

/** Un laboratoire : sa lecture au départ et à la solution, par libellé. */
function laboratoire(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, d, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE, REFAITE À LA MAIN
// ─────────────────────────────────────────────────────────────────────────────

const ventes = -solde("701");
const charges = f.balanceAvantInventaire.filter((l) => l.compte.startsWith("6")).map((l) => c(l.debit - l.credit));
const totalDesCharges = c(somme(charges));
const resultatDeLaBalance = c(ventes - totalDesCharges);
const joursDeService = 25 + 11 * 30; // du 6 janvier au 31 décembre, jours compris
const dotation = c((60_000 / 6) * (joursDeService / 360));
const placement = c(133_000 * 0.03 * (joursDeService / 360));
const coutMoyen = (1_500 * 22 + 1_500 * 23) / 3_000;
const jeux = 1_500 + 1_500 - 1_000 - 1_400;
const stockFinal = c(jeux * coutMoyen);
const fnp = { ht: 1_500 * 23, tva: 1_500 * 23 * 0.2, ttc: 1_500 * 23 * 1.2 };
const capitalDu = 80_000 - 3 * 4_000;
const interetsDeJanvier = c((capitalDu * 0.05) / 4);
const joursCourus = 28 + 30 + 30; // du 3 octobre au 31 décembre, jours compris
const icne = c((interetsDeJanvier * joursCourus) / 90);
const effetNet = c(-dotation + placement + stockFinal - fnp.ht - icne);
const rai = c(resultatDeLaBalance + effetNet);
const isReduit = 42_500 * 0.15;
const isNormal = c((rai - 42_500) * 0.25);
const impot = Math.round(isReduit + isNormal);
const resultatNet = c(rai - impot);
const isDe = (r: number) => Math.round(6_375 + (r - 42_500) * 0.25);

describe("la clôture : la fiche, refaite à la main", () => {
  it("donne les chiffres du monde du cours", () => {
    expect([ventes, totalDesCharges, resultatDeLaBalance]).toEqual([1_385_556, 1_250_840.4, 134_715.6]);
    expect([joursDeService, dotation, placement]).toEqual([355, 9_861.11, 3_934.58]);
    expect([coutMoyen, jeux, stockFinal]).toEqual([22.5, 600, 13_500]);
    expect(fnp).toEqual({ ht: 34_500, tva: 6_900, ttc: 41_400 });
    expect([capitalDu, interetsDeJanvier, joursCourus, icne]).toEqual([68_000, 850, 88, 831.11]);
    expect([effetNet, rai]).toEqual([-27_757.64, 106_957.96]);
    expect([isReduit, isNormal, impot, resultatNet]).toEqual([6_375, 16_114.49, 22_489, 84_468.96]);
  });

  it("se joue chez NOVA seule, au palier 3, avec ses blocs, et ses travaux sont ceux du modèle", () => {
    const ch = LA_CLOTURE;
    expect(CHAPITRES).toContain(ch);
    expect(ch.palier).toBe(3);
    expect(ch.entreprises?.codes).toEqual(["nova"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    for (const b of ch.blocs) {
      const ref = referentielDeCitation(b);
      expect(ref, b).not.toBeNull();
      expect(blocOfficiel(b, ref!.code), b).not.toBeNull();
    }
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(SITUATIONS).toContain(ACHETER_AVANT_LA_CLOTURE);
    // Le modèle retombe sur la main, travail par travail.
    const k = clotureDuMonde(f, { travauxOublies: TRAVAUX_DU_PALIER_SUIVANT });
    expect(Object.fromEntries(k.travaux.map((t) => [t.code, t.montant]))).toEqual({ dotation, stock: stockFinal, factureNonParvenue: fnp.ht, interetsCourus: icne, interetsDuPlacement: placement });
    expect([k.resultatAvantImpot, k.impot.impot, k.resultatNet]).toEqual([rai, impot, resultatNet]);
  });
});

describe("la clôture : les étapes", () => {
  const ch = LA_CLOTURE;

  it("les étapes guidées attendent ce que la fiche donne", () => {
    expect(attendus(ch, "resultat-provisoire")).toEqual({ "Total des charges de la balance": totalDesCharges, "Résultat de la balance": resultatDeLaBalance });
    expect(attendus(ch, "le-stock-final")).toEqual({ "Coût moyen pondéré d'un jeu": coutMoyen, "Jeux en stock au 31 décembre": jeux, "Stock final": stockFinal });
    expect(attendus(ch, "l-impot")).toEqual({ "Impôt au taux réduit": isReduit, "Impôt au taux normal": isNormal, "Impôt sur les sociétés de l'exercice": impot, "Résultat net": resultatNet });
  });

  it("les étapes autonomes : les intérêts courus, le résultat avant impôt", () => {
    expect(attendus(ch, "les-interets-courus")).toEqual({ "Intérêts de la prochaine échéance": interetsDeJanvier, "Jours courus dans l'exercice": joursCourus, "Intérêts courus au 31 décembre": icne });
    expect(attendus(ch, "resultat-avant-impot")).toEqual({ "Effet net des travaux d'inventaire": effetNet, "Résultat avant impôt": rai });
  });

  it("les écritures passent les travaux, au montant de la main", () => {
    const montants = (id: string) => {
      const e = ch.etapes.find((x) => x.id === id)!;
      if (e.type !== "ecriture") throw new Error(id);
      return Object.fromEntries(e.ecriture(cas).lignes.map((l) => [`${l.sens} ${l.compte}`, l.montant]));
    };
    expect(montants("dotation")).toEqual({ "debit 6811": dotation, "credit 28154": dotation });
    expect(montants("interets-du-placement")).toEqual({ "debit 5088": placement, "credit 764": placement });
    expect(montants("ecriture-du-stock")).toEqual({ "debit 31": stockFinal, "credit 6031": stockFinal });
    expect(montants("la-facture-non-parvenue")).toEqual({ "debit 601": fnp.ht, "debit 44586": fnp.tva, "credit 408": fnp.ttc });
    expect(montants("ecriture-des-interets-courus")).toEqual({ "debit 6611": icne, "credit 1688": icne });
    expect(montants("ecriture-de-l-impot")).toEqual({ "debit 695": impot, "credit 444": impot });
  });

  it("le journal se tient : écritures justes, bilan équilibré à chaque étape, résultat de la main avant et après l'impôt", () => {
    verifierLeJournal(ch);
    const chapitre = chapitreDuCas(ch, cas);
    expect(compteDeResultat(etatAvant(chapitre, cas, 0).soldes).resultat).toBe(resultatDeLaBalance);
    expect(compteDeResultat(etatAvant(chapitre, cas, indexDeLEtape(chapitre, "ecriture-de-l-impot")).soldes).resultat).toBe(rai);
    expect(compteDeResultat(etatAvant(chapitre, cas, chapitre.etapes.length).soldes).resultat).toBe(resultatNet);
    // La balance d'ouverture est celle de la fiche, la TVA de décembre tenue au 44551 du plan du cours.
    const ouverture = journalAvant(chapitre, cas, 0)[0]!;
    expect(c(somme(ouverture.lignes.map((l) => l.debit)))).toBe(1_661_173.27);
    expect(ouverture.lignes.find((l) => l.compte === "44551")!.credit).toBe(13_096);
  });

  it("au bout du journal, les soldes sont ceux de la clôture du modèle, compte par compte", () => {
    const chapitre = chapitreDuCas(ch, cas);
    const fin = etatAvant(chapitre, cas, chapitre.etapes.length).soldes;
    const k = clotureDuMonde(f, { travauxOublies: TRAVAUX_DU_PALIER_SUIVANT });
    const attendu = Object.fromEntries(Object.entries(k.soldes).map(([compte, v]) => [compte === "4455" ? "44551" : compte, v]));
    for (const [compte, v] of Object.entries(attendu)) expect(fin[compte] ?? 0, compte).toBeCloseTo(v, 2);
    for (const [compte, v] of Object.entries(fin)) expect(attendu[compte] ?? 0, compte).toBeCloseTo(v, 2);
    // La trésorerie ne bouge pas : la banque et le compte à terme de la balance. CampusTech paie à
    // 60 jours : sa facture d'octobre (22 656 €) est rentrée le 20 décembre, 115 734,87 + 22 656.
    expect([fin["512"], fin["508"]]).toEqual([138_390.87, 133_000]);
    expect(c(115_734.87 + 22_656)).toBe(138_390.87);
  });

  it("le laboratoire des travaux oubliés : le départ trop beau, une seule position retrouve la clôture", () => {
    const l = laboratoire(ch, "le-laboratoire-des-travaux");
    expect(l.depart).toEqual({ ...DEPART_DU_LABORATOIRE });
    expect(l.depart).toEqual({ stock: 0, facture: 0, interets: 0, mode: 0 });
    expect(l.solution).toEqual({ stock: 1, facture: 1, interets: 1, mode: 0 });
    expect(l.reussi).toEqual([false, true]);
    const raiDepart = c(resultatDeLaBalance - dotation + placement);
    expect(raiDepart).toBe(128_789.07);
    const lire = (r: number, dot: number, stock: number, facture: number, interets: number) => ({
      "Résultat de la balance": resultatDeLaBalance,
      "Dotation aux amortissements": -dot,
      "Intérêts courus du compte à terme": placement,
      "Stock final de composants": stock,
      "Facture non parvenue": -facture + 0,
      "Intérêts courus de l'emprunt": -interets + 0,
      "Résultat avant impôt": r,
      "Impôt sur les sociétés": isDe(r),
      "Banque et compte à terme": c(138_390.87 + 133_000),
    });
    expect(l.auDepart).toEqual(lire(raiDepart, dotation, 0, 0, 0));
    expect(l.aLaSolution).toEqual(lire(rai, dotation, stockFinal, fnp.ht, icne));
    expect([isDe(raiDepart), isDe(rai)]).toEqual([27_947, 22_489]);
    // Les 54 positions : chaque manière, à la main ; une seule retrouve le résultat de la clôture.
    const stocks = [0, stockFinal, jeux * 23];
    const factures = [0, fnp.ht, fnp.ttc];
    const interets = [0, icne, interetsDeJanvier];
    const dotations = [dotation, 60_000 * (1.75 / 6)];
    const reussies: string[] = [];
    for (const [s, vs] of stocks.entries())
      for (const [fa, vf] of factures.entries())
        for (const [i, vi] of interets.entries())
          for (const [m, vm] of dotations.entries()) {
            const p = { stock: s, facture: fa, interets: i, mode: m };
            const r = c(resultatDeLaBalance - vm + placement + vs - vf - vi);
            expect(l.e.lecture(cas, p).find((x) => x.libelle === "Résultat avant impôt")!.montant, JSON.stringify(p)).toBe(r);
            if (l.d.atteint(p)) reussies.push(JSON.stringify(p));
          }
    expect(reussies).toEqual([JSON.stringify(l.solution)]);
    // L'indice nomme le premier travail qui manque.
    expect(l.d.indice(l.depart)).toMatch(/^Le stock final manque/);
    expect(l.d.indice({ stock: 1, facture: 2, interets: 1, mode: 0 })).toMatch(/n'est pas une charge/);
    expect(l.d.indice({ stock: 1, facture: 1, interets: 1, mode: 1 })).toMatch(/dégressif/);
  });

  it("les curseurs, refaits à la main : le taux moyen, le taux qui paierait l'emprunt", () => {
    // Impôt au barème 6 375 + 25 % × (r − 42 500) face à 20 % × r : ils se croisent à 42 500 × 10 % ÷ 5 %.
    expect(TAUX_MOYEN_CHERCHE).toBe(0.2);
    const r = (42_500 * (0.25 - 0.15)) / (0.25 - 0.2);
    expect(Math.round(r)).toBe(85_000);
    expect(curseur(ch, "le-taux-moyen")).toEqual({
      attendu: 85_000,
      bornes: [42_500, 120_000],
      droites: [6_375, 42_500 * 0.2, 6_375 + (120_000 - 42_500) * 0.25, 120_000 * 0.2],
      lecture: { "Impôt au taux réduit": 6_375, "Impôt au taux normal": (85_000 - 42_500) * 0.25, "Impôt au barème": 17_000, "20 % du résultat": 17_000 },
    });
    // Le taux moyen de NOVA, et le pari : une charge de 1 000 € fait économiser 25 % d'elle-même.
    expect(c((impot / rai) * 100)).toBe(21.03);
    expect(CHARGE_DU_PARI).toBe(1_000);
    expect(juste(ch, "predire-l-impot")).toBe("250 € : le dernier euro est au taux normal");
    // Le placement : 80 000 € × t × 355 ÷ 360 face à la charge de l'emprunt, 2 850 € payés + 831,11 € courus.
    const charge = c(2_850 + icne);
    const t = Math.ceil((charge * 360 * 10_000) / (80_000 * 355));
    expect([charge, t]).toEqual([3_681.11, 467]);
    const produit = (bp: number) => (80_000 * bp * 355) / 10_000 / 360;
    expect(produit(466)).toBeLessThan(charge);
    expect(curseur(ch, "le-taux-qui-paierait-l-emprunt")).toEqual({
      attendu: 467,
      bornes: [0, 600],
      droites: [0, charge, c(produit(600)), charge],
      lecture: { "Intérêts des fonds placés": c(produit(467)), "Charge de l'emprunt sur l'exercice": charge, "Coût net de l'emprunt gardé": c(charge - c(produit(467))) },
    });
    expect([c(produit(467)), c(produit(600))]).toEqual([3_684.11, 4_733.33]);
  });

  it("les étapes d'expert : emprunter pour placer, le dégressif, le stock à rebours", () => {
    const charge = c(2_850 + icne);
    const placeAuTaux = c(80_000 * 0.03 * (355 / 360));
    expect(attendus(ch, "emprunter-pour-placer")).toEqual({
      "Charge de l'emprunt sur l'exercice": charge,
      "Intérêts des mêmes fonds placés": placeAuTaux,
      "Coût net avant impôt": c(charge - placeAuTaux),
      "Coût net après impôt": c(c(charge - placeAuTaux) * 0.75),
    });
    expect([placeAuTaux, c(charge - placeAuTaux), c(c(charge - placeAuTaux) * 0.75)]).toEqual([2_366.67, 1_314.44, 985.83]);
    // Le dégressif : 60 000 € × 1,75 ÷ 6, douze mois (la ligne est acquise en janvier).
    const degressive = c(60_000 * (1.75 / 6) * (12 / 12));
    const raiDegressif = c(rai + dotation - degressive);
    expect(attendus(ch, "variante-degressive")).toEqual({
      "Dotation dégressive de l'exercice": degressive,
      "Résultat avant impôt en dégressif": raiDegressif,
      "Impôt en dégressif": isDe(raiDegressif),
      "Impôt en moins cette année": impot - isDe(raiDegressif),
    });
    expect([degressive, raiDegressif, isDe(raiDegressif), impot - isDe(raiDegressif)]).toEqual([17_500, 99_319.07, 20_580, 1_909]);
    // Le stock au dernier prix : les 600 jeux à 23 €, le prix du dernier lot.
    const autreStock = jeux * 23;
    expect(attendus(ch, "a-rebours")).toEqual({ "Écart de résultat": c(autreStock - stockFinal), "Stock final retenu": autreStock, "Coût d'un jeu en stock": 23 });
    expect(c(rai + autreStock - stockFinal)).toBe(107_257.96);
    expect((ch.etapes.find((e) => e.id === "a-rebours") as EtapeMontants).question(cas, etatVide)).toContain("107\u202f257,96 €");
  });

  it("les verdicts : le pari du stock, le pari du placement, le dégressif ne fait que décaler l'impôt", () => {
    expect(juste(ch, "predire-le-stock")).toBe("Monter le résultat : ces jeux sortent des charges de l'exercice");
    expect(juste(ch, "predire-le-placement")).toBe("Coûte : la même somme placée rapporte moins que l'emprunt ne coûte");
    expect(juste(ch, "le-degressif-differe")).toBe("L'impôt n'est que décalé : la ligne s'amortit de 60 000 € en tout, dans les deux modes");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : acheter avant la clôture pour payer moins d'impôt ?", () => {
  const s = ACHETER_AVANT_LA_CLOTURE;
  // La seconde ligne, à la main : 60 000 € sur 6 ans, en service le 1er décembre, 30 jours.
  const jours = 30;
  const dotationDeDecembre = c(((60_000 / 6) * jours) / 360);
  const raiAvec = c(rai - dotationDeDecembre);

  it("tient la forme d'un cas dédié, chez NOVA seule", () => {
    casDedie(s, LA_CLOTURE);
    expect(s.commanditaire).toBe("Le dirigeant");
    expect(MISE_EN_SERVICE_EN_DECEMBRE).toEqual({ jour: 1, mois: 12 });
  });

  it("les chiffres de la réponse, refaits à la main", () => {
    expect(attendus(s, "sans-l-achat")).toEqual({ "Résultat avant impôt, sans l'achat": rai, "Impôt sur les sociétés, sans l'achat": impot });
    expect(attendus(s, "dotation-de-decembre")).toEqual({ "Annuité d'une année pleine": 10_000, "Jours d'utilisation dans l'exercice": jours, "Dotation de l'exercice": dotationDeDecembre });
    expect(dotationDeDecembre).toBe(833.33);
    expect(attendus(s, "avec-l-achat")).toEqual({ "Résultat avant impôt, avec l'achat": raiAvec, "Impôt sur les sociétés, avec l'achat": isDe(raiAvec), "Impôt économisé": impot - isDe(raiAvec) });
    expect([raiAvec, isDe(raiAvec), impot - isDe(raiAvec)]).toEqual([106_124.63, 22_281, 208]);
  });

  it("le curseur et le calcul à rebours : il faudrait 288 000 € d'équipement pour 1 000 € d'impôt", () => {
    expect(ECONOMIE_VISEE).toBe(1_000);
    // Économie = prix ÷ 6 × 30 ÷ 360 × 25 % = prix ÷ 288.
    const prix = 1_000 * 288;
    expect(curseur(s, "le-prix-au-curseur")).toEqual({
      attendu: prix,
      bornes: [0, 400_000],
      droites: [0, 1_000, c(400_000 / 288), 1_000],
      lecture: { "Dotation de décembre": 4_000, "Impôt économisé, au taux marginal": 1_000, "Ce qui sort de la banque, TVA comprise": prix * 1.2 },
    });
    expect(attendus(s, "a-rebours")).toEqual({ "Dotation de décembre nécessaire": 1_000 / 0.25, "Annuité d'une année pleine": (4_000 * 360) / 30, "Prix hors taxes de l'équipement": 48_000 * 6 });
  });

  it("le verdict : l'achat ne fait gagner que 208 €, et les erreurs classiques donnent d'autres nombres", () => {
    expect(juste(s, "reponse")).toBe("Seulement 208 € d'impôt en moins : n'achetez pas pour l'impôt");
    const textes = (s.etapes.find((e) => e.id === "reponse") as EtapeChoix).options(cas, etatVide).filter((o) => !o.juste).map((o) => o.texte.split(" d'impôt")[0]);
    expect(textes).toEqual(["15 000 €", "2 500 €", "125 €"]);
    expect([60_000 * 0.25, 10_000 * 0.25, Math.round(dotationDeDecembre * 0.15)]).toEqual([15_000, 2_500, 125]);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
  it("le journal du cas se tient", () => verifierLeJournal(s));
});
