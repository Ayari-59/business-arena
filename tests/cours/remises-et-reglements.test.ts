import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { REMISES_ET_REGLEMENTS, factureDeVente } from "../../src/config/cours/chapitres/remises-et-reglements";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { factureContestee } from "../../src/config/cours/situations/la-facture-contestee";
import { L_ESCOMPTE_DEMANDE_PAR_LE_CLIENT } from "../../src/config/cours/situations/par-chapitre/l-escompte-demande-par-le-client";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeEcriture, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";

/**
 * REMISES ET RÈGLEMENTS, ET SON CAS : L'ESCOMPTE DEMANDÉ PAR LE CLIENT, DANS LES NEUF ENTREPRISES DU
 * COURS.
 *
 * Chaque chiffre attendu est refait ici à la main sur le cas figé de chaque entreprise
 * (monde/cas-des-entreprises.ts), sans les fonctions du chapitre ni le modèle (monde/facture.ts) :
 * la facture en cascade, le taux annuel de l'escompte, le curseur des jours d'avance (attendu,
 * voisin, droites aux bornes, lecture), le laboratoire de l'escompte (lecture au départ et à la
 * solution, courbes du graphique), l'escompte maximal, la facture remontée à rebours, la variante en
 * cascade ; les valeurs de NOVA sont épinglées, les verdicts aussi. Puis les gardes de texte de
 * l'étalon, et le journal : client et fournisseur soldés, le résultat ne porte que les ventes,
 * l'achat et les deux escomptes, la remise n'apparaît nulle part.
 */

const centime = (x: number) => Math.round(x * 100) / 100;
const CODES = ENTREPRISES_DU_COURS;
const etatVide: EtatDuCours = { soldes: {} };
const ch = REMISES_ET_REGLEMENTS;

/** La facture d'une quantité aux conditions du cours (remise 5 %, escompte t), refaite à la main. */
function factureALaMain(c: Cas, quantite: number, escompte = 0.02, reductions: readonly number[] = [0.05]) {
  const brut = centime(quantite * c.venteCredit.prixUnitaire);
  let nc = brut;
  for (const r of reductions) nc = centime(nc - centime(nc * r));
  const esc = centime(nc * escompte);
  const nf = centime(nc - esc);
  const tva = centime(nf * c.venteCredit.tauxTva);
  return { brut, nc, esc, nf, tva, ttc: centime(nf + tva) };
}

/** L'achat au fournisseur et son escompte, refaits à la main. */
function achatALaMain(c: Cas) {
  const nc = c.achat.ht;
  const esc = centime(nc * 0.02);
  const nf = centime(nc - esc);
  const tva = centime(nf * c.achat.tauxTva);
  const jours = c.achat.delai - 10;
  return { nc, esc, nf, tva, ttc: centime(nf + tva), jours, taux: (0.02 / 0.98) * (360 / jours) };
}

function textesDe(e: Etape, c: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(c);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(c), e.repere?.(c) ?? "", ...tableau];
    case "ecriture":
      return [e.titre, e.evenement(c), ...e.indices(c), ...e.explication(c, etat), ...e.ecriture(c).lignes.flatMap((l) => [l.role, l.indice])];
    case "choix":
      return [e.titre, e.question(c, etat), ...e.options(c, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(c, etat), ...e.champs(c, etat).flatMap((x) => [x.libelle, x.calcul, String(x.attendu)]), ...e.explication(c, etat), ...tableau];
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
      return [e.titre, e.question(c), d.consigne, d.indice(depart), d.indice({ ...depart, taux: 8 }), ...e.explication(c, d.solution), ...e.lecture(c, d.solution).map((l) => l.libelle), ...e.leviers(c).flatMap((l) => [l.libelle, l.unite]), ...(g?.courbes.map((x) => x.libelle) ?? [])];
    }
    default:
      return [e.titre];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "perdu", "commandé"];

/** Les gardes de texte et de forme de l'étalon, dans une entreprise. */
function verifierLesTextes(chapitre0: Chapitre, cas: Cas) {
  const chapitre = chapitreDuCas(chapitre0, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      const ici = `${cas.code} · ${e.id} : ${x}`;
      expect(x, ici).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, ici).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, ici).not.toMatch(/ [-–—] /);
      expect(x, ici).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, ici).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, ici).not.toMatch(/(^|[\s(])-\d/);
      expect(x, ici).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(x, ici).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|jours?|mois|unités?)\b/i);
      expect(x, ici).not.toMatch(/ceux de l'arène|dans l'arène, les délais/);
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
      for (const x of champs) expect(Math.round(x.attendu * 100) / 100, `${e.id} : ${x.libelle}`).toBe(x.attendu);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, chapitre0.code).toBe(chapitre.etapes.length);
  expect(new Set(chapitre.etapes.map((e) => e.id)).size, chapitre0.code).toBe(chapitre.etapes.length);
}

