import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  DELAI_DU_CURSEUR,
  ENTREPRISES_DES_CONDITIONS,
  ESCOMPTE_DE_LA_SOLUTION,
  JOURNEES_DU_CURSEUR,
  LEVIERS_DU_LABORATOIRE,
  REMISES_ET_CONDITIONS,
  REMISE_DEMANDEE_AU_LABORATOIRE,
  delaiOuLEscompteVautLeDecouvert,
} from "../../src/config/cours/chapitres/remises-et-conditions";
import { ATLAS_CONDITIONS } from "../../src/config/cours/monde/delais-et-tva";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { COMMANDE_EN_PLUS, JOURNEES_DU_PALIER, LA_REMISE_PAR_PALIER, REMISE_DU_PALIER } from "../../src/config/cours/situations/par-chapitre/la-remise-par-palier";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * REMISES ET CONDITIONS, CHEZ ATLAS CONSEIL DU MONDE DU COURS, ET SON CAS : LA REMISE PAR PALIER.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de l'affaire (monde/delais-et-tva.ts,
 * `ATLAS_CONDITIONS`), sans les fonctions du chapitre ni le modèle (monde/delais.ts) ; les valeurs
 * absolues sont épinglées, les variantes (l'option pour les débits, le plus fort escompte, le palier
 * à rebours) refaites comme le reste, et les verdicts aussi. L'escompte se juge par UNE méthode, le
 * taux annuel (le découvert évité sur le net financier, pendant les seuls jours d'avance) : la garde
 * vérifie qu'aucun texte ne donne le point d'égalité de l'autre raccourci. Puis les gardes de texte de
 * l'étalon : rien d'indéfini, pas de « de le », pas de tiret au milieu d'une phrase, des élisions
 * faites, le signe moins, une seule bonne réponse, aucune option qui en contient une autre, des
 * libellés uniques, des notions qui existent.
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "conseil";
const cas = casDeLEntreprise(code);
const f = ATLAS_CONDITIONS;
const centime = (x: number) => Math.round(x * 100) / 100;

function textesDe(e: Etape, c: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(c);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(c), e.repere?.(c) ?? "", ...tableau];
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
      return [e.titre, e.question(c), d.consigne, d.indice(depart), ...e.explication(c, d.solution), ...e.lecture(c, d.solution).map((l) => l.libelle), ...e.leviers(c).flatMap((l) => [l.libelle, l.unite]), ...(g?.courbes.map((x) => x.libelle) ?? [])];
    }
    default:
      return [e.titre];
  }
}

const PARTICIPES = ["vendu", "commandé", "facturé", "demandé", "payé", "accordé", "gagné", "perdu"];

