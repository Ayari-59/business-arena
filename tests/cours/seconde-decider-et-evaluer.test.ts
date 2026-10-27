import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { anneeJouee, casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  AVEC_LA_PUBLICITE,
  DECIDER_AVEC_DES_CHIFFRES,
  ENTREPRISES_DU_CHOIX,
  SANS_PUBLICITE,
  anneeAvecLaPublicite,
  anneeDuChoix,
  deuxChoix,
} from "../../src/config/cours/chapitres/decider-avec-des-chiffres";
import { EVALUER_SON_ACTIVITE, PRIX_STABLE, activiteDeLAnnee } from "../../src/config/cours/chapitres/evaluer-son-activite";
import { anneeDeReference } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES, PARCOURS, PROGRAMME } from "../../src/config/cours/registre";
import { BUDGET_DOUBLE, DOUBLER_LA_PUBLICITE, publiciteDoublee } from "../../src/config/cours/situations/par-chapitre/doubler-la-publicite";
import { LE_SECOND_SEMESTRE, deuxSemestres } from "../../src/config/cours/situations/par-chapitre/le-second-semestre";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeMontants, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { soldUnits } from "../../src/engine/simulation/runGame";
import type { CompanyRoundResult } from "../../src/engine/types";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX CHAPITRES « DÉCIDER » ET « ÉVALUER » DE SECONDE (MANAGEMENT ET GESTION), ET LEURS CAS.
 *
 * Décider avec des chiffres : l'année du cours rejouée avec et sans publicité. Évaluer son
 * activité : quatre indicateurs de l'année du cours, trimestre par trimestre. Ces gardes
 * recomposent leurs chiffres avec le moteur, sans passer par les fonctions des chapitres, dans
 * chaque entreprise où ils se jouent ; elles vérifient que chaque valeur attendue d'un champ est
 * bien ce calcul, que les verdicts se calculent et changent d'une entreprise à l'autre, et que
 * les textes se lisent : rien d'indéfini, pas de « de le », pas de tiret au milieu d'une phrase,
 * des élisions faites, une seule bonne réponse par question, des libellés uniques.
 */

const etatVide: EtatDuCours = { soldes: {} };

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).colonnes, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    default:
      return [];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas. */
function verifierLesTextes(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      // Un négatif prend le signe moins (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\+−|\s{2,}/);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
    }
    if (e.tableau) {
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      // Le test de bout en bout clique l'option par son texte : aucun ne doit en contenir un autre.
      for (const a of options) for (const b of options) if (a !== b) expect(a.texte.toLowerCase().includes(b.texte.toLowerCase()), `${e.id} : ${b.texte}`).toBe(false);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) {
        expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
        // L'élève tape un montant au centime, un pourcentage au dixième : l'attendu aussi.
        expect(Math.round(c.attendu * 100) / 100, `${e.id} : ${c.libelle}`).toBe(c.attendu);
      }
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
}

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, id: string, cas: Cas): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  return Object.fromEntries(e.champs(cas, etatVide).map((c) => [c.libelle, c.attendu]));
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string, cas: Cas) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

const somme = (a: readonly CompanyRoundResult[], f: (r: CompanyRoundResult) => number) => Math.round(a.reduce((t, r) => t + f(r), 0));
const centime = (x: number) => Math.round(x * 100) / 100;
const dixieme = (x: number) => Math.round(x * 10) / 10;

const MG_ORGANISER = "2de MG · Organiser et décider, des objectifs à la réalisation";
const MG_EVALUER = "2de MG · Évaluer et évoluer, du pilotage aux développements numériques";

