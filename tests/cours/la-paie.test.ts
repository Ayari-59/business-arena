import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, TAUX_PATRONAL, TAUX_SALARIAL, type Cas } from "../../src/config/cours/cas";
import { LA_PAIE } from "../../src/config/cours/chapitres/la-paie";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { ACOMPTE_DE_JANVIER, PAIE_DU_MOIS, TAUX_DE_LA_PAIE } from "../../src/config/cours/monde/exercice-de-nova";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { LA_PRIME_EXCEPTIONNELLE } from "../../src/config/cours/situations/par-chapitre/la-prime-exceptionnelle";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant, journalAvant } from "../../src/pedagogy/cours/deroule";
import { compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";

/**
 * LA PAIE ET LA PRIME EXCEPTIONNELLE, DANS LE MONDE DU COURS, DANS LES NEUF ENTREPRISES.
 *
 * Chaque chiffre attendu est refait ici à la main, sur le cas figé de chaque entreprise
 * (`c.personnel`) et les taux du cours, sans les fonctions du chapitre ni le modèle de la paie
 * (monde/paie.ts) : le bulletin de janvier, les paiements, les deux curseurs (du net promis au brut,
 * du budget au brut), les calculs à rebours, le laboratoire de la prime (au départ, à la solution,
 * et l'impossibilité au taux patronal plein), le cas (du net promis au coût, le curseur du budget).
 * Les verdicts sont épinglés. Puis les gardes de texte de l'étalon : rien d'indéfini, pas de « de
 * le », pas de tiret au milieu d'une phrase, des élisions faites, le signe moins, une seule bonne
 * réponse, aucune option qui en contient une autre, des libellés uniques, des notions qui existent.
 */

const etatVide: EtatDuCours = { soldes: {} };
const centime = (x: number) => Math.round((x + Number.EPSILON * Math.sign(x)) * 100) / 100 + 0;
const euros = (x: number) => `${x.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(x) ? 0 : 2, maximumFractionDigits: 2 })} €`;

// Les taux du cours, écrits à la main : 18 % + 4 % salariaux, 36 % + 6 % patronaux, la CSG et la
// CRDS non déductibles à 2,9 % sur 98,25 % du brut, le prélèvement à la source à 2 %.
const SU = 0.18;
const SR = 0.04;
const PU = 0.36;
const PR = 0.06;
const CSG = 0.029;
const ASSIETTE = 0.9825;
const PAS = 0.02;

/** Un bulletin refait à la main, chaque ligne au centime, avec un taux patronal URSSAF et un prélèvement donnés. */
function bulletin(brut: number, { pu = PU, pas = PAS, acompte = 0 } = {}) {
  const su = centime(brut * SU);
  const sr = centime(brut * SR);
  const nai = centime(brut - su - sr);
  const csg = centime(brut * ASSIETTE * CSG);
  const ni = centime(nai + csg);
  const pre = centime(ni * pas);
  const net = centime(nai - pre - acompte);
  const pu2 = centime(brut * pu);
  const pr = centime(brut * PR);
  return { su, sr, sal: centime(su + sr), nai, csg, ni, pre, net, pu: pu2, pr, pat: centime(pu2 + pr), cout: centime(brut + pu2 + pr), urssaf: centime(su + pu2), retraite: centime(sr + pr) };
}

/** Ce qu'un euro brut laisse au salarié : 78 % moins le prélèvement sur 78 % + 2,9 % × 98,25 %. */
const K = 1 - SU - SR - PAS * (1 - SU - SR + CSG * ASSIETTE);

function textesDe(e: Etape, c: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(c);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(c), e.repere?.(c) ?? "", ...tableau];
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
      return [e.titre, e.question(c, etat), ...e.options(c, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(c, etat), ...e.champs(c, etat).flatMap((x) => [x.libelle, x.calcul, String(x.attendu)]), ...e.explication(c, etat), ...tableau];
    case "tri":
      return [e.titre, e.question(c), ...e.categories.map((k) => k.libelle), ...e.elements(c).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(c), ...tableau];
    case "curseur": {
      const k = e.cible(c);
      const g = e.grandeur?.(c);
      const r = e.rates?.(c);
      return [e.titre, e.question(c), ...e.explication(c), ...e.lecture(c, k.attendu).map((l) => l.libelle), ...e.droites(c).libelles, ...(e.zones ?? []), g?.libelle ?? "", g?.unite ?? "", r?.dessous ?? "", r?.dessus ?? "", e.montrer ?? ""];
    }
    case "simulation": {
      const d = e.defi(c);
      const depart = Object.fromEntries(e.leviers(c).map((l) => [l.code, l.depart]));
      return [e.titre, e.question(c), d.consigne, d.indice(depart), d.indice(d.solution), ...e.explication(c, d.solution), ...e.lecture(c, d.solution).map((l) => l.libelle), ...e.leviers(c).flatMap((l) => [l.libelle, l.unite])];
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix) (salariés?|euros?|primes?|trimestres?)\b/i);
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

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, id: string, cas: Cas): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  expect(e?.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

/** Un curseur : son attendu, ses droites aux deux bornes, et sa lecture à l'attendu, par libellé. */
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

/** Un laboratoire : sa lecture au départ et à la solution, par libellé. */
function laboratoire(ch: Chapitre, id: string, cas: Cas) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e?.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, d, depart, solution: { ...d.solution }, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string, cas: Cas) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