/** Les gardes de texte et de forme, communes au chapitre et au cas (celles de l'étalon). */
function verifierLesTextes(ch: Chapitre) {
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|vingt|trente|quarante|soixante|cent) (journées?|jours?|points?)\b/i);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
      // L'arène ne joue plus : ni l'emprunt du cas, ni l'arène qui rejoue (la synthèse seule la nomme).
      expect(x, `${e.id} : ${x}`).not.toMatch(/\bemprunt\b|l'arène (rejoue|joue)/);
      // Une seule méthode pour l'escompte : jamais le point d'égalité de l'autre raccourci (80 jours).
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b80 jours\b/);
      // La TVA due dès la facture n'est dite que pour l'option pour les débits ou pour des biens.
      if (/TVA[^.]*due dès la facture/.test(x)) expect(x, `${e.id} : ${x}`).toMatch(/option|biens?/);
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
      if (champs.some((x) => /^Écart/.test(x.libelle))) expect(e.question(cas, etat), e.id).toMatch(/Négatif pour un écart (favorable|défavorable)/);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
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
    expect(juste.texte.length, `${s.code} / ${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, id: string): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  expect(e?.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

/** Un curseur : son attendu, ses droites aux deux bornes, et sa lecture à l'attendu, par libellé. */
function curseur(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeCurseur;
  expect(e.type, id).toBe("curseur");
  const k = e.cible(cas);
  const d = e.droites(cas);
  const min = k.min ?? 0;
  // L'attendu est bien la position que le sens désigne : la plus petite qui couvre, ou la plus grande.
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

// LA FICHE, REFAITE À LA MAIN.
const brut = f.journees * f.prixHT;
const remise = brut * f.remise;
const nc = brut - remise;
const escompte = nc * f.escompte.taux;
const nf = nc - escompte;
const tva = centime(nf * f.tauxDeTva);
const ttcSansEscompte = nc * (1 + f.tauxDeTva);
const coutsVariables = f.journees * f.coutVariableHT;
const margeCatalogue = f.journees * (f.prixHT - f.coutVariableHT);
const marge = nc - coutsVariables;
const credit = (nc * f.tauxDeFinancement * f.delai) / 360;
const resultat = marge - credit;
const avance = f.delai - f.escompte.jours;
const tauxAnnuel = (f.escompte.taux / (1 - f.escompte.taux)) * (360 / avance);
const evite = (j: number) => (nf * f.tauxDeFinancement * (j - f.escompte.jours)) / 360;

describe("remises et conditions : le chapitre, chez ATLAS CONSEIL du monde du cours", () => {
  const ch = REMISES_ET_CONDITIONS;

  it("se joue chez ATLAS CONSEIL seule, au palier 2 du BTS NDRC, avec ses blocs", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.parcours).toBe("ndrc");
    expect(ch.palier).toBe(2);
    expect(ch.entreprises?.codes).toEqual(["conseil"]);
    expect(ENTREPRISES_DES_CONDITIONS).toEqual(["conseil"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(ch.entreprises!.pourquoi).toMatch(/encaissement/);
    expect(ch.blocs).toEqual(["BTS NDRC Bloc 1 · Relation client et négociation-vente", "BUT TC · Vendre une offre commerciale"]);
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(f.entreprise).toBe(cas.entreprise);
    expect(f.client).toBe("Kerval Distribution");
    expect(f.nature).toBe("services");
    expect(SITUATIONS).toContain(LA_REMISE_PAR_PALIER);
  });

  it("la fiche donne les chiffres de la consigne", () => {
    expect([brut, remise, nc, escompte, nf, tva, nf + tva, ttcSansEscompte]).toEqual([32_000, 1_600, 30_400, 608, 29_792, 5_958.4, 35_750.4, 36_480]);
    expect([margeCatalogue, marge, centime((remise / margeCatalogue) * 100)]).toEqual([26_000, 24_400, 6.15]);
    expect([credit, resultat]).toEqual([456, 23_944]);
    expect([avance, centime(tauxAnnuel * 100), centime(evite(f.delai))]).toEqual([50, 14.69, 372.4]);
  });

  it("l'intro dit les hypothèses de la simulation, et la synthèse finit sur l'arène", () => {
    const intro = ch.etapes[0]!;
    if (intro.type !== "lecture") throw new Error("intro");
    const texte = intro.texte(cas).join(" ");
    expect(texte).toMatch(/simulation du cours/);
    expect(texte).toMatch(/120 journées achetées en N/);
    expect(texte).toMatch(/découvert, à 9 % l'an/);
    expect(texte).toMatch(/n'est due qu'à l'encaissement \(il n'a pas opté pour les débits\)/);
    expect(intro.tableau!(cas).lignes.map((l) => [l.libelle, l.valeurs[0]])).toEqual([
      ["Journées commandées", "40"],
      ["Prix catalogue d'une journée (HT)", "800 €"],
      ["Coût variable d'une journée (HT)", "150 €"],
      ["Remise sur la commande", "5 %"],
      ["Escompte pour un paiement sous 10 jours", "2 %"],
      ["Délai de paiement, sans escompte", "60 jours"],
      ["Taux du découvert du cabinet, l'an", "9 %"],
      ["TVA, due à l'encaissement", "20 %"],
    ]);
    const synthese = ch.etapes.at(-1)!;
    if (synthese.type !== "lecture") throw new Error("synthese");
    expect(synthese.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
    expect(synthese.tableau!(cas).lignes.map((l) => l.valeurs[0])).toEqual(["26 000 €", "−1 600 €", "−456 €", "23 944 €", "−608 €", "372,40 €"]);
  });

  it("les étapes guidées : la facture, la marge, le crédit hors taxes", () => {
    expect(attendus(ch, "facture")).toEqual({
      "Montant brut (HT)": brut,
      Remise: remise,
      "Net commercial (HT)": nc,
      Escompte: escompte,
      "Net financier (HT)": nf,
      TVA: tva,
      "Net à payer (TTC)": centime(nf + tva),
    });
    expect(attendus(ch, "marge")).toEqual({ "Marge au prix catalogue (HT)": margeCatalogue, "Marge après remise (HT)": marge, "Part de la marge cédée (%)": 6.15 });
    // La remise sort tout entière de la marge.
    expect(margeCatalogue - marge).toBe(remise);
    expect(attendus(ch, "le-credit")).toEqual({ "Coût du crédit accordé": credit, "Résultat de l'affaire (HT)": resultat });
  });

  it("le curseur de la contrepartie, refait à la main : 43 journées au prix remisé", () => {
    const prixRemise = f.prixHT * (1 - f.remise);
    const parJournee = prixRemise - f.coutVariableHT;
    expect([prixRemise, parJournee]).toEqual([760, 610]);
    const q = Math.ceil(margeCatalogue / parJournee);
    expect(q).toBe(43);
    expect(42 * parJournee).toBeLessThan(margeCatalogue);
    expect(JOURNEES_DU_CURSEUR).toEqual({ min: 30, max: 60 });
    expect(curseur(ch, "la-contrepartie-au-curseur")).toEqual({
      attendu: q,
      bornes: [30, 60],
      droites: [30 * parJournee, margeCatalogue, 60 * parJournee, margeCatalogue],
      lecture: {
        "Chiffre d'affaires au prix remisé (HT)": q * prixRemise,
        "Coûts variables (HT)": q * f.coutVariableHT,
        "Marge après remise (HT)": q * parJournee,
        "Marge du prix catalogue à retrouver (HT)": margeCatalogue,
        "Marge en plus ou en moins": q * parJournee - margeCatalogue,
      },
    });
    expect(q * parJournee - margeCatalogue).toBe(230);
    // Le pari : au prorata de la remise, 5 % de 40 journées, il en faudrait 2 ; il en faut 3.
    expect(f.journees * f.remise).toBe(2);
    expect(juste(ch, "predire-la-contrepartie")).toBe("Plus de 2 : chaque journée remisée laisse moins de marge");
    expect(attendus(ch, "contrepartie")).toEqual({
      "Prix remisé d'une journée (HT)": prixRemise,
      "Marge d'une journée remisée (HT)": parJournee,
      "Commande qui paie la remise": q,
      "Journées à obtenir en plus": q - f.journees,
    });
  });

  it("le crédit se finance hors taxes : la TVA d'un service n'est due qu'à l'encaissement", () => {
    expect(juste(ch, "qui-avance-la-tva")).toBe("La TVA d'un service n'est due qu'à l'encaissement : le cabinet ne l'avance pas");
    // La variante : avec l'option pour les débits, le cabinet financerait le TTC.
    const creditTTC = (ttcSansEscompte * f.tauxDeFinancement * f.delai) / 360;
    expect(attendus(ch, "l-option-pour-les-debits")).toEqual({
      "TVA avancée pour le client": ttcSansEscompte - nc,
      "Coût du crédit, TVA avancée comprise": creditTTC,
      "Ce que l'option coûte de plus": centime(creditTTC - credit),
    });
    expect([ttcSansEscompte - nc, creditTTC, centime(creditTTC - credit)]).toEqual([6_080, 547.2, 91.2]);
    expect(centime(creditTTC - credit)).toBe(centime(((ttcSansEscompte - nc) * f.tauxDeFinancement * f.delai) / 360));
  });

  it("le curseur de l'escompte, refait à la main : le découvert évité ne couvre l'escompte qu'à 92 jours", () => {
    // Le découvert évité, 29 792 € × 9 % × (j − 10) ÷ 360, face à l'escompte de 608 € : égaux à 10 + 608 × 360 ÷ (29 792 × 9 %).
    const egalite = f.escompte.jours + (escompte * 360) / (nf * f.tauxDeFinancement);
    expect(centime(egalite)).toBe(91.63);
    // C'est le même point que par le taux annuel : 10 + t ÷ (1 − t) × 360 ÷ taux.
    expect(egalite).toBeCloseTo(f.escompte.jours + ((0.02 / 0.98) * 360) / 0.09, 9);
    expect(delaiOuLEscompteVautLeDecouvert(0.02, 10, 0.09)).toBeCloseTo(egalite, 9);
    expect(DELAI_DU_CURSEUR).toEqual({ min: 30, max: 120 });
    expect(curseur(ch, "l-escompte-au-curseur")).toEqual({
      attendu: 92,
      bornes: [30, 120],
      droites: [centime(evite(30)), escompte, centime(evite(120)), escompte],
      lecture: { "Escompte cédé": escompte, "Découvert évité par le paiement à 10 jours": centime(evite(92)), "Découvert évité moins escompte": centime(evite(92) - escompte) },
    });
    expect([centime(evite(30)), centime(evite(92)), centime(evite(120))]).toEqual([148.96, 610.74, 819.28]);
    expect(evite(91)).toBeLessThan(escompte);
    // Au délai convenu, l'escompte coûte 608 € pour 372,40 € de découvert évité.
    expect(centime(escompte - evite(60))).toBe(235.6);
    expect(juste(ch, "predire-l-escompte")).toBe("Plus cher que le découvert, une fois ramené à l'année");
  });

  it("la formalisation : le taux annuel de l'escompte, et le raisonnement qui tient", () => {
    expect(attendus(ch, "le-taux-annuel")).toEqual({ "Jours d'avance": 50, "Taux annuel de l'escompte (%)": 14.69, "Découvert évité": 372.4 });
    // Le curseur et le taux annuel disent la même chose : 608 ÷ 372,40 = 14,69 % ÷ 9 %.
    expect(escompte / evite(f.delai)).toBeCloseTo(tauxAnnuel / f.tauxDeFinancement, 9);
    expect(juste(ch, "quel-raisonnement")).toBe("Le retirer : ramené à l'année, il coûte 14,69 %, plus que le découvert");
  });

  it("l'expert à rebours : le plus fort escompte que le découvert justifie, 1,23 %", () => {
    const x = (f.tauxDeFinancement * avance) / 360;
    const t = x / (1 + x);
    expect(attendus(ch, "escompte-maximal")).toEqual({
      "Coût du découvert sur 50 jours (%)": 1.25,
      "Escompte le plus fort (%)": 1.23,
      "Escompte le plus fort sur la facture": centime(nc * t),
    });
    expect(centime(nc * t)).toBe(375.31);
    // À cet escompte, le taux annuel vaut le découvert, et l'escompte vaut le découvert qu'il évite.
    expect((t / (1 - t)) * (360 / avance)).toBeCloseTo(f.tauxDeFinancement, 12);
    expect(nc * t).toBeCloseTo(((nc - nc * t) * f.tauxDeFinancement * avance) / 360, 9);
  });

  it("le laboratoire des conditions : accorder 10 % sans rien perdre", () => {
    const l = laboratoire(ch, "le-laboratoire-des-conditions");
    expect(LEVIERS_DU_LABORATOIRE).toEqual({
      remise: { min: 0, max: 20, pas: 1 },
      escompte: { min: 0, max: 3, pas: 0.25 },
      delai: { min: 30, max: 120, pas: 5 },
      journees: { min: 30, max: 60, pas: 1 },
    });
    expect([REMISE_DEMANDEE_AU_LABORATOIRE, ESCOMPTE_DE_LA_SOLUTION]).toEqual([0.1, 0.01]);
    expect(l.depart).toEqual({ remise: 5, escompte: 2, delai: 60, journees: 40 });
    expect(l.solution).toEqual({ remise: 10, escompte: 1, delai: 60, journees: 43 });
    expect(l.reussi).toEqual([false, true]);
    /** L'affaire refaite à la main pour une position des leviers. */
    const lire = (r: number, e: number, d: number, j: number) => {
      const b = j * f.prixHT;
      const n = b * (1 - r / 100);
      const m = n - j * f.coutVariableHT;
      const cr = centime((n * f.tauxDeFinancement * d) / 360);
      const es = centime(n * (e / 100));
      const ev = centime(((n - es) * f.tauxDeFinancement * (d - f.escompte.jours)) / 360);
      return {
        "Net commercial (HT)": n,
        "Marge après remise (HT)": m,
        "Marge cédée par la remise": -(j * (f.prixHT - f.coutVariableHT) - m),
        "Coût du crédit accordé": -cr,
        "Résultat de l'affaire, payée à l'échéance": centime(m - cr),
        "Taux annuel de l'escompte": centime((e / 100 / (1 - e / 100)) * (360 / (d - f.escompte.jours)) * 100),
        "Escompte cédé, s'il est pris": es,
        "Découvert que l'escompte évite": ev,
        "Effet de l'escompte, s'il est pris": centime(ev - es),
      };
    };
    expect(l.auDepart).toEqual(lire(5, 2, 60, 40));
    expect(Object.values(l.auDepart)).toEqual([30_400, 24_400, -1_600, -456, 23_944, 14.69, 608, 372.4, -235.6]);
    expect(l.aLaSolution).toEqual(lire(10, 1, 60, 43));
    expect(Object.values(l.aLaSolution)).toEqual([30_960, 24_510, -3_440, -464.4, 24_045.6, 7.27, 309.6, 383.13, 73.53]);
    // 42 journées ne paient pas les 10 % ; d'autres chemins relèvent le défi, d'autres non.
    expect(lire(10, 0, 60, 42)["Résultat de l'affaire, payée à l'échéance"]).toBe(23_486.4);
    const essai = (remise: number, escompte: number, delai: number, journees: number) => l.d.atteint({ remise, escompte, delai, journees });
    expect(essai(10, 0, 60, 43)).toBe(true);
    expect(essai(10, 1, 60, 42)).toBe(false);
    expect(essai(10, 1.25, 60, 43)).toBe(false);
    expect(essai(10, 1, 65, 43)).toBe(false);
    // Raccourcir le délai coûte moins de crédit, mais rend l'escompte plus cher en taux annuel.
    expect(essai(10, 0.5, 30, 43)).toBe(false);
    expect(essai(10, 0.25, 30, 43)).toBe(true);
    expect(lire(10, 0.5, 30, 43)["Taux annuel de l'escompte"]).toBe(9.05);
  });

  it("le graphique du laboratoire : le taux annuel de l'escompte selon le délai, une hyperbole qui croise le découvert vers 92 jours", () => {
    const { e } = laboratoire(ch, "le-laboratoire-des-conditions");
    const g = e.graphique!(cas);
    expect(g.levier).toBe("delai");
    expect(g.unite).toBe("%");
    const [escompteAnnuel, decouvert] = g.courbes;
    expect([escompteAnnuel!.libelle, decouvert!.libelle]).toEqual(["Taux annuel de l'escompte", "Taux du découvert"]);
    const t = (d: number, esc = 2) => escompteAnnuel!.valeur({ remise: 5, escompte: esc, delai: d, journees: 40 });
    const main = (d: number, esc = 2) => (esc / 100 / (1 - esc / 100)) * (360 / (d - 10)) * 100;
    for (const d of [30, 60, 90, 95, 120]) expect(t(d)).toBeCloseTo(main(d), 9);
    expect([t(30), t(60), t(120)].map(centime)).toEqual([36.73, 14.69, 6.68]);
    expect(t(90)).toBeGreaterThan(9);
    expect(t(95)).toBeLessThan(9);
    expect(t(60, 1)).toBeCloseTo(main(60, 1), 9);
    expect(decouvert!.valeur({ remise: 5, escompte: 2, delai: 60, journees: 40 })).toBe(9);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("la remise par palier : le cas, chez ATLAS CONSEIL du monde du cours", () => {
  const s = LA_REMISE_PAR_PALIER;
  const ch = REMISES_ET_CONDITIONS;
  // La proposition, refaite à la main : 48 journées à 8 %.
  const j = f.journees * (1 + COMMANDE_EN_PLUS);
  const b = j * f.prixHT;
  const r = b * REMISE_DU_PALIER;
  const n = b - r;
  const m = n - j * f.coutVariableHT;
  const cr = centime((n * f.tauxDeFinancement * f.delai) / 360);
  const res = centime(m - cr);
  const prixDuPalier = f.prixHT * (1 - REMISE_DU_PALIER);
  const parJournee = centime(prixDuPalier - f.coutVariableHT - (prixDuPalier * f.tauxDeFinancement * f.delai) / 360);

  it("se joue où son chapitre se joue, et tient la forme d'un cas dédié", () => {
    casDedie(s, ch);
    expect(s.commanditaire).toBe("Le responsable des ventes");
    expect([REMISE_DU_PALIER, COMMANDE_EN_PLUS]).toEqual([0.08, 0.2]);
    expect(s.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
  });

  it("les deux commandes, refaites à la main", () => {
    expect([j, b, r, n, m, cr, res]).toEqual([48, 38_400, 3_072, 35_328, 28_128, 529.92, 27_598.08]);
    expect(attendus(s, "aujourd-hui")).toEqual({ "Net commercial (HT)": nc, "Marge de l'affaire (HT)": marge, "Coût du délai": credit, "Résultat de l'affaire (HT)": resultat });
    expect(attendus(s, "proposition")).toEqual({
      "Montant brut (HT)": b,
      Remise: r,
      "Net commercial (HT)": n,
      "Marge de l'affaire (HT)": m,
      "Coût du délai": cr,
      "Résultat de l'affaire (HT)": res,
    });
  });

  it("le curseur du cas : la plus petite commande qui garde, au palier, le résultat d'aujourd'hui", () => {
    // Une journée au palier : 736 − 150 − 736 × 9 % × 60 ÷ 360 = 574,96 € ; il faut 23 944 ÷ 574,96 = 41,6 journées.
    expect([prixDuPalier, parJournee]).toEqual([736, 574.96]);
    const minimale = Math.ceil(resultat / parJournee);
    expect(minimale).toBe(42);
    expect(41 * parJournee).toBeLessThan(resultat);
    // La même commande garde aussi la marge d'aujourd'hui : 24 400 ÷ (736 − 150) = 41,6.
    expect(Math.ceil(marge / (prixDuPalier - f.coutVariableHT))).toBe(42);
    expect(JOURNEES_DU_PALIER).toEqual({ min: 30, max: 60 });
    expect(curseur(s, "le-palier-au-curseur")).toEqual({
      attendu: minimale,
      bornes: [30, 60],
      droites: [centime(30 * parJournee), resultat, centime(60 * parJournee), resultat],
      lecture: {
        "Marge au palier (HT)": minimale * (prixDuPalier - f.coutVariableHT),
        "Coût du délai": centime(minimale * 11.04),
        "Résultat au palier, délai payé": centime(minimale * parJournee),
        "Résultat d'aujourd'hui": resultat,
      },
    });
    expect(centime(minimale * parJournee)).toBe(24_148.32);
  });

  it("à rebours : le volume qui paie le palier, la remise que paie le volume, le gain", () => {
    // La remise la plus forte sur 48 journées : (23 944 + 7 200) ÷ (1 − 1,5 %) = 31 618,27 € de net commercial au moins.
    const necessaire = (resultat + j * f.coutVariableHT) / (1 - (f.tauxDeFinancement * f.delai) / 360);
    const plusForte = Math.floor((1 - necessaire / b) * 10_000) / 100;
    expect(plusForte).toBe(17.66);
    expect(attendus(s, "a-rebours")).toEqual({
      "Résultat d'une journée au palier": parJournee,
      "Commande minimale au palier": 42,
      "Remise la plus forte sur 48 journées (%)": plusForte,
      "Résultat gagné par la proposition": centime(res - resultat),
    });
    expect(centime(res - resultat)).toBe(3_654.08);
    // À 17,66 %, la commande proposée garde encore le résultat ; à 17,67 %, plus.
    const auTaux = (t: number) => b * (1 - t) * (1 - (f.tauxDeFinancement * f.delai) / 360) - j * f.coutVariableHT;
    expect(auTaux(0.1766)).toBeGreaterThanOrEqual(resultat);
    expect(auTaux(0.1767)).toBeLessThan(resultat);
  });

  it("la réponse : accepter, mais n'accorder le palier qu'à partir du volume qui le paie", () => {
    // Accordés sur les 40 journées d'aujourd'hui, les 8 % font perdre : 29 440 − 6 000 − 441,60.
    const sans = centime(f.journees * f.prixHT * (1 - REMISE_DU_PALIER) * (1 - (f.tauxDeFinancement * f.delai) / 360) - f.journees * f.coutVariableHT);
    expect(sans).toBe(22_998.4);
    expect(centime(resultat - sans)).toBe(945.6);
    const e = s.etapes.find((x) => x.id === "reponse") as EtapeChoix;
    const options = e.options(cas, etatVide);
    expect(options.find((o) => o.juste)!.texte).toBe("Accepter, et n'accorder les 8 % qu'à partir de 42 journées");
    // Les distracteurs chiffrés : la remise en plus, la facture en plus, la marge en plus.
    expect(options.filter((o) => !o.juste).map((o) => o.texte)).toEqual([
      "Refuser : la remise en plus nous coûte 1 472 €",
      "Accepter : l'affaire nous rapporte 4 928 € de plus",
      "Accepter : le résultat de l'affaire monte de 3 728 €",
      "Accepter, et accorder les 8 % dès les 40 journées d'aujourd'hui",
    ]);
    expect([r - remise, n - nc, m - marge, centime(cr - credit)]).toEqual([1_472, 4_928, 3_728, 73.92]);
    expect(options.find((o) => o.texte.startsWith("Accepter, et accorder"))!.retour).toContain("22 998,40 €");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
