import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { CREATION_PREMIER_BILAN, soldesDeJanvier } from "../../src/config/cours/chapitres/creation-premier-bilan";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { LA_COMMANDE_DU_31_JANVIER } from "../../src/config/cours/situations/par-chapitre/la-commande-du-31-janvier";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeComparaison, EtapeCurseur, EtapeEcriture, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant, indexDeLEtape } from "../../src/pedagogy/cours/deroule";
import { compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";

/**
 * DE LA CRÉATION AU PREMIER BILAN, ET SON CAS : LA COMMANDE DU 31 JANVIER, DANS LES NEUF ENTREPRISES
 * DU COURS.
 *
 * Chaque chiffre attendu est refait ici à la main sur le cas figé de chaque entreprise
 * (monde/cas-des-entreprises.ts), sans les fonctions du chapitre : le résultat, la TVA, la banque et
 * le bilan de janvier, le curseur de l'équipement (attendu, voisin, droites aux bornes, lecture), le
 * laboratoire de la trésorerie (lecture au départ et à la solution, courbes du graphique), le calcul
 * à rebours, le mois complet ; les valeurs de NOVA sont épinglées, et les verdicts aussi. Puis les
 * gardes de texte de l'étalon : rien d'indéfini, pas de « de le », pas de tiret au milieu d'une
 * phrase, des élisions faites, le signe moins, une seule bonne réponse, aucune option qui en contient
 * une autre, des libellés uniques, des notions qui existent, des accords avec l'unité.
 */

const centime = (x: number) => Math.round(x * 100) / 100;
const CODES = ENTREPRISES_DU_COURS;

/** Le mois de janvier, refait à la main sur le cas. */
function aLaMain(c: Cas) {
  const v = c.venteCredit;
  const w = c.venteComptant;
  const a = c.achat;
  const i = c.immobilisation;
  const p = c.personnel;
  const produits = centime(v.ht + w.ht);
  const charges = centime(c.loyer.montant + a.ht + p.brut + p.cotisationsPatronales);
  const resultat = centime(produits - charges);
  const collectee = centime(v.tva + w.tva);
  const deductible = centime(i.tva + a.tva);
  const tva = centime(collectee - deductible);
  const cotisations = centime(p.cotisationsSalariales + p.cotisationsPatronales);
  const banque = centime(c.capital + c.emprunt - c.loyer.montant - i.ttc - p.net + w.ttc);
  const actif = centime(i.ht + v.ttc + Math.max(0, -tva) + banque);
  const passif = centime(c.capital + resultat + c.emprunt + a.ttc + cotisations + Math.max(0, tva));
  // L'usure du 6 au 31 janvier : 25 jours (le 31 compte comme le 30) ; les intérêts du 3 au 31 : 28 jours.
  const joursDeService = 30 - i.date + 1;
  const joursDInterets = 30 - c.dates.emprunt + 1;
  const dureeAns = c.gestion.dureeAmortissementMois / 12;
  const dotation = centime(((i.ht / dureeAns) * joursDeService) / 360);
  const interets = centime((c.emprunt * c.pret.tauxAnnuel * joursDInterets) / 360);
  return {
    produits,
    charges,
    resultat,
    collectee,
    deductible,
    tva,
    cotisations,
    banque,
    actif,
    passif,
    variation: centime(banque - c.capital - c.emprunt),
    joursDeService,
    joursDInterets,
    dotation,
    interets,
    resultatComplet: centime(resultat - dotation - interets),
    totalComplet: centime(actif - dotation),
    comptantTtc: centime(banque - c.capital - c.emprunt + c.loyer.montant + i.ttc + p.net),
  };
}

function textesDe(e: Etape, c: Cas, etat: EtatDuCours, ch: Chapitre): string[] {
  const t = e.tableau?.(c);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(c), e.repere?.(c) ?? "", ...tableau];
    case "ecriture": {
      const p = e.piece?.(c);
      const piece = p ? [p.nature, p.de, p.a, p.date, p.mention ?? "", ...p.lignes.map((l) => l.libelle), ...p.totaux.map((l) => l.libelle)] : [];
      return [e.titre, e.evenement(c), ...e.indices(c), ...e.explication(c, etat), ...e.ecriture(c).lignes.flatMap((l) => [l.role, l.indice]), ...piece];
    }
    case "choix":
      return [e.titre, e.question(c, etat), ...e.options(c, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(c, etat), ...e.champs(c, etat).flatMap((x) => [x.libelle, x.calcul, String(x.attendu)]), ...e.explication(c, etat), ...tableau];
    case "comparaison": {
      const avant = etatAvant(ch, c, indexDeLEtape(ch, e.avantLEtape));
      return [e.titre, e.question(c), ...e.options(c, avant, etat).flatMap((o) => [o.texte, o.retour]), ...e.explication(c, avant, etat)];
    }
    case "curseur": {
      const k = e.cible(c);
      const g = e.grandeur?.(c);
      const r = e.rates?.(c);
      return [e.titre, e.question(c), ...e.explication(c), ...e.lecture(c, k.attendu).map((l) => l.libelle), ...e.droites(c).libelles, ...(e.zones ?? []), g?.libelle ?? "", g?.unite ?? "", r?.dessous ?? "", r?.dessus ?? "", e.montrer ?? ""];
    }
    case "simulation": {
      const d = e.defi(c);
      const depart = Object.fromEntries(e.leviers(c).map((l) => [l.code, l.depart]));
      const g = e.graphique?.(c);
      return [e.titre, e.question(c), d.consigne, d.indice(depart), ...e.explication(c, d.solution), ...e.lecture(c, d.solution).map((l) => l.libelle), ...e.leviers(c).flatMap((l) => [l.libelle, l.unite]), ...(g?.courbes.map((x) => x.libelle) ?? [])];
    }
    default:
      return [e.titre];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "perdu", "commandé"];

/** Les gardes de texte et de forme de l'étalon, dans une entreprise. */
function verifierLesTextes(ch: Chapitre, cas: Cas) {
  const chapitre = chapitreDuCas(ch, cas);
  expect(chapitre.etapes.length, `${ch.code} : une étape a disparu`).toBe(ch.etapes.length);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat, chapitre)) {
      const ici = `${cas.code} · ${e.id} : ${x}`;
      expect(x, ici).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, ici).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, ici).not.toMatch(/ [-–—] /);
      expect(x, ici).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, ici).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, ici).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, ici).not.toMatch(/(^|[\s(])-\d/);
      expect(x, ici).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(x, ici).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, ici).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|jours?|heures?|mois|salariés?|unités?)\b/i);
      expect(x, ici).not.toMatch(/arène rejoue|l'arène a rejoué/);
      if (UNITES_FEMININES.has(u)) expect(x, ici).not.toMatch(masculinFautif);
    }
    if (e.tableau) {
      expect(["lecture", "choix", "montants", "tri"], e.id).toContain(e.type);
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), `${cas.code} · ${e.id}`).toHaveLength(1);
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
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
  expect(new Set(chapitre.etapes.map((e) => e.id)).size, ch.code).toBe(chapitre.etapes.length);
}