describe("les deux chapitres et leurs cas, dans le parcours de seconde", () => {
  it("portent les titres du programme, au palier 1, et le thème du référentiel de seconde qu'ils travaillent", () => {
    const paires: [Chapitre, string][] = [
      [DECIDER_AVEC_DES_CHIFFRES, MG_ORGANISER],
      [EVALUER_SON_ACTIVITE, MG_EVALUER],
    ];
    for (const [ch, bloc] of paires) {
      expect(PROGRAMME["seconde-mg"][1], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("seconde-mg");
      expect(ch.palier).toBe(1);
      expect(ch.blocs).toEqual([bloc]);
      expect(ch.libre).toBe(false);
      // Le bloc porte le préfixe de la seconde, et désigne une entrée du texte, une seule.
      expect(referentielDeCitation(bloc)?.code, bloc).toBe("seconde-mg");
      expect(blocOfficiel(bloc, "seconde-mg"), bloc).toBe(bloc.replace("2de MG · ", ""));
      // Un code neuf, qu'aucun chapitre du registre ne porte déjà.
      expect(CHAPITRES.some((x) => x.code === ch.code && x !== ch), ch.code).toBe(false);
    }
    expect(PARCOURS.find((p) => p.code === "seconde-mg")!.formation).toBe("seconde-mg");
    expect(DECIDER_AVEC_DES_CHIFFRES.code).toBe("decider-avec-des-chiffres");
    expect(EVALUER_SON_ACTIVITE.code).toBe("evaluer-son-activite");
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const paires: [Situation, Chapitre][] = [
      [DOUBLER_LA_PUBLICITE, DECIDER_AVEC_DES_CHIFFRES],
      [LE_SECOND_SEMESTRE, EVALUER_SON_ACTIVITE],
    ];
    for (const [s, ch] of paires) {
      expect(s.reprend, s.code).toEqual([ch.code]);
      expect(s.palier, s.code).toBe(ch.palier);
      expect(s.parcours, s.code).toBe(ch.parcours);
      expect(s.entreprises?.codes, s.code).toEqual(ch.entreprises?.codes);
      expect(s.libre, s.code).toBe(false);
      expect(s.blocs, s.code).toEqual([]);
      expect(s.commanditaire.length, s.code).toBeGreaterThan(3);
      expect(s.etapes[0]!.type, s.code).toBe("lecture");
      expect(s.etapes.slice(1).filter((e) => e.type === "lecture"), s.code).toHaveLength(0);
      expect(s.etapes.at(-1)!.type, s.code).toBe("choix");
      expect(s.code, s.code).not.toBe(ch.code);
      expect(CHAPITRES.some((x) => x.code === s.code), s.code).toBe(false);
    }
  });

  it("le choix de la publicité se joue partout : sans publicité, chaque entreprise vend encore à chaque trimestre", () => {
    expect(ENTREPRISES_DU_CHOIX).toEqual(ENTREPRISES_DU_COURS);
    expect(DECIDER_AVEC_DES_CHIFFRES.entreprises).toBeUndefined();
    // Sur l'année du cours (concurrents assainis), la boutique en ligne ne cesse plus son activité
    // sans publicité : elle vend encore au dernier trimestre, et le chapitre s'y joue.
    const sans = anneeAvecLaPublicite("ecommerce", SANS_PUBLICITE);
    expect(sans.at(-1)!.incomeStatement.revenue).toBeGreaterThan(0);
    for (const code of ENTREPRISES_DU_CHOIX) {
      expect(anneeDuChoix(anneeAvecLaPublicite(code, SANS_PUBLICITE)).active, code).toBe(true);
      expect(anneeDuChoix(anneeAvecLaPublicite(code, BUDGET_DOUBLE)).active, code).toBe(true);
    }
    expect(EVALUER_SON_ACTIVITE.entreprises).toBeUndefined();
  });
});

describe.each(ENTREPRISES_DU_CHOIX)("décider avec des chiffres chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const reference = anneeDeReference(code);

  it("« avec la publicité », c'est l'année du cours ; « sans », la même année, sans un euro de publicité", () => {
    const avec = anneeAvecLaPublicite(code, AVEC_LA_PUBLICITE);
    expect(avec.map((r) => r.incomeStatement.netIncome)).toEqual(reference.map((r) => r.incomeStatement.netIncome));
    expect(avec.map((r) => r.incomeStatement.netIncome)).toEqual(anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!.incomeStatement.netIncome));
    expect(deuxChoix(cas).avec.publicite).toBe(Math.round(cas.annee.publicite));
    expect(deuxChoix(cas).avec.chiffreDAffaires).toBe(Math.round(cas.annee.ventes));
    const sans = anneeAvecLaPublicite(code, SANS_PUBLICITE);
    for (const r of sans) expect(r.incomeStatement.marketingCost).toBe(0);
    const double = anneeAvecLaPublicite(code, BUDGET_DOUBLE);
    reference.forEach((r, i) => expect(double[i]!.incomeStatement.marketingCost).toBeCloseTo(r.incomeStatement.marketingCost * BUDGET_DOUBLE, 6));
  });

  it("les champs attendent ce que le moteur donne, recomposé à la main", () => {
    const sans = anneeAvecLaPublicite(code, SANS_PUBLICITE);
    const budget = somme(reference, (r) => r.incomeStatement.marketingCost);
    const marge = somme(reference, (r) => r.incomeStatement.grossMargin);
    const ventes = somme(reference, soldUnits);
    const margeParVente = centime(marge / ventes);
    const aGagner = Math.ceil(budget / margeParVente - 1e-9);
    expect(aGagner * margeParVente).toBeGreaterThanOrEqual(budget);
    expect((aGagner - 1) * margeParVente).toBeLessThan(budget);
    expect(attendus(DECIDER_AVEC_DES_CHIFFRES, "prevoir", cas)).toEqual({
      "Marge d'une vente": margeParVente,
      "Ventes que la publicité doit faire gagner": aGagner,
    });
    const gagnees = ventes - somme(sans, soldUnits);
    const margeGagnee = marge - somme(sans, (r) => r.incomeStatement.grossMargin);
    const ecart = somme(reference, (r) => r.incomeStatement.operatingIncome) - somme(sans, (r) => r.incomeStatement.operatingIncome);
    expect(attendus(DECIDER_AVEC_DES_CHIFFRES, "constater", cas)).toEqual({
      "Ventes gagnées grâce à la publicité": gagnees,
      "Marge gagnée grâce à la publicité": margeGagnee,
      "Écart de résultat de l'activité, avec moins sans": ecart,
    });
    // Ce que dit l'explication : l'écart de résultat est la marge gagnée moins la publicité, à l'arrondi près.
    expect(Math.abs(ecart - (margeGagnee - budget))).toBeLessThanOrEqual(2);
    // Et le verdict suit l'écart de résultat.
    expect(juste(DECIDER_AVEC_DES_CHIFFRES, "le-bon-choix", cas)).toBe(
      ecart > 0 ? "Garder la publicité : elle a rapporté plus qu'elle n'a coûté" : "S'en passer : la publicité a coûté plus qu'elle n'a rapporté",
    );
    expect(juste(DECIDER_AVEC_DES_CHIFFRES, "choisir", cas)).toBe(`Garder la publicité si elle fait gagner au moins ${aGagner.toLocaleString("fr-FR")} ventes`);
  });

  it("le cas : le budget en plus, les ventes qu'il doit faire gagner, et ce que l'arène en fait", () => {
    const double = anneeAvecLaPublicite(code, BUDGET_DOUBLE);
    const budgetActuel = somme(reference, (r) => r.incomeStatement.marketingCost);
    const enPlus = somme(double, (r) => r.incomeStatement.marketingCost) - budgetActuel;
    expect(enPlus).toBe(budgetActuel * (BUDGET_DOUBLE - 1));
    const margeParVente = centime(somme(reference, (r) => r.incomeStatement.grossMargin) / somme(reference, soldUnits));
    expect(attendus(DOUBLER_LA_PUBLICITE, "prevoir", cas)).toEqual({
      "Budget de publicité en plus": enPlus,
      "Marge d'une vente": margeParVente,
      "Ventes que le budget en plus doit faire gagner": Math.ceil(enPlus / margeParVente - 1e-9),
    });
    const ecart = somme(double, (r) => r.incomeStatement.operatingIncome) - somme(reference, (r) => r.incomeStatement.operatingIncome);
    expect(attendus(DOUBLER_LA_PUBLICITE, "constater", cas)).toEqual({
      "Ventes gagnées avec le budget doublé": somme(double, soldUnits) - somme(reference, soldUnits),
      "Écart de résultat de l'activité, budget doublé moins budget actuel": ecart,
    });
    expect(publiciteDoublee(cas).verdict).toBe(ecart > 0 ? "doubler" : "garder");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(DECIDER_AVEC_DES_CHIFFRES, code));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(DOUBLER_LA_PUBLICITE, code));
});

