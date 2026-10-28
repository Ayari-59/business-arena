import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  DATE_DE_REVENTE,
  DEVIS_DU_FOURNISSEUR,
  IMMOBILISATIONS,
  MISE_EN_SERVICE_A_REBOURS,
  PRIX_DE_L_OCCASION,
  TAUX_D_IMPOT,
  compteDAmortissement,
  planDAmortissement,
} from "../../src/config/cours/chapitres/immobilisations";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CAS_DES_ENTREPRISES } from "../../src/config/cours/monde/cas-des-entreprises";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { DATE_DE_REPRISE, JOUR_DE_MISE_EN_SERVICE, UN_SECOND_EQUIPEMENT } from "../../src/config/cours/situations/par-chapitre/un-second-equipement";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { bilan, compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";

/**
 * IMMOBILISATIONS ET AMORTISSEMENTS, ET LEUR CAS « UN SECOND ÉQUIPEMENT », DANS LE MONDE DU COURS.
 *
 * Chaque chiffre attendu est refait ici à la main sur le cas figé de chaque entreprise
 * (monde/cas-des-entreprises.ts : le prix hors taxes, la mise en service du 6 janvier, la durée),
 * sans les fonctions du chapitre ni le modèle (monde/amortissement.ts) : le plan linéaire au prorata
 * des jours, le devis, la revente, le plan dégressif et son passage au linéaire, le calcul à rebours,
 * le curseur et le laboratoire, dans les neuf entreprises ; les valeurs de NOVA sont épinglées, celles
 * de la clôture comprises. Puis les verdicts, les écritures, et les gardes de texte de l'étalon.
 */

const etatVide: EtatDuCours = { soldes: {} };
/** L'arrondi au centime, sans l'erreur des flottants sur les demis. */
// Au centime, la moitié s'éloignant de zéro, après réduction à 15 chiffres : 11 930,625 € donne 11 930,63 €.
const centime = (x: number) => (Math.sign(x) * Math.round(Number((Math.abs(x) * 100).toPrecision(15)))) / 100 + 0;
const JOURS_DE_L_ANNEE = 360;
/** Un montant comme le cours l'écrit : « 42 500 € », « 57 222,22 € ». */
const euros = (x: number) => `${x.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(x) ? 0 : 2, maximumFractionDigits: 2 })} €`;
const JOURS_DU_MOIS = 30;

// ─────────────────────────────────────────────────────────────────────────────
// LES PLANS, REFAITS À LA MAIN
// ─────────────────────────────────────────────────────────────────────────────

/** Le coefficient fiscal du dégressif, selon la durée (le barème légal). */
const coefficientALaMain = (n: number) => (n <= 4 ? 1.25 : n <= 6 ? 1.75 : 2.25);

/** Le plan linéaire d'une base mise en service le jour j du mois m (mois de 30 jours, année de 360 jours, jour de départ compté). */
function lineaireALaMain(base: number, n: number, jour: number, mois: number) {
  const jours = JOURS_DU_MOIS - jour + 1 + (12 - mois) * JOURS_DU_MOIS;
  const annuite = base / n;
  const dotations = [centime((annuite * jours) / JOURS_DE_L_ANNEE)];
  while (centime(base - dotations.reduce((t, x) => t + x, 0)) > 0) {
    const reste = centime(base - dotations.reduce((t, x) => t + x, 0));
    dotations.push(Math.min(reste, centime(annuite)));
  }
  return { jours, annuite, dotations };
}

/** Le plan dégressif : le taux sur la valeur nette, la première année en mois, le passage au linéaire dès que 1 ÷ années restantes ≥ taux. */
function degressifALaMain(base: number, n: number, mois: number) {
  const t = coefficientALaMain(n) / n;
  const dotations: number[] = [];
  let vnc = base;
  let passage = -1;
  let constante = 0;
  for (let k = 0; k < n; k++) {
    const restantes = n - k;
    if (passage < 0 && k > 0 && 1 / restantes >= t) {
      passage = k;
      constante = centime(vnc / restantes);
    }
    const d = k === n - 1 ? vnc : passage >= 0 ? constante : centime(vnc * t * (k === 0 ? (12 - mois + 1) / 12 : 1));
    dotations.push(d);
    vnc = centime(vnc - d);
  }
  return { t, dotations, passage };
}

const somme = (xs: readonly number[]) => centime(xs.reduce((t, x) => t + x, 0));

/** Tout ce que le chapitre demande, pour une entreprise, à la main. */
function aLaMain(c: Cas) {
  const B = c.immobilisation.ht;
  const n = c.gestion.dureeAmortissementMois / 12;
  // Le 6 janvier, jour 6 de l'année : le 6 du premier mois.
  expect(c.immobilisation.date).toBe(6);
  const lin = lineaireALaMain(B, n, 6, 1);
  const deg = degressifALaMain(B, n, 1);
  const vncLin = (k: number) => centime(B - somme(lin.dotations.slice(0, k + 1)));
  // La revente au 30 juin de la 3e année : 180 jours de la 3e année.
  const dot3 = centime((lin.annuite * 180) / JOURS_DE_L_ANNEE);
  const cumul = centime(lin.dotations[0]! + lin.dotations[1]! + dot3);
  const prix = centime(B * 0.4);
  // La revente à la fin du mois m (compté depuis janvier de la 1re année), dans chaque mode.
  const cumulAuMois = (mode: "lin" | "deg", m: number) => {
    const k = Math.floor((m - 1) / 12);
    const mm = ((m - 1) % 12) + 1;
    if (mode === "lin") {
      const avant = somme(lin.dotations.slice(0, k));
      const jours = k === 0 ? mm * JOURS_DU_MOIS - 6 + 1 : mm * JOURS_DU_MOIS;
      const reste = centime(B - avant);
      return centime(avant + Math.min(reste, centime((lin.annuite * jours) / JOURS_DE_L_ANNEE)));
    }
    const avant = somme(deg.dotations.slice(0, k));
    const jours = mm * JOURS_DU_MOIS;
    return centime(avant + Math.min(centime(B - avant), centime((deg.dotations[k]! * jours) / JOURS_DE_L_ANNEE)));
  };
  const premierMois = (mode: "lin" | "deg") => {
    for (let m = 1; m <= 12 * n; m++) if (prix - (B - cumulAuMois(mode, m)) >= -1e-9) return m;
    return 12 * n;
  };
  // Le rebours : mise en service le 21 septembre, 10 jours de septembre puis 3 mois.
  const joursRebours = 30 - 21 + 1 + 3 * 30;
  const dotRebours = centime((lin.annuite * joursRebours) / JOURS_DE_L_ANNEE);
  return { B, n, lin, deg, vncLin, dot3, cumul, vnc: centime(B - cumul), prix, cumulAuMois, mD: premierMois("deg"), mL: premierMois("lin"), joursRebours, dotRebours };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES OUTILS DES GARDES (ceux de l'étalon)
// ─────────────────────────────────────────────────────────────────────────────

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

/** Les gardes de texte et de forme de l'étalon, dans une entreprise. */
function verifierLesTextes(ch: Chapitre, cas: Cas) {
  const chapitre = chapitreDuCas(ch, cas);
  expect(chapitre.etapes.length, `${ch.code} : une étape a disparu`).toBe(ch.etapes.length);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/l'arène (rejoue|joue|donne)|dans l'arène, il/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|douze|trente|cent) (ans|années?|mois|jours?|exercices?|équipements?)\b/i);
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
    if (e.type === "tri") {
      const codes = e.categories.map((k) => k.code);
      for (const x of e.elements(cas)) expect(codes, `${e.id} : ${x.libelle}`).toContain(x.categorie);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
}

const etapeDe = <T extends Etape>(ch: Chapitre, id: string) => {
  const e = ch.etapes.find((x) => x.id === id);
  if (!e) throw new Error(`${ch.code} : pas d'étape ${id}`);
  return e as T;
};
const attendus = (ch: Chapitre, id: string, cas: Cas) => Object.fromEntries(etapeDe<EtapeMontants>(ch, id).champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
const juste = (ch: Chapitre, id: string, cas: Cas) => etapeDe<EtapeChoix>(ch, id).options(cas, etatVide).find((o) => o.juste)!.texte;

function curseur(ch: Chapitre, id: string, cas: Cas) {
  const e = etapeDe<EtapeCurseur>(ch, id);
  expect(e.type, id).toBe("curseur");
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
  const e = etapeDe<EtapeSimulation>(ch, id);
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, depart, solution: { ...d.solution }, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)], atteint: d.atteint };
}

