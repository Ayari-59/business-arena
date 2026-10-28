import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { L_EMPRUNT, MODES_DE_REMBOURSEMENT } from "../../src/config/cours/chapitres/l-emprunt";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CLOTURE_DE_LA_FICHE, CONTRAT_DE_PRET } from "../../src/config/cours/monde/exercice-de-nova";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { UN_DEUXIEME_PRET } from "../../src/config/cours/situations/par-chapitre/un-deuxieme-pret";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant, journalAvant } from "../../src/pedagogy/cours/deroule";
import { compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";

/**
 * L'EMPRUNT ET UN DEUXIÈME PRÊT, DANS LE MONDE DU COURS, DANS LES NEUF ENTREPRISES.
 *
 * Chaque chiffre attendu est refait ici à la main sur le contrat du cas figé de chaque entreprise
 * (montant, taux, nombre d'échéances), sans les fonctions du chapitre ni le modèle de l'emprunt
 * (monde/emprunt.ts) : les tableaux en amortissement constant et en échéances constantes, les trois
 * échéances de l'exercice, les intérêts courus (mois de 30 jours, jours compris), le croisement des
 * échéances au curseur, le coût du crédit dans les deux modes, le taux retrouvé à rebours, le
 * laboratoire (au départ, à la solution, l'impossibilité au taux du contrat, les courbes du
 * graphique), et le cas (le prêt que la limite permet, le coût des deux formules, les intérêts
 * courus du deuxième prêt). Chez NOVA, les intérêts de l'exercice sont ceux de la clôture. Les
 * verdicts sont épinglés ; puis les gardes de texte de l'étalon.
 */

const etatVide: EtatDuCours = { soldes: {} };
const centime = (x: number) => Math.round((x + Number.EPSILON * Math.sign(x)) * 100) / 100 + 0;

/** Un tableau d'emprunt refait à la main : intérêts au centime sur le restant dû, la dernière ligne solde le capital. */
function tableau(C: number, tauxAnnuel: number, n: number, mode: "ac" | "ec") {
  const i = tauxAnnuel / 4;
  const a = centime((C * i) / (1 - (1 + i) ** -n));
  const lignes: { du: number; interets: number; capital: number; echeance: number; reste: number }[] = [];
  let du = C;
  for (let k = 1; k <= n; k++) {
    const interets = centime(du * i);
    let capital = mode === "ac" ? centime(C / n) : centime(a - interets);
    if (k === n) capital = du;
    const reste = centime(du - capital);
    lignes.push({ du, interets, capital, echeance: centime(capital + interets), reste });
    du = reste;
  }
  return { a, lignes, cout: centime(lignes.reduce((s, l) => s + l.interets, 0)) };
}

function textesDe(e: Etape, c: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(c);
  const tab = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(c), e.repere?.(c) ?? "", ...tab];
    case "ecriture": {
      const piece = e.piece?.(c);
      return [
        e.titre,
        e.evenement(c),
        ...e.indices(c),
        ...e.explication(c, etat),
        ...e.ecriture(c).lignes.flatMap((l) => [l.role, l.indice]),
        ...(piece ? [piece.a, ...piece.lignes.map((l) => l.libelle), ...piece.totaux.map((x) => x.libelle)] : []),
      ];
    }
    case "choix":
      return [e.titre, e.question(c, etat), ...e.options(c, etat).flatMap((o) => [o.texte, o.retour]), ...tab];
    case "montants":
      return [e.titre, e.question(c, etat), ...e.champs(c, etat).flatMap((x) => [x.libelle, x.calcul, String(x.attendu)]), ...e.explication(c, etat), ...tab];
    case "curseur": {
      const k = e.cible(c);
      const g = e.grandeur?.(c);
      const r = e.rates?.(c);
      return [e.titre, e.question(c), ...e.explication(c), ...e.lecture(c, k.attendu).map((l) => l.libelle), ...e.droites(c).libelles, ...(e.zones ?? []), g?.libelle ?? "", g?.unite ?? "", r?.dessous ?? "", r?.dessus ?? "", e.montrer ?? ""];
    }
    case "simulation": {
      const d = e.defi(c);
      const depart = Object.fromEntries(e.leviers(c).map((l) => [l.code, l.depart]));
      return [
        e.titre,
        e.question(c),
        d.consigne,
        d.indice(depart),
        ...e.explication(c, d.solution),
        ...e.lecture(c, d.solution).map((l) => l.libelle),
        ...e.leviers(c).flatMap((l) => [l.libelle, l.unite, ...(l.choix ?? []).map((x) => x.libelle)]),
        ...(e.graphique?.(c).courbes.map((x) => x.libelle) ?? []),
      ];
    }
    default:
      return [e.titre];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "perdu"];

