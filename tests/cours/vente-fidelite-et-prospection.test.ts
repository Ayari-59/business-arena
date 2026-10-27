import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { anneeJouee, casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  ECART_NEGLIGEABLE,
  ENTREPRISES_DE_L_ABONNEMENT,
  LE_CLIENT_QUI_REVIENT,
  PART_DES_PLACES_OUVERTES,
  TRIMESTRE_DES_DEPARTS,
  TRIMESTRE_DES_TRAVAUX,
  clientsDeLAnnee,
  travauxDuChapitre,
  trimestresDesAdherents,
} from "../../src/config/cours/chapitres/le-client-qui-revient";
import {
  ENTREPRISES_DE_LA_CAMPAGNE,
  HAUSSE_DE_LA_CAMPAGNE,
  TRIMESTRE_DE_LA_CAMPAGNE,
  UN_NOUVEAU_CLIENT,
  VENTES_GAGNEES_MINIMUM,
  campagneDuChapitre,
  trimestresDeVente,
} from "../../src/config/cours/chapitres/un-nouveau-client";
import { anneeDeReference, rejouerAvec } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { PARCOURS, PROGRAMME } from "../../src/config/cours/registre";
import { LES_TRAVAUX_DE_L_ETE, TRIMESTRE_DE_L_ETE, travauxDeLEte } from "../../src/config/cours/situations/par-chapitre/les-travaux-de-l-ete";
import { HAUSSE_PLUS_FORTE, UNE_CAMPAGNE_PLUS_FORTE, campagnePlusForte } from "../../src/config/cours/situations/par-chapitre/une-campagne-plus-forte";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { soldUnits } from "../../src/engine/simulation/runGame";
import type { CompanyRoundResult, RoundDecisions } from "../../src/engine/types";
import { auCentime } from "../../src/pedagogy/cours/etats";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE CLIENT QUI REVIENT ET CE QUE RAPPORTE UN NOUVEAU CLIENT (BAC PRO MCV, TERMINALE), ET LEURS
 * CAS PRATIQUES.
 *
 * Ces gardes recomposent les chiffres avec le moteur, sans passer par les fonctions des
 * chapitres : le portefeuille d'adhérents de l'année du cours, l'année rejouée avec moins
 * d'adhérents accueillis un trimestre, l'année rejouée avec une campagne de publicité posée en
 * valeur absolue sur l'année du cours (et la garde qui vérifie le budget joué à chaque
 * trimestre). Elles recomptent les entreprises où chaque chapitre se joue, vérifient que les
 * verdicts se calculent et changent quand l'année le permet, et que les textes se lisent : rien
 * d'indéfini, pas de « de le », pas de tiret au milieu d'une phrase, des élisions faites, une
 * seule bonne réponse, aucune option qui en contient une autre, des libellés uniques, des notions
 * qui existent, des accords avec les unités féminines.
 */

/** Ces gardes rejouent l'année plusieurs fois dans neuf entreprises. */
const REJOUE_L_ANNEE = 60_000;

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
      return [];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "demandé", "servi", "produit", "dernier", "perdu", "livré", "prévu", "gagné", "manqué"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas. */
