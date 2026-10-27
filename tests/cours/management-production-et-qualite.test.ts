import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { scenarioDuCours } from "../../src/config/cours/arene-du-cours";
import { anneeJouee, casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  EMBAUCHES_DU_CHAPITRE,
  ENTREPRISES_DE_LA_PRODUCTION,
  PRODUIRE,
  TRIMESTRE_DE_L_EMBAUCHE,
  anneeAvecEmbauches,
  production,
} from "../../src/config/cours/chapitres/produire";
import {
  ENTREPRISES_DE_LA_QUALITE,
  PRODUIRE_BIEN,
  SEUIL_DE_SURCHAUFFE_DU_MOTEUR,
  anneeAuBudget,
  budgetDuSecteur,
  qualite,
} from "../../src/config/cours/chapitres/produire-bien";
import { anneeDeReference } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES, PARCOURS, PROGRAMME } from "../../src/config/cours/registre";
import { DEUX_EMBAUCHES_POUR_PRODUIRE_PLUS, EMBAUCHES_DU_CAS, deuxEmbauches } from "../../src/config/cours/situations/par-chapitre/deux-embauches-pour-produire-plus";
import { LA_MOITIE_DU_BUDGET_QUALITE, PART_DU_BUDGET_DU_SECTEUR, moitieDuBudget } from "../../src/config/cours/situations/par-chapitre/la-moitie-du-budget-qualite";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeMontants, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { neutralDecisions } from "../../src/engine/bots";
import { computeProducedQuality } from "../../src/engine/production";
import { soldUnits } from "../../src/engine/simulation/runGame";
import type { CompanyRoundResult } from "../../src/engine/types";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX CHAPITRES DE PRODUCTION DU BAC STMG (MANAGEMENT), ET LEURS CAS.
 *
 * Produire : la capacité, la ressource qui bride et la productivité du travail sur l'année du
 * cours, puis l'année rejouée avec une embauche de plus. Produire bien : la qualité produite et
 * perçue, la surchauffe, les rebuts, puis l'année jouée sans budget qualité et avec celui du
 * secteur. Ces gardes recomposent les chiffres avec le moteur, sans passer par les fonctions des
 * chapitres, dans chaque entreprise où ils se jouent ; elles vérifient les rejeux (l'embauche posée
 * en plus de celles du gestionnaire, un budget qualité absolu à chaque trimestre), les valeurs
 * attendues des champs, les verdicts et leur variété, et que les textes se lisent : rien
 * d'indéfini, pas de « de le », pas de tiret au milieu d'une phrase, des élisions faites, une seule
 * bonne réponse par question, aucune option qui en contient une autre, des libellés uniques.
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

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "prévu"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas. */
function verifierLesTextes(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    // Le test de bout en bout lit ces titres : aucun ne nomme un bouton.
    expect(e.titre, e.id).not.toMatch(/vérifier|étape suivante|terminer/i);
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

/** Les étapes qui restent dans une entreprise. */
const idsDesEtapes = (ch: Chapitre, code: string) => chapitreDuCas(ch, casDeLEntreprise(code)).etapes.map((e) => e.id);

type Annee = readonly CompanyRoundResult[];
const somme = (a: Annee, f: (r: CompanyRoundResult) => number) => a.reduce((t, r) => t + f(r), 0);
const centieme = (x: number) => Math.round(x * 100) / 100;
const dixieme = (x: number) => Math.round(x * 10) / 10;

/** Ce que le moteur rend d'une année, relu à la main : les capacités, l'effectif, la production. */
function relire(code: string, annee: Annee) {
  const s = scenarioByCode(code).scenario;
  const { depart } = anneeJouee(code);
  expect(depart.productivity, code).toBe(1);
  const outil = annee.map((r) => Math.round(r.production.machineCapacity));
  const equipe = annee.map((r) => Math.floor(r.production.laborCapacity + 1e-9));
  // L'effectif se relit dans la capacité de l'équipe : effectif × heures d'un salarié ÷ heures d'une unité.
  const effectif = annee.map((r) => Math.round((r.production.laborCapacity * s.product.hoursPerUnit) / depart.hoursPerEmployee));
  const capacite = outil.map((o, k) => Math.min(o, equipe[k]!));
  const produite = annee.map((r) => Math.round(r.production.produced));
  const total = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
  const effectifs = total(effectif);
  return {
    outil,
    equipe,
    effectif,
    capacite,
    produite,
    sommeCapacite: total(capacite),
    sommeProduction: total(produite),
    effectifs,
    effectifMoyen: centieme(effectifs / 4),
    heures: effectifs * depart.hoursPerEmployee,
    resultat: Math.round(somme(annee, (r) => r.incomeStatement.operatingIncome)),
    embauches: Math.round(somme(annee, (r) => r.hr?.hired ?? 0)),
  };
}

const STMG_PRODUCTION = "STMG Thème 1 · Les organisations et l'activité de production de biens et de services";
const STMG_MANAGEMENT = "STMG Thème 1 · À la rencontre du management des organisations";

/**
 * L'écart de résultat qui fonde un verdict reste loin de zéro : à plus de cette marge, le bruit
 * des moteurs (`auBruitPres`) ne peut pas le faire changer de signe.
 */
const MARGE_DU_VERDICT = 500;

describe("les deux chapitres de production et leurs cas, dans le parcours de management", () => {
  it("portent les titres du programme, au palier 1, et des thèmes du référentiel STMG qui se résolvent", () => {
    const paires: [Chapitre, string[]][] = [
      [PRODUIRE, [STMG_PRODUCTION, STMG_MANAGEMENT]],
      [PRODUIRE_BIEN, [STMG_PRODUCTION]],
    ];
    for (const [ch, blocs] of paires) {
      expect(PROGRAMME["stmg-management"][1], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("stmg-management");
      expect(ch.palier).toBe(1);
      expect(ch.blocs).toEqual(blocs);
      expect(ch.libre).toBe(false);
      for (const bloc of blocs) {
        // Le bloc porte le préfixe du bac STMG, et désigne une entrée du texte, une seule.
        expect(referentielDeCitation(bloc)?.code, bloc).toBe("stmg");
        expect(blocOfficiel(bloc, "stmg"), bloc).toBe(bloc.replace("STMG ", ""));
      }
      // Un code neuf, qu'aucun autre chapitre du registre ne porte déjà.
      expect(CHAPITRES.some((x) => x.code === ch.code && x !== ch), ch.code).toBe(false);
    }
    expect(PARCOURS.find((p) => p.code === "stmg-management")!.formation).toBe("stmg");
    expect(PRODUIRE.code).toBe("produire");
    expect(PRODUIRE_BIEN.code).toBe("produire-bien");
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const paires: [Situation, Chapitre][] = [
      [DEUX_EMBAUCHES_POUR_PRODUIRE_PLUS, PRODUIRE],
      [LA_MOITIE_DU_BUDGET_QUALITE, PRODUIRE_BIEN],
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
    // Les textes écrivent ces nombres en toutes lettres (« un salarié de plus », « deux embauches »,
    // « la moitié ») : ils restent ceux des constantes.
    expect(EMBAUCHES_DU_CHAPITRE).toBe(1);
    expect(EMBAUCHES_DU_CAS).toBe(2);
    expect(PART_DU_BUDGET_DU_SECTEUR).toBe(0.5);
    expect(TRIMESTRE_DE_L_EMBAUCHE).toBe(1);
  });

  it("les entreprises se recomptent sur le moteur : un seul produit, servi dans le trimestre", () => {
    // Le moteur rend une gamme référence par référence (`products`), un portefeuille d'adhérents
    // à part (`subscription`) : ni l'un ni l'autre ne se lit ici.
    const recomptees = ENTREPRISES_DU_COURS.filter((code) => anneeDeReference(code).every((r) => !r.products && !r.subscription));
    expect([...ENTREPRISES_DE_LA_PRODUCTION]).toEqual(recomptees);
    expect([...ENTREPRISES_DE_LA_PRODUCTION]).toEqual(["nova", "hotel", "bistrot", "conseil", "ecommerce", "batiment", "transport"]);
    expect(ENTREPRISES_DE_LA_QUALITE).toEqual(ENTREPRISES_DE_LA_PRODUCTION);
    expect(PRODUIRE.entreprises!.codes).toEqual(ENTREPRISES_DE_LA_PRODUCTION);
    expect(PRODUIRE_BIEN.entreprises!.codes).toEqual(ENTREPRISES_DE_LA_QUALITE);
    // À la boutique, le budget qualité de la feuille ne change rien : chaque article a le sien.
    const boutique = anneeAuBudget("boutique", budgetDuSecteur("boutique"));
    expect(somme(boutique, soldUnits)).toBe(somme(anneeDeReference("boutique"), soldUnits));
  });

  it("le bon gestionnaire ne met aucun budget qualité dans sept entreprises sur neuf : le chapitre ne part pas d'une part de son budget", () => {
    const avecUnBudget = ENTREPRISES_DU_COURS.filter((code) => anneeDeReference(code).some((r) => r.incomeStatement.qualityCost > 0));
    expect(avecUnBudget).toEqual(["bistrot", "transport"]);
    expect(ENTREPRISES_DU_COURS.length - avecUnBudget.length).toBe(7);
  });
});

describe.each(ENTREPRISES_DE_LA_PRODUCTION)("produire chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const reference = anneeDeReference(code);
  const avec = anneeAvecEmbauches(code, EMBAUCHES_DU_CHAPITRE, "une-embauche-au-premier-trimestre");

  it("l'année du cours est celle de l'arène, et l'embauche se pose en plus de celles du gestionnaire", () => {
    expect(reference.map((r) => r.incomeStatement.netIncome)).toEqual(anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!.incomeStatement.netIncome));
    // Le premier trimestre embauche un salarié de plus que le gestionnaire ; l'année, aussi.
    expect(avec[0]!.hr?.hired ?? 0).toBe((reference[0]!.hr?.hired ?? 0) + EMBAUCHES_DU_CHAPITRE);
    expect(Math.round(somme(avec, (r) => r.hr?.hired ?? 0))).toBe(Math.round(somme(reference, (r) => r.hr?.hired ?? 0)) + EMBAUCHES_DU_CHAPITRE);
    // Le salarié arrive au deuxième trimestre : un de plus dès lors, rien de plus au premier.
    const a = relire(code, reference);
    const b = relire(code, avec);
    expect(b.effectif[0]).toBe(a.effectif[0]);
    for (const k of [1, 2, 3]) expect(b.effectif[k], `trimestre ${k + 1}`).toBe(a.effectif[k]! + EMBAUCHES_DU_CHAPITRE);
    // Aucune défaillance dans l'année rejouée.
    for (const r of avec) expect(r.defaillant ?? false).toBe(false);
  });

  it("les champs attendent ce que le moteur donne, recomposé à la main", () => {
    const a = relire(code, reference);
    const p = production(cas);
    expect(p.annee.trimestres.map((t) => t.effectif)).toEqual(a.effectif);
    expect(attendus(PRODUIRE, "capacite", cas)).toEqual({
      "Capacité de l'entreprise sur l'année": a.sommeCapacite,
      "Production de l'année": a.sommeProduction,
      "Taux d'utilisation de la capacité (%)": dixieme((a.sommeProduction / a.sommeCapacite) * 100),
    });
    expect(a.sommeProduction).toBeLessThanOrEqual(a.sommeCapacite);
    expect(attendus(PRODUIRE, "productivite", cas)).toEqual({
      "Effectif moyen de l'année": a.effectifMoyen,
      "Production par salarié": dixieme(a.sommeProduction / a.effectifMoyen),
      [`Production par ${code === "conseil" ? "jour" : "heure"} de travail`]: centieme(a.sommeProduction / a.heures),
    });
    const b = relire(code, avec);
    expect(attendus(PRODUIRE, "une-embauche", cas)).toEqual({
      "Production gagnée sur l'année": b.sommeProduction - a.sommeProduction,
      "Production par salarié avec l'embauche": dixieme(b.sommeProduction / b.effectifMoyen),
      "Écart de résultat de l'activité, avec l'embauche moins l'année du cours": b.resultat - a.resultat,
    });
    expect(Math.abs(b.resultat - a.resultat)).toBeGreaterThanOrEqual(MARGE_DU_VERDICT);
    // La ressource qui bride est la même à chaque trimestre : le retour le dit.
    const parTrimestre = new Set(a.outil.map((o, k) => (o <= a.equipe[k]! ? "outil" : "equipe")));
    expect([...parTrimestre]).toEqual([p.bride]);
    expect(juste(PRODUIRE, "ce-qui-bride", cas)).toBe(
      p.bride === "outil" ? "Les équipements : l'équipe pourrait faire davantage" : "L'équipe : les équipements pourraient faire davantage",
    );
    const gagnee = b.sommeProduction - a.sommeProduction;
    expect(juste(PRODUIRE, "embaucher", cas)).toBe(
      gagnee <= 0
        ? "Non : l'embauche ne fait rien produire de plus"
        : b.resultat > a.resultat
          ? "Oui : la production monte, et paie le salaire"
          : "Non : la production monte, mais ne paie pas le salaire",
    );
    // Là où les équipements brident, l'embauche ne fait rien produire de plus.
    if (p.bride === "outil") expect(gagnee).toBe(0);
  });

  it("le cas : la capacité au deuxième trimestre est celle du moteur, et l'année rejouée tient", () => {
    const deux = anneeAvecEmbauches(code, EMBAUCHES_DU_CAS, "cas-deux-embauches-au-premier-trimestre");
    expect(deux[0]!.hr?.hired ?? 0).toBe((reference[0]!.hr?.hired ?? 0) + EMBAUCHES_DU_CAS);
    const equipe = Math.floor(deux[1]!.production.laborCapacity + 1e-9);
    const outil = Math.round(reference[1]!.production.machineCapacity);
    expect(Math.round(deux[1]!.production.machineCapacity)).toBe(outil);
    expect(attendus(DEUX_EMBAUCHES_POUR_PRODUIRE_PLUS, "la-capacite", cas)).toEqual({
      "Capacité de l'équipe au 2e trimestre": equipe,
      "Capacité de l'entreprise au 2e trimestre": Math.min(outil, equipe),
    });
    const a = relire(code, reference);
    const b = relire(code, deux);
    expect(b.effectif[1]).toBe(a.effectif[1]! + EMBAUCHES_DU_CAS);
    expect(attendus(DEUX_EMBAUCHES_POUR_PRODUIRE_PLUS, "l-annee-rejouee", cas)).toEqual({
      "Production gagnée avec les deux embauches": b.sommeProduction - a.sommeProduction,
      "Écart de résultat, avec les deux embauches moins sans": b.resultat - a.resultat,
    });
    expect(Math.abs(b.resultat - a.resultat)).toBeGreaterThanOrEqual(MARGE_DU_VERDICT);
    const options = (DEUX_EMBAUCHES_POUR_PRODUIRE_PLUS.etapes.at(-1) as EtapeChoix).options(cas, etatVide);
    const bonne = options.find((o) => o.juste)!;
    expect(bonne.texte.length).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(PRODUIRE, code));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(DEUX_EMBAUCHES_POUR_PRODUIRE_PLUS, code));
});

describe.each(ENTREPRISES_DE_LA_QUALITE)("produire bien chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;
  const reference = anneeDeReference(code);
  const budget = budgetDuSecteur(code);
  const indice = (q: number) => Math.round(q * 100 * 10) / 10;

  it("le budget du rejeu est celui de la gestion neutre du secteur, posé tel quel à chaque trimestre", () => {
    const { depart } = anneeJouee(code);
    const neutre = neutralDecisions({ scenario: scenarioDuCours(scenarioByCode(code).scenario, 4), state: depart, roundIndex: 1 });
    expect(Math.round(neutre.qualityBudget)).toBe(budget);
    // L'année du cours engage ce budget à chaque trimestre, ou aucun.
    const engages = new Set(reference.map((r) => Math.round(r.incomeStatement.qualityCost)));
    expect(engages.size).toBe(1);
    expect([0, budget]).toContain([...engages][0]);
    const sans = anneeAuBudget(code, 0);
    const avec = anneeAuBudget(code, budget);
    for (const r of sans) expect(r.incomeStatement.qualityCost).toBe(0);
    for (const r of avec) expect(Math.round(r.incomeStatement.qualityCost)).toBe(budget);
    // L'une des deux années est l'année du cours.
    expect([sans, avec]).toContain(reference);
    for (const a of [sans, avec]) for (const r of a) expect(r.defaillant ?? false).toBe(false);
    const moitie = anneeAuBudget(code, Math.round(budget * PART_DU_BUDGET_DU_SECTEUR));
    for (const r of moitie) expect(Math.round(r.incomeStatement.qualityCost)).toBe(Math.round(budget * PART_DU_BUDGET_DU_SECTEUR));
  });

  it("la qualité perçue se recompose avec la règle du moteur, et la surchauffe avec son seuil", () => {
    const q = qualite(cas);
    const etats = anneeJouee(code).partie.rounds.map((t) => t.companies.find((x) => x.id === "joueur")!);
    expect(q.annee.trimestres.map((t) => t.percue)).toEqual(etats.map((e) => indice(e.perceivedQuality)));
    expect(q.annee.trimestres.map((t) => t.produite)).toEqual(reference.map((r) => indice(r.production.producedQuality)));
    // Le seuil du moteur : à 95 % la qualité ne perd rien, au-delà elle perd.
    expect(s.production.overheatThreshold).toBeUndefined();
    const args = { qualityBudget: 0, qualitySensitivity: s.production.qualitySensitivity, qualityScale: s.production.qualityScale };
    expect(computeProducedQuality({ ...args, utilizationRate: SEUIL_DE_SURCHAUFFE_DU_MOTEUR })).toBe(computeProducedQuality({ ...args, utilizationRate: 0 }));
    expect(computeProducedQuality({ ...args, utilizationRate: SEUIL_DE_SURCHAUFFE_DU_MOTEUR + 0.02 })).toBeLessThan(computeProducedQuality({ ...args, utilizationRate: 0 }));
    const plusCharge = Math.max(...reference.map((r) => r.production.utilizationRate));
    expect(q.surchauffe !== null).toBe(plusCharge > SEUIL_DE_SURCHAUFFE_DU_MOTEUR);
    expect(idsDesEtapes(PRODUIRE_BIEN, code).includes("la-surchauffe")).toBe(q.surchauffe !== null);
    if (q.surchauffe) {
      const k = reference.findIndex((r) => r.production.utilizationRate === plusCharge);
      expect(q.surchauffe.numero).toBe(k + 1);
      const champ = attendus(PRODUIRE_BIEN, "la-surchauffe", cas)["Qualité produite du trimestre le plus chargé (indice)"]!;
      // Le calcul sur les chiffres affichés retrouve la qualité du moteur, au dixième près.
      expect(Math.abs(champ - reference[k]!.production.producedQuality * 100)).toBeLessThanOrEqual(0.1);
    }
    expect(idsDesEtapes(PRODUIRE_BIEN, code).includes("les-rebuts")).toBe(s.qualityCosts !== undefined);
  });

  it("les champs attendent ce que le moteur donne, recomposé à la main, et le verdict suit l'écart de résultat", () => {
    const sans = anneeAuBudget(code, 0);
    const avec = anneeAuBudget(code, budget);
    const ventes = (a: Annee) => Math.round(somme(a, soldUnits));
    const resultat = (a: Annee) => Math.round(somme(a, (r) => r.incomeStatement.operatingIncome));
    const nonQualite = (a: Annee) => a.reduce((t, r) => t + Math.round((r.qualityCosts?.internalFailure ?? 0) + (r.qualityCosts?.externalFailure ?? 0)), 0);
    const rebuts = (a: Annee) => a.reduce((t, r) => t + Math.round(r.qualityCosts?.defectUnits ?? 0), 0);
    const produits = (a: Annee) => a.reduce((t, r) => t + Math.round(r.production.produced), 0);
    if (s.qualityCosts) {
      expect(attendus(PRODUIRE_BIEN, "les-rebuts", cas)).toEqual({
        "Rebuts de l'année": rebuts(reference),
        "Taux de rebut (%)": centieme((rebuts(reference) / produits(reference)) * 100),
        "Coût de la non-qualité de l'année": nonQualite(reference),
      });
      expect(rebuts(reference)).toBeGreaterThan(0);
    }
    // La qualité perçue du premier trimestre, sur les chiffres affichés, retrouve celle du moteur au dixième près.
    const lambda = s.production.qualityInertia;
    const percue = attendus(PRODUIRE_BIEN, "la-qualite-percue", cas);
    expect(percue["Budget qualité de l'année, au budget du secteur"]).toBe(4 * budget);
    expect(Math.abs(percue["Qualité perçue à la fin du 1er trimestre (indice)"]! - (lambda + (1 - lambda) * avec[0]!.production.producedQuality) * 100)).toBeLessThanOrEqual(0.1);
    const ecart = resultat(avec) - resultat(sans);
    expect(attendus(PRODUIRE_BIEN, "ce-que-la-qualite-change", cas)).toEqual({
      "Ventes gagnées avec le budget du secteur": ventes(avec) - ventes(sans),
      ...(s.qualityCosts ? { "Non-qualité évitée avec le budget": nonQualite(sans) - nonQualite(avec) } : {}),
      "Écart de résultat de l'activité, avec moins sans": ecart,
    });
    expect(Math.abs(ecart)).toBeGreaterThanOrEqual(MARGE_DU_VERDICT);
    // La qualité fait vendre partout : le budget attire des clients, sans toujours se payer.
    expect(ventes(avec)).toBeGreaterThan(ventes(sans));
    expect(juste(PRODUIRE_BIEN, "le-verdict", cas)).toBe(
      ecart <= 0
        ? "Non : il coûte plus qu'il ne fait gagner"
        : nonQualite(sans) - nonQualite(avec) >= 4 * budget
          ? "Oui : les rebuts évités suffisent à payer le budget"
          : "Oui : la marge des ventes gagnées paie le budget",
    );
  });

  it("le cas : la moitié du budget du secteur, face à l'année du cours", () => {
    const moitie = anneeAuBudget(code, Math.round(budget * PART_DU_BUDGET_DU_SECTEUR));
    const resultat = (a: Annee) => Math.round(somme(a, (r) => r.incomeStatement.operatingIncome));
    const ecart = resultat(moitie) - resultat(reference);
    expect(attendus(LA_MOITIE_DU_BUDGET_QUALITE, "l-annee-rejouee", cas)).toEqual({
      "Ventes en plus à la moitié du budget": Math.round(somme(moitie, soldUnits)) - Math.round(somme(reference, soldUnits)),
      "Écart de résultat, à la moitié moins l'année du cours": ecart,
    });
    expect(Math.abs(ecart)).toBeGreaterThanOrEqual(MARGE_DU_VERDICT);
    const lambda = s.production.qualityInertia;
    const champs = attendus(LA_MOITIE_DU_BUDGET_QUALITE, "la-qualite", cas);
    expect(champs["Budget qualité de l'année, à la moitié"]).toBe(4 * Math.round(budget * PART_DU_BUDGET_DU_SECTEUR));
    expect(Math.abs(champs["Qualité perçue à la fin du 1er trimestre (indice)"]! - (lambda + (1 - lambda) * moitie[0]!.production.producedQuality) * 100)).toBeLessThanOrEqual(0.1);
    expect(moitieDuBudget(cas).reponse).toBe(ecart > 0 ? "passer-a-la-moitie" : "ne-rien-changer");
    const options = (LA_MOITIE_DU_BUDGET_QUALITE.etapes.at(-1) as EtapeChoix).options(cas, etatVide);
    const bonne = options.find((o) => o.juste)!;
    expect(bonne.texte.length).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(PRODUIRE_BIEN, code));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(LA_MOITIE_DU_BUDGET_QUALITE, code));
});