function attendus(c: Chapitre, cas: Cas, id: string): Record<string, number> {
  const e = c.etapes.find((x) => x.id === id) as EtapeMontants;
  expect(e.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

function curseur(c: Chapitre, cas: Cas, id: string) {
  const e = c.etapes.find((x) => x.id === id) as EtapeCurseur;
  expect(e.type, id).toBe("curseur");
  const k = e.cible(cas);
  const d = e.droites(cas);
  const min = k.min ?? 0;
  const couvre = (q: number) => d.produit(q) - d.cout(q) >= -1e-9;
  expect(couvre(k.attendu), `${id} : l'attendu couvre`).toBe(true);
  expect(couvre(k.attendu + 1), `${id} : la position suivante couvre encore`).toBe(false);
  expect(e.sens).toBe("plus-grande");
  return {
    attendu: k.attendu,
    bornes: [min, k.max],
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(centime),
    lecture: Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant])),
  };
}

const juste = (c: Chapitre, cas: Cas, id: string) => (c.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

describe("remises et règlements : le chapitre, dans les neuf entreprises", () => {
  it("reste au palier 3, réservé, joué partout, au gabarit de l'étalon", () => {
    expect(CHAPITRES).toContain(ch);
    expect([ch.palier, ch.libre, ch.entreprises]).toEqual([3, false, undefined]);
    const ids = ch.etapes.map((e) => e.id);
    expect(ids).toEqual([
      "intro",
      "facture-de-vente",
      "ecriture-de-vente",
      "remise-ou-escompte",
      "encaissement",
      "predire-l-escompte",
      "jours-d-avance",
      "escompte-du-fournisseur",
      "decision",
      "facture-d-achat",
      "paiement-fournisseur",
      "predire-l-escompte-accorde",
      "le-laboratoire-de-l-escompte",
      "l-escompte-maximal",
      "a-rebours",
      "en-cascade",
      "critique",
      "fin",
    ]);
    for (const id of ["l-escompte-maximal", "a-rebours", "en-cascade"]) expect((ch.etapes.find((e) => e.id === id) as EtapeMontants).champs(casDeLEntreprise("nova"), etatVide).length, id).toBeGreaterThanOrEqual(3);
  });

  it.each(CODES)("chez %s : les textes tiennent les gardes de l'étalon, et la synthèse finit sur la phrase commune", (code) => {
    const cas = casDeLEntreprise(code);
    verifierLesTextes(ch, cas);
    const fin = ch.etapes.at(-1)!;
    if (fin.type !== "lecture") throw new Error("la synthèse est une lecture");
    expect(fin.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });

  it.each(CODES)("chez %s : la facture en cascade, la TVA sur le net financier, et le taux annuel de l'escompte du fournisseur", (code) => {
    const cas = casDeLEntreprise(code);
    const v = factureALaMain(cas, cas.venteCredit.quantite);
    expect(v.brut).toBe(cas.venteCredit.ht);
    expect(attendus(ch, cas, "facture-de-vente")).toEqual({
      Remise: centime(v.brut * 0.05),
      "Net commercial": v.nc,
      Escompte: v.esc,
      "Net financier": v.nf,
      TVA: v.tva,
      "Net à payer": v.ttc,
    });
    const a = achatALaMain(cas);
    expect(attendus(ch, cas, "escompte-du-fournisseur")).toEqual({
      "Escompte obtenu": a.esc,
      "Net financier à payer, hors taxes": a.nf,
      "Jours de paiement avancés": a.jours,
      "Taux annuel de l'escompte, en %": centime(a.taux * 100),
    });
    // L'escompte du fournisseur vaut toujours plus que l'emprunt : prendre l'escompte est la bonne décision.
    expect(a.taux).toBeGreaterThan(cas.pret.tauxAnnuel);
    expect(juste(ch, cas, "decision")).toBe("Payer sous 10 jours et prendre l'escompte, si la trésorerie le permet.");
    expect(juste(ch, cas, "predire-l-escompte")).toMatch(/^Bien plus que les /);
  });

  it.each(CODES)("chez %s : chaque écriture se corrige juste ; client et fournisseur soldés ; le résultat ne porte que les ventes, l'achat et les escomptes", (code) => {
    const cas = casDeLEntreprise(code);
    const chapitre = chapitreDuCas(ch, cas);
    for (const e of chapitre.etapes) {
      if (e.type !== "ecriture") continue;
      const x = e.ecriture(cas);
      expect(equilibree(enEcriture(x)), e.id).toBe(true);
      for (const l of x.lignes) expect(compteDuPlan(l.compte), `${e.id} : ${l.compte}`).toBeDefined();
      expect(corriger(enSaisie(x), x).juste, e.id).toBe(true);
    }
    const v = factureALaMain(cas, cas.venteCredit.quantite);
    const a = achatALaMain(cas);
    const fin = etatAvant(chapitre, cas, chapitre.etapes.length).soldes;
    expect(fin["411"] ?? 0).toBeCloseTo(0, 2);
    expect(fin["401"] ?? 0).toBeCloseTo(0, 2);
    expect(compteDeResultat(fin).resultat).toBeCloseTo(v.nc - a.nc - v.esc + a.esc, 2);
    expect(-(fin[cas.venteCredit.compte] ?? 0)).toBeCloseTo(v.nc, 2);
    expect(fin["512"]).toBeCloseTo(v.ttc - a.ttc, 2);
  });

  it.each(CODES)("chez %s : le curseur des jours d'avance, refait à la main", (code) => {
    const cas = casDeLEntreprise(code);
    const a = achatALaMain(cas);
    const r = cas.pret.tauxAnnuel;
    const limite = Math.floor((a.esc * 360) / (a.nf * r) + 1e-9);
    const interets = centime((a.nf * r * limite) / 360);
    expect(curseur(ch, cas, "jours-d-avance")).toEqual({
      attendu: limite,
      bornes: [0, 240],
      droites: [a.esc, 0, a.esc, centime((a.nf * r * 240) / 360)],
      lecture: { "Escompte obtenu": a.esc, "Intérêts de l'argent avancé, au taux de l'emprunt": interets, "Gain du paiement rapide": centime(a.esc - interets) },
    });
    // Les jours que paie l'escompte dépassent largement ceux qu'il fait gagner.
    expect(limite).toBeGreaterThan(a.jours);
  });

  it("le curseur des jours d'avance, épinglé : 146 jours chez NOVA, ce que l'audit avait calculé", () => {
    const jours = Object.fromEntries(CODES.map((code) => [code, curseur(ch, casDeLEntreprise(code), "jours-d-avance").attendu]));
    expect(jours).toEqual({ nova: 146, boutique: 141, hotel: 174, bistrot: 126, conseil: 113, ecommerce: 118, fitness: 133, batiment: 126, transport: 141 });
  });

  it.each(CODES)("chez %s : le laboratoire de l'escompte, refait à la main au départ et à la solution", (code) => {
    const cas = casDeLEntreprise(code);
    const e = ch.etapes.find((x) => x.id === "le-laboratoire-de-l-escompte") as EtapeSimulation;
    const d = e.defi(cas);
    const j = cas.venteCredit.delai - 10;
    const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
    expect(depart).toEqual({ remise: 5, escompte: 2, jours: j, taux: Math.round(cas.pret.tauxAnnuel * 1000) / 10 });
    // L'escompte le plus fort au dixième de point qui ne coûte pas plus qu'un découvert à 8 % : t ÷ (1 − t) × 360 ÷ j ≤ 8 %.
    const x = (0.08 * j) / 360;
    const meilleur = Math.floor((x / (1 + x)) * 1000 + 1e-9) / 10;
    expect(d.solution).toEqual({ remise: 5, escompte: meilleur, jours: j, taux: 8 });
    const coute = (e100: number) => (e100 / 100 / (1 - e100 / 100)) * (360 / j);
    expect(coute(meilleur)).toBeLessThanOrEqual(0.08);
    expect(coute(meilleur + 0.1)).toBeGreaterThan(0.08);
    expect([d.atteint(depart), d.atteint(d.solution)]).toEqual([false, true]);
    // Un dixième de moins, un autre taux ou d'autres jours : le défi n'est pas relevé.
    expect(d.atteint({ ...d.solution, escompte: Math.round((meilleur - 0.1) * 10) / 10 })).toBe(false);
    expect(d.atteint({ ...d.solution, jours: j + 1 })).toBe(false);
    expect(d.atteint({ ...d.solution, remise: 0 })).toBe(true);
    const lire = (p: Record<string, number>) => {
      const f = factureALaMain(cas, cas.venteCredit.quantite, p.escompte! / 100, [p.remise! / 100]);
      const interets = centime((f.nf * (p.taux! / 100) * p.jours!) / 360);
      return {
        "Net commercial": f.nc,
        "Escompte accordé, en euros": f.esc,
        "Net financier": f.nf,
        "Coût de l'escompte ramené à l'année": centime(coute(p.escompte!) * 100 * (j / p.jours!)),
        "Taux annuel du découvert": p.taux,
        "Intérêts du découvert évités": interets,
        "Gain du paiement rapide, face au découvert": centime(interets - f.esc),
      };
    };
    const lecture = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
    expect(lecture(depart)).toEqual(lire(depart));
    expect(lecture(d.solution)).toEqual(lire(d.solution));
    // À la solution, le paiement rapide ne coûte rien face au découvert ; au départ, les 2 % coûtent.
    expect(lecture(d.solution)["Gain du paiement rapide, face au découvert"]).toBeGreaterThanOrEqual(0);
    expect(lecture(depart)["Gain du paiement rapide, face au découvert"]).toBeLessThan(0);
    // Le graphique : le coût annuel de l'escompte selon les jours, une hyperbole ; le découvert, plat.
    const g = e.graphique!(cas);
    expect(g.levier).toBe("jours");
    const [cout, decouvert] = g.courbes;
    expect([10, 45, 90].map((n) => cout!.valeur({ ...d.solution, jours: n }))).toEqual([10, 45, 90].map((n) => centime((meilleur / (100 - meilleur)) * (360 / n) * 100)));
    expect([10, 90].map((n) => decouvert!.valeur({ ...d.solution, jours: n }))).toEqual([8, 8]);
  });

  it("le défi du laboratoire, épinglé, et le pari sur l'escompte à accorder", () => {
    const defis = Object.fromEntries(
      CODES.map((code) => {
        const e = ch.etapes.find((x) => x.id === "le-laboratoire-de-l-escompte") as EtapeSimulation;
        return [code, e.defi(casDeLEntreprise(code)).solution.escompte];
      }),
    );
    expect(defis).toEqual({ nova: 1.5, boutique: 0.7, hotel: 0.7, bistrot: 0.4, conseil: 1, ecommerce: 0.4, fitness: 0.7, batiment: 1.7, transport: 1 });
    for (const code of CODES) expect(juste(ch, casDeLEntreprise(code), "predire-l-escompte-accorde"), code).toBe("Moins que les 2 % des conditions du cours");
  });

  it.each(CODES)("chez %s : les étapes d'expert, refaites à la main", (code) => {
    const cas = casDeLEntreprise(code);
    const v = factureALaMain(cas, cas.venteCredit.quantite);
    const j = cas.venteCredit.delai - 10;
    const x = (0.08 * j) / 360;
    const t = x / (1 + x);
    expect(attendus(ch, cas, "l-escompte-maximal")).toEqual({
      "Coût du découvert sur la période, en %": centime(x * 100),
      "Escompte le plus fort, en %": centime(t * 100),
      "Escompte sur la facture, à ce taux arrondi": centime(v.nc * (Math.round(t * 10_000) / 10_000)),
    });
    // L'escompte maximal paie exactement les intérêts du découvert sur le net financier.
    expect(v.nc * t).toBeCloseTo(v.nc * (1 - t) * x, 9);
    // À rebours : la deuxième commande, la moitié de la première.
    const q = Math.round(cas.venteCredit.quantite * 0.5);
    const k = factureALaMain(cas, q);
    const champs = (ch.etapes.find((e) => e.id === "a-rebours") as EtapeMontants).champs(cas, etatVide);
    expect(Object.fromEntries(champs.map((c) => [c.libelle, c.attendu]))).toEqual({
      "Net financier": k.nf,
      "Net commercial": k.nc,
      "Prix brut, hors taxes": k.brut,
      [`Nombre ${/^[aeiouyé]/.test(cas.unites) ? "d'" : "de "}${cas.unites}`]: q,
    });
    // Les divisions à rebours retombent sur la facture, dans la tolérance des champs.
    const nf = k.ttc / (1 + cas.venteCredit.tauxTva);
    const nc = nf / 0.98;
    const brut = nc / 0.95;
    for (const [c, valeur] of [champs[0]!, champs[1]!, champs[2]!].map((c, i) => [c, [nf, nc, brut][i]!] as const)) expect(Math.abs(valeur - c.attendu), c.libelle).toBeLessThanOrEqual(c.tolerance ?? 0.01);
    expect(Math.round(brut / cas.venteCredit.prixUnitaire)).toBe(q);
    // La variante : la remise, puis le rabais de 3 % sur le net après remise.
    const w = factureALaMain(cas, cas.venteCredit.quantite, 0.02, [0.05, 0.03]);
    expect(attendus(ch, cas, "en-cascade")).toEqual({ "Net commercial": w.nc, Escompte: w.esc, "Net financier": w.nf, TVA: w.tva, "Net à payer": w.ttc });
    expect(w.nc).not.toBe(centime(v.brut * 0.92));
    expect(juste(ch, cas, "critique")).toBe(`Pas la même chose : l'escompte achète ${j} jours de trésorerie, la remise n'achète rien`);
  });

  it("chez NOVA, les chiffres épinglés, et le délai de CampusTech dit comme le propriétaire l'a décidé", () => {
    const cas = casDeLEntreprise("nova");
    expect(factureDeVente(cas)).toEqual({ brut: 18_880, remise: 944, netCommercial: 17_936, escompte: 358.72, netFinancier: 17_577.28, tauxTva: 0.2, tva: 3_515.46, ttc: 21_092.74, date: 20, paiement: 30, joursAvances: 70 });
    const a = achatALaMain(cas);
    expect([a.esc, a.nf, a.jours, centime(a.taux * 100)]).toEqual([699.6, 34_280.4, 12, 61.22]);
    expect(attendus(ch, cas, "l-escompte-maximal")).toEqual({ "Coût du découvert sur la période, en %": 1.56, "Escompte le plus fort, en %": 1.53, "Escompte sur la facture, à ce taux arrondi": 274.42 });
    expect(attendus(ch, cas, "a-rebours")).toEqual({ "Net financier": 8_788.64, "Net commercial": 8_968, "Prix brut, hors taxes": 9_440, "Nombre d'enceintes": 160 });
    const intro = ch.etapes[0]!;
    if (intro.type !== "lecture") throw new Error("l'intro est une lecture");
    expect(intro.texte(cas)[0]).toContain("CampusTech achète au prix affiché et paie à 80 jours, 20 jours au-delà des 60 jours convenus.");
    // La facture contestée lit toujours la facture juste du chapitre.
    expect(factureContestee(cas).juste.ttc).toBe(21_092.74);
  });

  it("une vente passée au brut, remise en charge, est refusée : la remise baisse le prix", () => {
    const cas = casDeLEntreprise("nova");
    const v = factureDeVente(cas);
    const etape = ch.etapes.find((e) => e.id === "ecriture-de-vente") as EtapeEcriture;
    const m = (x: number) => String(x).replace(".", ",");
    const c = corriger(
      [
        { compte: "411", debit: m(v.ttc), credit: "" },
        { compte: "665", debit: m(v.escompte + v.remise), credit: "" },
        { compte: "701", debit: "", credit: m(v.brut) },
        { compte: "44571", debit: "", credit: m(v.tva) },
      ],
      etape.ecriture(cas),
    );
    expect(c.juste).toBe(false);
    expect(c.remarques.join(" ")).toContain("La vente, au net commercial : le montant ne convient pas. Pensez au net commercial");
  });
});

describe("le cas : l'escompte demandé par le client", () => {
  const s = L_ESCOMPTE_DEMANDE_PAR_LE_CLIENT;

  /** Le cas, refait à la main. */
  function escompte(c: Cas) {
    const f = factureALaMain(c, c.venteCredit.quantite, 0.03);
    const r = c.pret.tauxAnnuel;
    const jours = c.venteCredit.delai - 10;
    const periode = 0.03 / 0.97;
    const x = (r * jours) / 360;
    const plafond = x / (1 + x);
    const interets = centime((f.nf * r * jours) / 360);
    return { f, jours, periode, annuel: (periode * 360) / jours, plafond, centiemes: Math.floor(plafond * 10_000 + 1e-9), necessaires: Math.ceil((periode * 360) / r - 1e-9), interets, surcout: centime(f.esc - interets) };
  }

  it("est le cas dédié du chapitre, réservé comme lui, sans cours, et passé sur le monde du cours", () => {
    expect(casDuChapitre(ch.code)).toBe(s);
    expect(SITUATIONS).toContain(s);
    expect(s.reprend).toEqual([ch.code]);
    expect([s.palier, s.parcours, s.libre]).toEqual([3, "comptabilite-generale", false]);
    expect(s.entreprises).toBeUndefined();
    expect(s.etapes[0]!.type).toBe("lecture");
    expect(s.etapes[0]!.tableau).toBeDefined();
    expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
    expect(s.etapes.map((e) => e.id)).toEqual(["demande", "facture", "ecriture", "cout", "le-plafond", "le-croisement", "reponse"]);
  });

  it.each(CODES)("chez %s : les textes tiennent, la bonne réponse n'est jamais la plus longue", (code) => {
    const cas = casDeLEntreprise(code);
    verifierLesTextes(s, cas);
    const reponse = s.etapes.at(-1) as EtapeChoix;
    const options = reponse.options(cas, etatVide);
    expect(options.find((o) => o.juste)!.texte.length).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  });

  it.each(CODES)("chez %s : la facture, le coût de l'escompte, le curseur et le croisement, refaits à la main", (code) => {
    const cas = casDeLEntreprise(code);
    const k = escompte(cas);
    expect(attendus(s, cas, "facture")).toEqual({ Remise: centime(k.f.brut * 0.05), "Net commercial": k.f.nc, Escompte: k.f.esc, "Net financier": k.f.nf, TVA: k.f.tva, "Net à payer": k.f.ttc });
    expect(attendus(s, cas, "cout")).toEqual({
      "Jours de paiement avancés": k.jours,
      "Coût de l'escompte pour la période (%)": centime(k.periode * 100),
      "Coût de l'escompte ramené à l'année (%)": centime(k.annuel * 100),
    });
    const x = (cas.pret.tauxAnnuel * k.jours) / 360;
    const esc = centime((k.f.nc * k.centiemes) / 10_000);
    const interets = centime(((k.f.nc - esc) * x));
    expect(curseur(s, cas, "le-plafond")).toEqual({
      attendu: k.centiemes,
      bornes: [0, 400],
      droites: [centime(k.f.nc * x), 0, centime(k.f.nc * 0.96 * x), centime(k.f.nc * 0.04)],
      lecture: { "Escompte abandonné au client": esc, "Intérêts de l'emprunt sur le net financier": interets, "Gain du paiement rapide, face à l'emprunt": centime(interets - esc) },
    });
    expect(attendus(s, cas, "le-croisement")).toEqual({
      "Escompte le plus fort que paie l'emprunt (%)": centime(k.plafond * 100),
      "Jours d'avance qu'il faudrait": k.necessaires,
      "Surcoût de l'escompte demandé, sur cette facture": k.surcout,
    });
    // Les jours qu'il faudrait dépassent ceux que le client avance : l'escompte demandé coûte plus que l'emprunt.
    expect(k.necessaires).toBeGreaterThan(k.jours);
    expect(k.surcout).toBeGreaterThan(0);
    const ecriture = s.etapes.find((e) => e.id === "ecriture") as EtapeEcriture;
    const e = ecriture.ecriture(cas);
    expect(equilibree(enEcriture(e))).toBe(true);
    expect(corriger(enSaisie(e), e).juste).toBe(true);
    expect(juste(s, cas, "reponse")).toMatch(/^Ne le généralisons pas : [\d,]+ % par an, contre /);
  });

  it("chez NOVA, les chiffres épinglés", () => {
    const cas = casDeLEntreprise("nova");
    const k = escompte(cas);
    expect([k.f.esc, k.f.nf, k.f.tva, k.f.ttc]).toEqual([538.08, 17_397.92, 3_479.58, 20_877.5]);
    expect([k.jours, centime(k.periode * 100), centime(k.annuel * 100), k.centiemes, k.necessaires, k.surcout]).toEqual([70, 3.09, 15.91, 96, 223, 368.93]);
    expect(juste(s, cas, "reponse")).toBe("Ne le généralisons pas : 15,9 % par an, contre 5 % pour l'emprunt");
    const demande = s.etapes[0]!;
    if (demande.type !== "lecture") throw new Error("la demande est une lecture");
    expect(demande.texte(cas)[0]).toContain("CampusTech paie à 80 jours, 20 jours au-delà des 60 jours convenus");
  });
});
