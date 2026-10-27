import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { anneeJouee, casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  ENTREPRISES_DU_SERVICE,
  LA_PRODUCTIVITE_DU_SERVICE,
  productiviteDuService,
} from "../../src/config/cours/chapitres/la-productivite-du-service";
import {
  BAISSE_EN_BASSE_SAISON,
  ENTREPRISES_DE_LA_SAISON,
  HAUSSE_EN_HAUTE_SAISON,
  LE_PRIX_SELON_LA_SAISON,
  lireLAnnee,
  prixSelonLaSaison,
  saisonDuMarche,
} from "../../src/config/cours/chapitres/le-prix-selon-la-saison";
import { anneeDeReference, rejouerAvec } from "../../src/config/cours/gestion-de-la-pme";
import { CHAPITRES, PARCOURS, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import { LE_COUT_DU_TRIMESTRE_CREUX, coutDuTrimestreCreux } from "../../src/config/cours/situations/par-chapitre/le-cout-du-trimestre-creux";
import {
  PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON,
  plusCherAuPlusFort,
} from "../../src/config/cours/situations/par-chapitre/plus-cher-au-plus-fort-de-la-saison";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeMontants, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { computePotentialDemand } from "../../src/engine/market/demand";
import { soldUnits } from "../../src/engine/simulation/runGame";
import type { CompanyRoundResult } from "../../src/engine/types";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX CHAPITRES DU BTS MHR AU PALIER 3, ET LEURS CAS : LA PRODUCTIVITÉ DU SERVICE, LE PRIX
 * SELON LA SAISON.
 *
 * La productivité : l'année du cours (`anneeJouee`), trimestre par trimestre, au bistrot et à
 * l'hôtel. Le prix selon la saison : la saisonnalité du scénario de l'hôtel, puis l'année rejouée
 * au prix de la saison et au prix du remplissage (gestion-de-la-pme.ts). Ces gardes recomposent
 * les chiffres avec le moteur, sans passer par les fonctions des chapitres ; elles vérifient que
 * chaque valeur attendue d'un champ est bien ce calcul, que le prix de l'hôtel est une décision
 * unique que le moteur honore, que la défaillance se tranche avant la somme, que les verdicts se
 * calculent, et que les textes se lisent : rien d'indéfini, pas de « de le », pas de tiret au
 * milieu d'une phrase, des élisions faites, une seule bonne réponse, aucune option qui en contient
 * une autre, des libellés uniques, des notions qui existent, des accords avec les unités féminines.
 */

const etatVide: EtatDuCours = { soldes: {} };

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(cas);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
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

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis"];

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
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-/);
      // Pas de capitales espacées, pas de nombre en toutes lettres devant ce qui se compte.
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix) (clientèles?|trimestres?|salariés?|chambres?|nuitées?|couverts?)\b/i);
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

/** La bonne réponse d'un cas ne se devine pas à sa longueur. */
function reponseSansIndice(s: Situation, code: string) {
  const cas = casDeLEntreprise(code);
  for (const e of s.etapes) {
    if (e.type !== "choix") continue;
    const options = e.options(cas, etatVide);
    const juste = options.find((o) => o.juste)!;
    expect(juste.texte.length, `${s.code} / ${code} / ${e.id}`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, id: string, cas: Cas): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  return Object.fromEntries(e.champs(cas, etatVide).map((c) => [c.libelle, c.attendu]));
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string, cas: Cas) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

const centime = (x: number) => Math.round(x * 100) / 100;
const dixieme = (x: number) => Math.round(x * 10) / 10;
const ventes = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.sold, 0);
const demande = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.demandForCompany, 0);
const somme = (a: readonly CompanyRoundResult[], f: (r: CompanyRoundResult) => number) => a.reduce((t, r) => t + f(r), 0);

const BLOC_3 = "BTS MHR Bloc 3 · Management de la production de services en hôtellerie restauration";
const BLOC_2 = "BTS MHR Bloc 2 · Mercatique des services en hôtellerie restauration";