const BLOCS = [
  ["BTS CG P2 · Contrôle et production de l'information financière", "bts-cg"],
  ["DCG UE9 · Comptabilité", "dcg"],
  ["BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation", "but-gea"],
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// LE CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

describe("immobilisations : le chapitre, au monde du cours", () => {
  it("se joue dans les neuf entreprises, au palier 3 de la comptabilité générale, avec ses blocs", () => {
    const ch = IMMOBILISATIONS;
    expect(CHAPITRES).toContain(ch);
    expect(ch.entreprises).toBeUndefined();
    expect(ch.palier).toBe(3);
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.libre).toBe(false);
    expect(ch.blocs).toEqual(BLOCS.map(([b]) => b));
    for (const [b, ref] of BLOCS) {
      expect(referentielDeCitation(b)?.code, b).toBe(ref);
      expect(blocOfficiel(b, ref), b).not.toBeNull();
    }
    expect(new Set(ch.etapes.map((e) => e.id)).size).toBe(ch.etapes.length);
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.type).toBe("lecture");
    // Le gabarit : deux paris, un curseur, un laboratoire à levier à choix et graphique, des étapes d'expert à trois champs ou plus.
    expect(ch.etapes.filter((e) => e.id.startsWith("predire-")).map((e) => e.id)).toEqual(["predire-la-revente", "predire-le-degressif"]);
    expect(ch.etapes.filter((e) => e.type === "curseur").map((e) => e.id)).toEqual(["le-prix-de-revente"]);
    const labo = ch.etapes.find((e) => e.type === "simulation") as EtapeSimulation;
    const cas = casDeLEntreprise("nova");
    expect(labo.leviers(cas).some((l) => l.choix)).toBe(true);
    expect(labo.graphique).toBeDefined();
    for (const id of ["le-plan-degressif", "a-rebours"]) expect(etapeDe<EtapeMontants>(ch, id).champs(cas, etatVide).length, id).toBeGreaterThanOrEqual(3);
    // La synthèse finit par la phrase du monde du cours.
    const fin = ch.etapes.at(-1)!;
    if (fin.type !== "lecture") throw new Error("lecture attendue");
    expect(fin.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });

  it("les hypothèses du chapitre sont des constantes nommées", () => {
    expect(DEVIS_DU_FOURNISSEUR).toEqual({ remise: 0.05, livraison: 0.02, installation: 0.04, formation: 0.015, entretien: 0.025 });
    expect(PRIX_DE_L_OCCASION).toBe(0.4);
    expect(DATE_DE_REVENTE).toEqual({ jour: 30, mois: 6, exercice: 2 });
    expect(MISE_EN_SERVICE_A_REBOURS).toEqual({ jour: 21, mois: 9 });
    expect(TAUX_D_IMPOT).toBe(0.25);
    expect(compteDAmortissement("2154")).toBe("28154");
    expect(compteDAmortissement("2182")).toBe("28182");
  });

  it("chez NOVA, les chiffres épinglés : la ligne de la clôture, ses deux plans, sa revente", () => {
    const cas = casDeLEntreprise("nova");
    const m = aLaMain(cas);
    expect([m.B, m.n, m.lin.jours]).toEqual([60_000, 6, 355]);
    // La dotation de la clôture (monde/exercice-de-nova.ts) : 10 000 × 355 ÷ 360.
    expect(m.lin.dotations).toEqual([9_861.11, 10_000, 10_000, 10_000, 10_000, 10_000, 138.89]);
    expect(m.deg.dotations).toEqual([17_500, 12_395.83, 8_780.38, 7_107.93, 7_107.93, 7_107.93]);
    expect(m.deg.passage).toBe(3);
    expect([m.cumul, m.vnc, m.prix, centime(m.prix - m.vnc)]).toEqual([24_861.11, 35_138.89, 24_000, -11_138.89]);
    expect([m.mD, m.mL]).toEqual([33, 44]);
    expect([m.dotRebours, centime(m.B - m.dotRebours)]).toEqual([2_777.78, 57_222.22]);
    expect(juste(IMMOBILISATIONS, "le-degressif-et-l-impot", cas)).toBe("L'impôt est décalé, pas économisé : les dernières années porteront moins de dotations, 60\u202f000 € au total dans les deux plans");
    expect(etapeDe<EtapeChoix>(IMMOBILISATIONS, "le-degressif-et-l-impot").question(cas, etatVide)).toContain("7\u202f638,89 € de charges en plus cette année, c'est 1\u202f909,72 € d'impôt en moins");
  });

  it("les premiers mois sans moins-value, épinglés dans chaque entreprise : toujours plus tôt en dégressif", () => {
    const attendu: Record<string, [number, number]> = {
      nova: [33, 44],
      boutique: [28, 29],
      hotel: [34, 58],
      bistrot: [26, 37],
      conseil: [20, 22],
      ecommerce: [20, 22],
      fitness: [33, 44],
      batiment: [26, 37],
      transport: [26, 37],
    };
    expect(Object.keys(attendu).sort()).toEqual([...ENTREPRISES_DU_COURS].sort());
    for (const code of ENTREPRISES_DU_COURS) {
      const m = aLaMain(casDeLEntreprise(code));
      expect([m.mD, m.mL], code).toEqual(attendu[code]);
      expect(m.mD, code).toBeLessThan(m.mL);
    }
  });
});