function verifierLesTextes(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  expect(new Set(chapitre.etapes.map((e) => e.id)).size, ch.code).toBe(chapitre.etapes.length);
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
  for (const [i, e] of chapitre.etapes.entries()) {
    // Le test de bout en bout clique les boutons par leur nom : aucun titre ne s'y confond.
    expect(e.titre, e.id).not.toMatch(/v[ée]rifier|étape suivante|terminer|montrer la réponse|changer le signe/i);
    if (e.tableau) expect(["lecture", "choix", "montants", "tri"], e.id).toContain(e.type);
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${code} / ${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      expect(x, `${code} / ${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${code} / ${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${code} / ${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${code} / ${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${code} / ${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      expect(x, `${code} / ${e.id} : ${x}`).not.toMatch(/« «|» »/);
      expect(x, `${code} / ${e.id} : ${x}`).not.toMatch(/\b([A-Z] ){2,}[A-Z]\b/);
      // Un négatif prend le signe moins (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${code} / ${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${code} / ${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\. \./);
      // Une phrase ne reprend pas de capitale après un deux-points.
      expect(x, `${code} / ${e.id} : ${x}`).not.toMatch(/ : (La|Le|Les|Un|Une) /);
      if (UNITES_FEMININES.has(u)) expect(x, `${code} / ${e.id} : ${x}`).not.toMatch(masculinFautif);
    }
    if (e.tableau) {
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), `${code} / ${e.id}`).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      // Le test de bout en bout clique l'option par son texte : aucun ne doit en contenir un autre.
      for (const a of options) for (const b of options) if (a !== b) expect(a.texte.toLowerCase().includes(b.texte.toLowerCase()), `${e.id} : ${b.texte}`).toBe(false);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) {
        expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
        expect(auCentime(c.attendu), `${e.id} : ${c.libelle}`).toBe(c.attendu);
      }
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
}

/** La bonne réponse d'un cas ne se devine pas à sa longueur, à aucune de ses questions. */
function reponsesSansIndice(s: Situation, code: string) {
  const cas = casDeLEntreprise(code);
  for (const e of chapitreDuCas(s, cas).etapes) {
    if (e.type !== "choix") continue;
    const options = e.options(cas, { soldes: {} });
    const juste = options.find((o) => o.juste)!;
    expect(juste.texte.length, `${s.code} / ${e.id} chez ${code}`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

/** Les champs d'une étape de montants, par libellé. */
function champs(ch: Chapitre, id: string, cas: Cas): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id)!;
  if (e.type !== "montants") throw new Error(`${id} n'est pas une étape de montants`);
  return Object.fromEntries(e.champs(cas, { soldes: {} }).map((c) => [c.libelle, c.attendu]));
}

const justeDe = (ch: Chapitre, id: string, cas: Cas) => {
  const e = ch.etapes.find((x) => x.id === id)!;
  if (e.type !== "choix") throw new Error(`${id} n'est pas un choix`);
  return e.options(cas, { soldes: {} }).find((o) => o.juste)!.texte;
};

const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

describe("les deux chapitres du bac pro MCV et leurs cas", () => {
  it("portent les titres du programme, au palier 2, et des blocs du bac pro MCV qui se résolvent", () => {
    const vente = PARCOURS.find((p) => p.code === "vente")!;
    expect(vente.formation).toBe("bac-pro-mcv");
    const attendus: [Chapitre, string, string[]][] = [
      [LE_CLIENT_QUI_REVIENT, "le-client-qui-revient", ["Bac pro MCV Bloc 3 · Fidéliser la clientèle et développer la relation client"]],
      [UN_NOUVEAU_CLIENT, "un-nouveau-client", ["Bac pro MCV Bloc 4B · Prospecter et valoriser l'offre commerciale"]],
    ];
    for (const [ch, code, blocs] of attendus) {
      expect(ch.code).toBe(code);
      expect(PROGRAMME.vente[2], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("vente");
      expect(ch.palier).toBe(2);
      expect(ch.libre).toBe(false);
      expect(ch.blocs).toEqual(blocs);
      for (const bloc of blocs) {
        const cite = referentielDeCitation(bloc);
        expect(cite?.code, bloc).toBe("bac-pro-mcv");
        expect(blocOfficiel(bloc, cite!.code), bloc).toBe(bloc.replace("Bac pro MCV ", ""));
      }
    }
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const paires: [Situation, Chapitre][] = [
      [LES_TRAVAUX_DE_L_ETE, LE_CLIENT_QUI_REVIENT],
      [UNE_CAMPAGNE_PLUS_FORTE, UN_NOUVEAU_CLIENT],
    ];
    for (const [sit, ch] of paires) {
      expect(sit.reprend, sit.code).toEqual([ch.code]);
      expect(sit.palier, sit.code).toBe(ch.palier);
      expect(sit.parcours, sit.code).toBe(ch.parcours);
      expect(sit.entreprises?.codes, sit.code).toEqual(ch.entreprises?.codes);
      expect(sit.libre, sit.code).toBe(false);
      expect(sit.blocs, sit.code).toEqual([]);
      expect(sit.commanditaire.length, sit.code).toBeGreaterThan(3);
      expect(sit.etapes[0]!.type, sit.code).toBe("lecture");
      expect(sit.etapes.slice(1).filter((e) => e.type === "lecture"), sit.code).toHaveLength(0);
      expect(sit.etapes.at(-1)!.type, sit.code).toBe("choix");
      expect(sit.code, sit.code).not.toBe(ch.code);
    }
  });
});

/* ------------------------------------------------------------------------------------------ */
/* Le client qui revient et le client qui part                                                 */
/* ------------------------------------------------------------------------------------------ */

const FITNESS = "fitness";
const salle = casDeLEntreprise(FITNESS);
const sub = (r: CompanyRoundResult) => r.subscription!;

/** L'année rejouée par le test lui-même, avec moins d'adhérents accueillis un trimestre. */
function travauxParLeTest(trimestre: number) {
  const places = Math.round(anneeDeReference(FITNESS)[trimestre - 1]!.production.planned * PART_DES_PLACES_OUVERTES);
  return {
    places,
    annee: rejouerAvec(FITNESS, `test-vente:travaux-t${trimestre}`, (t, d) => (t === trimestre ? { ...d, productionPlan: places } : undefined)),
  };
}

describe("le client qui revient, chez la salle de sport", () => {
  it("se joue là où l'arène compte ses clients un par un : un portefeuille d'adhérents, recompté sur le moteur", () => {
    const avecUnPortefeuille = ENTREPRISES_DU_COURS.filter(
      (code) => scenarioByCode(code).scenario.subscription !== undefined && anneeDeReference(code).every((r) => r.subscription !== undefined),
    );
    expect(avecUnPortefeuille).toEqual([...ENTREPRISES_DE_L_ABONNEMENT]);
    expect(LE_CLIENT_QUI_REVIENT.entreprises?.codes).toBe(ENTREPRISES_DE_L_ABONNEMENT);
    // Ailleurs, la fidélité joue par la part du tour d'avant : chaque entreprise a une clientèle fidèle.
    for (const code of ENTREPRISES_DU_COURS) {
      const s = scenarioByCode(code).scenario;
      const segments = [...s.market.segments, ...(s.products ?? []).flatMap((p) => p.market?.segments ?? [])];
      expect(Math.max(...segments.map((g) => g.loyalty)), code).toBeGreaterThan(0);
    }
  });

  it("le portefeuille est celui du moteur : partis + revenus = début, revenus + nouveaux = fin", () => {
    const reference = anneeDeReference(FITNESS);
    expect(reference.map((r) => r.incomeStatement.revenue)).toEqual(anneeJouee(FITNESS).partie.rounds.map((t) => t.results["joueur"]!.incomeStatement.revenue));
    expect(reference.some((r) => r.defaillant)).toBe(false);
    const k = clientsDeLAnnee(salle);
    k.trimestres.forEach((t, i) => {
      const r = reference[i]!;
      expect(t.debut).toBe(Math.round(sub(r).opening));
      expect(t.gardes).toBe(Math.round(sub(r).retained));
      expect(t.fin).toBe(Math.round(sub(r).closing));
      expect(t.partis + t.gardes).toBe(t.debut);
      expect(t.gardes + t.nouveaux).toBe(t.fin);
      expect(t.abonnement).toBe(auCentime(r.incomeStatement.revenue / sub(r).closing));
      if (i > 0) expect(t.debut).toBe(k.trimestres[i - 1]!.fin);
    });
    // Les chiffres de l'arène aujourd'hui.
    expect(k.trimestres.map((t) => [t.debut, t.partis, t.gardes, t.nouveaux, t.fin])).toEqual([
      [1600, 240, 1360, 840, 2200],
      [2200, 558, 1642, 422, 2064],
      [2064, 618, 1446, 194, 1640],
      [1640, 266, 1374, 410, 1784],
    ]);
  });

  it("les départs et la part de ceux qui reviennent se recomposent", () => {
    const r = anneeDeReference(FITNESS)[TRIMESTRE_DES_DEPARTS - 1]!;
    const debut = Math.round(sub(r).opening);
    const gardes = Math.round(sub(r).retained);
    const fin = Math.round(sub(r).closing);
    const a = champs(LE_CLIENT_QUI_REVIENT, "partis", salle);
    expect(a["Adhérents partis"]).toBe(debut - gardes);
    expect(a["Part des adhérents qui reviennent (%)"]).toBe(Math.round((gardes / debut) * 1000) / 10);
    expect(champs(LE_CLIENT_QUI_REVIENT, "poids-des-gardes", salle)["Part des clients qui reviennent dans la salle (%)"]).toBe(Math.round((gardes / fin) * 1000) / 10);
    expect([a["Adhérents partis"], a["Part des adhérents qui reviennent (%)"]]).toEqual([558, 74.6]);
  });

  it("la marge d'un adhérent gardé et celle d'un adhérent parti : les abonnements de l'arène, le coût variable du scénario", () => {
    const s = scenarioByCode(FITNESS).scenario;
    const cv = s.product.materialCostPerUnit + s.product.otherVariableCostPerUnit;
    expect(salle.gestion.coutVariableUnitaire).toBe(cv);
    const abonnements = anneeDeReference(FITNESS).map((r) => auCentime(r.incomeStatement.revenue / sub(r).closing));
    const g = champs(LE_CLIENT_QUI_REVIENT, "garde-toute-l-annee", salle);
    expect(g["Abonnements payés sur l'année"]).toBe(auCentime(somme(abonnements)));
    expect(g["Coûts de l'adhérent sur l'année"]).toBe(cv * 4);
    expect(g["Marge d'un adhérent gardé toute l'année"]).toBe(auCentime(somme(abonnements) - cv * 4));
    const p = champs(LE_CLIENT_QUI_REVIENT, "parti-apres-le-premier", salle);
    expect(p["Abonnements qu'il ne paiera pas"]).toBe(auCentime(somme(abonnements.slice(1))));
    expect(p["Marge que la salle perd"]).toBe(auCentime(somme(abonnements.slice(1)) - cv * 3));
    expect([g["Marge d'un adhérent gardé toute l'année"], p["Marge que la salle perd"]]).toEqual([376.01, 286.01]);
  });

  it(
    "les travaux rejoués : seul le nombre d'adhérents accueillis change, au seul trimestre des travaux, et les refusés ne reviennent pas",
    () => {
      const T = TRIMESTRE_DES_TRAVAUX;
      const reference = anneeDeReference(FITNESS);
      const { places, annee } = travauxParLeTest(T);
      expect(places).toBe(Math.round(2200 * PART_DES_PLACES_OUVERTES));
      expect([...reference, ...annee].some((r) => r.defaillant)).toBe(false);
      // Avant les travaux, rien ne bouge ; pendant, la salle accueille ce qu'on a posé.
      for (let k = 0; k < T - 1; k++) expect(annee[k]!.incomeStatement.revenue).toBe(reference[k]!.incomeStatement.revenue);
      expect(annee[T - 1]!.production.planned).toBe(places);
      // Dans l'année du cours, tout le monde trouvait sa place au trimestre des travaux.
      expect(sub(reference[T - 1]!).unserved + Object.values(reference[T - 1]!.market.bySegment).reduce((t, v) => t + v.lost, 0)).toBeLessThan(0.5);
      const p = travauxDuChapitre(salle);
      const fin = (a: readonly CompanyRoundResult[], k: number) => Math.round(sub(a[k]!).closing);
      const refuses = fin(reference, T - 1) - fin(annee, T - 1);
      // Les refusés du tableau sont ceux que le moteur compte, anciens et nouveaux, à l'arrondi près.
      const duMoteur = sub(annee[T - 1]!).unserved + Object.values(annee[T - 1]!.market.bySegment).reduce((t, v) => t + v.lost, 0);
      expect(Math.abs(refuses - duMoteur)).toBeLessThanOrEqual(1);
      expect(sub(annee[T - 1]!).unserved).toBeGreaterThan(0);
      const marge = (a: readonly CompanyRoundResult[]) => somme(a.map((r) => Math.round(r.incomeStatement.grossMargin)));
      const k = champs(LE_CLIENT_QUI_REVIENT, "les-travaux", salle);
      expect(k[`Adhérents refusés au T${T}`]).toBe(refuses);
      expect(k["Adhérents en moins à la fin de l'année"]).toBe(fin(reference, 3) - fin(annee, 3));
      expect(k["Marge perdue sur l'année"]).toBe(marge(reference) - marge(annee));
      // La marge perdue ne s'arrête pas au trimestre des travaux : l'explication le dit.
      const auTrimestre = Math.round(reference[T - 1]!.incomeStatement.grossMargin) - Math.round(annee[T - 1]!.incomeStatement.grossMargin);
      expect(marge(reference) - marge(annee) - auTrimestre).toBeGreaterThan(0);
      expect(p.margePerdueEnsuite).toBe(marge(reference) - marge(annee) - auTrimestre);
      // Le verdict : la marge perdue par refusé, face à la marge d'un trimestre.
      const parRefuse = auCentime((marge(reference) - marge(annee)) / refuses);
      const margeDUnTrimestre = auCentime(reference[T - 1]!.incomeStatement.revenue / sub(reference[T - 1]!).closing - salle.gestion.coutVariableUnitaire);
      expect(p.parRefuse).toBe(parRefuse);
      expect(p.margeDUnTrimestre).toBe(margeDUnTrimestre);
      expect(parRefuse / margeDUnTrimestre).toBeGreaterThan(1 + ECART_NEGLIGEABLE);
      expect(p.verdict).toBe("plus");
      expect(justeDe(LE_CLIENT_QUI_REVIENT, "ce-que-coute-un-refus", salle)).toBe("Plus qu'un trimestre de marge : il ne revient pas");
      // Les chiffres de l'arène aujourd'hui.
      expect([refuses, k["Adhérents en moins à la fin de l'année"], k["Marge perdue sur l'année"], parRefuse, margeDUnTrimestre]).toEqual([524, 159, 89529, 170.86, 90]);
    },
    REJOUE_L_ANNEE,
  );

  it("une défaillance avant un trimestre le compte à zéro", () => {
    const [a, b] = anneeDeReference(FITNESS);
    const t = trimestresDesAdherents([{ ...a!, defaillant: true }, b!]);
    expect(t[1]!.fin).toBe(0);
    expect(t[1]!.marge).toBe(0);
    expect(trimestresDesAdherents([a!, b!])[1]!.fin).toBe(Math.round(sub(b!).closing));
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(LE_CLIENT_QUI_REVIENT, FITNESS), REJOUE_L_ANNEE);
});

describe("les travaux de l'été, chez la salle de sport", () => {
  it(
    "les travaux rejoués en été refusent moins d'adhérents et coûtent moins qu'au printemps",
    () => {
      const T = TRIMESTRE_DE_L_ETE;
      expect(T).toBe(3);
      const reference = anneeDeReference(FITNESS);
      const { places, annee } = travauxParLeTest(T);
      expect(annee[T - 1]!.production.planned).toBe(places);
      for (let k = 0; k < T - 1; k++) expect(annee[k]!.incomeStatement.revenue).toBe(reference[k]!.incomeStatement.revenue);
      expect(annee.some((r) => r.defaillant)).toBe(false);
      const fin = (a: readonly CompanyRoundResult[], k: number) => Math.round(sub(a[k]!).closing);
      const marge = (a: readonly CompanyRoundResult[]) => somme(a.map((r) => Math.round(r.incomeStatement.grossMargin)));
      const k = champs(LES_TRAVAUX_DE_L_ETE, "l-ete-rejoue", salle);
      const refuses = fin(reference, T - 1) - fin(annee, T - 1);
      expect(k[`Adhérents refusés au T${T}`]).toBe(refuses);
      expect(k["Adhérents en moins à la fin de l'année"]).toBe(fin(reference, 3) - fin(annee, 3));
      expect(k["Marge perdue sur l'année"]).toBe(marge(reference) - marge(annee));
      expect(champs(LES_TRAVAUX_DE_L_ETE, "un-refus", salle)["Marge perdue par adhérent refusé"]).toBe(auCentime((marge(reference) - marge(annee)) / refuses));
      const w = travauxDeLEte(salle);
      expect(w.ete.margePerdue).toBeLessThan(w.printemps.margePerdue * (1 - ECART_NEGLIGEABLE));
      expect(w.quand).toBe("ete");
      expect(justeDe(LES_TRAVAUX_DE_L_ETE, "reponse", salle)).toBe("En été, quand la salle est moins pleine");
      expect([refuses, k["Adhérents en moins à la fin de l'année"], k["Marge perdue sur l'année"]]).toEqual([261, 219, 39517]);
    },
    REJOUE_L_ANNEE,
  );

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(LES_TRAVAUX_DE_L_ETE, FITNESS);
    reponsesSansIndice(LES_TRAVAUX_DE_L_ETE, FITNESS);
  }, REJOUE_L_ANNEE);
});

/* ------------------------------------------------------------------------------------------ */
/* Ce que rapporte un nouveau client                                                           */
/* ------------------------------------------------------------------------------------------ */

/**
 * La campagne rejouée par le test lui-même : au trimestre de la campagne, le budget de l'année
 * du cours multiplié par `1 + hausse` ; aux autres, celui de l'année du cours. Article par
 * article pour une gamme.
 */
function campagneParLeTest(code: string, hausse: number) {
  const reference = anneeDeReference(code);
  return rejouerAvec(code, `test-vente:campagne-plus-${hausse}`, (t, d): RoundDecisions => {
    const r = reference[t - 1]!;
    const k = t === TRIMESTRE_DE_LA_CAMPAGNE ? 1 + hausse : 1;
    if (!d.products || !r.products) return { ...d, marketingBudget: r.incomeStatement.marketingCost * k };
    const products = Object.fromEntries(Object.entries(d.products).map(([p, x]) => [p, { ...x, marketingBudget: r.products![p]!.marketingBudget * k }]));
    return { ...d, products, marketingBudget: somme(Object.values(products).map((x) => x.marketingBudget ?? 0)) };
  });
}

/** Les ventes et la marge d'une année, trimestre par trimestre arrondi, zéro après une défaillance. */
function venteDeLAnnee(a: readonly CompanyRoundResult[]) {
  const vivant = (i: number) => !a.slice(0, i).some((r) => r.defaillant);
  return {
    ventes: a.map((r, i) => (vivant(i) ? Math.round(soldUnits(r)) : 0)),
    marge: a.map((r, i) => (vivant(i) ? Math.round(r.incomeStatement.grossMargin) : 0)),
    publicite: a.map((r, i) => (vivant(i) ? Math.round(r.incomeStatement.marketingCost) : 0)),
    resultat: somme(a.map((r, i) => (vivant(i) ? r.incomeStatement.operatingIncome : 0))),
  };
}

describe("ce que rapporte un nouveau client : où la campagne fait gagner des clients", () => {
  it(
    "les entreprises du chapitre sont celles où la campagne gagne au moins 10 ventes sur l'année, recomptées sur le moteur",
    () => {
      const gagnees = Object.fromEntries(
        ENTREPRISES_DU_COURS.map((code) => {
          const sans = venteDeLAnnee(anneeDeReference(code));
          const avec = venteDeLAnnee(campagneParLeTest(code, HAUSSE_DE_LA_CAMPAGNE));
          return [code, somme(avec.ventes) - somme(sans.ventes)];
        }),
      );
      expect(ENTREPRISES_DU_COURS.filter((c) => gagnees[c]! >= VENTES_GAGNEES_MINIMUM)).toEqual([...ENTREPRISES_DE_LA_CAMPAGNE]);
      expect(UN_NOUVEAU_CLIENT.entreprises?.codes).toBe(ENTREPRISES_DE_LA_CAMPAGNE);
      // Loin du seuil, des deux côtés : le bruit des moteurs n'y change rien.
      for (const c of ENTREPRISES_DU_COURS) {
        if ((ENTREPRISES_DE_LA_CAMPAGNE as readonly string[]).includes(c)) expect(gagnees[c]!, c).toBeGreaterThan(10 * VENTES_GAGNEES_MINIMUM);
        else expect(gagnees[c]!, c).toBeLessThan(VENTES_GAGNEES_MINIMUM / 2);
      }
    },
    REJOUE_L_ANNEE,
  );

  it("les deux verdicts se rencontrent, et ceux du cas aussi", () => {
    const verdicts = ENTREPRISES_DE_LA_CAMPAGNE.map((c) => campagneDuChapitre(casDeLEntreprise(c)).verdict);
    expect(verdicts).toEqual(["paie", "ne-paie-pas", "paie", "paie", "paie", "ne-paie-pas"]);
    const choix = ENTREPRISES_DE_LA_CAMPAGNE.map((c) => campagnePlusForte(casDeLEntreprise(c)).choix);
    expect(choix).toEqual(["celle-de-janvier", "aucune", "celle-de-janvier", "plus-forte", "celle-de-janvier", "aucune"]);
  }, REJOUE_L_ANNEE);
});

describe.each(ENTREPRISES_DE_LA_CAMPAGNE)("ce que rapporte un nouveau client chez %s", (code) => {
  const cas = casDeLEntreprise(code);

  it(
    "la campagne rejouée : le budget de l'année du cours, doublé au seul trimestre de la campagne, à chaque trimestre",
    () => {
      const reference = anneeDeReference(code);
      const avec = campagneParLeTest(code, HAUSSE_DE_LA_CAMPAGNE);
      expect([...reference, ...avec].some((r) => r.defaillant)).toBe(false);
      reference.forEach((r, i) => {
        const k = i + 1 === TRIMESTRE_DE_LA_CAMPAGNE ? 1 + HAUSSE_DE_LA_CAMPAGNE : 1;
        expect(avec[i]!.incomeStatement.marketingCost, `T${i + 1}`).toBeCloseTo(r.incomeStatement.marketingCost * k, 6);
        if (r.products) for (const [p, x] of Object.entries(r.products)) expect(avec[i]!.products![p]!.marketingBudget, `${p} T${i + 1}`).toBeCloseTo(x.marketingBudget * k, 6);
      });
      // Et le chapitre a joué la même année.
      expect(trimestresDeVente(avec)).toEqual(campagneDuChapitre(cas).avec);
      expect(trimestresDeVente(reference)).toEqual(campagneDuChapitre(cas).reference);
    },
    REJOUE_L_ANNEE,
  );

  it(
    "les ventes gagnées, le coût et la marge d'une vente gagnée se recomposent, et le verdict suit le résultat",
    () => {
      const sans = venteDeLAnnee(anneeDeReference(code));
      const avec = venteDeLAnnee(campagneParLeTest(code, HAUSSE_DE_LA_CAMPAGNE));
      const t = TRIMESTRE_DE_LA_CAMPAGNE - 1;
      const campagne = somme(avec.publicite) - somme(sans.publicite);
      expect(campagne).toBe(sans.publicite[t]! * HAUSSE_DE_LA_CAMPAGNE);
      const gagnees = somme(avec.ventes) - somme(sans.ventes);
      const margeGagnee = somme(avec.marge) - somme(sans.marge);
      const v = champs(UN_NOUVEAU_CLIENT, "ventes-gagnees", cas);
      expect(v[`Ventes gagnées au T${TRIMESTRE_DE_LA_CAMPAGNE}`]).toBe(avec.ventes[t]! - sans.ventes[t]!);
      expect(v["Ventes gagnées sur l'année"]).toBe(gagnees);
      expect(champs(UN_NOUVEAU_CLIENT, "cout-d-une-vente", cas)["Coût d'une vente gagnée"]).toBe(auCentime(campagne / gagnees));
      const m = champs(UN_NOUVEAU_CLIENT, "marge-d-une-vente", cas);
      expect(m["Marge gagnée sur l'année"]).toBe(margeGagnee);
      expect(m["Marge d'une vente gagnée"]).toBe(auCentime(margeGagnee / gagnees));
      // La campagne paie si la marge gagnée dépasse son coût ; le résultat de l'année le dit, à l'arrondi près.
      const k = campagneDuChapitre(cas);
      expect(k.laisse).toBe(margeGagnee - campagne);
      expect(Math.abs(avec.resultat - sans.resultat - k.laisse), "écart de résultat").toBeLessThanOrEqual(2);
      // Loin de zéro : le verdict ne tient pas au bruit des moteurs.
      expect(Math.abs(k.laisse)).toBeGreaterThan(1000);
      expect(k.verdict).toBe(margeGagnee > campagne ? "paie" : "ne-paie-pas");
      expect(justeDe(UN_NOUVEAU_CLIENT, "la-campagne-paie", cas)).toBe(
        margeGagnee > campagne ? "Oui : une vente gagnée rapporte plus qu'elle n'a coûté" : "Non : une vente gagnée coûte plus qu'elle ne rapporte",
      );
      // Des ventes après la campagne, partout : l'étape qui l'explique se joue, et la publicité est revenue à son budget.
      expect(gagnees - (avec.ventes[t]! - sans.ventes[t]!)).toBeGreaterThan(0);
      expect(avec.publicite[t + 1]).toBe(sans.publicite[t + 1]);
      // Au trimestre de la campagne, sans vente gagnée, les clients en plus sont repartis sans être servis : l'explication le dit.
      if (avec.ventes[t] === sans.ventes[t]) expect(k.manqueesAvec).toBeGreaterThan(k.manqueesSans);
    },
    REJOUE_L_ANNEE,
  );

  it(
    "la campagne plus forte du cas se recompose, et la réponse suit ce que chaque campagne laisse",
    () => {
      const reference = anneeDeReference(code);
      const forte = campagneParLeTest(code, HAUSSE_PLUS_FORTE);
      expect(forte.some((r) => r.defaillant)).toBe(false);
      reference.forEach((r, i) => {
        const k = i + 1 === TRIMESTRE_DE_LA_CAMPAGNE ? 1 + HAUSSE_PLUS_FORTE : 1;
        expect(forte[i]!.incomeStatement.marketingCost, `T${i + 1}`).toBeCloseTo(r.incomeStatement.marketingCost * k, 6);
      });
      const sans = venteDeLAnnee(reference);
      const avec = venteDeLAnnee(forte);
      const campagne = somme(avec.publicite) - somme(sans.publicite);
      const gagnees = somme(avec.ventes) - somme(sans.ventes);
      const margeGagnee = somme(avec.marge) - somme(sans.marge);
      const a = champs(UNE_CAMPAGNE_PLUS_FORTE, "les-ventes", cas);
      expect(a["Ventes gagnées sur l'année"]).toBe(gagnees);
      expect(a["Coût d'une vente gagnée"]).toBe(auCentime(campagne / gagnees));
      const b = champs(UNE_CAMPAGNE_PLUS_FORTE, "la-marge", cas);
      expect(b["Marge gagnée sur l'année"]).toBe(margeGagnee);
      expect(b["Marge d'une vente gagnée"]).toBe(auCentime(margeGagnee / gagnees));
      expect(b["Ce que la campagne laisse"]).toBe(margeGagnee - campagne);
      const k = campagnePlusForte(cas);
      const meilleure = Math.max(0, k.janvier.laisse, k.forte.laisse);
      expect(k.choix).toBe(meilleure === 0 ? "aucune" : meilleure === k.forte.laisse ? "plus-forte" : "celle-de-janvier");
      // Loin de l'égalité : le choix ne tient pas au bruit des moteurs.
      expect(Math.abs(k.janvier.laisse - k.forte.laisse)).toBeGreaterThan(1000);
    },
    REJOUE_L_ANNEE,
  );

  it("textes propres, une seule bonne réponse, notions existantes ; le cas ne se devine pas à la longueur", () => {
    verifierLesTextes(UN_NOUVEAU_CLIENT, code);
    verifierLesTextes(UNE_CAMPAGNE_PLUS_FORTE, code);
    reponsesSansIndice(UNE_CAMPAGNE_PLUS_FORTE, code);
  }, REJOUE_L_ANNEE);
});

describe("ce que rapporte un nouveau client, les chiffres de l'arène aujourd'hui", () => {
  it("à l'hôtel : la campagne de janvier paie", () => {
    const hotel = casDeLEntreprise("hotel");
    const v = champs(UN_NOUVEAU_CLIENT, "ventes-gagnees", hotel);
    const m = champs(UN_NOUVEAU_CLIENT, "marge-d-une-vente", hotel);
    expect([v["Ventes gagnées au T1"], v["Ventes gagnées sur l'année"], champs(UN_NOUVEAU_CLIENT, "cout-d-une-vente", hotel)["Coût d'une vente gagnée"], m["Marge gagnée sur l'année"], m["Marge d'une vente gagnée"]]).toEqual([
      162, 352, 22.73, 25438, 72.27,
    ]);
    const forte = champs(UNE_CAMPAGNE_PLUS_FORTE, "la-marge", hotel);
    expect(forte["Ce que la campagne laisse"]).toBe(16237);
    expect(justeDe(UNE_CAMPAGNE_PLUS_FORTE, "reponse", hotel)).toBe("La campagne de janvier, sans plus");
  }, REJOUE_L_ANNEE);

  it("à la boutique : la campagne ne paie pas", () => {
    const boutique = casDeLEntreprise("boutique");
    expect(champs(UN_NOUVEAU_CLIENT, "cout-d-une-vente", boutique)["Coût d'une vente gagnée"]).toBe(35.71);
    expect(champs(UN_NOUVEAU_CLIENT, "marge-d-une-vente", boutique)["Marge d'une vente gagnée"]).toBe(23.52);
    expect(justeDe(UN_NOUVEAU_CLIENT, "la-campagne-paie", boutique)).toBe("Non : une vente gagnée coûte plus qu'elle ne rapporte");
  }, REJOUE_L_ANNEE);
});