describe("décider avec des chiffres, sur les huit entreprises", () => {
  it("les deux verdicts se rencontrent, et la prévision voit juste partout, dans les deux sens", () => {
    const verdicts = new Set(ENTREPRISES_DU_CHOIX.map((c) => deuxChoix(casDeLEntreprise(c)).verdict));
    expect([...verdicts].sort()).toEqual(["garder", "s-en-passer"]);
    // Sur l'année du cours, la prévision ne se trompe nulle part : la branche « la prévision disait
    // le contraire » de la synthèse n'est lue dans aucune entreprise. Elle voit juste dans les deux
    // sens : assez de ventes gagnées chez les unes, trop peu chez les autres.
    const k = ENTREPRISES_DU_CHOIX.map((c) => deuxChoix(casDeLEntreprise(c)));
    expect(k.every((x) => x.previsionJuste)).toBe(true);
    expect([...new Set(k.map((x) => x.ventesGagnees >= x.ventesAGagner))].sort()).toEqual([false, true]);
    // Chez NOVA et ROUTE & CIE, la publicité ne fait gagner aucune vente : sans elle déjà, des
    // clients repartent chaque trimestre sans être servis, et le chapitre le dit.
    expect(ENTREPRISES_DU_CHOIX.filter((_, i) => k[i]!.ventesGagnees === 0)).toEqual(["nova", "transport"]);
    for (const x of k.filter((y) => y.ventesGagnees === 0)) expect([x.margeGagnee, x.sansPubliciteDejaEnManque]).toEqual([0, true]);
  });

  it("doubler la publicité ne se paie pas partout : les deux réponses se rencontrent", () => {
    expect(new Set(ENTREPRISES_DU_CHOIX.map((c) => publiciteDoublee(casDeLEntreprise(c)).verdict)).size).toBe(2);
  });

  it("chez NOVA, les chiffres du chapitre", () => {
    const k = deuxChoix(casDeLEntreprise("nova"));
    expect(k.budget).toBe(24000);
    expect(k.margeParVente).toBe(21);
    expect(k.ventesAGagner).toBe(1143);
    expect(k.ventesGagnees).toBe(0);
    expect(k.margeGagnee).toBe(0);
    expect(k.ecartDeResultat).toBe(-24000);
    expect(k.verdict).toBe("s-en-passer");
  });
});