/** Les gardes de texte et de forme de l'étalon, dans une entreprise. */
function verifierLesTextes(ch: Chapitre, cas: Cas) {
  const chapitre = chapitreDuCas(ch, cas);
  expect(chapitre.etapes.length, `${ch.code} : une étape a disparu`).toBe(ch.etapes.length);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix) (échéances?|trimestres?|ans|années)\b/i);
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
    if (e.type === "ecriture") {
      const a = e.ecriture(cas);
      expect(equilibree(enEcriture(a)), e.id).toBe(true);
      for (const l of a.lignes) expect(compteDuPlan(l.compte), `${e.id} : ${l.compte}`).toBeDefined();
      expect(corriger(enSaisie(a), a).juste, e.id).toBe(true);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
}

function attendus(ch: Chapitre, id: string, cas: Cas): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  expect(e?.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

function curseur(ch: Chapitre, id: string, cas: Cas) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeCurseur;
  expect(e?.type, id).toBe("curseur");
  const k = e.cible(cas);
  const d = e.droites(cas);
  const min = k.min ?? 0;
  const couvre = (q: number) => d.produit(q) >= d.cout(q);
  expect(couvre(k.attendu), `${id} : l'attendu couvre`).toBe(true);
  if (e.sens === "plus-grande") expect(couvre(k.attendu + 1), `${id} : la position suivante couvre encore`).toBe(false);
  else expect(couvre(k.attendu - 1), `${id} : la position d'avant couvre déjà`).toBe(false);
  return {
    attendu: k.attendu,
    bornes: [min, k.max],
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(centime),
    lecture: Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant])),
  };
}

function laboratoire(ch: Chapitre, id: string, cas: Cas) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e?.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, d, depart, solution: { ...d.solution }, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

const juste = (ch: Chapitre, id: string, cas: Cas) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