describe("produire et produire bien, sur les sept entreprises", () => {
  const casDe = (code: string) => casDeLEntreprise(code);

  it("les verdicts se calculent et se rencontrent, ce que l'année permet vraiment", () => {
    // L'embauche ne se paie que là où l'équipe bride : au cabinet de conseil.
    const embauche = ENTREPRISES_DE_LA_PRODUCTION.map((c) => production(casDe(c)).verdict);
    expect([...new Set(embauche)].sort()).toEqual(["ne-produit-pas-plus", "produit-plus-et-se-paie"]);
    expect(ENTREPRISES_DE_LA_PRODUCTION.filter((c) => production(casDe(c)).bride === "equipe")).toEqual(["conseil"]);
    expect(ENTREPRISES_DE_LA_PRODUCTION.filter((c) => production(casDe(c)).verdict === "produit-plus-et-se-paie")).toEqual(["conseil"]);
    expect(ENTREPRISES_DE_LA_PRODUCTION.filter((c) => deuxEmbauches(casDe(c)).verdict === "produit-plus-et-se-paie")).toEqual(["conseil"]);
    expect(new Set(ENTREPRISES_DE_LA_PRODUCTION.map((c) => deuxEmbauches(casDe(c)).verdict)).size).toBe(2);
    // Le budget qualité se paie par les ventes là où le gestionnaire le met, et ne se paie pas
    // ailleurs : l'arène donne partout raison au bon gestionnaire. Les rebuts évités ne paient
    // nulle part le budget.
    const verdicts = ENTREPRISES_DE_LA_QUALITE.map((c) => qualite(casDe(c)).verdict);
    expect([...new Set(verdicts)].sort()).toEqual(["ne-se-paie-pas", "par-les-ventes"]);
    expect(ENTREPRISES_DE_LA_QUALITE.filter((c) => qualite(casDe(c)).verdict === "par-les-ventes")).toEqual(["bistrot", "transport"]);
    expect(ENTREPRISES_DE_LA_QUALITE.filter((c) => !qualite(casDe(c)).raison)).toEqual([]);
    // La moitié du budget du secteur ne fait mieux qu'au transporteur, qui en met le double.
    expect(ENTREPRISES_DE_LA_QUALITE.filter((c) => moitieDuBudget(casDe(c)).reponse === "passer-a-la-moitie")).toEqual(["transport"]);
    // Les étapes propres à certaines entreprises s'y jouent, et seulement là.
    expect(ENTREPRISES_DE_LA_QUALITE.filter((c) => idsDesEtapes(PRODUIRE_BIEN, c).includes("les-rebuts"))).toEqual(["bistrot", "ecommerce"]);
    expect(ENTREPRISES_DE_LA_QUALITE.filter((c) => idsDesEtapes(PRODUIRE_BIEN, c).includes("la-surchauffe"))).toEqual(["nova", "bistrot", "ecommerce", "batiment", "transport"]);
    // Au trimestre qui surchauffe, la qualité perçue baisse partout : la branche « monte moins vite »
    // de l'explication n'est lue nulle part.
    for (const c of ["nova", "bistrot", "ecommerce", "batiment", "transport"]) expect(qualite(casDe(c)).surchauffe!.percueEnBaisse, c).toBe(true);
  });

  it("chez NOVA, les chiffres des deux chapitres", () => {
    const p = production(casDe("nova"));
    expect(p.annee.capacite).toBe(28000);
    expect(p.annee.production).toBe(24286);
    expect(p.annee.utilisation).toBe(86.7);
    expect(p.annee.parSalarie).toBe(6071.5);
    expect(p.annee.parHeure).toBe(2.81);
    expect(p.bride).toBe("outil");
    expect(p.productionGagnee).toBe(0);
    expect(p.avec.parSalarie).toBe(5112.8);
    expect(p.ecartDeResultat).toBe(-27000);
    const q = qualite(casDe("nova"));
    expect(q.budget).toBe(3000);
    expect(q.surchauffe).toMatchObject({ numero: 3, base: 100, taux: 96.6, produite: 98.4 });
    expect(q.percueAuPremier).toBe(102.4);
    expect(q.ventesGagnees).toBe(39);
    expect(q.ecartDeResultat).toBe(-11181);
    expect(q.verdict).toBe("ne-se-paie-pas");
  });

  it("au cabinet de conseil et au bistrot, les chiffres qui portent les verdicts", () => {
    const p = production(casDe("conseil"));
    expect(p.annee.effectifMoyen).toBe(12.75);
    expect(p.productionGagnee).toBe(120);
    expect(p.ecartDeResultat).toBe(10600);
    const q = qualite(casDe("bistrot"));
    expect(q.annee.rebuts).toBe(518);
    expect(q.tauxDeRebut).toBe(1.83);
    expect(q.ventesGagnees).toBe(598);
    expect(q.nonQualiteEvitee).toBe(513);
    expect(q.ecartDeResultat).toBe(3766);
  });
});