describe("les deux chapitres et leurs cas, dans le parcours du BTS MHR", () => {
  it("portent les titres du programme, au palier 3, et le bloc du référentiel du BTS MHR qu'ils travaillent", () => {
    const paires: [Chapitre, string, string, string][] = [
      [LA_PRODUCTIVITE_DU_SERVICE, BLOC_3, "la-productivite-du-service", "La productivité du service : couverts et chambres par salarié"],
      [LE_PRIX_SELON_LA_SAISON, BLOC_2, "le-prix-selon-la-saison", "Remplir l'hôtel : le prix selon la saison"],
    ];
    for (const [ch, bloc, code, titre] of paires) {
      expect(ch.code).toBe(code);
      expect(ch.titre).toBe(titre);
      expect(PROGRAMME.mhr[3], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("mhr");
      expect(ch.palier).toBe(3);
      expect(ch.blocs).toEqual([bloc]);
      expect(ch.libre).toBe(false);
      // Le bloc porte le préfixe du BTS MHR, et désigne une entrée du texte, une seule.
      expect(referentielDeCitation(bloc)?.code, bloc).toBe("bts-mhr");
      expect(blocOfficiel(bloc, "bts-mhr"), bloc).toBe(bloc.replace("BTS MHR ", ""));
      // Un code neuf, qu'aucun chapitre du registre ni aucun cas ne porte déjà.
      expect(CHAPITRES.some((x) => x.code === ch.code && x !== ch), ch.code).toBe(false);
      expect(SITUATIONS.some((x) => x.code === ch.code), ch.code).toBe(false);
    }
    expect(PARCOURS.find((p) => p.code === "mhr")!.formation).toBe("bts-mhr");
    expect(LA_PRODUCTIVITE_DU_SERVICE.entreprises!.codes).toEqual(["bistrot", "hotel"]);
    expect(LE_PRIX_SELON_LA_SAISON.entreprises!.codes).toEqual(["hotel"]);
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const paires: [Situation, Chapitre][] = [
      [LE_COUT_DU_TRIMESTRE_CREUX, LA_PRODUCTIVITE_DU_SERVICE],
      [PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON, LE_PRIX_SELON_LA_SAISON],
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
      expect(SITUATIONS.some((x) => x.code === s.code && x !== s), s.code).toBe(false);
      for (const code of s.entreprises!.codes) reponseSansIndice(s, code);
    }
  });
});

describe.each(ENTREPRISES_DU_SERVICE)("la productivité du service chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;
  const hr = s.hr!;
  const { partie, depart } = anneeJouee(code);
  const annee = partie.rounds.map((t) => t.results["joueur"]!);
  const vendues = annee.map((r) => Math.round(soldUnits(r)));

  it("l'équipe est fixe toute l'année, et sa paie est dans les charges de structure de l'arène", () => {
    for (const t of partie.rounds) expect(t.companies.find((x) => x.id === "joueur")!.headcount).toBe(depart.headcount);
    expect(depart.headcount).toBe(hr.includedHeadcount);
    for (const r of annee) expect(r.incomeStatement.fixedCosts).toBe(s.fixedCostsPerRound);
    // Aucune commande en plus : les ventes du trimestre sont celles des clientèles.
    for (const r of annee) expect(soldUnits(r)).toBeCloseTo(ventes(r), 6);
  });

  it("les champs attendent ce que le moteur donne, recomposé à la main", () => {
    const p = productiviteDuService(cas);
    const effectif = depart.headcount;
    const personnel = effectif * hr.salaryPerEmployeePerRound;
    const iPlein = vendues.indexOf(Math.max(...vendues));
    const iCreux = vendues.indexOf(Math.min(...vendues));
    expect(p.plein.numero).toBe(iPlein + 1);
    expect(p.creux.numero).toBe(iCreux + 1);
    const champs = (i: number) => ({
      [`${cas.unites.charAt(0).toUpperCase()}${cas.unites.slice(1)} par salarié sur le trimestre`]: dixieme(vendues[i]! / effectif),
      [`${cas.unites.charAt(0).toUpperCase()}${cas.unites.slice(1)} par salarié et par jour`]: centime(vendues[i]! / (effectif * s.roundDays)),
      [`Coût du personnel par ${cas.unite}`]: centime(personnel / vendues[i]!),
    });
    expect(attendus(LA_PRODUCTIVITE_DU_SERVICE, "plein", cas)).toEqual(champs(iPlein));
    expect(attendus(LA_PRODUCTIVITE_DU_SERVICE, "creux", cas)).toEqual(champs(iCreux));
    const prodPlein = dixieme(vendues[iPlein]! / effectif);
    const prodCreux = dixieme(vendues[iCreux]! / effectif);
    const coutPlein = centime(personnel / vendues[iPlein]!);
    const coutCreux = centime(personnel / vendues[iCreux]!);
    expect(attendus(LA_PRODUCTIVITE_DU_SERVICE, "ecart", cas)).toEqual({
      "Variation de la productivité (%)": dixieme((prodCreux / prodPlein - 1) * 100),
      [`Variation du coût du personnel par ${cas.unite} (%)`]: dixieme((coutCreux / coutPlein - 1) * 100),
    });
    // Le coût par client monte plus que la productivité ne baisse : le même coût, moins de clients.
    expect(p.variationDuCout).toBeGreaterThan(-p.variationDeLaProductivite);
    const rc = annee[iCreux]!;
    const capacite = Math.min(Math.round(rc.production.machineCapacity), Math.floor(rc.production.laborCapacity + 1e-9));
    expect(attendus(LA_PRODUCTIVITE_DU_SERVICE, "plafond", cas)).toEqual({
      "Productivité à pleine capacité": dixieme(capacite / effectif),
      [`Coût du personnel par ${cas.unite} à pleine capacité`]: centime(personnel / capacite),
    });
  });

  it("les verdicts se calculent : la même équipe, et des clients refusés au trimestre creux", () => {
    const p = productiviteDuService(cas);
    expect(juste(LA_PRODUCTIVITE_DU_SERVICE, "pourquoi", cas)).toBe("La même équipe, payée pareil, pour moins de clients");
    const rc = annee[p.creux.numero - 1]!;
    const refuses = Math.round(demande(rc)) > Math.round(soldUnits(rc));
    expect(juste(LA_PRODUCTIVITE_DU_SERVICE, "remplir-le-creux", cas).startsWith(refuses ? "Servir les clients refusés" : "Attirer plus de clients")).toBe(true);
    // Dans l'année du cours, le trimestre creux a refusé des clients, au bistrot comme à l'hôtel :
    // c'est « Couverts à préparer » ou « Nuitées mises en vente » qui l'a laissé creux.
    expect(refuses).toBe(true);
  });

  it("le cas : le coût moyen de l'année, ce qu'il fallait servir au trimestre creux, et si c'était possible", () => {
    const effectif = depart.headcount;
    const personnel = effectif * hr.salaryPerEmployeePerRound;
    const total = vendues.reduce((t, x) => t + x, 0);
    const coutAnnee = centime((personnel * annee.length) / total);
    const iCreux = vendues.indexOf(Math.min(...vendues));
    const aServir = Math.ceil(personnel / coutAnnee - 1e-9);
    expect(aServir * coutAnnee).toBeGreaterThanOrEqual(personnel);
    expect((aServir - 1) * coutAnnee).toBeLessThan(personnel);
    const U = `${cas.unites.charAt(0).toUpperCase()}${cas.unites.slice(1)}`;
    expect(attendus(LE_COUT_DU_TRIMESTRE_CREUX, "l-annee", cas)).toEqual({
      "Coût du personnel de l'année": personnel * annee.length,
      [`${U} de l'année`]: total,
      [`Coût du personnel par ${cas.unite} sur l'année`]: coutAnnee,
    });
    expect(attendus(LE_COUT_DU_TRIMESTRE_CREUX, "le-creux", cas)).toEqual({
      [`${U} à servir au ${iCreux === 0 ? "1er" : `${iCreux + 1}e`} trimestre`]: aServir,
      [`${U} en plus`]: aServir - vendues[iCreux]!,
      "Productivité par salarié visée": dixieme(aServir / effectif),
    });
    const rc = annee[iCreux]!;
    const capacite = Math.min(Math.round(rc.production.machineCapacity), Math.floor(rc.production.laborCapacity + 1e-9));
    const verdict = aServir > capacite ? "capacite" : aServir > Math.round(demande(rc)) ? "demande" : "possible";
    expect(coutDuTrimestreCreux(cas).verdict).toBe(verdict);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(LA_PRODUCTIVITE_DU_SERVICE, code));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(LE_COUT_DU_TRIMESTRE_CREUX, code));
});