function casDedie(s: Situation, ch: Chapitre, cas: Cas) {
  expect(s.reprend).toEqual([ch.code]);
  expect(casDuChapitre(ch.code)).toBe(s);
  expect(s.palier).toBe(ch.palier);
  expect(s.parcours).toBe(ch.parcours);
  expect(s.entreprises?.codes).toEqual(ch.entreprises?.codes);
  expect(s.libre).toBe(false);
  expect(s.etapes[0]!.type).toBe("lecture");
  expect(s.etapes[0]!.tableau).toBeDefined();
  expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
  expect(s.etapes.at(-1)!.type).toBe("choix");
  for (const e of s.etapes) {
    if (e.type !== "choix") continue;
    const options = e.options(cas, etatVide);
    const j = options.find((o) => o.juste)!;
    expect(j.texte.length, `${s.code} / ${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

/** Les chiffres de l'exercice, refaits à la main : trois échéances (avril, juillet, octobre), les intérêts courus du 3 octobre au 31 décembre. */
function exercice(cas: Cas) {
  const C = cas.emprunt;
  const n = cas.pret.nombreEcheances;
  const r = cas.pret.tauxAnnuel;
  const ac = tableau(C, r, n, "ac");
  const ec = tableau(C, r, n, "ec");
  const trois = ac.lignes.slice(0, 3);
  const payes = centime(trois.reduce((s, l) => s + l.interets, 0));
  // Du 3 octobre au 31 décembre, en mois de 30 jours, jours compris : 28 + 30 + 30 = 88 jours sur 90.
  const jours = 30 - cas.dates.emprunt + 1 + 30 + 30;
  const courus = centime((ac.lignes[3]!.interets * jours) / 90);
  return { C, n, r, i: r / 4, cap: C / n, ac, ec, trois, payes, jours, courus, charge: centime(payes + courus), preleve: centime(trois.reduce((s, l) => s + l.echeance, 0)) };
}

describe("l'emprunt : le chapitre au gabarit de l'étalon", () => {
  it("est réservé, au palier 3, dans le registre ; trois temps, un curseur, un laboratoire à levier à choix et graphique, des montants d'expert à trois champs", () => {
    expect(CHAPITRES).toContain(L_EMPRUNT);
    expect(SITUATIONS).toContain(UN_DEUXIEME_PRET);
    expect(L_EMPRUNT.libre).toBe(false);
    expect(L_EMPRUNT.palier).toBe(3);
    expect(L_EMPRUNT.entreprises).toBeUndefined();
    expect(new Set(L_EMPRUNT.etapes.map((e) => e.id)).size).toBe(L_EMPRUNT.etapes.length);
    const ids = L_EMPRUNT.etapes.map((e) => e.id);
    expect(ids.slice(ids.indexOf("predire-le-croisement"), ids.indexOf("predire-le-croisement") + 3)).toEqual(["predire-le-croisement", "les-echeances-qui-se-croisent", "annuites-constantes"]);
    expect(ids.slice(ids.indexOf("predire-le-cout"), ids.indexOf("predire-le-cout") + 3)).toEqual(["predire-le-cout", "le-laboratoire-du-pret", "cout-du-credit"]);
    const cas = casDeLEntreprise("nova");
    for (const id of ["annuites-constantes", "cout-du-credit", "le-taux-a-rebours"]) expect(Object.keys(attendus(L_EMPRUNT, id, cas)).length, id).toBeGreaterThanOrEqual(3);
    const labo = laboratoire(L_EMPRUNT, "le-laboratoire-du-pret", cas);
    expect(labo.e.leviers(cas).find((l) => l.code === "mode")!.choix!.map((x) => x.libelle)).toEqual(["Amortissement constant", "Échéances constantes"]);
    expect(labo.e.graphique?.(cas).levier).toBe("duree");
    const fin = L_EMPRUNT.etapes.at(-1)!;
    if (fin.type !== "lecture") throw new Error("lecture attendue");
    expect(fin.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
    expect(fin.texte(cas).join(" ")).not.toMatch(/rembourse dans l'arène/);
  });

  it("une échéance passée entière en charge est refusée : le capital n'est pas une charge", () => {
    const cas = casDeLEntreprise("nova");
    const etape = L_EMPRUNT.etapes.find((x) => x.id === "echeance-1")!;
    if (etape.type !== "ecriture") throw new Error("écriture attendue");
    const c = corriger(
      [
        { compte: "6611", debit: "5000", credit: "" },
        { compte: "512", debit: "", credit: "5000" },
      ],
      etape.ecriture(cas),
    );
    expect(c.juste).toBe(false);
    expect(c.remarques.join(" ")).toContain("le capital remboursé");
  });
});

describe("l'emprunt chez NOVA : le prêt de la fiche, et les chiffres épinglés", () => {
  const cas = casDeLEntreprise("nova");
  const ch = L_EMPRUNT;
  const x = exercice(cas);

  it("le contrat est celui de la fiche de l'exercice, et ses intérêts de l'année ceux de la clôture", () => {
    expect([cas.emprunt, cas.pret.tauxAnnuel, cas.pret.nombreEcheances]).toEqual([CONTRAT_DE_PRET.capital, CONTRAT_DE_PRET.tauxAnnuel, CONTRAT_DE_PRET.dureeAns * 4]);
    expect([x.payes, x.jours, x.courus, x.charge]).toEqual([2_850, 88, 831.11, 3_681.11]);
    expect(x.courus).toBe(CLOTURE_DE_LA_FICHE.travaux.interetsCourus);
    expect(attendus(ch, "premiere-ligne", cas)).toEqual({
      "Nombre d'échéances": 20,
      "Capital remboursé à chaque échéance": 4_000,
      "Intérêts de la première échéance": 1_000,
      "Montant de la première échéance": 5_000,
      "Capital restant dû après la première échéance": 76_000,
    });
    expect(attendus(ch, "premiere-annee", cas)).toEqual({ "Intérêts payés dans l'année": 2_850, "Capital restant dû au 31 décembre": 68_000, "Part à rembourser dans les douze mois": 16_000 });
    expect(attendus(ch, "les-interets-courus", cas)).toEqual({ "Intérêts de la prochaine échéance": 850, "Jours courus dans l'exercice": 88, "Intérêts courus au 31 décembre": 831.11, "Charge d'intérêts de l'exercice": 3_681.11 });
  });

  it("le croisement au curseur : la onzième échéance ; l'échéance constante de 4 545,63 €", () => {
    expect(x.ec.a).toBe(4_545.63);
    expect(curseur(ch, "les-echeances-qui-se-croisent", cas)).toEqual({
      attendu: 11,
      bornes: [1, 20],
      droites: [4_545.63, 5_000, 4_545.63, 4_050],
      lecture: {
        "Échéance en amortissement constant": 4_500,
        "Échéance constante": 4_545.63,
        "Capital restant dû après, en amortissement constant": 36_000,
        "Capital restant dû après, en échéances constantes": x.ec.lignes[10]!.reste,
      },
    });
    expect(attendus(ch, "annuites-constantes", cas)).toEqual({
      "Échéance constante": 4_545.63,
      "Intérêts de la première échéance": 1_000,
      "Capital remboursé à la première échéance": 3_545.63,
      "Capital restant dû après la première échéance": 76_454.37,
    });
    expect(juste(ch, "predire-le-croisement", cas)).toBe("Plus légère que les premières, plus lourde que les dernières");
  });

  it("le coût du crédit : 10 500 € et 10 912,64 €, le taux de 6 % retrouvé à rebours", () => {
    expect(attendus(ch, "cout-du-credit", cas)).toEqual({ "Coût du crédit en amortissement constant": 10_500, "Coût du crédit en échéances constantes": 10_912.64, "Supplément des échéances constantes": 412.64 });
    expect(juste(ch, "predire-le-cout", cas)).toBe("Plus d'intérêts : la dette baisse moins vite au début");
    expect(attendus(ch, "le-taux-a-rebours", cas)).toEqual({ "Baisse des intérêts d'une échéance à l'autre": 60, "Taux du trimestre, en %": 1.5, "Taux annuel, en %": 6, "Montant emprunté": 80_000 });
    expect(juste(ch, "quel-mode", cas)).toBe("Au même taux, aucun n'est plus cher : on choisit selon la trésorerie des premières années");
  });

  it("le laboratoire : 9 000 € d'intérêts et 5 000 € de première échéance ne tiennent qu'en négociant le taux, à 4,25 %", () => {
    const l = laboratoire(ch, "le-laboratoire-du-pret", cas);
    expect(l.depart).toEqual({ taux: 5, duree: 5, mode: MODES_DE_REMBOURSEMENT.amortissementConstant });
    expect(l.solution).toEqual({ taux: 4.25, duree: 5, mode: MODES_DE_REMBOURSEMENT.amortissementConstant });
    expect(l.reussi).toEqual([false, true]);
    expect(l.auDepart).toEqual({
      "Première échéance": 5_000,
      "Coût du crédit sur toute la durée": 10_500,
      "Charge d'intérêts de l'exercice, courus compris": -3_681.11,
      "Prélevé par la banque dans l'exercice": 14_850,
      "Capital restant dû au 31 décembre": 68_000,
    });
    // À 4,25 % : 80 000 × 1,0625 % × 21 ÷ 2 = 8 925 € ; 4 000 + 850 = 4 850 €.
    expect(l.aLaSolution["Coût du crédit sur toute la durée"]).toBe(8_925);
    expect(l.aLaSolution["Première échéance"]).toBe(4_850);
  });
});

describe.each(ENTREPRISES_DU_COURS)("l'emprunt chez %s, refait à la main", (code) => {
  const cas = casDeLEntreprise(code);
  const ch = L_EMPRUNT;
  const x = exercice(cas);
  const chapitre = chapitreDuCas(ch, cas);

  it("le tableau rembourse tout le prêt, en intérêts qui baissent au quart du taux annuel ; les trois échéances de l'exercice", () => {
    expect(x.n * cas.pret.capitalParEcheance).toBe(x.C);
    expect(x.ac.lignes.at(-1)!.reste).toBe(0);
    expect(x.ec.lignes.at(-1)!.reste).toBe(0);
    for (let k = 1; k < x.n; k++) expect(x.ac.lignes[k]!.interets).toBeLessThan(x.ac.lignes[k - 1]!.interets);
    const e1 = x.ac.lignes[0]!;
    expect(attendus(ch, "premiere-ligne", cas)).toEqual({
      "Nombre d'échéances": x.n,
      "Capital remboursé à chaque échéance": x.cap,
      "Intérêts de la première échéance": centime(x.C * x.i),
      "Montant de la première échéance": e1.echeance,
      "Capital restant dû après la première échéance": x.C - x.cap,
    });
    for (const k of [1, 2, 3]) {
      const e = ch.etapes.find((y) => y.id === `echeance-${k}`)!;
      if (e.type !== "ecriture") throw new Error("écriture attendue");
      const l = x.ac.lignes[k - 1]!;
      expect(e.ecriture(cas).lignes.map((y) => [y.compte, y.montant]), `échéance ${k}`).toEqual([
        ["164", x.cap],
        ["6611", l.interets],
        ["512", l.echeance],
      ]);
      expect(e.ecriture(cas).date).toBe(`${cas.dates.emprunt} ${["avril", "juillet", "octobre"][k - 1]}`);
    }
  });

  it("au 31 décembre : intérêts payés, capital restant dû, part à moins d'un an, intérêts courus et leur écriture", () => {
    expect(attendus(ch, "premiere-annee", cas)).toEqual({ "Intérêts payés dans l'année": x.payes, "Capital restant dû au 31 décembre": x.C - 3 * x.cap, "Part à rembourser dans les douze mois": 4 * x.cap });
    expect(attendus(ch, "les-interets-courus", cas)).toEqual({
      "Intérêts de la prochaine échéance": x.ac.lignes[3]!.interets,
      "Jours courus dans l'exercice": 88,
      "Intérêts courus au 31 décembre": x.courus,
      "Charge d'intérêts de l'exercice": x.charge,
    });
    const fin = etatAvant(chapitre, cas, chapitre.etapes.length).soldes;
    expect(centime(compteDeResultat(fin).totalCharges)).toBe(x.charge);
    expect(-(fin["164"] ?? 0)).toBe(x.C - 3 * x.cap);
    expect(centime(-(fin["1688"] ?? 0))).toBe(x.courus);
    expect(centime(fin["512"] ?? 0)).toBe(centime(x.C - x.preleve));
    expect(journalAvant(chapitre, cas, chapitre.etapes.length)).toHaveLength(5);
  });

  it("le curseur du croisement et le tableau en échéances constantes", () => {
    const a = x.ec.a;
    const droite = (k: number) => x.cap + (x.C - (k - 1) * x.cap) * x.i;
    let k = 1;
    while (a < droite(k)) k += 1;
    const c = curseur(ch, "les-echeances-qui-se-croisent", cas);
    expect(c.attendu).toBe(k);
    expect(c.bornes).toEqual([1, x.n]);
    expect(c.droites).toEqual([a, centime(droite(1)), a, centime(droite(x.n))]);
    expect(c.lecture).toEqual({
      "Échéance en amortissement constant": x.ac.lignes[k - 1]!.echeance,
      "Échéance constante": x.ec.lignes[k - 1]!.echeance,
      "Capital restant dû après, en amortissement constant": x.ac.lignes[k - 1]!.reste,
      "Capital restant dû après, en échéances constantes": x.ec.lignes[k - 1]!.reste,
    });
    expect(k).toBeGreaterThan(1);
    expect(k).toBeLessThan(x.n);
    const l = x.ec.lignes[0]!;
    expect(attendus(ch, "annuites-constantes", cas)).toEqual({
      "Échéance constante": a,
      "Intérêts de la première échéance": centime(x.C * x.i),
      "Capital remboursé à la première échéance": centime(a - centime(x.C * x.i)),
      "Capital restant dû après la première échéance": l.reste,
    });
  });

  it("le coût du crédit dans les deux modes, et le taux retrouvé à rebours", () => {
    // En amortissement constant, une suite arithmétique : C × i × (n + 1) ÷ 2, au centime près des arrondis de chaque ligne.
    expect(Math.abs(x.ac.cout - centime((x.C * x.i * (x.n + 1)) / 2))).toBeLessThanOrEqual(0.1);
    expect(Math.abs(x.ec.cout - centime(x.n * x.ec.a - x.C))).toBeLessThanOrEqual(0.2);
    expect(attendus(ch, "cout-du-credit", cas)).toEqual({
      "Coût du crédit en amortissement constant": x.ac.cout,
      "Coût du crédit en échéances constantes": x.ec.cout,
      "Supplément des échéances constantes": centime(x.ec.cout - x.ac.cout),
    });
    expect(x.ec.cout).toBeGreaterThan(x.ac.cout);
    const avis1 = centime(x.cap + x.C * 0.015);
    const avis2 = centime(x.cap + (x.C - x.cap) * 0.015);
    expect(attendus(ch, "le-taux-a-rebours", cas)).toEqual({
      "Baisse des intérêts d'une échéance à l'autre": centime(avis1 - avis2),
      "Taux du trimestre, en %": 1.5,
      "Taux annuel, en %": 6,
      "Montant emprunté": x.C,
    });
  });

  it("le laboratoire : impossible au taux du contrat dans toute durée et tout mode, relevé au taux de la solution ; les courbes du graphique", () => {
    const l = laboratoire(ch, "le-laboratoire-du-pret", cas);
    const plafond = Math.floor((0.86 * x.ac.cout) / 100) * 100;
    const premiere = x.ac.lignes[0]!.echeance;
    const D0 = x.n / 4;
    expect(l.depart).toEqual({ taux: centime(x.r * 100), duree: D0, mode: 0 });
    expect(l.reussi).toEqual([false, true]);
    expect(l.auDepart).toEqual({
      "Première échéance": premiere,
      "Coût du crédit sur toute la durée": x.ac.cout,
      "Charge d'intérêts de l'exercice, courus compris": -x.charge,
      "Prélevé par la banque dans l'exercice": x.preleve,
      "Capital restant dû au 31 décembre": x.C - 3 * x.cap,
    });
    // Au taux du contrat, aucune durée de 2 à 12 ans ni aucun mode ne tient les deux contraintes.
    for (let D = 2; D <= 12; D++)
      for (const mode of ["ac", "ec"] as const) {
        const t = tableau(x.C, x.r, 4 * D, mode);
        expect(t.cout <= plafond && t.lignes[0]!.echeance <= premiere, `${D} ans en ${mode}`).toBe(false);
        expect(l.d.atteint({ taux: centime(x.r * 100), duree: D, mode: mode === "ac" ? 0 : 1 })).toBe(false);
      }
    // La solution : le taux le plus haut, sur le pas de 0,05 point, qui tient en amortissement constant sur la durée du contrat.
    let t = Math.round(x.r * 10_000);
    while (!(tableau(x.C, t / 10_000, x.n, "ac").cout <= plafond && tableau(x.C, t / 10_000, x.n, "ac").lignes[0]!.echeance <= premiere)) t -= 5;
    expect(l.solution).toEqual({ taux: t / 100, duree: D0, mode: 0 });
    expect(t).toBeLessThan(Math.round(x.r * 10_000));
    const s = tableau(x.C, t / 10_000, x.n, "ac");
    expect(l.aLaSolution["Coût du crédit sur toute la durée"]).toBe(s.cout);
    expect(l.aLaSolution["Première échéance"]).toBe(s.lignes[0]!.echeance);
    // Le graphique : le coût selon la durée, au taux du moment ; la courbe des échéances constantes reste au-dessus.
    const g = l.e.graphique!(cas);
    const [acCourbe, ecCourbe] = g.courbes;
    for (const D of [2, D0, 12]) {
      expect(acCourbe!.valeur({ ...l.depart, duree: D }), `${D} ans`).toBe(tableau(x.C, x.r, 4 * D, "ac").cout);
      expect(ecCourbe!.valeur({ ...l.depart, duree: D }), `${D} ans`).toBe(tableau(x.C, x.r, 4 * D, "ec").cout);
      expect(ecCourbe!.valeur({ ...l.depart, duree: D })).toBeGreaterThan(acCourbe!.valeur({ ...l.depart, duree: D }));
    }
  });

  it("les verdicts, et des textes propres", () => {
    expect(juste(ch, "pourquoi-baisse", cas)).toMatch(/^Ils se calculent sur le capital qui reste dû/);
    expect(juste(ch, "predire-le-cout", cas)).toBe("Plus d'intérêts : la dette baisse moins vite au début");
    expect(juste(ch, "quel-mode", cas)).toBe("Au même taux, aucun n'est plus cher : on choisit selon la trésorerie des premières années");
    verifierLesTextes(ch, cas);
  });
});

describe("un deuxième prêt : la limite de la trésorerie choisit la formule", () => {
  const s = UN_DEUXIEME_PRET;

  /** Le deuxième prêt, refait à la main : 75 % de l'équipement, la durée d'usage, versé le 1er septembre, échéances dès le 1er décembre. */
  function deuxieme(cas: Cas) {
    const C = cas.immobilisation.ht * 0.75;
    const n = cas.gestion.dureeAmortissementMois / 3;
    const r = cas.pret.tauxAnnuel;
    const i = r / 4;
    const ac = tableau(C, r, n, "ac");
    const ec = tableau(C, r, n, "ec");
    const limite = Math.floor((0.95 * ac.lignes[0]!.echeance) / 10) * 10;
    let max = Math.floor(limite / (1 / n + i));
    while ((max + 1) / n + (max + 1) * i <= limite) max += 1;
    while (max / n + max * i > limite) max -= 1;
    // Au 31 décembre : l'échéance du 1er décembre payée ; les intérêts du 1er au 31 décembre courus, 30 jours sur 90.
    const courus = centime((ec.lignes[1]!.interets * 30) / 90);
    return { C, n, i, ac, ec, limite, max, courus, charge: centime(ec.lignes[0]!.interets + courus) };
  }

  it("chez NOVA : les chiffres épinglés", () => {
    const cas = casDeLEntreprise("nova");
    const d = deuxieme(cas);
    expect([d.C, d.n, d.ac.lignes[0]!.echeance, d.ec.a, d.limite, d.max, d.courus, d.charge]).toEqual([45_000, 24, 2_437.5, 2_181.9, 2_310, 42_646, 180.75, 743.25]);
    expect(juste(s, "reponse", cas)).toBe("Échéances constantes de 2 181,90 € ; 743,25 € d'intérêts sur l'exercice");
  });

  it.each(ENTREPRISES_DU_COURS)("chez %s : les deux formules, le curseur, le coût, la clôture, refaits à la main", (code) => {
    const cas = casDeLEntreprise(code);
    casDedie(s, L_EMPRUNT, cas);
    const d = deuxieme(cas);
    // La limite tombe entre l'échéance constante et la première échéance en amortissement constant.
    expect(d.ec.a).toBeLessThan(d.limite);
    expect(d.limite).toBeLessThan(d.ac.lignes[0]!.echeance);
    expect(attendus(s, "les-deux-formules", cas)).toEqual({ "Montant du prêt": d.C, "Nombre d'échéances": d.n, "Première échéance en amortissement constant": d.ac.lignes[0]!.echeance, "Échéance constante": d.ec.a });
    expect(curseur(s, "le-pret-au-curseur", cas)).toEqual({
      attendu: d.max,
      bornes: [Math.round(d.C / 2), d.C],
      droites: [d.limite, centime(Math.round(d.C / 2) / d.n + Math.round(d.C / 2) * d.i), d.limite, centime(d.C / d.n + d.C * d.i)],
      lecture: {
        "Capital remboursé à chaque échéance": centime(d.max / d.n),
        "Intérêts de la première échéance": centime(d.max * d.i),
        "Première échéance": centime(d.max / d.n + d.max * d.i),
        "Part de l'équipement à payer sur la trésorerie": centime(cas.immobilisation.ht - d.max),
      },
    });
    expect(d.max).toBeLessThan(d.C);
    expect(attendus(s, "le-cout-des-deux-formules", cas)).toEqual({
      "Coût du crédit en amortissement constant": d.ac.cout,
      "Coût du crédit en échéances constantes": d.ec.cout,
      "Supplément des échéances constantes": centime(d.ec.cout - d.ac.cout),
    });
    expect(juste(s, "la-formule-qui-tient", cas)).toMatch(/^Les échéances constantes : /);
    const e = s.etapes.find((y) => y.id === "echeance-1")!;
    if (e.type !== "ecriture") throw new Error("écriture attendue");
    const l = d.ec.lignes[0]!;
    expect(e.ecriture(cas).lignes.map((y) => [y.compte, y.montant])).toEqual([
      ["164", l.capital],
      ["6611", l.interets],
      ["512", l.echeance],
    ]);
    const prochaine = attendus(s, "les-interets-courus", cas);
    expect(Object.values(prochaine)).toEqual([d.ec.lignes[1]!.interets, 30, d.courus, d.charge]);
    expect(Object.keys(prochaine)[0]).toBe("Intérêts de l'échéance du 1er mars de l'année suivante");
    // Le journal : le versement à l'ouverture, puis l'échéance de décembre.
    const fin = etatAvant(s, cas, s.etapes.length).soldes;
    expect(centime(-(fin["164"] ?? 0))).toBe(l.reste);
    expect(centime(compteDeResultat(fin).totalCharges)).toBe(l.interets);
    verifierLesTextes(s, cas);
  });
});
