import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  CAMPAGNE_D_AFFICHAGE,
  PANIER_EN_PROMOTION,
  POINT_MORT_VISE,
  SEUIL_DU_POINT_DE_VENTE,
  seuilDuPointDeVente,
} from "../../src/config/cours/chapitres/seuil-du-point-de-vente";
import { MAILLE_ET_CO } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import {
  FERME_POUR_TRAVAUX,
  JOURS_DES_TRAVAUX_ACCELERES,
  JOURS_DE_FERMETURE,
  SUPPLEMENT_DES_TRAVAUX_ACCELERES,
  fermePourTravaux,
} from "../../src/config/cours/situations/par-chapitre/ferme-pour-travaux";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE SEUIL DE RENTABILITÉ DU POINT DE VENTE, À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : FERMÉ
 * POUR TRAVAUX.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de la boutique (monde/maille-et-co.ts),
 * sans les fonctions du chapitre ni le modèle (monde/boutique.ts) : les coûts variables référence par
 * référence, les charges fixes poste par poste, le seuil, l'indice de sécurité, le point mort, les jours
 * de fermeture, les passages et le panier plancher, les variantes (la remise, la campagne) et le calcul
 * à rebours. Les curseurs (attendu, position voisine, droites aux bornes, lecture), le laboratoire
 * (départ, solution, graphique) et les verdicts sont épinglés. Puis les gardes de texte de l'étalon.
 */

const etatVide: EtatDuCours = { soldes: {} };
const cas = casDeLEntreprise("boutique");
const f = MAILLE_ET_CO;
const centime = (x: number) => Math.round(x * 100) / 100 + 0;

// ─────────────────────────────────────────────────────────────────────────────
// LES GARDES DE L'ÉTALON
// ─────────────────────────────────────────────────────────────────────────────

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
      const g = e.graphique?.(c);
      return [
        e.titre,
        e.question(c),
        d.consigne,
        d.indice(depart),
        ...e.explication(c, d.solution),
        ...e.lecture(c, d.solution).map((l) => l.libelle),
        ...e.leviers(c).flatMap((l) => [l.libelle, l.unite]),
        ...(g?.courbes.map((x) => x.libelle) ?? []),
      ];
    }
    default:
      return [e.titre];
  }
}

/** Les gardes de texte et de forme, communes aux chapitres et aux cas (celles de l'étalon). */
function verifierLesTextes(ch: Chapitre) {
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|vingt|trente|cent) (articles?|pulls?|jours?|références?|commandes?|lignes?|passages?)\b/i);
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