describe.each(ENTREPRISES_DU_COURS)("évaluer son activité chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const tours = anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!);
  const ca = tours.map((r) => Math.round(r.incomeStatement.revenue));
  const ventes = tours.map((r) => Math.round(soldUnits(r)));
  const resultat = tours.map((r) => Math.round(r.incomeStatement.operatingIncome));
  const tresorerie = tours.map((r) => Math.round(r.cashFlow.closing));

  it("les quatre indicateurs sont ceux du moteur, et le compte de l'année se retrouve", () => {
    const k = activiteDeLAnnee(cas);
    expect(k.trimestres.map((x) => x.chiffreDAffaires)).toEqual(ca);
    expect(k.trimestres.map((x) => x.ventes)).toEqual(ventes);
    expect(k.trimestres.map((x) => x.resultat)).toEqual(resultat);
    expect(k.trimestres.map((x) => x.tresorerie)).toEqual(tresorerie);
    expect(Math.abs(ca.reduce((t, x) => t + x, 0) - cas.annee.ventes)).toBeLessThanOrEqual(2);
    for (const v of ventes) expect(v).toBeGreaterThan(0);
  });

  it("les champs attendent les évolutions et les écarts recomposés à la main, et les verdicts suivent", () => {
    const evo = (a: number, b: number) => dixieme(((b - a) / a) * 100);
    expect(attendus(EVALUER_SON_ACTIVITE, "evolutions", cas)).toEqual({
      "Évolution du chiffre d'affaires, du 1er au 4e trimestre (%)": evo(ca[0]!, ca[3]!),
      "Évolution des ventes, du 1er au 4e trimestre (%)": evo(ventes[0]!, ventes[3]!),
    });
    expect(attendus(EVALUER_SON_ACTIVITE, "resultat-et-tresorerie", cas)).toEqual({
      "Écart de résultat de l'activité, du 1er au 4e trimestre": resultat[3]! - resultat[0]!,
      "Écart de trésorerie, du 1er au 4e trimestre": tresorerie[3]! - tresorerie[0]!,
    });
    // Le meilleur trimestre est unique : une seule bonne réponse sans égalité.
    const meilleur = Math.max(...resultat);
    expect(resultat.filter((x) => x === meilleur)).toHaveLength(1);
    expect(juste(EVALUER_SON_ACTIVITE, "le-meilleur-trimestre", cas)).toBe(`Le ${["premier", "deuxième", "troisième", "quatrième"][resultat.indexOf(meilleur)]} trimestre`);
    const variation = centime(ca[3]! / ventes[3]!) / centime(ca[0]! / ventes[0]!) - 1;
    const prix = Math.abs(variation) < PRIX_STABLE ? "Il n'a presque pas bougé" : variation < 0 ? "Il a baissé" : "Il a monté";
    expect(juste(EVALUER_SON_ACTIVITE, "le-prix-moyen", cas).startsWith(prix)).toBe(true);
    const lecture = juste(EVALUER_SON_ACTIVITE, "va-t-elle-bien", cas);
    const caMonte = ca[3]! > ca[0]!;
    const resultatMonte = resultat[3]! > resultat[0]!;
    expect(lecture).toBe(
      caMonte === resultatMonte
        ? `${caMonte ? "Oui" : "Non"} : chiffre d'affaires et résultat en ${caMonte ? "hausse" : "baisse"}`
        : `En partie : chiffre d'affaires en ${caMonte ? "hausse" : "baisse"}, mais résultat en ${resultatMonte ? "hausse" : "baisse"}`,
    );
  });

  it("le cas : les deux semestres, additionnés trimestre par trimestre", () => {
    const s1 = { ca: ca[0]! + ca[1]!, v: ventes[0]! + ventes[1]!, r: resultat[0]! + resultat[1]! };
    const s2 = { ca: ca[2]! + ca[3]!, v: ventes[2]! + ventes[3]!, r: resultat[2]! + resultat[3]! };
    expect(attendus(LE_SECOND_SEMESTRE, "chiffre-et-ventes", cas)).toEqual({
      "Chiffre d'affaires du premier semestre": s1.ca,
      "Chiffre d'affaires du second semestre": s2.ca,
      "Évolution du chiffre d'affaires d'un semestre à l'autre (%)": dixieme(((s2.ca - s1.ca) / s1.ca) * 100),
      "Évolution des ventes d'un semestre à l'autre (%)": dixieme(((s2.v - s1.v) / s1.v) * 100),
    });
    expect(attendus(LE_SECOND_SEMESTRE, "resultats", cas)).toEqual({
      "Résultat de l'activité du premier semestre": s1.r,
      "Résultat de l'activité du second semestre": s2.r,
      "Écart de résultat, du premier au second semestre": s2.r - s1.r,
    });
    const caMonte = s2.ca > s1.ca;
    const resultatMonte = s2.r > s1.r;
    expect(deuxSemestres(cas).lecture).toBe(caMonte ? (resultatMonte ? "en-hausse" : "chiffre-en-hausse") : resultatMonte ? "resultat-en-hausse" : "en-baisse");
  });

  it("dans le cas, la bonne réponse ne se devine pas à sa longueur", () => {
    for (const s of [LE_SECOND_SEMESTRE, ...(ENTREPRISES_DU_CHOIX.includes(code) ? [DOUBLER_LA_PUBLICITE] : [])]) {
      const options = (s.etapes.at(-1) as EtapeChoix).options(cas, etatVide);
      const bonne = options.find((o) => o.juste)!;
      expect(bonne.texte.length, s.code).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
    }
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(EVALUER_SON_ACTIVITE, code));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(LE_SECOND_SEMESTRE, code));
});