describe("le prix selon la saison, à l'hôtel", () => {
  const code = "hotel";
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;
  const reference = anneeDeReference(code);
  const prixDeLAnnee = (a: readonly CompanyRoundResult[]) => a.map((r) => r.incomeStatement.revenue / soldUnits(r));
  /** L'année au prix de la saison, rejouée à part, avec une clé du test : haute saison au 2e et au 3e trimestre. */
  const haute = [2, 3];
  const anneeDeSaison = () =>
    rejouerAvec(code, "test-mhr:prix-de-la-saison", (t, d) => ({
      ...d,
      price: d.price * (haute.includes(t) ? 1 + HAUSSE_EN_HAUTE_SAISON : 1 - BAISSE_EN_BASSE_SAISON),
    }));

  it("le prix de l'hôtel est une décision unique, que le moteur honore tel quel", () => {
    expect(ENTREPRISES_DE_LA_SAISON).toEqual(["hotel"]);
    // Une seule nuitée à prix moyen : pas de références, le prix scalaire est le seul prix.
    expect(s.products === undefined || s.products.length <= 1).toBe(true);
    expect(reference.map((r) => r.incomeStatement.netIncome)).toEqual(anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!.incomeStatement.netIncome));
    const unique = prixDeLAnnee(reference);
    for (const x of unique) expect(x).toBeCloseTo(unique[0]!, 6);
    // Rejouée à part, avec une clé du test, l'année au prix de la saison donne les mêmes prix.
    const rejouee = anneeDeSaison();
    prixDeLAnnee(rejouee).forEach((x, i) => expect(x).toBeCloseTo(unique[0]! * (haute.includes(i + 1) ? 1 + HAUSSE_EN_HAUTE_SAISON : 1 - BAISSE_EN_BASSE_SAISON), 6));
    const p = prixSelonLaSaison(cas);
    expect(p.saison.trimestres.map((t) => t.resultat)).toEqual(rejouee.map((r) => Math.round(r.incomeStatement.netIncome)));
    expect(p.saison.trimestres.map((t) => t.prix)).toEqual(prixDeLAnnee(rejouee).map(centime));
  });

  it("la saisonnalité est celle du scénario : haute saison au 2e et au 3e trimestre, basse au 1er et au 4e", () => {
    const totaux = [1, 2, 3, 4].map((k) => s.market.segments.reduce((t, g) => t + Math.round(computePotentialDemand(g, k, s.market.seasonality, 1)), 0));
    const moyenne = centime(totaux.reduce((t, x) => t + x, 0) / 4);
    const m = saisonDuMarche(cas);
    expect(m.totaux).toEqual(totaux);
    expect(m.haute).toEqual([2, 3]);
    expect(m.basse).toEqual([1, 4]);
    expect(attendus(LE_PRIX_SELON_LA_SAISON, "coefficients", cas)).toEqual({
      "Demande moyenne d'un trimestre": moyenne,
      "Coefficient du 3e trimestre": centime(totaux[2]! / moyenne),
      "Coefficient du 1er trimestre": centime(totaux[0]! / moyenne),
    });
  });

  it("les champs attendent ce que le moteur donne, recomposé à la main", () => {
    const p = prixSelonLaSaison(cas);
    const indicateurs = (a: readonly CompanyRoundResult[]) => {
      const v = somme(a, (r) => Math.round(soldUnits(r)));
      const o = somme(a, (r) => Math.round(r.production.machineCapacity));
      const ca = somme(a, (r) => Math.round(r.incomeStatement.revenue));
      return { v, o, ca, occupation: dixieme((v / o) * 100), prixMoyen: centime(ca / v), revpar: centime(ca / o), resultat: somme(a, (r) => Math.round(r.incomeStatement.netIncome)) };
    };
    const u = indicateurs(reference);
    // Au prix unique : des clients refusés au 3e et au 4e trimestre, des nuitées vides au 1er et au 2e.
    const rang = (i: number) => (i === 0 ? "1er" : `${i + 1}e`);
    const refuses = reference.flatMap((r, i) => {
      const n = Math.round(demande(r)) - Math.round(r.production.produced);
      return n > 0 ? [[`Nuitées refusées au ${rang(i)} trimestre`, n] as const] : [];
    });
    const videes = reference.flatMap((r, i) => {
      const n = Math.round(r.production.produced) - Math.round(soldUnits(r));
      return n > 0 ? [[`Nuitées vides au ${rang(i)} trimestre`, n] as const] : [];
    });
    expect(attendus(LE_PRIX_SELON_LA_SAISON, "prix-unique", cas)).toEqual(Object.fromEntries([...refuses, ...videes]));
    expect(refuses.map(([l]) => l)).toEqual(["Nuitées refusées au 3e trimestre", "Nuitées refusées au 4e trimestre"]);
    expect(videes.map(([l]) => l)).toEqual(["Nuitées vides au 1er trimestre", "Nuitées vides au 2e trimestre"]);
    expect([p.unique.occupation, p.unique.prixMoyen, p.unique.revpar]).toEqual([u.occupation, u.prixMoyen, u.revpar]);
    // Le revenu par chambre disponible est bien le prix moyen fois le taux d'occupation.
    expect(Math.abs(u.revpar - (u.prixMoyen * u.v) / u.o)).toBeLessThanOrEqual(0.01);
    const saison = anneeDeSaison();
    const k = indicateurs(saison);
    expect(attendus(LE_PRIX_SELON_LA_SAISON, "prix-de-la-saison", cas)).toEqual({
      "Taux d'occupation au prix de la saison (%)": k.occupation,
      "Prix moyen au prix de la saison": k.prixMoyen,
      "Revenu par chambre disponible au prix de la saison": k.revpar,
      "Écart de résultat net, saison moins prix unique": k.resultat - u.resultat,
    });
    // Ce qu'une baisse doit faire vendre, aux trimestres où des nuitées en vente sont restées vides.
    const vides = reference.map((r, i) => ({ i, vides: Math.round(r.production.produced) - Math.round(soldUnits(r)), vendues: Math.round(soldUnits(r)) })).filter((x) => x.vides > 0);
    expect(vides.map((x) => x.i + 1)).toEqual([1, 2]);
    const aGagner = (n: number) => Math.ceil((n * BAISSE_EN_BASSE_SAISON) / (1 - BAISSE_EN_BASSE_SAISON) - 1e-9);
    expect(attendus(LE_PRIX_SELON_LA_SAISON, "ce-qu-une-baisse-doit-vendre", cas)).toEqual(
      Object.fromEntries(vides.map((x) => [`Nuitées à gagner au ${x.i === 0 ? "1er" : `${x.i + 1}e`} trimestre`, aGagner(x.vendues)])),
    );
    // La baisse ne se joue qu'où les nuitées vides pouvaient la payer : le 1er trimestre, pas le 2e.
    expect(p.baisses).toEqual(vides.filter((x) => x.vides >= aGagner(x.vendues)).map((x) => x.i + 1));
    expect(p.baisses).toEqual([1]);
    expect(p.refus).toEqual([3, 4]);
    const facteurs = [1 - BAISSE_EN_BASSE_SAISON, 1, 1 + HAUSSE_EN_HAUTE_SAISON, 1 + HAUSSE_EN_HAUTE_SAISON];
    const remplissage = rejouerAvec(code, "test-mhr:prix-du-remplissage", (t, d) => (facteurs[t - 1] === 1 ? undefined : { ...d, price: d.price * facteurs[t - 1]! }));
    const r = indicateurs(remplissage);
    expect(attendus(LE_PRIX_SELON_LA_SAISON, "prix-du-remplissage", cas)).toEqual({
      "Taux d'occupation au prix du remplissage (%)": r.occupation,
      "Revenu par chambre disponible au prix du remplissage": r.revpar,
      "Écart de résultat net, remplissage moins prix unique": r.resultat - u.resultat,
    });
  });

  it("la défaillance se tranche avant la somme, et les verdicts se calculent", () => {
    const p = prixSelonLaSaison(cas);
    // Aucune des trois années ne finit en défaillance : leurs résultats additionnés se comparent.
    for (const a of [p.unique, p.saison, p.remplissage]) expect(a.defaillance).toBeNull();
    // Une année marquée défaillante au 3e trimestre est lue comme telle.
    const marquee = reference.map((r, i) => (i === 2 ? { ...r, defaillant: true } : r));
    expect(lireLAnnee(marquee).defaillance).toBe(3);
    // Le prix de la saison fait moins bien que le prix unique ; celui du remplissage, mieux que les deux.
    expect(p.ecartSaison).toBeLessThan(0);
    expect(p.ecartRemplissage).toBeGreaterThan(0);
    expect(juste(LE_PRIX_SELON_LA_SAISON, "verdict-de-la-saison", cas)).toBe(p.ecartSaison > 0 ? "Oui : le résultat net de l'année monte" : "Non : le résultat net de l'année baisse");
    expect(juste(LE_PRIX_SELON_LA_SAISON, "la-regle", cas)).toBe("Regarder s'il reste des chambres à vendre ou des clients refusés, pas seulement le calendrier");
    expect(juste(LE_PRIX_SELON_LA_SAISON, "lire-l-annee", cas)).toBe("Trop bas quand des clients repartaient, trop haut quand des nuitées restaient vides");
    // Le calendrier et le remplissage se contredisent : au 2e trimestre (haute saison, nuitées vides), au 4e (basse saison, clients refusés).
    expect(p.hausseMalPlacee).toEqual([2]);
    expect(p.baisseMalPlacee).toEqual([4]);
  });

  it("le cas : le seul trimestre le plus fort, plus cher, et ce que l'année y gagne", () => {
    const x = plusCherAuPlusFort(cas);
    expect(x.k).toBe(3);
    const releve = rejouerAvec(code, "test-mhr:plus-cher-au-plus-fort", (t, d) => (t === 3 ? { ...d, price: d.price * (1 + HAUSSE_EN_HAUTE_SAISON) } : undefined));
    for (const r of releve) expect(r.defaillant ?? false).toBe(false);
    const avant = reference[2]!;
    const apres = releve[2]!;
    expect(apres.incomeStatement.revenue / soldUnits(apres)).toBeCloseTo((avant.incomeStatement.revenue / soldUnits(avant)) * (1 + HAUSSE_EN_HAUTE_SAISON), 6);
    const o = Math.round(avant.production.machineCapacity);
    expect(attendus(PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON, "le-trimestre", cas)).toEqual({
      "Taux d'occupation au prix unique (%)": dixieme((Math.round(soldUnits(avant)) / o) * 100),
      "Taux d'occupation au prix relevé (%)": dixieme((Math.round(soldUnits(apres)) / Math.round(apres.production.machineCapacity)) * 100),
      "Revenu par chambre disponible au prix unique": centime(Math.round(avant.incomeStatement.revenue) / o),
      "Revenu par chambre disponible au prix relevé": centime(Math.round(apres.incomeStatement.revenue) / Math.round(apres.production.machineCapacity)),
    });
    const ecart = somme(releve, (r) => Math.round(r.incomeStatement.netIncome)) - somme(reference, (r) => Math.round(r.incomeStatement.netIncome));
    expect(attendus(PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON, "l-annee", cas)).toEqual({ "Écart de résultat net de l'année, prix relevé moins prix unique": ecart });
    expect(x.verdict).toBe(ecart > 0 ? "monter" : "garder");
    expect(juste(PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON, "reponse", cas)).toBe(ecart > 0 ? "Montez-la au 3e trimestre : l'année y gagne" : "Gardez le prix unique : la hausse fait perdre plus de clients qu'elle ne rapporte");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(LE_PRIX_SELON_LA_SAISON, code));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON, code));
});