/** Un curseur : son attendu (et sa position voisine), ses droites aux deux bornes, et sa lecture à l'attendu. */
function curseur(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeCurseur;
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

/** Un laboratoire : sa lecture au départ et à la solution, par libellé. */
function laboratoire(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE, REFAITE À LA MAIN
// ─────────────────────────────────────────────────────────────────────────────

// Janvier : vendus, prix hors taxes, coût d'achat et autres coûts variables d'un article.
const G = [
  { nom: "Pull col rond", q: 600, prix: 55, achat: 25, autres: 3.5 },
  { nom: "Cardigan", q: 360, prix: 75, achat: 34, autres: 4 },
  { nom: "Pull mérinos", q: 90, prix: 135, achat: 56, autres: 5 },
  { nom: "Écharpe", q: 330, prix: 35, achat: 14, autres: 2 },
  { nom: "Bonnet", q: 150, prix: 25, achat: 9.5, autres: 1.5 },
];
const CA = G.reduce((t, r) => t + r.q * r.prix, 0);
const CV = G.reduce((t, r) => t + r.q * (r.achat + r.autres), 0);
const MCV = CA - CV;
const taux = MCV / CA;
// Les charges fixes : loyer, l'équipe (10 100 € bruts × 1,42), publicité, entretien, usure.
const CF = 13_600 + 10_100 * 1.42 + 1_500 + 920 + 333;
const seuil = centime(CF / taux);
// Les commandes des comités d'entreprise, facturées à 45 jours, ne passent pas en caisse : un seul
// panier dans tout le cours, le chiffre d'affaires encaissé en caisse ÷ les passages en caisse.
const COMITES = 80 * 55 + 20 * 135 + 60 * 35 + 40 * 25;
const PASSAGES = 340 + 600;
const panier = (CA - COMITES) / PASSAGES;

describe("la fiche de la boutique donne les chiffres de la consigne", () => {
  it("la fiche est bien celle que le test refait", () => {
    expect(f.gamme.map((r) => [r.nom, r.ventesDuMois, r.prixHt, r.coutDAchat, r.autresCoutsVariables])).toEqual(G.map((r) => [r.nom, r.q, r.prix, r.achat, r.autres]));
    expect(f.charges).toEqual({ loyer: 13_600, publicite: 1_500, entretien: 920, amortissement: 333 });
    expect(f.equipe.reduce((t, s) => t + s.brutMensuel, 0)).toBe(10_100);
    expect(f.clienteles.filter((c) => c.delaiDeReglement === 0).reduce((t, c) => t + c.tickets, 0)).toBe(PASSAGES);
  });

  it("marge, seuil, sécurité, point mort", () => {
    expect([CA, CV, MCV, CF]).toEqual([87_450, 43_200, 44_250, 30_695]);
    expect(Math.round(taux * 1000) / 10).toBe(50.6);
    expect(seuil).toBe(60_661.64);
    expect(centime(CA - seuil)).toBe(26_788.36);
    expect(Math.round(((CA - seuil) / CA) * 1000) / 10).toBe(30.6);
    expect(Math.ceil((seuil / CA) * 30)).toBe(21);
    expect(MCV - CF).toBe(13_555);
  });
});

describe("le seuil du point de vente : le chapitre", () => {
  const ch = SEUIL_DU_POINT_DE_VENTE;

  it("se joue chez MAILLE & CO seule, au palier 3 du parcours MCO, avec ses blocs", () => {
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(FERME_POUR_TRAVAUX);
    expect(ch.parcours).toBe("mco");
    expect(ch.palier).toBe(3);
    expect(ch.entreprises?.codes).toEqual(["boutique"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(f.entreprise).toBe(cas.entreprise);
    for (const b of ch.blocs) {
      const ref = referentielDeCitation(b);
      expect(ref, b).not.toBeNull();
      expect(blocOfficiel(b, ref!.code), b).not.toBeNull();
    }
    expect(ch.etapes[0]!.type).toBe("lecture");
    const synthese = ch.etapes.at(-1)!;
    expect(synthese.id).toBe("synthese");
    if (synthese.type !== "lecture") throw new Error("La synthèse est une lecture");
    expect(synthese.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });

  it("les étapes guidées : la marge, les charges, le seuil", () => {
    expect(attendus(ch, "la-marge")).toEqual({ "Coûts variables du mois": CV, "Marge sur coût variable": MCV, "Taux de marge sur coût variable (%)": 50.6 });
    const tri = ch.etapes.find((e) => e.id === "les-charges") as EtapeTri;
    expect(Object.fromEntries(tri.elements(cas).map((x) => [x.libelle, [x.montant, x.categorie]]))).toEqual({
      "Prix d'achat des articles vendus": [G.reduce((t, r) => t + r.q * r.achat, 0), "variable"],
      "Emballages, étiquettes et frais de carte": [G.reduce((t, r) => t + r.q * r.autres, 0), "variable"],
      "Loyer et frais du local": [13_600, "fixe"],
      "Salaires et cotisations de l'équipe": [14_342, "fixe"],
      Publicité: [1_500, "fixe"],
      "Entretien de la boutique et de la vitrine": [920, "fixe"],
      "Usure du rayonnage": [333, "fixe"],
    });
    expect([G.reduce((t, r) => t + r.q * r.achat, 0), G.reduce((t, r) => t + r.q * r.autres, 0)]).toEqual([38_325, 4_875]);
    expect(attendus(ch, "le-seuil")).toEqual({ "Charges fixes du mois": CF, "Seuil de rentabilité": seuil, "Marge de sécurité": centime(CA - seuil), "Indice de sécurité (%)": 30.6 });
  });

  it("les étapes autonomes : le point mort, le jour fermé, les passages", () => {
    expect(attendus(ch, "le-point-mort")).toEqual({ "Point mort (jour du mois)": 21, "Marge sur coût variable d'un jour": MCV / 30, "Résultat du mois": MCV - CF });
    expect(MCV / 30).toBe(1_475);
    // Les jours de fermeture supportables : 30 × (1 − CF ÷ MCV) = 9,2.
    const j = Math.floor(30 * (1 - CF / MCV));
    expect(j).toBe(9);
    expect(attendus(ch, "ce-que-coute-un-jour-ferme")).toEqual({ "Marge perdue par jour fermé": 1_475, "Jours de fermeture supportables": j, "Résultat avec ces jours fermés": (MCV * (30 - j)) / 30 - CF });
    expect((MCV * 21) / 30 - CF).toBe(280);
    expect(attendus(ch, "en-passages")).toEqual({ "Panier moyen": centime(panier), "Passages en caisse au seuil": Math.ceil((seuil - COMITES) / panier) });
    expect([COMITES, centime(panier), Math.ceil((seuil - COMITES) / panier)]).toEqual([10_200, 82.18, 615]);
  });

  it("les étapes d'expert : la remise, le calcul à rebours, la campagne", () => {
    expect(PANIER_EN_PROMOTION).toBe(65);
    const caPromo = PASSAGES * 65 + COMITES;
    expect(attendus(ch, "le-panier-en-promotion")).toEqual({
      "Chiffre d'affaires avec la remise": caPromo,
      "Marge sur coût variable avec la remise": caPromo - CV,
      "Résultat du mois avec la remise": caPromo - CV - CF,
      "Panier plancher d'une remise": Math.ceil((CF + CV - COMITES) / PASSAGES),
    });
    expect([caPromo, caPromo - CV, caPromo - CV - CF, Math.ceil((CF + CV - COMITES) / PASSAGES)]).toEqual([71_300, 28_100, -2_595, 68]);
    // À rebours : l'indice de sécurité tombe à 20 %, le seuil d'alerte de la fiche.
    expect(f.seuilsDAlerte.indiceDeSecurite.seuil).toBe(0.2);
    const caFevrier = centime(seuil / 0.8);
    const margeFevrier = centime(caFevrier * taux);
    expect(attendus(ch, "a-rebours")).toEqual({ "Chiffre d'affaires de février": caFevrier, "Marge sur coût variable de février": margeFevrier, "Résultat de février": centime(margeFevrier - CF) });
    expect([caFevrier, margeFevrier, centime(margeFevrier - CF)]).toEqual([75_827.05, 38_368.75, 7_673.75]);
    // Le résultat vaut la marge de sécurité × le taux de marge.
    expect(centime((caFevrier - seuil) * taux)).toBeCloseTo(centime(margeFevrier - CF), 1);
    expect(CAMPAGNE_D_AFFICHAGE).toBe(1_500);
    const seuilCampagne = centime((CF + 1_500) / taux);
    expect(attendus(ch, "une-campagne-de-plus")).toEqual({
      "Seuil avec la campagne": seuilCampagne,
      "Point mort avec la campagne (jour du mois)": Math.ceil((seuilCampagne / CA) * 30),
      "Chiffre d'affaires en plus pour payer la campagne": centime(1_500 / taux),
    });
    expect([seuilCampagne, Math.ceil((seuilCampagne / CA) * 30), centime(1_500 / taux)]).toEqual([63_626.05, 22, 2_964.41]);
  });

  it("les verdicts : les paris, le plancher en question", () => {
    expect(juste(ch, "predire-le-point-mort")).toBe("Vers le 21 : quand les ventes cumulées atteignent le seuil");
    expect(juste(ch, "predire-la-fermeture")).toBe("Autant de jours que l'indice de sécurité en laisse");
    expect(juste(ch, "le-plancher-en-question")).toBe("Il ne vaut que si le panier baisse sans toucher au taux de marge : par la remise, le plancher monte");
  });

  it("les curseurs, refaits à la main : le point mort, la fermeture, le panier plancher", () => {
    // Le chiffre d'affaires cumulé, 2 915 € par jour, face au seuil.
    expect(CA / 30).toBe(2_915);
    expect(curseur(ch, "le-point-mort-au-curseur")).toEqual({
      attendu: 21,
      bornes: [0, 30],
      droites: [0, seuil, CA, seuil],
      lecture: { "Chiffre d'affaires cumulé": 21 * 2_915, "Marge sur coût variable cumulée": 21 * 1_475, "Charges fixes du mois": CF, "Résultat cumulé": 21 * 1_475 - CF },
    });
    // La marge des jours ouverts, 44 250 × (30 − j) ÷ 30, face aux charges fixes.
    expect(curseur(ch, "la-fermeture-au-curseur")).toEqual({
      attendu: 9,
      bornes: [0, 20],
      droites: [MCV, CF, (MCV * 10) / 30, CF],
      lecture: { "Chiffre d'affaires du mois": (CA * 21) / 30, "Marge sur coût variable": (MCV * 21) / 30, "Charges fixes du mois": CF, "Résultat du mois": 280 },
    });
    // La marge, (940 × p + 10 200) × taux, face aux charges fixes : (30 695 ÷ taux − 10 200) ÷ 940 = 53,68.
    const p = Math.ceil((CF / taux - COMITES) / PASSAGES);
    expect(p).toBe(54);
    const c = curseur(ch, "le-panier-plancher");
    expect([c.attendu, ...c.bornes]).toEqual([54, 45, 110]);
    expect(c.droites).toEqual([centime((PASSAGES * 45 + COMITES) * taux), CF, centime((PASSAGES * 110 + COMITES) * taux), CF]);
    const ca54 = PASSAGES * 54 + COMITES;
    expect(c.lecture).toEqual({ "Chiffre d'affaires du mois": ca54, "Marge sur coût variable": centime(ca54 * taux), "Charges fixes": CF, "Résultat du mois": centime(centime(ca54 * taux) - CF) });
    expect(c.lecture["Résultat du mois"]).toBe(150.97);
  });

  it("le laboratoire du seuil : avancer le point mort au 18, le seuil ne bouge pas", () => {
    const l = laboratoire(ch, "le-laboratoire-du-seuil");
    expect(POINT_MORT_VISE).toBe(18);
    expect(l.depart).toEqual({ passages: PASSAGES, panier: 0, fermeture: 0, jour: 30 });
    expect(l.solution).toEqual({ passages: 1_000, panier: 12, fermeture: 0, jour: 18 });
    expect(l.reussi).toEqual([false, true]);
    expect(l.auDepart).toEqual({
      "Chiffre d'affaires du mois": CA,
      "Seuil de rentabilité": seuil,
      "Chiffre d'affaires cumulé au jour lu": CA,
      "Point mort, jour du mois": 21,
      "Indice de sécurité": 30.6,
      "Résultat du mois": MCV - CF,
    });
    // 1 000 passages au panier de janvier plus 12 %, et les commandes des comités : 102 242,55 € sur le mois.
    const ca = centime(1_000 * panier * 1.12 + COMITES);
    expect(ca).toBe(102_242.55);
    const marge = centime(ca * taux);
    expect(l.aLaSolution).toEqual({
      "Chiffre d'affaires du mois": ca,
      "Seuil de rentabilité": seuil,
      "Chiffre d'affaires cumulé au jour lu": centime(((1_000 * panier * 1.12 + COMITES) / 30) * 18),
      "Point mort, jour du mois": Math.ceil((seuil / ca) * 30),
      "Indice de sécurité": Math.round(((ca - seuil) / ca) * 1000) / 10,
      "Résultat du mois": centime(marge - CF),
    });
    expect(Math.ceil((seuil / ca) * 30)).toBe(18);
    // Une fermeture de 3 jours au départ recule le point mort d'autant.
    const e = l.e;
    const fermee = Object.fromEntries(e.lecture(cas, { ...l.depart, fermeture: 3 }).map((x) => [x.libelle, x.montant]));
    expect(fermee["Point mort, jour du mois"]).toBe(24);
  });

  it("le graphique du laboratoire : le chiffre d'affaires cumulé jour par jour, face au seuil", () => {
    const { e } = laboratoire(ch, "le-laboratoire-du-seuil");
    const g = e.graphique!(cas);
    expect(g.levier).toBe("jour");
    const [cumule, ligne] = g.courbes;
    expect([cumule!.libelle, ligne!.libelle]).toEqual(["Chiffre d'affaires cumulé", "Seuil de rentabilité"]);
    const p = { passages: PASSAGES, panier: 0, fermeture: 5, jour: 0 };
    // Plat pendant les 5 jours fermés, puis 2 915 € par jour ouvert.
    expect([0, 5, 6, 26, 30].map((j) => centime(cumule!.valeur({ ...p, jour: j })))).toEqual([0, 0, 2_915, 21 * 2_915, 25 * 2_915]);
    expect(ligne!.valeur(p)).toBe(seuil);
    // Le jour où il passe le seuil est le point mort : le 21 sans fermeture, le 26 avec 5 jours fermés.
    expect(cumule!.valeur({ ...p, fermeture: 0, jour: 21 })).toBeGreaterThanOrEqual(seuil);
    expect(cumule!.valeur({ ...p, fermeture: 0, jour: 20 })).toBeLessThan(seuil);
    expect(cumule!.valeur({ ...p, jour: 26 })).toBeGreaterThanOrEqual(seuil);
    expect(cumule!.valeur({ ...p, jour: 25 })).toBeLessThan(seuil);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("fermé pour travaux : le cas", () => {
  const s = FERME_POUR_TRAVAUX;
  const ch = SEUIL_DU_POINT_DE_VENTE;

  it("garde la forme d'un cas dédié, chez MAILLE & CO seule", () => {
    casDedie(s, ch);
    expect(s.commanditaire).toBe("Le gérant");
    expect([JOURS_DE_FERMETURE, JOURS_DES_TRAVAUX_ACCELERES, SUPPLEMENT_DES_TRAVAUX_ACCELERES]).toEqual([5, 3, 2_500]);
  });

  it("un mois normal, les travaux simples, les travaux accélérés", () => {
    expect(attendus(s, "un-mois-normal")).toEqual({ "Marge sur coût variable du mois": MCV, "Taux de marge sur coût variable (%)": 50.6, "Seuil de rentabilité": seuil, "Point mort (jour du mois)": 21 });
    expect(attendus(s, "le-mois-des-travaux")).toEqual({
      "Chiffre d'affaires du mois des travaux": (CA * 25) / 30,
      "Marge sur coût variable des travaux simples": (MCV * 25) / 30,
      "Résultat des travaux simples": (MCV * 25) / 30 - CF,
      "Point mort des travaux simples (jour du mois)": 5 + 21,
    });
    expect([(CA * 25) / 30, (MCV * 25) / 30 - CF]).toEqual([72_875, 6_180]);
    const seuilAccelere = centime((CF + 2_500) / taux);
    expect(attendus(s, "les-travaux-acceleres")).toEqual({
      "Résultat des travaux accélérés": (MCV * 27) / 30 - CF - 2_500,
      "Seuil des travaux accélérés": seuilAccelere,
      "Point mort des travaux accélérés (jour du mois)": 3 + Math.ceil(seuilAccelere / (CA / 30)),
    });
    expect([(MCV * 27) / 30 - CF - 2_500, seuilAccelere, 3 + Math.ceil(seuilAccelere / 2_915)]).toEqual([6_630, 65_602.32, 26]);
  });

  it("le curseur du cas, à rebours : le supplément que les 2 jours gagnés paient", () => {
    // Le résultat des travaux accélérés, 44 250 × 27 ÷ 30 − 30 695 − x, face à celui des travaux simples.
    const x = Math.floor((MCV * 27) / 30 - CF - 6_180);
    expect(x).toBe(2 * 1_475);
    expect(curseur(s, "le-supplement-au-curseur")).toEqual({
      attendu: x,
      bornes: [0, 5_000],
      droites: [(MCV * 27) / 30 - CF, 6_180, (MCV * 27) / 30 - CF - 5_000, 6_180],
      lecture: {
        "Marge des jours ouverts, travaux accélérés": (MCV * 27) / 30,
        "Charges fixes et supplément": CF + x,
        "Résultat des travaux accélérés": 6_180,
        "Résultat des travaux simples": 6_180,
        "Avantage des travaux accélérés": 0,
      },
    });
    expect(fermePourTravaux(cas).supplementMaximal).toBe(2_950);
  });

  it("le verdict : le résultat tranche, pas le point mort", () => {
    expect(juste(s, "reponse")).toBe("Les travaux accélérés : 450 € de plus, au même point mort");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});

describe("l'export compatible du seuil du cas figé, pour les chapitres qui le lisent encore", () => {
  it("rend le taux, l'indice et le point mort du mois du cas, sans rien charger de l'arène", () => {
    const s = seuilDuPointDeVente(cas);
    expect(s.ca).toBe(cas.gestion.chiffreDAffaires);
    expect(s.tauxMcv).toBeCloseTo((s.mcv / s.ca) * 100, 0);
    expect(s.pointMort).toBeLessThanOrEqual(30);
  });
});
