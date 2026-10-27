import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { anneeJouee, casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { MARCHES } from "../../src/config/cours/chapitres/marche-et-part-de-marche";
import {
  CATEGORIES_DU_DIAGNOSTIC,
  ENTREPRISES_DU_DIAGNOSTIC,
  LE_DIAGNOSTIC_STRATEGIQUE,
  TAUX_DE_SERVICE_ATTENDU,
  cleSansEvenement,
  diagnostic,
} from "../../src/config/cours/chapitres/le-diagnostic-strategique";
import {
  ENTREPRISES_DES_OBJECTIFS,
  SE_FIXER_DES_OBJECTIFS,
  TAUX_DE_CAPACITE_VISE,
  suiviDesObjectifs,
} from "../../src/config/cours/chapitres/se-fixer-des-objectifs";
import { anneeDeReference, rejouerAvec, surLAnnee } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { PROGRAMME } from "../../src/config/cours/registre";
import {
  DES_CLIENTS_REPARTIS_SANS_ETRE_SERVIS,
  clientsRepartis,
} from "../../src/config/cours/situations/par-chapitre/des-clients-repartis-sans-etre-servis";
import { TAUX_AMBITIEUX, UN_OBJECTIF_PLUS_AMBITIEUX, objectifAmbitieux } from "../../src/config/cours/situations/par-chapitre/un-objectif-plus-ambitieux";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import type { CompanyRoundResult } from "../../src/engine/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX PREMIERS CHAPITRES DU PARCOURS « STRATÉGIE ET MANAGEMENT », ET LEURS CAS PRATIQUES.
 *
 * Le diagnostic stratégique range les constats de l'année de l'arène ; se fixer des objectifs
 * suit, trimestre après trimestre, un objectif tiré de la capacité de départ. Ces gardes
 * recomposent leurs chiffres avec le moteur, indépendamment du code des chapitres, dans chaque
 * entreprise où ils se jouent : les ventes, la demande et les parts de marché clientèle par
 * clientèle, le résultat et la trésorerie de l'année du cours, l'événement de l'année rejouée
 * sans lui, la capacité de l'équipement et de l'équipe. Elles vérifient le sens donné à chaque
 * constat, la règle de chaque conclusion, et que leurs textes se lisent : rien d'indéfini, pas de
 * tiret au milieu d'une phrase, des élisions faites, une seule bonne réponse par question, des
 * libellés uniques, des options qu'un clic par leur texte ne confond pas.
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).colonnes, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    case "tri":
      return [e.question(cas), ...e.categories.map((k) => k.libelle), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(cas), ...tableau];
    default:
      throw new Error(`type d'étape inattendu : ${e.type}`);
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier"];

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
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      // Des capitales espacées (« F O R C E ») ne se lisent pas.
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      // Un négatif prend le signe moins (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}/);
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
      // Le test de bout en bout clique l'option par son texte : aucun ne doit en contenir un autre.
      for (const a of options) for (const b of options) if (a !== b) expect(a.texte.toLowerCase().includes(b.texte.toLowerCase()), `${e.id} : ${b.texte}`).toBe(false);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
    }
    if (e.type === "tri") {
      const elements = e.elements(cas);
      const codes = new Set(e.categories.map((k) => k.code));
      expect(new Set(elements.map((x) => x.libelle)).size, e.id).toBe(elements.length);
      for (const x of elements) {
        expect(codes.has(x.categorie), `${e.id} : ${x.libelle}`).toBe(true);
        expect(Number.isFinite(x.montant), `${e.id} : ${x.libelle}`).toBe(true);
        // Le test de bout en bout trouve l'élément par un sélecteur entre guillemets droits.
        expect(x.libelle, e.id).not.toMatch(/["\\]/);
      }
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
}

/** La bonne réponse du livrable d'un cas ne se devine pas à sa longueur. */
function reponseNonTrahie(s: Situation, code: string) {
  const cas = casDeLEntreprise(code);
  const e = s.etapes.at(-1)!;
  if (e.type !== "choix") throw new Error("la réponse est un choix");
  const options = e.options(cas, { soldes: {} });
  const juste = options.find((o) => o.juste)!;
  expect(juste.texte.length).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
}

const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const segments = (r: CompanyRoundResult) => Object.values(r.market.bySegment);
const vendues = (r: CompanyRoundResult) => somme(segments(r).map((v) => v.sold));
const manquees = (r: CompanyRoundResult) => somme(segments(r).map((v) => v.lost));
const demandees = (r: CompanyRoundResult) => somme(segments(r).map((v) => v.demandForCompany));
const potentiel = (r: CompanyRoundResult) => somme(segments(r).map((v) => v.potential));
const BLOC_DIAGNOSTIC = "STMG Thème 2 · Le management stratégique, du diagnostic à la fixation des objectifs";

describe("les deux chapitres et leurs cas, dans le parcours Stratégie et management", () => {
  it("portent les titres du programme, au palier 1, dans le parcours de la stratégie", () => {
    for (const ch of [LE_DIAGNOSTIC_STRATEGIQUE, SE_FIXER_DES_OBJECTIFS]) {
      expect(PROGRAMME.strategie[1], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("strategie");
      expect(ch.palier).toBe(1);
      expect(ch.libre).toBe(false);
      expect(ch.blocs).toContain(BLOC_DIAGNOSTIC);
    }
    expect(LE_DIAGNOSTIC_STRATEGIQUE.code).toBe("le-diagnostic-strategique");
    expect(SE_FIXER_DES_OBJECTIFS.code).toBe("se-fixer-des-objectifs");
    expect(PROGRAMME.strategie[1]).toEqual([LE_DIAGNOSTIC_STRATEGIQUE.titre, SE_FIXER_DES_OBJECTIFS.titre]);
  });

  it("citent des blocs qui portent le préfixe d'un diplôme et désignent une entrée de son texte", () => {
    expect(LE_DIAGNOSTIC_STRATEGIQUE.blocs).toEqual([BLOC_DIAGNOSTIC, "DCG UE7 · Management des organisations"]);
    expect(SE_FIXER_DES_OBJECTIFS.blocs).toEqual([BLOC_DIAGNOSTIC, "2de MG · Organiser et décider, des objectifs à la réalisation"]);
    for (const bloc of [...LE_DIAGNOSTIC_STRATEGIQUE.blocs, ...SE_FIXER_DES_OBJECTIFS.blocs]) {
      const cite = referentielDeCitation(bloc);
      expect(cite, bloc).not.toBeNull();
      expect(blocOfficiel(bloc, cite!.code), bloc).not.toBeNull();
    }
  });

  it("se jouent partout sauf chez VOLT FITNESS, dont le marché se compte en abonnés gardés", () => {
    expect(ENTREPRISES_DU_DIAGNOSTIC).toEqual(ENTREPRISES_DU_COURS.filter((c) => c !== "fitness"));
    expect(ENTREPRISES_DU_DIAGNOSTIC).toEqual(MARCHES);
    expect(ENTREPRISES_DES_OBJECTIFS).toEqual(MARCHES);
    expect(scenarioByCode("fitness").scenario.subscription).toBeDefined();
    for (const ch of [LE_DIAGNOSTIC_STRATEGIQUE, SE_FIXER_DES_OBJECTIFS]) {
      expect(ch.entreprises!.codes).toEqual(MARCHES);
      expect(ch.entreprises!.pourquoi).toContain("VOLT FITNESS");
    }
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const paires: [Situation, Chapitre][] = [
      [DES_CLIENTS_REPARTIS_SANS_ETRE_SERVIS, LE_DIAGNOSTIC_STRATEGIQUE],
      [UN_OBJECTIF_PLUS_AMBITIEUX, SE_FIXER_DES_OBJECTIFS],
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
    }
  });

  it("les hypothèses du cours sont des constantes, et l'objectif du cas vise plus haut que celui du chapitre", () => {
    expect(TAUX_DE_SERVICE_ATTENDU).toBe(0.95);
    expect(TAUX_DE_CAPACITE_VISE).toBe(0.7);
    expect(TAUX_AMBITIEUX).toBe(0.9);
    expect(TAUX_AMBITIEUX).toBeGreaterThan(TAUX_DE_CAPACITE_VISE);
  });
});

describe.each(ENTREPRISES_DU_DIAGNOSTIC)("le diagnostic stratégique chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const def = scenarioByCode(code);
  const s = def.scenario;
  const { partie } = anneeJouee(code);
  const joueur = partie.rounds.map((t) => t.results["joueur"]!);

  it("les enseignes sont celles de l'arène, et leurs chiffres ceux du moteur", () => {
    const d = diagnostic(cas);
    expect(d.trimestres).toBe(4);
    expect(d.enseignes.map((x) => x.id)).toEqual(["joueur", ...def.bots.slice(0, 2).map((b) => b.id)]);
    expect(d.concurrents.map((x) => x.nom)).toEqual(def.bots.slice(0, 2).map((b) => b.name));
    const marche = somme(joueur.map((r) => Math.round(potentiel(r))));
    expect(d.marche.annee).toBe(marche);
    for (const x of d.enseignes) {
      const rs = partie.rounds.map((t) => t.results[x.id]!);
      expect(x.ventes, x.id).toBe(somme(rs.map((r) => Math.round(vendues(r)))));
      expect(Math.abs(x.ventes - somme(rs.map(vendues))), x.id).toBeLessThanOrEqual(2);
      expect(x.chiffreDAffaires, x.id).toBe(Math.round(somme(rs.map((r) => r.incomeStatement.revenue))));
      expect(x.prix, x.id).toBeCloseTo(somme(rs.map((r) => r.incomeStatement.revenue)) / somme(rs.map(vendues)), 2);
      expect(x.resultat, x.id).toBe(Math.round(somme(rs.map((r) => r.incomeStatement.netIncome))));
      expect(x.tauxDeMarge, x.id).toBeCloseTo((somme(rs.map((r) => r.incomeStatement.grossMargin)) / x.chiffreDAffaires) * 100, 0);
      expect(x.part, x.id).toBe(auDixieme((x.ventes / marche) * 100));
      expect(x.qualite, x.id).toBeCloseTo(partie.rounds.at(-1)!.companies.find((k) => k.id === x.id)!.perceivedQuality, 2);
      const k = rs.findIndex((r) => r.defaillant);
      expect(x.defaillance?.trimestre ?? null, x.id).toBe(k < 0 ? null : k + 1);
    }
    // L'année du diagnostic est celle que la gestion de la PME rejoue : même résultat, au centime.
    expect(d.entreprise.resultat).toBe(Math.round(surLAnnee(anneeDeReference(code), (r) => r.incomeStatement.netIncome)));
    expect(d.tresorerie).toBe(Math.round(anneeDeReference(code).at(-1)!.functionalBalance.netTreasury));
  });

  it("la demande servie se recompose : les ventes et les ventes manquées font la demande adressée", () => {
    const d = diagnostic(cas);
    for (const r of joueur) expect(vendues(r) + manquees(r)).toBeCloseTo(demandees(r), 3);
    expect(d.manquees).toBe(somme(joueur.map((r) => Math.round(manquees(r)))));
    // Les deux chapitres lisent les mêmes ventes et la même demande de l'année.
    const o = suiviDesObjectifs(cas);
    expect([d.entreprise.ventes, d.demande]).toEqual([o.ventesDeLAnnee, o.demandeDeLAnnee]);
    expect(d.demande).toBe(d.entreprise.ventes + d.manquees);
    // Ventes et ventes manquées s'arrondissent à l'unité trimestre par trimestre : la demande
    // recomposée ne s'écarte de celle du moteur que de ces arrondis, pas d'une unité de plus.
    const arrondis = somme(joueur.map((r) => Math.abs(Math.round(vendues(r)) - vendues(r)) + Math.abs(Math.round(manquees(r)) - manquees(r))));
    expect(Math.abs(d.demande - somme(joueur.map(demandees)))).toBeLessThanOrEqual(arrondis + 1e-6);
    expect(d.servie).toBe(auDixieme((d.entreprise.ventes / d.demande) * 100));
    expect(d.caManque).toBe(Math.round(d.manquees * d.entreprise.prix));
    expect(d.evolutionDuMarche).toBe(auDixieme((Math.round(potentiel(joueur.at(-1)!)) / Math.round(potentiel(joueur[0]!)) - 1) * 100));
  });

  it("l'événement de l'année est celui que le scénario déclenche, et l'année rejouée sans lui mesure son effet", () => {
    const d = diagnostic(cas);
    const tires = partie.rounds.flatMap((t, k) => t.newEvents.map((e) => ({ code: e.code, round: k + 1 })));
    const scriptes = (s.scriptedEvents ?? []).filter((e) => e.round <= partie.rounds.length).map((e) => ({ code: e.eventCode, round: e.round }));
    // Aucun événement tiré au hasard dans l'année du cours : le rejeu sans le scénarisé suffit.
    expect(tires).toEqual(scriptes);
    expect(d.evenements.map((e) => ({ code: e.code, round: e.trimestre }))).toEqual(scriptes);
    for (const ev of d.evenements) {
      const sans = rejouerAvec(code, cleSansEvenement(ev.code), () => undefined, (sc) => ({
        ...sc,
        scriptedEvents: (sc.scriptedEvents ?? []).filter((x) => x.eventCode !== ev.code),
      }));
      // Avant l'événement, rien ne change.
      for (let i = 0; i < ev.trimestre - 1; i++) expect(sans[i]!.incomeStatement.netIncome).toBe(joueur[i]!.incomeStatement.netIncome);
      expect(ev.resultatPerdu).toBe(Math.round(surLAnnee(sans, (r) => r.incomeStatement.netIncome) - surLAnnee(joueur, (r) => r.incomeStatement.netIncome)));
      if (ev.nature === "cout") {
        expect(ev.multiplicateur).toBeGreaterThan(1);
        expect(ev.resultatPerdu).toBeGreaterThan(0);
      } else {
        expect(Math.sign(ev.demandeEnPlus)).toBe(Math.sign(ev.multiplicateur - 1));
      }
    }
  });

  it("chaque constat est rangé selon sa règle, et le tri reprend les constats", () => {
    const d = diagnostic(cas);
    const e = d.entreprise;
    const m = d.moinsCher;
    const parCode = new Map(d.constats.map((k) => [k.code, k]));
    expect(m.prix).toBeLessThan(e.prix);
    expect(m.prix).toBe(Math.min(...d.concurrents.map((x) => x.prix)));
    expect(parCode.get("resultat")!.categorie).toBe(e.resultat > 0 ? "force" : "faiblesse");
    expect(parCode.get("resultat")!.montant).toBe(e.resultat);
    expect(parCode.get("tresorerie")!.categorie).toBe(d.tresorerie > 0 ? "force" : "faiblesse");
    expect(parCode.get("demande-servie")!.categorie).toBe(d.servie >= TAUX_DE_SERVICE_ATTENDU * 100 ? "force" : "faiblesse");
    expect(parCode.get("demande-servie")!.montant).toBe(d.caManque);
    expect(parCode.get("qualite")!.categorie).toBe(e.qualite > m.qualite ? "force" : "faiblesse");
    expect(parCode.get("qualite")!.montant).toBe(Math.round(somme(joueur.map((r) => r.incomeStatement.qualityCost))));
    expect(parCode.get("marge")!.categorie).toBe(e.tauxDeMarge > m.tauxDeMarge ? "force" : "faiblesse");
    expect(parCode.get("part-de-marche")!.categorie).toBe(e.part >= d.premierConcurrent.part ? "force" : "faiblesse");
    expect(parCode.get("demande-du-marche")!.categorie).toBe(d.marche.fin > d.marche.debut ? "opportunite" : "menace");
    expect(parCode.get("demande-du-marche")!.montant).toBe(Math.abs(Math.round((d.marche.fin - d.marche.debut) * e.prix)));
    expect(parCode.get("concurrent-moins-cher")!.categorie).toBe("menace");
    for (const x of d.concurrents) expect(parCode.get(`defaillance-${x.id}`)?.categorie).toBe(x.defaillance ? "opportunite" : undefined);
    for (const ev of d.evenements) {
      expect(parCode.get(`evenement-${ev.code}`)!.categorie).toBe(ev.nature === "cout" || ev.multiplicateur < 1 ? "menace" : "opportunite");
    }
    // Interne d'abord, externe ensuite : les six constats internes sont des forces ou des faiblesses.
    const internes = ["resultat", "tresorerie", "demande-servie", "qualite", "marge", "part-de-marche"];
    for (const k of internes) expect(["force", "faiblesse"]).toContain(parCode.get(k)!.categorie);
    for (const k of d.constats.filter((x) => !internes.includes(x.code))) expect(["opportunite", "menace"]).toContain(k.categorie);
    const tri = LE_DIAGNOSTIC_STRATEGIQUE.etapes.find((x) => x.type === "tri");
    if (tri?.type !== "tri") throw new Error("étape de tri");
    expect(tri.categories).toBe(CATEGORIES_DU_DIAGNOSTIC);
    expect(tri.elements(cas).map((x) => [x.libelle, x.montant, x.categorie])).toEqual(d.constats.map((x) => [x.libelle, x.montant, x.categorie]));
  });

  it("la conclusion suit sa règle : pas d'opportunité, se protéger ; des comptes sains, saisir ; sinon, corriger", () => {
    const d = diagnostic(cas);
    const opportunites = d.constats.filter((k) => k.categorie === "opportunite").length;
    expect(d.compte.opportunite).toBe(opportunites);
    const sains = d.entreprise.resultat > 0 && d.tresorerie > 0;
    expect(d.verdict).toBe(opportunites === 0 ? "se-proteger" : sains ? "saisir" : "corriger");
  });

  it("les valeurs attendues des champs sont celles du moteur", () => {
    const d = diagnostic(cas);
    const e = LE_DIAGNOSTIC_STRATEGIQUE.etapes.find((x) => x.id === "chiffres");
    if (e?.type !== "montants") throw new Error("étape de montants");
    const champs = e.champs(cas, { soldes: {} });
    const ventes = somme(joueur.map((r) => Math.round(vendues(r))));
    const perdues = somme(joueur.map((r) => Math.round(manquees(r))));
    const marche = somme(joueur.map((r) => Math.round(potentiel(r))));
    expect(champs.map((c) => c.attendu)).toEqual([
      auDixieme((ventes / marche) * 100),
      auDixieme((Math.round(potentiel(joueur.at(-1)!)) / Math.round(potentiel(joueur[0]!)) - 1) * 100),
      auDixieme((ventes / (ventes + perdues)) * 100),
    ]);
    expect(champs.map((c) => c.attendu)).toEqual([d.entreprise.part, d.evolutionDuMarche, d.servie]);
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(LE_DIAGNOSTIC_STRATEGIQUE, code));
});

describe("le diagnostic stratégique, sur les huit entreprises", () => {
  it("les trois conclusions se rencontrent, et chaque sens de constat aussi", () => {
    const ds = ENTREPRISES_DU_DIAGNOSTIC.map((c) => diagnostic(casDeLEntreprise(c)));
    expect([...new Set(ds.map((d) => d.verdict))].sort()).toEqual(["corriger", "saisir", "se-proteger"]);
    const resultats = new Set(ds.map((d) => d.constats.find((k) => k.code === "resultat")!.categorie));
    expect([...resultats].sort()).toEqual(["faiblesse", "force"]);
    const marches = new Set(ds.map((d) => d.constats.find((k) => k.code === "demande-du-marche")!.categorie));
    expect([...marches].sort()).toEqual(["menace", "opportunite"]);
    // Sur l'année du cours (concurrents assainis, arene-du-cours.ts), aucun concurrent ne fait
    // défaut : le constat de défaillance n'est lu dans aucune entreprise. Les opportunités
    // viennent alors du marché lui-même : la demande qui monte, et un événement de l'année.
    const defauts = ds.map((d) => d.concurrents.some((x) => x.defaillance));
    expect(defauts.every((x) => !x)).toBe(true);
    expect(ds.flatMap((d) => d.constats.map((k) => k.code)).filter((k) => k.startsWith("defaillance-"))).toEqual([]);
    const sources = new Set(ds.flatMap((d) => d.constats.filter((k) => k.categorie === "opportunite").map((k) => (k.code.startsWith("evenement-") ? "evenement" : k.code))));
    expect([...sources].sort()).toEqual(["demande-du-marche", "evenement"]);
  });

  it("chez NOVA, les chiffres du diagnostic", () => {
    const d = diagnostic(casDeLEntreprise("nova"));
    expect([d.entreprise.part, d.evolutionDuMarche, d.servie]).toEqual([20.2, 179.2, 62.3]);
    expect([d.entreprise.resultat, d.tresorerie, d.verdict]).toEqual([29213, -22516, "corriger"]);
  });
});

describe.each(ENTREPRISES_DES_OBJECTIFS)("se fixer des objectifs chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const { partie } = anneeJouee(code);
  const joueur = partie.rounds.map((t) => t.results["joueur"]!);

  it("l'objectif se tire de la capacité de départ, la plus petite de l'équipement et de l'équipe", () => {
    const o = suiviDesObjectifs(cas);
    const p = joueur[0]!.production;
    expect(o.capacite).toBe(Math.min(Math.round(p.machineCapacity), Math.round(p.laborCapacity)));
    expect(o.objectif).toBe(Math.round(o.capacite * TAUX_DE_CAPACITE_VISE));
    expect(o.objectifDeLAnnee).toBe(o.objectif * 4);
    expect(o.objectif).toBeLessThan(o.capacite);
  });

  it("les écarts se recomposent avec les ventes et la demande du moteur", () => {
    const o = suiviDesObjectifs(cas);
    o.trimestres.forEach((t, i) => {
      expect(t.ventes, `T${i + 1}`).toBe(Math.round(vendues(joueur[i]!)));
      expect(t.manquees, `T${i + 1}`).toBe(Math.round(manquees(joueur[i]!)));
      expect(Math.abs(t.demande - demandees(joueur[i]!)), `T${i + 1}`).toBeLessThanOrEqual(1);
      expect(t.ecart).toBe(t.ventes - o.objectif);
      expect(t.origine).toBe(t.demande < o.objectif ? "demande" : "production");
    });
    expect(o.ventesDeLAnnee).toBe(somme(o.trimestres.map((t) => t.ventes)));
    expect(o.ecartDeLAnnee).toBe(o.ventesDeLAnnee - o.objectifDeLAnnee);
    expect(o.realisation).toBe(auDixieme((o.ventesDeLAnnee / o.objectifDeLAnnee) * 100));
    expect(o.pire.ecart).toBe(Math.min(...o.trimestres.map((t) => t.ecart)));
    expect(o.verdict).toBe(o.ventesDeLAnnee >= o.objectifDeLAnnee ? "tenu" : o.demandeDeLAnnee >= o.objectifDeLAnnee ? "a-revoir" : "mal-pose");
    // Le chapitre dit « des clients repartis sans être servis » quand la production manque : il y en a.
    if (o.pire.origine === "production" && !o.pire.tenu) expect(o.pire.manquees).toBeGreaterThan(0);
  });

  it("les valeurs attendues des champs sont celles du suivi", () => {
    const champsDe = (id: string) => {
      const e = SE_FIXER_DES_OBJECTIFS.etapes.find((x) => x.id === id);
      if (e?.type !== "montants") throw new Error(`étape de montants ${id}`);
      return e.champs(cas, { soldes: {} }).map((c) => c.attendu);
    };
    const p = joueur[0]!.production;
    const capacite = Math.min(Math.round(p.machineCapacity), Math.round(p.laborCapacity));
    const objectif = Math.round(capacite * 0.7);
    expect(champsDe("objectif")).toEqual([capacite, objectif, objectif * 4]);
    const ventes = joueur.map((r) => Math.round(vendues(r)));
    expect(champsDe("ecarts")).toEqual([...ventes.map((v) => v - objectif), auDixieme((somme(ventes) / (objectif * 4)) * 100)]);
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(SE_FIXER_DES_OBJECTIFS, code));
});

describe("se fixer des objectifs, sur les huit entreprises", () => {
  it("l'objectif est tenu chez les unes, à revoir ou mal posé chez les autres", () => {
    const verdicts = new Set(ENTREPRISES_DES_OBJECTIFS.map((c) => suiviDesObjectifs(casDeLEntreprise(c)).verdict));
    expect([...verdicts].sort()).toEqual(["a-revoir", "mal-pose", "tenu"]);
    const origines = new Set(ENTREPRISES_DES_OBJECTIFS.map((c) => suiviDesObjectifs(casDeLEntreprise(c)).pire.origine));
    expect([...origines].sort()).toEqual(["demande", "production"]);
  });

  it("chez NOVA, les chiffres du suivi", () => {
    const o = suiviDesObjectifs(casDeLEntreprise("nova"));
    expect([o.capacite, o.objectif, o.objectifDeLAnnee, o.ventesDeLAnnee, o.realisation, o.verdict]).toEqual([7000, 4900, 19600, 22924, 117, "tenu"]);
    expect(o.trimestres.map((t) => t.ecart)).toEqual([143, 674, 1789, 718]);
  });
});

describe.each(ENTREPRISES_DU_DIAGNOSTIC)("des clients repartis sans être servis chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const { partie, depart } = anneeJouee(code);

  it("le trimestre est celui des ventes manquées les plus nombreuses, et l'offre maximale celle du moteur", () => {
    const k = clientsRepartis(cas);
    const perdues = partie.rounds.map((t) => Math.round(manquees(t.results["joueur"]!)));
    expect(k.t.manquees).toBe(Math.max(...perdues));
    expect(k.t.numero).toBe(perdues.indexOf(k.t.manquees) + 1);
    const r = partie.rounds[k.t.numero - 1]!.results["joueur"]!;
    const avant = k.t.numero === 1 ? depart : partie.rounds[k.t.numero - 2]!.companies.find((x) => x.id === "joueur")!;
    expect(k.t.capacite).toBe(Math.round(Math.min(r.production.machineCapacity, r.production.laborCapacity)));
    expect(k.t.stock).toBe(Math.round(avant.finishedGoods.quantity));
    expect(k.t.demande).toBe(k.t.ventes + k.t.manquees);
    // Le prix se calcule sur les chiffres que l'élève lit : le chiffre d'affaires et les ventes, à l'unité.
    expect(k.prix).toBeCloseTo(k.t.chiffreDAffaires / k.t.ventes, 2);
    expect(k.t.chiffreDAffaires).toBe(Math.round(r.incomeStatement.revenue));
    expect(Math.abs(k.prix / (r.incomeStatement.revenue / vendues(r)) - 1)).toBeLessThan(0.01);
    expect(k.caManque).toBeCloseTo(k.t.manquees * k.prix, 2);
    expect(k.offreMaximale).toBe(k.t.capacite + k.t.stock);
    expect(k.horsDePortee).toBe(Math.max(0, k.t.demande - k.offreMaximale));
    expect(k.verdict).toBe(k.horsDePortee > 0 ? "capacite" : "production");
    // Des ventes manquées, c'est un stock vidé : il ne reste rien à vendre en fin de trimestre.
    expect(k.t.manquees).toBeGreaterThan(0);
    expect(Math.round(partie.rounds[k.t.numero - 1]!.companies.find((x) => x.id === "joueur")!.finishedGoods.quantity)).toBe(0);
    // « La capacité suffisait » vaut même en retirant les rebuts du trimestre.
    if (k.verdict === "production") expect(k.t.capacite - k.t.rebuts + k.t.stock).toBeGreaterThanOrEqual(k.t.demande);
    // Elle n'a pas produit à plein : sinon, rien ne serait « à produire davantage ».
    expect(k.t.production).toBeLessThan(k.t.capacite);
  });

  it("les valeurs attendues des champs sont celles du trimestre", () => {
    const k = clientsRepartis(cas);
    const champs = DES_CLIENTS_REPARTIS_SANS_ETRE_SERVIS.etapes.flatMap((e) => (e.type === "montants" ? e.champs(cas, { soldes: {} }).map((c) => c.attendu) : []));
    expect(champs).toEqual([k.t.manquees, k.prix, k.caManque, k.t.capacite + k.t.stock, Math.max(0, k.t.demande - k.t.capacite - k.t.stock)]);
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(DES_CLIENTS_REPARTIS_SANS_ETRE_SERVIS, code);
    reponseNonTrahie(DES_CLIENTS_REPARTIS_SANS_ETRE_SERVIS, code);
  });
});

describe("des clients repartis sans être servis, sur les huit entreprises", () => {
  it("la capacité manque chez les unes, la production chez les autres", () => {
    const verdicts = new Set(ENTREPRISES_DU_DIAGNOSTIC.map((c) => clientsRepartis(casDeLEntreprise(c)).verdict));
    expect([...verdicts].sort()).toEqual(["capacite", "production"]);
  });
});

describe.each(ENTREPRISES_DES_OBJECTIFS)("un objectif plus ambitieux chez %s", (code) => {
  const cas = casDeLEntreprise(code);

  it("l'objectif proposé est celui du chapitre au taux du directeur, éprouvé sur la même demande", () => {
    const k = objectifAmbitieux(cas);
    expect(k.o.capacite).toBe(k.actuel.capacite);
    expect(k.o.objectif).toBe(Math.round(k.o.capacite * TAUX_AMBITIEUX));
    expect(k.o.objectif).toBeGreaterThan(k.actuel.objectif);
    expect(k.o.trimestres.map((t) => t.demande)).toEqual(k.actuel.trimestres.map((t) => t.demande));
    expect(k.o.demandeDeLAnnee).toBe(somme(k.o.trimestres.map((t) => t.demande)));
    expect(k.trimestresPossibles).toBe(k.o.trimestres.filter((t) => t.demande >= k.o.objectif).length);
    expect(k.verdict).toBe(k.o.ventesDeLAnnee >= k.o.objectifDeLAnnee ? "tenu" : k.o.demandeDeLAnnee >= k.o.objectifDeLAnnee ? "a-revoir" : "mal-pose");
    const champs = UN_OBJECTIF_PLUS_AMBITIEUX.etapes.flatMap((e) => (e.type === "montants" ? e.champs(cas, { soldes: {} }).map((c) => c.attendu) : []));
    expect(champs).toEqual([Math.round(k.o.capacite * 0.9), Math.round(k.o.capacite * 0.9) * 4, k.o.demandeDeLAnnee, k.trimestresPossibles]);
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(UN_OBJECTIF_PLUS_AMBITIEUX, code);
    reponseNonTrahie(UN_OBJECTIF_PLUS_AMBITIEUX, code);
  });
});

describe("un objectif plus ambitieux, sur les huit entreprises", () => {
  it("tenable ici à condition de produire, hors de portée là", () => {
    const verdicts = new Set(ENTREPRISES_DES_OBJECTIFS.map((c) => objectifAmbitieux(casDeLEntreprise(c)).verdict));
    expect([...verdicts].sort()).toEqual(["a-revoir", "mal-pose"]);
  });
});