describe.each(ENTREPRISES_DU_COURS)("immobilisations chez %s, refaites à la main", (code) => {
  const cas = casDeLEntreprise(code);
  const ch = IMMOBILISATIONS;
  const m = aLaMain(cas);
  const B = m.B;

  it("le cas vient du monde du cours", () => {
    expect(cas).toEqual(CAS_DES_ENTREPRISES[code]);
  });

  it("le devis : la remise et les frais de mise en service dans le coût, la formation et l'entretien en charges", () => {
    const net = centime(B - B * 0.05);
    const cout = centime(net + B * 0.02 + B * 0.04);
    expect(cout).toBe(centime(B * 1.01));
    expect(attendus(ch, "le-cout-d-acquisition", cas)).toEqual({
      "Prix net, après la remise": net,
      "Coût d'acquisition de l'équipement": cout,
      "Charges de l'exercice": centime(B * 0.015 + B * 0.025),
      "Annuité linéaire d'une année pleine": centime(cout / m.n),
    });
    const tri = etapeDe<EtapeTri>(ch, "charge-ou-immobilisation");
    expect(Object.fromEntries(tri.elements(cas).map((x) => [x.libelle, [x.montant, x.categorie]]))).toEqual({
      "Le prix catalogue": [B, "actif"],
      "La remise sur le prix": [-centime(B * 0.05), "actif"],
      "La livraison": [centime(B * 0.02), "actif"],
      "L'installation et les essais de mise en route": [centime(B * 0.04), "actif"],
      "La formation de l'équipe": [centime(B * 0.015), "charge"],
      "Le contrat d'entretien de la première année": [centime(B * 0.025), "charge"],
    });
    // La somme de ce qui va à l'actif est le coût d'acquisition.
    expect(centime(tri.elements(cas).filter((x) => x.categorie === "actif").reduce((t, x) => t + x.montant, 0))).toBe(cout);
  });

  it("le plan linéaire : prorata de 355 jours, annuités pleines, dernière année qui solde", () => {
    expect(m.lin.jours).toBe(355);
    expect(attendus(ch, "plan", cas)).toEqual({
      "Taux d'amortissement, en %": centime(100 / m.n),
      "Annuité d'une année pleine": centime(B / m.n),
      "Jours d'utilisation la première année": 355,
      "Dotation de la première année": m.lin.dotations[0],
      "Valeur nette comptable au 31 décembre": m.vncLin(0),
    });
    expect(m.lin.dotations.length).toBe(m.n + 1);
    expect(somme(m.lin.dotations)).toBe(B);
    expect(attendus(ch, "annees-suivantes", cas)).toEqual({
      "Dotation de la deuxième année": centime(B / m.n),
      "Valeur nette comptable à la fin de la deuxième année": m.vncLin(1),
      "Numéro de la dernière année d'amortissement": m.n + 1,
      "Dotation de la dernière année": centime(B - m.lin.dotations[0]! - (m.n - 1) * centime(B / m.n)),
    });
    // Le modèle du chapitre retrouve le plan fait à la main.
    expect(planDAmortissement(cas).lineaire.map((l) => l.dotation)).toEqual(m.lin.dotations);
  });

  it("la revente au 30 juin de la 3e année, au prix de l'occasion : 180 jours de la 3e année", () => {
    expect(attendus(ch, "revente", cas)).toEqual({
      "Dotation de la 3e année, jusqu'au 30 juin": m.dot3,
      "Amortissements cumulés à la revente": m.cumul,
      "Valeur nette comptable à la revente": m.vnc,
      "Résultat de cession": centime(m.prix - m.vnc),
    });
    expect(m.dot3).toBe(centime(B / m.n / 2));
  });

  it("le curseur du prix de revente : la frontière à la valeur nette, arrondie à l'euro au-dessus", () => {
    const attendu = Math.ceil(m.vnc - 1e-9);
    expect(curseur(ch, "le-prix-de-revente", cas)).toEqual({
      attendu,
      bornes: [0, B],
      droites: [0, m.vnc, B, m.vnc],
      lecture: {
        "Prix de revente": attendu,
        "Valeur nette comptable à la revente": m.vnc,
        "Résultat de cession": centime(attendu - m.vnc),
        "Charges de l'équipement, de l'achat à la revente": centime(B - attendu),
      },
    });
  });

  it("le plan dégressif : le coefficient légal, la première année en 12 mois, le passage au linéaire", () => {
    const k = coefficientALaMain(m.n);
    const restantes = m.n - m.deg.passage;
    expect(attendus(ch, "le-plan-degressif", cas)).toEqual({
      "Taux dégressif, en %": centime((100 * k) / m.n),
      "Dotation dégressive de la première année": centime((B * k) / m.n),
      "Dotation dégressive de la deuxième année": m.deg.dotations[1],
      "Numéro de l'année du passage au linéaire": m.deg.passage + 1,
      "Dotation de chaque année après le passage": centime((B - somme(m.deg.dotations.slice(0, m.deg.passage))) / restantes),
    });
    expect(somme(m.deg.dotations)).toBe(B);
    expect(m.deg.dotations.length).toBe(m.n);
    // Avant le passage, le taux linéaire des années restantes ne dépassait pas le taux dégressif.
    expect(1 / (restantes + 1)).toBeLessThan(m.deg.t);
    expect(1 / restantes).toBeGreaterThanOrEqual(m.deg.t);
    expect(planDAmortissement(cas).degressif.map((l) => l.dotation)).toEqual(m.deg.dotations);
  });

  it("le laboratoire du plan : lecture au départ (linéaire, 30 juin de la 3e année) et à la solution (dégressif, premier mois sans moins-value)", () => {
    const l = laboratoire(ch, "le-laboratoire-du-plan", cas);
    expect(l.depart).toEqual({ mode: 0, mois: 30 });
    expect(l.solution).toEqual({ mode: 1, mois: m.mD });
    expect(l.reussi).toEqual([false, true]);
    const lire = (mode: "lin" | "deg", mois: number) => {
      const cumul = m.cumulAuMois(mode, mois);
      const resultat = centime(m.prix - (B - cumul));
      return {
        "Dotations cumulées jusqu'à la revente": cumul,
        "Valeur nette comptable à la revente": centime(B - cumul),
        "Prix offert": m.prix,
        "Résultat de cession": resultat,
        "Dotations et résultat de cession réunis": centime(resultat - cumul),
      };
    };
    expect(l.auDepart).toEqual(lire("lin", 30));
    expect(l.auDepart["Dotations cumulées jusqu'à la revente"]).toBe(m.cumul);
    expect(l.aLaSolution).toEqual(lire("deg", m.mD));
    // Dotations et résultat de cession réunis : le prix offert moins le prix d'achat, dans les deux modes.
    expect(l.auDepart["Dotations et résultat de cession réunis"]).toBe(centime(m.prix - B));
    expect(l.aLaSolution["Dotations et résultat de cession réunis"]).toBe(centime(m.prix - B));
    // La solution est la première : un mois plus tôt, aucun mode ne revend sans moins-value ; au même mois, le linéaire en fait une.
    expect(l.atteint({ mode: 0, mois: m.mD })).toBe(false);
    if (m.mD > 1) for (const mode of [0, 1]) expect(l.atteint({ mode, mois: m.mD - 1 })).toBe(false);
    // Le graphique : les deux valeurs nettes en quelques points, et le prix offert à plat.
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("mois");
    const [vl, vd, px] = g.courbes;
    for (const mois of [1, 12, 13, m.mD, 12 * m.n]) {
      expect(vl!.valeur({ mode: 0, mois }), `${mois}`).toBe(centime(B - m.cumulAuMois("lin", mois)));
      expect(vd!.valeur({ mode: 0, mois }), `${mois}`).toBe(centime(B - m.cumulAuMois("deg", mois)));
      expect(px!.valeur({ mode: 1, mois })).toBe(m.prix);
    }
    // La valeur nette dégressive est sous la linéaire, et sa courbe n'est pas une droite.
    for (let mois = 1; mois <= 12 * m.n; mois++) expect(vd!.valeur({ mode: 0, mois }), `${mois}`).toBeLessThanOrEqual(vl!.valeur({ mode: 0, mois }));
    expect(vd!.valeur({ mode: 0, mois: 1 }) - vd!.valeur({ mode: 0, mois: 12 })).toBeGreaterThan(vd!.valeur({ mode: 0, mois: 13 }) - vd!.valeur({ mode: 0, mois: 24 }));
  });

  it("le calcul à rebours : la valeur nette donne la dotation, les jours, puis le 21 septembre", () => {
    expect(m.joursRebours).toBe(100);
    expect(attendus(ch, "a-rebours", cas)).toEqual({
      "Dotation de la première année": m.dotRebours,
      "Jours d'utilisation": 100,
      "Mois de la mise en service, de 1 à 12": 9,
      "Jour du mois de la mise en service": 21,
    });
    // Le chemin à rebours retombe sur les 100 jours, à l'arrondi près.
    expect(Math.round((m.dotRebours * JOURS_DE_L_ANNEE) / (B / m.n))).toBe(100);
    expect(etapeDe<EtapeMontants>(ch, "a-rebours").question(cas, etatVide)).toContain(`valeur nette de ${euros(centime(B - m.dotRebours))}`);
  });

  it("les verdicts : la valeur nette fait la frontière, le dégressif baisse la valeur nette, l'impôt est décalé", () => {
    expect(juste(ch, "predire-la-revente", cas)).toBe("La valeur nette comptable de l'équipement ce jour-là");
    expect(juste(ch, "predire-le-degressif", cas)).toBe("Plus basse : les premières années portent plus de charges");
    expect(juste(ch, "tresorerie", cas)).toBe("Non : l'argent est sorti à l'achat. La dotation répartit ce coût sur les années, sans nouveau paiement.");
    expect(juste(ch, "le-degressif-et-l-impot", cas)).toMatch(/^L'impôt est décalé, pas économisé/);
    const ecart = centime((B * coefficientALaMain(m.n)) / m.n - m.lin.dotations[0]!);
    expect(planDAmortissement(cas).impotDecale).toBe(centime(ecart * 0.25));
  });

  it("les écritures s'équilibrent sur des comptes du plan ; la dotation ne touche pas la banque, le bilan montre la valeur nette", () => {
    const compte = compteDAmortissement(cas.immobilisation.compte);
    expect(compteDuPlan(compte), compte).toBeDefined();
    for (const e of ch.etapes) {
      if (e.type !== "ecriture") continue;
      const a = e.ecriture(cas);
      expect(equilibree(enEcriture(a)), e.id).toBe(true);
      for (const l of a.lignes) {
        expect(compteDuPlan(l.compte), `${e.id} : ${l.compte}`).toBeDefined();
        for (const x of l.acceptes ?? []) expect(compteDuPlan(x), `${e.id} : ${x}`).toBeDefined();
      }
      expect(corriger(enSaisie(a), a).juste, e.id).toBe(true);
    }
    const i = ch.etapes.findIndex((e) => e.id === "dotation");
    const avant = etatAvant(ch, cas, i).soldes;
    const apres = etatAvant(ch, cas, i + 1).soldes;
    expect(apres["512"]).toBe(avant["512"]);
    expect(apres["512"]).toBe(-cas.immobilisation.ttc);
    expect(compteDeResultat(apres).totalCharges).toBeCloseTo(m.lin.dotations[0]!, 2);
    expect(bilan(apres).actif.find((l) => l.libelle === "Immobilisations")!.montant).toBeCloseTo(m.vncLin(0), 2);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch, cas));
});

describe("immobilisations : une dotation passée au crédit du compte de l'équipement est refusée", () => {
  it("l'usure se cumule à part, au compte 28", () => {
    const cas = casDeLEntreprise("nova");
    const etape = etapeDe(IMMOBILISATIONS, "dotation");
    if (etape.type !== "ecriture") throw new Error("écriture attendue");
    const c = corriger(
      [
        { compte: "6811", debit: "9861,11", credit: "" },
        { compte: cas.immobilisation.compte, debit: "", credit: "9861,11" },
      ],
      etape.ecriture(cas),
    );
    expect(c.juste).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LE CAS
// ─────────────────────────────────────────────────────────────────────────────

/** Ce qu'un cas dédié doit tenir, et sa réponse qui ne se devine pas à sa longueur. */
function casDedie(s: Situation, ch: Chapitre, cas: Cas) {
  expect(s.reprend).toEqual([ch.code]);
  expect(casDuChapitre(ch.code)).toBe(s);
  expect(SITUATIONS).toContain(s);
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
    const j = options.find((o) => o.juste)!;
    expect(j.texte.length, `${s.code} / ${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

describe("un second équipement : le cas, refait à la main", () => {
  const s = UN_SECOND_EQUIPEMENT;

  it("ses hypothèses : le 16 avril, la reprise au 31 décembre de la 3e année", () => {
    expect(JOUR_DE_MISE_EN_SERVICE).toBe(106);
    expect(DATE_DE_REPRISE).toEqual({ jour: 31, mois: 12, exercice: 2 });
    expect(s.commanditaire).toBe("La direction");
    expect(s.etapes.filter((e) => e.type === "curseur").map((e) => e.id)).toEqual(["le-prix-de-reprise"]);
  });

  it("chez NOVA, les chiffres épinglés et la réponse", () => {
    const cas = casDeLEntreprise("nova");
    expect(attendus(s, "cout-d-entree", cas)).toEqual({ "Prix net, après la remise": 57_000, "Coût d'acquisition, hors taxes": 60_600, "Charges de l'exercice": 2_400, "TVA de l'équipement installé": 12_120 });
    expect(attendus(s, "les-deux-plans", cas)).toEqual({
      "Jours d'utilisation, en linéaire": 255,
      "Dotation linéaire de l'année": 7_154.17,
      "Mois comptés, en dégressif": 9,
      "Dotation dégressive de l'année": 13_256.25,
      "Impôt en moins cette année, en dégressif": 1_525.52,
    });
    expect(attendus(s, "sur-trois-exercices", cas)).toEqual({
      "Dotations des 3 exercices, en linéaire": 27_354.17,
      "Résultat de cession, en linéaire": -9_245.83,
      "Dotations des 3 exercices, en dégressif": 36_845.93,
      "Résultat de cession, en dégressif": 245.93,
      "Charges nettes des 3 exercices, dans l'un ou l'autre mode": 36_600,
    });
    expect(juste(s, "reponse", cas)).toBe("Le dégressif décale 1\u202f525,52 € d'impôt sans en économiser : le plan suit l'usure");
  });

  describe.each(ENTREPRISES_DU_COURS)("chez %s", (code) => {
    const cas = casDeLEntreprise(code);
    const B = cas.immobilisation.ht;
    const n = cas.gestion.dureeAmortissementMois / 12;
    const cout = centime(B * 1.01);
    // Le 16 avril : 15 jours d'avril, puis 8 mois ; en dégressif, d'avril à décembre, 9 mois.
    const lin = lineaireALaMain(cout, n, 16, 4);
    const deg = degressifALaMain(cout, n, 4);
    const prix = centime(B * 0.4);
    const dotLin3 = somme(lin.dotations.slice(0, 3));
    const dotDeg3 = somme(deg.dotations.slice(0, 3));
    const resLin = centime(prix - (cout - dotLin3));
    const resDeg = centime(prix - (cout - dotDeg3));

    it("le coût d'entrée, l'achat, et la première année dans les deux modes", () => {
      expect(lin.jours).toBe(255);
      expect(attendus(s, "cout-d-entree", cas)).toEqual({
        "Prix net, après la remise": centime(B * 0.95),
        "Coût d'acquisition, hors taxes": cout,
        "Charges de l'exercice": centime(B * 0.04),
        "TVA de l'équipement installé": centime(cout * 0.2),
      });
      const achat = etapeDe(s, "achat");
      if (achat.type !== "ecriture") throw new Error("écriture attendue");
      const e = achat.ecriture(cas);
      expect(e.lignes.map((l) => [l.compte, l.sens, l.montant])).toEqual([
        [cas.immobilisation.compte, "debit", cout],
        ["44562", "debit", centime(cout * 0.2)],
        ["512", "credit", centime(cout * 1.2)],
      ]);
      expect(equilibree(enEcriture(e))).toBe(true);
      expect(corriger(enSaisie(e), e).juste).toBe(true);
      expect(attendus(s, "les-deux-plans", cas)).toEqual({
        "Jours d'utilisation, en linéaire": 255,
        "Dotation linéaire de l'année": centime((cout / n) * (255 / 360)),
        "Mois comptés, en dégressif": 9,
        "Dotation dégressive de l'année": centime(cout * (coefficientALaMain(n) / n) * (9 / 12)),
        "Impôt en moins cette année, en dégressif": centime((deg.dotations[0]! - lin.dotations[0]!) * 0.25),
      });
    });

    it("le croisement sur 3 exercices : le même total dans les deux modes, le coût moins le prix de reprise", () => {
      expect(attendus(s, "sur-trois-exercices", cas)).toEqual({
        "Dotations des 3 exercices, en linéaire": dotLin3,
        "Résultat de cession, en linéaire": resLin,
        "Dotations des 3 exercices, en dégressif": dotDeg3,
        "Résultat de cession, en dégressif": resDeg,
        "Charges nettes des 3 exercices, dans l'un ou l'autre mode": centime(cout - prix),
      });
      expect(centime(dotLin3 - resLin)).toBe(centime(cout - prix));
      expect(centime(dotDeg3 - resDeg)).toBe(centime(cout - prix));
      expect(resDeg).toBeGreaterThan(resLin);
    });

    it("le curseur du prix de reprise : la frontière à la valeur nette linéaire", () => {
      const vncLin = centime(cout - dotLin3);
      const vncDeg = centime(cout - dotDeg3);
      const attendu = Math.ceil(vncLin - 1e-9);
      expect(curseur(s, "le-prix-de-reprise", cas)).toEqual({
        attendu,
        bornes: [0, cout],
        droites: [0, vncLin, cout, vncLin],
        lecture: {
          "Valeur nette en linéaire": vncLin,
          "Valeur nette en dégressif": vncDeg,
          "Résultat de cession en linéaire": centime(attendu - vncLin),
          "Résultat de cession en dégressif": centime(attendu - vncDeg),
          "Charges des 3 exercices, dans l'un ou l'autre mode": centime(cout - attendu),
        },
      });
    });

    it("la réponse : le dégressif décale l'impôt sans l'économiser, et la bonne option ne se devine pas", () => {
      const impot = centime((deg.dotations[0]! - lin.dotations[0]!) * 0.25);
      expect(juste(s, "reponse", cas)).toBe(`Le dégressif décale ${euros(impot)} d'impôt sans en économiser : le plan suit l'usure`);
      casDedie(s, IMMOBILISATIONS, cas);
    });

    it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s, cas));
  });
});