/** L'état du journal juste avant une étape, dans l'ordre que l'entreprise donne aux règlements. */
function avant(ch: Chapitre, cas: Cas, id: string) {
  const deroule = chapitreDuCas(ch, cas);
  return etatAvant(deroule, cas, indexDeLEtape(deroule, id));
}

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, cas: Cas, id: string): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  expect(e.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, avant(ch, cas, id)).map((x) => [x.libelle, x.attendu]));
}

/** Un curseur : son attendu, sa position voisine, ses droites aux deux bornes, et sa lecture à l'attendu. */
function curseur(ch: Chapitre, cas: Cas, id: string) {
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
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(centime),
    lecture: Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant])),
  };
}

/** Un laboratoire : sa lecture au départ et à la solution, par libellé. */
function laboratoire(ch: Chapitre, cas: Cas, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, depart, solution: { ...d.solution }, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)], atteint: d.atteint };
}

/** L'option juste d'une étape de choix. */
function juste(ch: Chapitre, cas: Cas, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeChoix;
  return e.options(cas, avant(ch, cas, id)).find((o) => o.juste)!.texte;
}

const ch = CREATION_PREMIER_BILAN;

describe("de la création au premier bilan : le chapitre pilote, dans les neuf entreprises", () => {
  it("reste le chapitre libre du palier 2, joué partout, avec les étapes que l'e2e parcourt", () => {
    expect(CHAPITRES[0]).toBe(ch);
    expect(ch.libre).toBe(true);
    expect(ch.palier).toBe(2);
    expect(ch.entreprises).toBeUndefined();
    expect(ch.etapes.map((e) => e.id).slice(0, 4)).toEqual(["intro", "apport", "emprunt", "emprunt-charge"]);
    expect(ch.etapes[1]!.titre).toBe("Les apports des associés");
    const options = (ch.etapes[3] as EtapeChoix).options(casDeLEntreprise("nova"), { soldes: {} }).map((o) => [o.texte, o.juste]);
    expect(options).toEqual([
      ["Oui : emprunter coûte de l'argent.", false],
      ["Non : c'est une ressource, une dette qu'il faudra rembourser.", true],
      ["Non : c'est un produit, l'entreprise s'enrichit.", false],
    ]);
    // Le gabarit : deux paris, un curseur, un laboratoire, trois étapes d'expert, la synthèse.
    const types = Object.fromEntries(["curseur", "simulation"].map((t) => [t, ch.etapes.filter((e) => e.type === t).map((e) => e.id)]));
    expect(types).toEqual({ curseur: ["la-tva-de-l-equipement"], simulation: ["le-laboratoire-de-la-tresorerie"] });
    const ordre = (id: string) => ch.etapes.findIndex((e) => e.id === id);
    expect(ordre("predire-la-tva")).toBe(ordre("la-tva-de-l-equipement") - 1);
    expect(ordre("la-tva-de-l-equipement")).toBe(ordre("tva-nette") - 1);
    expect(ordre("predire-la-banque")).toBe(ordre("le-laboratoire-de-la-tresorerie") - 1);
    expect(ordre("le-laboratoire-de-la-tresorerie")).toBe(ordre("du-resultat-a-la-banque") - 1);
    for (const id of ["a-rebours", "le-mois-complet"]) expect((ch.etapes.find((e) => e.id === id) as EtapeMontants).champs(casDeLEntreprise("nova"), { soldes: {} }).length, id).toBeGreaterThanOrEqual(3);
    expect(ch.etapes.length).toBe(30);
    expect(ch.etapes.at(-1)!.id).toBe("fin");
  });

  it.each(CODES)("chez %s : les textes tiennent les gardes de l'étalon", (code) => {
    verifierLesTextes(ch, casDeLEntreprise(code));
    const fin = ch.etapes.at(-1)!;
    if (fin.type !== "lecture") throw new Error("la synthèse est une lecture");
    expect(fin.texte(casDeLEntreprise(code)).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });

  it.each(CODES)("chez %s : chaque écriture s'équilibre et se corrige juste, et le journal donne le mois refait à la main", (code) => {
    const cas = casDeLEntreprise(code);
    const deroule = chapitreDuCas(ch, cas);
    for (const e of deroule.etapes) {
      if (e.type !== "ecriture") continue;
      const x = e.ecriture(cas);
      expect(equilibree(enEcriture(x)), e.id).toBe(true);
      for (const l of x.lignes) expect(compteDuPlan(l.compte), `${e.id} : ${l.compte}`).toBeDefined();
      expect(corriger(enSaisie(x), x).juste, e.id).toBe(true);
    }
    const m = aLaMain(cas);
    const janvier = avant(ch, cas, "predire-la-tva").soldes;
    expect(janvier).toEqual(soldesDeJanvier(cas));
    expect(compteDeResultat(janvier).resultat).toBe(m.resultat);
    expect(janvier["512"]).toBe(m.banque);
    // Après les échéances : les tiers soldés, la banque refaite, le résultat inchangé.
    const apres = etatAvant(deroule, cas, deroule.etapes.length).soldes;
    for (const compte of ["401", "411", "421", "431"]) expect(apres[compte] ?? 0, compte).toBeCloseTo(0, 2);
    expect(apres["512"]).toBeCloseTo(m.banque + cas.venteCredit.ttc - cas.achat.ttc - m.cotisations, 2);
    expect(compteDeResultat(apres).resultat).toBe(m.resultat);
  });

  it.each(CODES)("chez %s : la TVA, le résultat, le bilan et le passage à la banque, refaits à la main", (code) => {
    const cas = casDeLEntreprise(code);
    const m = aLaMain(cas);
    expect(attendus(ch, cas, "tva-nette")).toEqual({ "TVA collectée": m.collectee, "TVA déductible": m.deductible, "TVA du mois, collectée moins déductible": m.tva });
    expect(attendus(ch, cas, "resultat")).toEqual({ "Total des produits": m.produits, "Total des charges": m.charges, "Résultat (produits moins charges)": m.resultat });
    expect(attendus(ch, cas, "bilan")).toEqual({ "Banque au 31 janvier": m.banque, "Total de l'actif": m.actif, "Total du passif": m.passif });
    expect(m.actif).toBe(m.passif);
    expect(attendus(ch, cas, "du-resultat-a-la-banque")).toEqual({
      "Créance sur le client, non encaissée": cas.venteCredit.ttc,
      "Dettes envers le fournisseur et l'URSSAF, non payées": centime(cas.achat.ttc + m.cotisations),
      "Variation de la banque, hors apports et emprunt": m.variation,
    });
    // Le tableau de passage refait la variation de la banque.
    expect(centime(m.resultat - cas.venteCredit.ttc + cas.achat.ttc + m.cotisations - cas.immobilisation.ht + m.tva)).toBe(m.variation);
    expect(attendus(ch, cas, "bulletin")).toEqual({
      "Cotisations salariales": cas.personnel.cotisationsSalariales,
      "Net à payer aux salariés": centime(cas.personnel.brut - cas.personnel.cotisationsSalariales),
      "Cotisations patronales": cas.personnel.cotisationsPatronales,
      "Coût total pour l'entreprise": centime(cas.personnel.brut + cas.personnel.cotisationsPatronales),
    });
  });

  it("chez NOVA, les chiffres épinglés", () => {
    const m = aLaMain(casDeLEntreprise("nova"));
    expect([m.produits, m.charges, m.resultat]).toEqual([93_810, 65_330, 28_480]);
    expect([m.collectee, m.deductible, m.tva]).toEqual([18_762, 18_996, -234]);
    expect([m.banque, m.actif, m.variation]).toEqual([222_366, 305_256, -7_634]);
    expect([m.dotation, m.interets, m.resultatComplet, m.totalComplet]).toEqual([694.44, 311.11, 27_474.45, 304_561.56]);
  });

  it.each(CODES)("chez %s : le curseur de l'équipement, refait à la main", (code) => {
    const cas = casDeLEntreprise(code);
    const m = aLaMain(cas);
    const t = cas.immobilisation.tauxTva;
    const limite = Math.floor((m.collectee - cas.achat.tva) / t + 1e-9);
    const max = Math.ceil((2 * Math.max(cas.immobilisation.ht, limite)) / 10_000) * 10_000;
    expect(curseur(ch, cas, "la-tva-de-l-equipement")).toEqual({
      attendu: limite,
      bornes: [0, max],
      droites: [m.collectee, cas.achat.tva, m.collectee, centime(cas.achat.tva + t * max)],
      lecture: {
        "TVA collectée sur les ventes": m.collectee,
        "TVA déductible sur les achats": cas.achat.tva,
        "TVA déductible sur l'équipement": centime(limite * t),
        "TVA du mois : due si positive, crédit si négative": centime(m.collectee - cas.achat.tva - limite * t),
      },
    });
    // Le crédit de TVA du cas se lit de part et d'autre de la limite : l'équipement réel la dépasse ou non.
    expect(m.tva < 0, code).toBe(cas.immobilisation.ht > limite);
  });

  it("le curseur de l'équipement, aux valeurs épinglées, et le pari sur la TVA", () => {
    const limites = Object.fromEntries(CODES.map((code) => [code, curseur(ch, casDeLEntreprise(code), "la-tva-de-l-equipement").attendu]));
    expect(limites).toEqual({ nova: 58_830, boutique: 47_360, hotel: 36_480, bistrot: 28_642, conseil: 80_800, ecommerce: 37_100, fitness: 27_720, batiment: 94_380, transport: 113_500 });
    const paris = Object.fromEntries(CODES.map((code) => [code, juste(ch, casDeLEntreprise(code), "predire-la-tva").split(" :")[0]]));
    expect(paris).toEqual({
      nova: "Un crédit de TVA",
      boutique: "Une TVA due",
      hotel: "Un crédit de TVA",
      bistrot: "Un crédit de TVA",
      conseil: "Une TVA due",
      ecommerce: "Une TVA due",
      fitness: "Un crédit de TVA",
      batiment: "Une TVA due",
      transport: "Une TVA due",
    });
  });

  it.each(CODES)("chez %s : le laboratoire de la trésorerie, refait à la main ; le résultat ne bouge jamais", (code) => {
    const cas = casDeLEntreprise(code);
    const m = aLaMain(cas);
    const l = laboratoire(ch, cas, "le-laboratoire-de-la-tresorerie");
    const joursUrssaf = cas.personnel.dateUrssaf - cas.personnel.date;
    expect(l.depart).toEqual({ delaiClient: cas.venteCredit.delai, aCredit: cas.venteCredit.ttc, delaiFournisseur: cas.achat.delai, joursUrssaf });
    expect(l.solution).toEqual({ ...l.depart, delaiClient: 31 - cas.venteCredit.date });
    expect(l.reussi).toEqual([false, true]);
    expect(l.auDepart).toEqual({
      "Résultat de janvier": m.resultat,
      "Banque au 31 janvier": m.banque,
      "Variation de la banque, hors apports et emprunt": m.variation,
      "Créance sur le client": cas.venteCredit.ttc,
      "Dette envers le fournisseur": cas.achat.ttc,
      "Dette envers l'URSSAF": m.cotisations,
    });
    expect(l.aLaSolution).toEqual({
      "Résultat de janvier": m.resultat,
      "Banque au 31 janvier": centime(m.banque + cas.venteCredit.ttc),
      "Variation de la banque, hors apports et emprunt": centime(m.variation + cas.venteCredit.ttc),
      "Créance sur le client": 0,
      "Dette envers le fournisseur": cas.achat.ttc,
      "Dette envers l'URSSAF": m.cotisations,
    });
    // Le seuil du défi : la banque plus la facture du client, au millier inférieur ; un jour de plus, il échappe.
    const seuil = Math.floor((m.banque + cas.venteCredit.ttc) / 1_000) * 1_000;
    expect(l.atteint({ ...l.solution, delaiClient: 31 - cas.venteCredit.date + 1 })).toBe(false);
    expect(l.e.defi(cas).consigne).toContain(new Intl.NumberFormat("fr-FR").format(seuil));
    // Tout payer au comptant relève aussi le défi ; payer le fournisseur et l'URSSAF en janvier fait baisser la banque.
    expect(l.atteint({ ...l.depart, aCredit: 0 })).toBe(true);
    const tout = l.e.lecture(cas, { ...l.depart, delaiFournisseur: 0, joursUrssaf: 0 });
    expect(Object.fromEntries(tout.map((x) => [x.libelle, x.montant]))["Banque au 31 janvier"]).toBe(centime(m.banque - cas.achat.ttc - m.cotisations));
    // Le résultat ne dépend d'aucun levier.
    for (const p of [l.depart, l.solution, { delaiClient: 0, aCredit: 0, delaiFournisseur: 0, joursUrssaf: 0 }, { delaiClient: 90, aCredit: 1, delaiFournisseur: 60, joursUrssaf: 30 }]) {
      expect(l.e.lecture(cas, p)[0]!.montant).toBe(m.resultat);
    }
    // Le graphique : la banque fait une marche le jour où le client paie en janvier, le résultat est plat.
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("delaiClient");
    const [banque, resultat] = g.courbes;
    const dernierJour = 31 - cas.venteCredit.date;
    expect([0, dernierJour, dernierJour + 1, 90].map((d) => banque!.valeur({ ...l.depart, delaiClient: d }))).toEqual([
      centime(m.banque + cas.venteCredit.ttc),
      centime(m.banque + cas.venteCredit.ttc),
      m.banque,
      m.banque,
    ]);
    expect([0, 45, 90].map((d) => resultat!.valeur({ ...l.depart, delaiClient: d }))).toEqual([m.resultat, m.resultat, m.resultat]);
  });

  it("le seuil du défi, épinglé", () => {
    const seuils = Object.fromEntries(
      CODES.map((code) => {
        const cas = casDeLEntreprise(code);
        return [code, Math.floor((aLaMain(cas).banque + cas.venteCredit.ttc) / 1_000) * 1_000];
      }),
    );
    expect(seuils.nova).toBe(245_000);
    expect(juste(ch, casDeLEntreprise("nova"), "predire-la-banque")).toBe("Le même : la vente compte à la facture, payée ou non");
  });

  it.each(CODES)("chez %s : les étapes d'expert, refaites à la main", (code) => {
    const cas = casDeLEntreprise(code);
    const m = aLaMain(cas);
    const w = cas.venteComptant;
    expect(m.comptantTtc).toBe(w.ttc);
    expect(attendus(ch, cas, "a-rebours")).toEqual({
      "Ventes au comptant encaissées, toutes taxes comprises": w.ttc,
      "Ventes au comptant, hors taxes": centime(w.ttc / (1 + w.tauxTva)),
      [`Nombre ${/^[aeiouyé]/.test(cas.unites) ? "d'" : "de "}${cas.unites} au comptant`]: w.quantite,
    });
    expect(centime(w.ttc / (1 + w.tauxTva))).toBe(w.ht);
    expect([m.joursDeService, m.joursDInterets]).toEqual([25, 28]);
    expect(attendus(ch, cas, "le-mois-complet")).toEqual({
      "Dotation aux amortissements de janvier": m.dotation,
      "Intérêts courus de janvier": m.interets,
      "Résultat de janvier, mois complet": m.resultatComplet,
      "Total du bilan, mois complet": m.totalComplet,
    });
    // La balance du mois complet : sa somme des débits égale sa somme des crédits.
    const balance = (ch.etapes.find((e) => e.id === "le-mois-complet") as EtapeMontants).tableau!(cas);
    const lire = (s: string) => (s ? Number(s.replace(/[\s €]/g, "").replace(",", ".")) : 0);
    expect(centime(balance.lignes.reduce((t, l) => t + lire(l.valeurs[0]!), 0))).toBe(centime(balance.lignes.reduce((t, l) => t + lire(l.valeurs[1]!), 0)));
    expect(juste(ch, cas, "critique")).toBe(`Il manque l'usure de l'équipement et les intérêts du mois : le mois complet fait ${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: Number.isInteger(m.resultatComplet) ? 0 : 2 }).format(m.resultatComplet).replace(/^-/, "−")} €`);
  });

  it("le délai du client : CampusTech paie à 80 jours, 20 jours au-delà des 60 jours convenus (décision du propriétaire)", () => {
    const nova = casDeLEntreprise("nova");
    expect(nova.venteCredit.delai).toBe(80);
    const vente = ch.etapes.find((e) => e.id === "vente-credit") as EtapeEcriture;
    expect(vente.evenement(nova)).toContain("CampusTech paie à 80 jours, 20 jours au-delà des 60 jours convenus : son règlement est attendu le 10 avril.");
    expect(vente.piece!(nova).mention).toBe("Payable à 60 jours, le 21 mars.");
    const encaissement = ch.etapes.find((e) => e.id === "encaissement-client") as EtapeEcriture;
    expect(encaissement.evenement(nova)).toBe("Le 10 avril, CampusTech règle sa facture par virement, 20 jours après l'échéance convenue : 22 656 €.".replace(/ (?=656)/, " "));
    // Le même plafond vaut pour tout client professionnel : MARTEL & FILS est payé 30 jours au-delà.
    expect(vente.evenement(casDeLEntreprise("batiment"))).toContain("le cabinet médical paie à 90 jours, 30 jours au-delà des 60 jours convenus");
    // Sous le plafond, la facture porte le délai du cas, sans retard.
    expect(vente.evenement(casDeLEntreprise("hotel"))).not.toContain("convenus");
    expect(vente.piece!(casDeLEntreprise("hotel")).mention).toBe("Payable à 45 jours, le 6 mars.");
  });

  it("la comparaison après les échéances : le résultat n'a pas changé", () => {
    const cas = casDeLEntreprise("nova");
    const deroule = chapitreDuCas(ch, cas);
    const e = deroule.etapes.find((x) => x.id === "apres-echeances") as EtapeComparaison;
    const a = etatAvant(deroule, cas, indexDeLEtape(deroule, e.avantLEtape));
    const b = etatAvant(deroule, cas, indexDeLEtape(deroule, "apres-echeances"));
    expect(e.options(cas, a, b).find((o) => o.juste)!.texte).toBe("Non : payer et encaisser ne créent ni charge ni produit. Ils changent la forme de l'actif et du passif.");
    expect(compteDeResultat(a.soldes).resultat).toBe(compteDeResultat(b.soldes).resultat);
  });
});

describe("le cas : la commande du 31 janvier", () => {
  const s = LA_COMMANDE_DU_31_JANVIER;

  /** La commande, refaite à la main. */
  function commande(c: Cas) {
    const v = c.venteCredit;
    const m = aLaMain(c);
    const enveloppe = Math.ceil((v.ttc * 0.5) / 100 - 1e-9) * 100;
    const prixTtc = centime(v.prixUnitaire * (1 + v.tauxTva));
    const quantite = Math.floor(enveloppe / prixTtc + 1e-9);
    const ht = centime(quantite * v.prixUnitaire);
    const tva = centime(ht * v.tauxTva);
    return { m, enveloppe, prixTtc, quantite, horsTaxes: Math.floor(enveloppe / v.prixUnitaire + 1e-9), ht, tva, ttc: centime(ht + tva) };
  }

  it("est le cas dédié du chapitre, libre comme lui, sans cours, et passé sur le monde du cours", () => {
    expect(casDuChapitre(ch.code)).toBe(s);
    expect(SITUATIONS).toContain(s);
    expect(s.reprend).toEqual([ch.code]);
    expect([s.palier, s.parcours, s.libre]).toEqual([2, "comptabilite-generale", true]);
    expect(s.entreprises).toBeUndefined();
    expect(s.etapes[0]!.type).toBe("lecture");
    expect(s.etapes[0]!.tableau).toBeDefined();
    expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
    expect(s.etapes.at(-1)!.type).toBe("choix");
    expect(s.etapes.map((e) => e.id)).toEqual(["demande", "la-quantite", "facture", "ecriture", "ce-qui-change", "le-rattachement", "reponse"]);
  });

  it.each(CODES)("chez %s : les textes tiennent, la bonne réponse n'est jamais la plus longue", (code) => {
    const cas = casDeLEntreprise(code);
    verifierLesTextes(s, cas);
    for (const e of s.etapes) {
      if (e.type !== "choix") continue;
      const options = e.options(cas, { soldes: {} });
      const bonne = options.find((o) => o.juste)!;
      expect(bonne.texte.length, `${code} · ${e.id}`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
    }
  });

  it.each(CODES)("chez %s : l'enveloppe, la facture et ce qui change, refaits à la main", (code) => {
    const cas = casDeLEntreprise(code);
    const k = commande(cas);
    // Le journal d'ouverture est la balance du chapitre au 31 janvier.
    const ouverture = s.ouverture!(cas);
    expect(equilibree(ouverture)).toBe(true);
    const nonNuls = (x: Record<string, number>) => Object.fromEntries(Object.entries(x).filter(([, v]) => v !== 0));
    expect(nonNuls(etatAvant(s as Situation, cas, 1).soldes)).toEqual(nonNuls(soldesDeJanvier(cas)));
    // Le curseur : la plus grande quantité que l'enveloppe paie, TVA comprise.
    expect(curseur(s, cas, "la-quantite")).toEqual({
      attendu: k.quantite,
      bornes: [0, 2 * k.horsTaxes],
      droites: [k.enveloppe, 0, k.enveloppe, centime(2 * k.horsTaxes * k.prixTtc)],
      lecture: { "Commande hors taxes": k.ht, "Commande toutes taxes comprises": k.ttc, "Reste de l'enveloppe": centime(k.enveloppe - k.ttc) },
    });
    expect(k.ttc).toBeLessThanOrEqual(k.enveloppe);
    expect(centime((k.quantite + 1) * k.prixTtc)).toBeGreaterThan(k.enveloppe);
    expect(k.horsTaxes).toBeGreaterThan(k.quantite);
    expect(attendus(s, cas, "facture")).toEqual({ "Montant hors taxes (HT)": k.ht, TVA: k.tva, "Montant toutes taxes comprises (TTC)": k.ttc });
    expect(attendus(s, cas, "ce-qui-change")).toEqual({
      "Résultat de janvier, la vente comprise": centime(k.m.resultat + k.ht),
      "TVA collectée moins TVA déductible": centime(k.m.tva + k.tva),
      "Créance sur le client": centime(cas.venteCredit.ttc + k.ttc),
      "Banque au 31 janvier": k.m.banque,
    });
    const ecriture = s.etapes.find((e) => e.id === "ecriture") as EtapeEcriture;
    const x = ecriture.ecriture(cas);
    expect(equilibree(enEcriture(x))).toBe(true);
    expect(corriger(enSaisie(x), x).juste).toBe(true);
    expect(juste(s, cas, "le-rattachement")).toBe("Livrée le 2 février, la vente appartient à février");
    expect(juste(s, cas, "reponse")).toMatch(new RegExp(`^Facturez ce soir ${new Intl.NumberFormat("fr-FR").format(k.quantite)} ${cas.unites} : janvier gagne`));
  });

  it("chez NOVA, les chiffres épinglés", () => {
    const k = commande(casDeLEntreprise("nova"));
    expect([k.enveloppe, k.prixTtc, k.quantite, k.horsTaxes]).toEqual([11_400, 70.8, 161, 193]);
    expect([k.ht, k.tva, k.ttc]).toEqual([9_499, 1_899.8, 11_398.8]);
    expect([centime(k.m.resultat + k.ht), centime(k.m.tva + k.tva), centime(22_656 + k.ttc)]).toEqual([37_979, 1_665.8, 34_054.8]);
    const demande = s.etapes[0]!;
    if (demande.type !== "lecture") throw new Error("la demande est une lecture");
    expect(demande.texte(casDeLEntreprise("nova"))[0]).toContain("CampusTech paie à 80 jours, 20 jours au-delà des 60 jours convenus");
  });
});