describe("évaluer son activité, sur les neuf entreprises", () => {
  it("les lectures changent d'une entreprise à l'autre", () => {
    const annee = new Set(ENTREPRISES_DU_COURS.map((c) => activiteDeLAnnee(casDeLEntreprise(c)).lecture));
    expect([...annee].sort()).toEqual(["en-baisse", "en-hausse", "resultat-en-hausse"]);
    // L'escale vend un peu moins au 4e trimestre qu'au 1er, mais gagne davantage.
    expect(ENTREPRISES_DU_COURS.filter((c) => activiteDeLAnnee(casDeLEntreprise(c)).lecture === "resultat-en-hausse")).toEqual(["hotel"]);
    const semestres = new Set(ENTREPRISES_DU_COURS.map((c) => deuxSemestres(casDeLEntreprise(c)).lecture));
    expect([...semestres].sort()).toEqual(["chiffre-en-hausse", "en-baisse", "en-hausse"]);
    // Le prix moyen ne bouge qu'à la boutique, dont la gamme mêle des prix très différents.
    expect(ENTREPRISES_DU_COURS.filter((c) => activiteDeLAnnee(casDeLEntreprise(c)).prix !== "stable")).toEqual(["boutique"]);
  });

  it("chez NOVA, les chiffres du chapitre", () => {
    const k = activiteDeLAnnee(casDeLEntreprise("nova"));
    expect(k.trimestres.map((x) => x.chiffreDAffaires)).toEqual([297532, 328851, 394622, 331482]);
    expect(k.evolutionDuChiffre).toBe(11.4);
    expect(k.evolutionDesVentes).toBe(11.4);
    expect(k.meilleur).toBe(2);
    expect(k.ecartDeResultat).toBe(12083);
    expect(k.ecartDeTresorerie).toBe(-70851);
    expect(k.lecture).toBe("en-hausse");
  });
});