/** Ce qu'un cas dédié doit tenir, et sa réponse qui ne se devine pas à sa longueur. */
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

describe("la paie : les taux du cours, et le chapitre au gabarit de l'étalon", () => {
  it("les taux du monde sont ceux écrits à la main, et redonnent les taux du chapitre pilote", () => {
    const t = TAUX_DE_LA_PAIE;
    expect([t.salarialUrssaf, t.salarialRetraite, t.patronalUrssaf, t.patronalRetraite, t.csgCrdsNonDeductible, t.assietteDeLaCsg, t.prelevementALaSource]).toEqual([SU, SR, PU, PR, CSG, ASSIETTE, PAS]);
    expect(SU + SR).toBeCloseTo(TAUX_SALARIAL, 10);
    expect(PU + PR).toBeCloseTo(TAUX_PATRONAL, 10);
    expect(K).toBeCloseTo(0.76383015, 10);
  });

  it("est réservé, au palier 3, dans le registre, avec des étapes uniques ; trois temps, deux curseurs, un laboratoire, des montants d'expert à trois champs", () => {
    expect(CHAPITRES).toContain(LA_PAIE);
    expect(SITUATIONS).toContain(LA_PRIME_EXCEPTIONNELLE);
    expect(LA_PAIE.libre).toBe(false);
    expect(LA_PAIE.palier).toBe(3);
    expect(LA_PAIE.entreprises).toBeUndefined();
    expect(new Set(LA_PAIE.etapes.map((e) => e.id)).size).toBe(LA_PAIE.etapes.length);
    expect(LA_PAIE.etapes.filter((e) => e.type === "curseur").map((e) => e.id)).toEqual(["la-prime-au-curseur", "le-budget-au-curseur"]);
    expect(LA_PAIE.etapes.filter((e) => e.type === "simulation").map((e) => e.id)).toEqual(["le-laboratoire-de-la-prime"]);
    // Chaque curseur est précédé d'un pari et suivi de sa formalisation.
    const ids = LA_PAIE.etapes.map((e) => e.id);
    expect(ids.slice(ids.indexOf("predire-le-brut"), ids.indexOf("predire-le-brut") + 3)).toEqual(["predire-le-brut", "la-prime-au-curseur", "du-net-au-brut"]);
    expect(ids.slice(ids.indexOf("predire-le-budget"), ids.indexOf("predire-le-budget") + 3)).toEqual(["predire-le-budget", "le-budget-au-curseur", "du-cout-au-net"]);
    const cas = casDeLEntreprise("nova");
    for (const id of ["du-net-au-brut", "du-cout-au-net"]) expect(Object.keys(attendus(LA_PAIE, id, cas)).length, id).toBeGreaterThanOrEqual(3);
    const fin = LA_PAIE.etapes.at(-1)!;
    if (fin.type !== "lecture") throw new Error("lecture attendue");
    expect(fin.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });

  it("une cotisation de retraite passée à l'URSSAF est signalée : les deux organismes ne se confondent pas", () => {
    const cas = casDeLEntreprise("nova");
    const b = bulletin(cas.personnel.brut);
    const etape = LA_PAIE.etapes.find((e) => e.id === "cotisations-patronales")!;
    if (etape.type !== "ecriture") throw new Error("écriture attendue");
    const c = corriger(
      [
        { compte: "645", debit: String(b.pat), credit: "" },
        { compte: "431", debit: "", credit: String(b.pat) },
      ],
      etape.ecriture(cas),
    );
    expect(c.juste).toBe(false);
    expect(c.remarques.join(" ")).toContain("la caisse de retraite");
  });
});

describe("la paie chez NOVA : les chiffres épinglés", () => {
  const cas = casDeLEntreprise("nova");
  const ch = LA_PAIE;

  it("le bulletin de janvier, l'acompte de la fiche, le coût du personnel", () => {
    expect(cas.personnel.brut).toBe(PAIE_DU_MOIS.brut);
    expect(cas.personnel.effectif).toBe(PAIE_DU_MOIS.effectif);
    expect(attendus(ch, "bulletin", cas)).toEqual({
      "Cotisations salariales URSSAF": 1_350,
      "Cotisations salariales de retraite complémentaire": 300,
      "Net avant impôt": 5_850,
      "Prélèvement à la source": 121.27,
      "Net à payer en fin de mois": 5_028.73,
    });
    // L'acompte : la moitié de 5 850 ÷ 4, arrondie à la centaine : 700 €, celui de la fiche de l'exercice.
    expect(Math.round(5_850 / 4 / 2 / 100) * 100).toBe(ACOMPTE_DE_JANVIER.montant);
    expect(juste(ch, "cout-du-personnel", cas)).toBe("10 650 € : le brut et les cotisations patronales.");
  });

  it("les paris et les curseurs : 655 € bruts pour 500 € nets, 2 500 € bruts pour 3 550 € de budget", () => {
    expect(juste(ch, "predire-le-brut", cas)).toBe("Un peu plus de 641,03 € : il faut aussi couvrir le prélèvement à la source");
    expect(curseur(ch, "la-prime-au-curseur", cas)).toEqual({
      attendu: 655,
      bornes: [500, 800],
      droites: [centime(K * 500), 500, centime(K * 800), 500],
      lecture: { "Cotisations salariales": 144.1, "Prélèvement à la source": 10.59, "Net touché par le salarié": 500.31, "Coût de la prime pour l'entreprise": 930.1 },
    });
    // À 654 € bruts, la promesse manque d'un rien.
    expect(bulletin(654).net).toBe(499.54);
    expect(juste(ch, "predire-le-budget", cas)).toBe("2 500 € : le budget divisé par 1,42");
    expect(curseur(ch, "le-budget-au-curseur", cas)).toEqual({
      attendu: 2_500,
      bornes: [2_000, 3_000],
      droites: [3_550, 2_840, 3_550, 4_260],
      lecture: { "Cotisations patronales": 1_050, "Coût employeur": 3_550, "Net avant impôt du salarié": 1_950, "Net à payer au salarié": 1_909.58 },
    });
  });

  it("les calculs à rebours : du net au brut, du coût employeur au net", () => {
    expect(attendus(ch, "du-net-au-brut", cas)).toEqual({ "Net touché pour 100 € bruts": 76.38, "Prime brute par salarié": 654.58, "Coût employeur des primes de l'équipe": 3_718 });
    expect(attendus(ch, "du-cout-au-net", cas)).toEqual({ "Salaire brut": 2_500, "Net avant impôt": 1_950, "Prélèvement à la source": 40.42, "Net à payer au salarié": 1_909.58 });
  });

  it("le laboratoire : impossible à 42 %, relevé par 2 points d'allègement ; le prélèvement n'est pas un levier", () => {
    const l = laboratoire(ch, "le-laboratoire-de-la-prime", cas);
    expect(l.depart).toEqual({ prime: 500, patronal: 42, prelevement: 2 });
    expect(l.solution).toEqual({ prime: 500, patronal: 40, prelevement: 2 });
    expect(l.reussi).toEqual([false, true]);
    expect(l.auDepart).toEqual({
      "Cotisations salariales": 110,
      "Prélèvement à la source": 8.09,
      "Net touché par le salarié": 381.91,
      "Cotisations patronales": 210,
      "Coût employeur par salarié": 710,
      "Charge des primes de l'équipe": -2_840,
    });
    expect(l.aLaSolution).toEqual({ ...l.auDepart, "Cotisations patronales": 200, "Coût employeur par salarié": 700, "Charge des primes de l'équipe": -2_800 });
    expect(juste(ch, "le-levier-de-l-employeur", cas)).toBe("Le taux ne se décide pas : c'est l'impôt du salarié, et il ne change rien au coût de la prime");
  });
});

describe.each(ENTREPRISES_DU_COURS)("la paie chez %s, refaite à la main", (code) => {
  const cas = casDeLEntreprise(code);
  const ch = LA_PAIE;
  const p = cas.personnel;
  const acompte = Math.max(100, Math.round((p.brut * 0.78) / p.effectif / 2 / 100) * 100);
  const b = bulletin(p.brut, { acompte });
  const chapitre = chapitreDuCas(ch, cas);

  it("le bulletin de janvier redonne le brut, le net et le coût du chapitre pilote", () => {
    expect(b.sal).toBe(p.cotisationsSalariales);
    expect(b.pat).toBe(p.cotisationsPatronales);
    expect(b.nai).toBe(p.net);
    expect(b.cout).toBe(p.cout);
    expect(acompte).toBeGreaterThan(0);
    expect(acompte).toBeLessThan(b.nai / p.effectif);
    expect(attendus(ch, "bulletin", cas)).toEqual({
      "Cotisations salariales URSSAF": b.su,
      "Cotisations salariales de retraite complémentaire": b.sr,
      "Net avant impôt": b.nai,
      "Prélèvement à la source": b.pre,
      "Net à payer en fin de mois": b.net,
    });
  });

  it("le tri boucle sur le bulletin, et le coût du personnel est le brut plus les cotisations patronales", () => {
    const tri = ch.etapes.find((e) => e.id === "qui-supporte") as EtapeTri;
    const somme = (k: string) => centime(tri.elements(cas).filter((x) => x.categorie === k).reduce((s, x) => s + x.montant, 0));
    expect(somme("charge")).toBe(b.pat);
    expect(somme("retenue")).toBe(centime(p.brut - b.net));
    expect(juste(ch, "cout-du-personnel", cas)).toBe(`${euros(b.cout)} : le brut et les cotisations patronales.`);
  });

  it("au 15 février, les comptes de la paie sont soldés ; la banque a versé le coût du personnel, qui fait tout le résultat", () => {
    const fin = etatAvant(chapitre, cas, chapitre.etapes.length).soldes;
    for (const c of ["421", "425", "431", "437", "442"]) expect(fin[c] ?? 0, c).toBeCloseTo(0, 2);
    expect(centime(-(fin["512"] ?? 0))).toBe(centime(acompte + b.net + b.urssaf + b.retraite + b.pre));
    expect(centime(-(fin["512"] ?? 0))).toBe(b.cout);
    expect(centime(compteDeResultat(fin).totalCharges)).toBe(b.cout);
    expect(journalAvant(chapitre, cas, chapitre.etapes.length)).toHaveLength(5);
    const reglement = ch.etapes.find((e) => e.id === "reglement-organismes")!;
    if (reglement.type !== "ecriture") throw new Error("écriture attendue");
    expect(reglement.ecriture(cas).lignes.map((l) => [l.compte, l.montant])).toEqual([
      ["431", b.urssaf],
      ["437", b.retraite],
      ["442", b.pre],
      ["512", centime(b.urssaf + b.retraite + b.pre)],
    ]);
  });

  it("les deux curseurs et les calculs à rebours, refaits à la main : ils ne dépendent que des taux, l'équipe multiplie", () => {
    const prime = Math.ceil(500 / K);
    expect(prime).toBe(655);
    expect(curseur(ch, "la-prime-au-curseur", cas).attendu).toBe(prime);
    expect(curseur(ch, "le-budget-au-curseur", cas).attendu).toBe(Math.floor(3_550 / 1.42 + 1e-9));
    // Le plus petit brut au centime dont le bulletin verse 500 € nets.
    let brut = 654;
    while (bulletin(brut).net < 500) brut = centime(brut + 0.01);
    expect(brut).toBe(654.58);
    expect(bulletin(centime(brut - 0.01)).net).toBeLessThan(500);
    expect(attendus(ch, "du-net-au-brut", cas)).toEqual({
      "Net touché pour 100 € bruts": centime(78 - centime(centime(78 + centime(100 * ASSIETTE * CSG)) * PAS)),
      "Prime brute par salarié": brut,
      "Coût employeur des primes de l'équipe": centime(bulletin(brut).cout * p.effectif),
    });
    const e = bulletin(2_500);
    expect(attendus(ch, "du-cout-au-net", cas)).toEqual({ "Salaire brut": 2_500, "Net avant impôt": e.nai, "Prélèvement à la source": e.pre, "Net à payer au salarié": e.net });
    expect(e.cout).toBe(3_550);
  });

  it("le laboratoire : au taux patronal plein, aucune prime ne relève le défi ; sans prélèvement, oui ; la solution le relève", () => {
    const l = laboratoire(ch, "le-laboratoire-de-la-prime", cas);
    expect(l.reussi).toEqual([false, true]);
    const tient = (prime: number, pu: number, pas: number) => {
      const x = bulletin(prime, { pu, pas });
      return x.net >= 380 && x.cout <= 700;
    };
    const primes = Array.from({ length: (800 - 300) / 5 + 1 }, (_, i) => 300 + 5 * i);
    expect(primes.filter((x) => tient(x, PU, PAS))).toEqual([]);
    // Le piège : sans prélèvement, une prime tiendrait, mais le défi ne l'admet pas.
    expect(primes.filter((x) => tient(x, PU, 0)).length).toBeGreaterThan(0);
    expect(l.d.atteint({ prime: 490, patronal: 42, prelevement: 0 })).toBe(false);
    expect(tient(500, 0.34, PAS)).toBe(true);
    const s = bulletin(500, { pu: 0.34 });
    expect(l.aLaSolution).toEqual({
      "Cotisations salariales": s.sal,
      "Prélèvement à la source": s.pre,
      "Net touché par le salarié": s.net,
      "Cotisations patronales": s.pat,
      "Coût employeur par salarié": s.cout,
      "Charge des primes de l'équipe": -centime(s.cout * p.effectif),
    });
  });

  it("textes propres, une seule bonne réponse, écritures justes, notions existantes : le chapitre", () => verifierLesTextes(ch, cas));
});

describe("la prime exceptionnelle : 400 € nets promis, 740 € de budget par salarié", () => {
  const s = LA_PRIME_EXCEPTIONNELLE;
  // Le plus petit brut au centime dont le bulletin verse 400 € nets, et son coût.
  let brut = 520;
  while (bulletin(brut).net < 400) brut = centime(brut + 0.01);
  const cout = bulletin(brut).cout;
  // Le curseur : le net le plus haut, à l'euro, dont le coût (net ÷ K × 1,42) tient 740 €.
  const netTenu = Math.floor((740 * K) / 1.42);
  // Le plus petit brut au centime qui verse ce net.
  let brutTenu = 515;
  while (bulletin(brutTenu).net < netTenu) brutTenu = centime(brutTenu + 0.01);

  it("le cas dédié tient la forme, et le calcul à rebours se refait à la main", () => {
    const cas = casDeLEntreprise("nova");
    casDedie(s, LA_PAIE, cas);
    expect(s.commanditaire).toBe("Le gérant");
    expect([brut, cout, netTenu, brutTenu, bulletin(brutTenu).cout]).toEqual([523.68, 743.62, 398, 521.06, 739.9]);
    expect(attendus(s, "la-prime-a-rebours", cas)).toEqual({ "Net touché pour 100 € bruts": 76.38, "Prime brute par salarié": brut, "Coût employeur par salarié": cout });
    // Le piège : sans le prélèvement, 400 ÷ 78 % × 1,42 tiendrait dans le budget.
    expect(centime(centime(400 / 0.78) * 1.42)).toBeLessThan(740);
    expect(cout).toBeGreaterThan(740);
  });

  it("le curseur du budget, refait à la main", () => {
    const cas = casDeLEntreprise("nova");
    expect(curseur(s, "le-net-que-tient-le-budget", cas)).toEqual({
      attendu: netTenu,
      bornes: [300, 450],
      droites: [740, centime((300 / K) * 1.42), 740, centime((450 / K) * 1.42)],
      lecture: {
        "Prime brute nécessaire": brutTenu,
        "Coût employeur par salarié": bulletin(brutTenu).cout,
        "Reste du budget par salarié": centime(740 - bulletin(brutTenu).cout),
      },
    });
    expect(juste(s, "reponse", cas)).toBe("Non : 743,62 € par salarié ; votre budget tenait 398 € nets au plus");
  });

  it.each(ENTREPRISES_DU_COURS)("chez %s : les écritures de l'équipe se refont à la main, et les textes sont propres", (code) => {
    const cas = casDeLEntreprise(code);
    casDedie(s, LA_PAIE, cas);
    const e = bulletin(centime(brut * cas.personnel.effectif));
    const prime = s.etapes.find((x) => x.id === "ecriture-prime")!;
    const patronales = s.etapes.find((x) => x.id === "ecriture-patronales")!;
    if (prime.type !== "ecriture" || patronales.type !== "ecriture") throw new Error("écritures attendues");
    expect(prime.ecriture(cas).lignes.map((l) => [l.compte, l.montant])).toEqual([
      ["641", centime(brut * cas.personnel.effectif)],
      ["431", e.su],
      ["437", e.sr],
      ["442", e.pre],
      ["421", e.net],
    ]);
    expect(patronales.ecriture(cas).lignes.map((l) => [l.compte, l.montant])).toEqual([
      ["645", e.pat],
      ["431", e.pu],
      ["437", e.pr],
    ]);
    // Le net de l'équipe est, au centime près des arrondis, 400 € par salarié.
    expect(Math.abs(e.net - 400 * cas.personnel.effectif)).toBeLessThanOrEqual(0.05);
    const fin = etatAvant(s, cas, s.etapes.length).soldes;
    expect(centime(compteDeResultat(fin).totalCharges)).toBe(e.cout);
    expect(juste(s, "reponse", cas)).toBe("Non : 743,62 € par salarié ; votre budget tenait 398 € nets au plus");
    verifierLesTextes(s, cas);
  });
});
