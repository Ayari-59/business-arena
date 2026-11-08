import { expect } from "vitest";
import type { Bureau } from "../../src/config/cours/bureaux/types";
import type { Scenario } from "../../src/config/cours/scenarios/types";
import { CHAPITRES } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { corrigerAuBureau, servirLeBureau } from "../../src/pedagogy/cours/bureau-servi";
import { corriger, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import { corrigerAuScenario, servirLeScenario } from "../../src/pedagogy/cours/scenario-servi";
import { corrigerLeTableau, incoherencesDuTableau, solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { LEXIQUE_INTERDIT, espacesOrdinairesFautives, phrasesLongues, tiretsAuMilieu, tutoiements } from "./textes-du-depot";

/**
 * LES GARDES COMMUNES DES ACTIVITÉS DES CHAPITRES (décision du propriétaire, novembre 2026) : ce que toute
 * activité, bureau, enquête ou scénario, doit tenir, quel que soit son sujet. Chaque garde d'activité
 * (tests/cours/<activite>.test.ts) refait ses chiffres à la main, puis appelle celles-ci.
 */

/** Toutes les chaînes d'une valeur, sauf les codes. */
export function chaines(x: unknown, sortie: string[] = []): string[] {
  if (typeof x === "string") sortie.push(x);
  else if (Array.isArray(x)) x.forEach((v) => chaines(v, sortie));
  else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) if (!["code", "id", "categorie", "piece", "pieces", "compte", "sens", "type", "nature", "raison", "format"].includes(k)) chaines(v, sortie);
  return sortie;
}

/** La langue de la maison : ni tiret au milieu, ni tutoiement, ni lexique banni, ni nombre en lettres, des phrases courtes. */
export function verifierLaLangue(textes: readonly string[], servis: readonly string[]) {
  expect(textes.length).toBeGreaterThan(30);
  expect(textes.flatMap(tiretsAuMilieu)).toEqual([]);
  expect(textes.flatMap(tutoiements)).toEqual([]);
  for (const { mot, re } of LEXIQUE_INTERDIT) expect(textes.filter((t) => re.test(t)), mot).toEqual([]);
  for (const t of textes) {
    expect(t, t).not.toMatch(/(^|[\s(])-\d/);
    expect(t, t).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
    expect(t, t).not.toMatch(/\b(vingt|trente|quarante|cinquante|soixante|cent|mille)\b/i);
    expect(t, t).not.toMatch(/évènement/i);
    expect(t, t).not.toMatch(/la présidente\b|la dirigeante de NOVA/i);
  }
  expect([...phrasesLongues(textes)]).toEqual([]);
  expect(servis.flatMap(espacesOrdinairesFautives)).toEqual([]);
}

/** Une question à choix : une seule bonne option, jamais la plus longue, des textes distincts. */
export function verifierLesQuestions(questions: readonly { id: string; options: readonly { texte: string; juste: boolean }[] }[]) {
  for (const q of questions) {
    const justes = q.options.filter((o) => o.juste);
    expect(justes, q.id).toHaveLength(1);
    expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
    expect(new Set(q.options.map((o) => o.texte)).size, q.id).toBe(q.options.length);
    const plusLongue = Math.max(...q.options.filter((o) => !o.juste).map((o) => o.texte.length));
    expect(justes[0]!.texte.length, q.id).toBeLessThan(plusLongue);
  }
}

/** Les comptes admis hors du plan du cours : aucun. Une écriture d'activité n'emploie que des comptes du plan. */
export function verifierLesEcritures(ecritures: readonly { id: string; ecriture: Parameters<typeof corriger>[1] }[]) {
  for (const x of ecritures) {
    const total = (s: "debit" | "credit") => Math.round(x.ecriture.lignes.filter((l) => l.sens === s).reduce((t, l) => t + l.montant, 0) * 100);
    expect(total("debit"), `${x.id} équilibrée`).toBe(total("credit"));
    for (const l of x.ecriture.lignes) {
      expect(compteDuPlan(l.compte), `${x.id} ${l.compte}`).toBeDefined();
      expect(l.montant, `${x.id} ${l.compte}`).toBeGreaterThan(0);
    }
    expect(corriger(enSaisie(x.ecriture), x.ecriture).juste, x.id).toBe(true);
  }
}

/** Le lien au chapitre : le chapitre existe, l'activité garde son parcours et son palier, et n'entre pas dans les cas dédiés. */
export function verifierLeChapitre(a: Pick<Bureau, "code" | "reprend" | "parcours" | "palier" | "libre">) {
  expect(a.reprend).toHaveLength(1);
  const ch = CHAPITRES.find((c) => c.code === a.reprend[0]);
  expect(ch, a.reprend[0]).toBeDefined();
  expect(a.parcours).toBe(ch!.parcours);
  expect(a.palier).toBe(ch!.palier);
  expect(a.libre).toBe(false);
  expect(CAS_PAR_CHAPITRE.map((c) => c.code)).not.toContain(a.code);
  expect(CAS_PAR_CHAPITRE.length).toBe(204);
}

/** Un bureau ou une enquête : sa forme, ses tableaux, ses écritures, ses questions, son service, sa langue. */
export function verifierUnBureau(b: Bureau, taille: { pieces: [number, number]; etapes: [number, number] }) {
  verifierLeChapitre(b);
  expect(b.pile.length).toBeGreaterThanOrEqual(taille.pieces[0]);
  expect(b.pile.length).toBeLessThanOrEqual(taille.pieces[1]);
  expect(b.etapes.length).toBeGreaterThanOrEqual(taille.etapes[0]);
  expect(b.etapes.length).toBeLessThanOrEqual(taille.etapes[1]);
  const codes = new Set(b.pile.map((p) => p.code));
  expect(codes.size).toBe(b.pile.length);
  for (const e of b.etapes) {
    for (const p of e.pieces) expect(codes.has(p), `${e.id} : ${p}`).toBe(true);
    if (e.type === "classement") {
      for (const x of e.elements) {
        expect(e.categories.map((k) => k.code), x.code).toContain(x.categorie);
        if (x.piece) expect(codes.has(x.piece), x.piece).toBe(true);
      }
      expect(new Set(e.elements.map((x) => x.code)).size).toBe(e.elements.length);
    }
    if (e.type === "etat") {
      expect(incoherencesDuTableau(e.grille), e.id).toEqual([]);
      expect(corrigerLeTableau(e.grille, solutionsDuTableau(e.grille)).juste, e.id).toBe(true);
    }
    if (e.type === "journal") verifierLesEcritures(e.ecritures);
    if (e.type === "rectification") {
      verifierLesEcritures(e.ecritures);
      for (const x of e.ecritures) expect(e.raisons.map((k) => k.code), x.id).toContain(x.raison);
      const plusLongue = Math.max(...e.raisons.map((k) => k.libelle.length));
      for (const x of e.ecritures) expect(e.raisons.find((k) => k.code === x.raison)!.libelle.length, x.id).toBeLessThan(plusLongue);
    }
    if (e.type === "reponse") verifierLesQuestions(e.questions);
    // Le serveur corrige ce que la correction montre.
    expect("geste" in corrigerAuBureau(b, { etape: e.id, geste: "montrer" }), e.id).toBe(true);
  }
  // Rien d'un corrigé dans ce qui est servi.
  const servi = servirLeBureau(b);
  const texte = espacesOrdinaires(JSON.stringify(servi));
  for (const cle of ["categorie", "pourquoi", "juste", "retour", "calcul", "indice", "explication", "raison"]) expect(texte, cle).not.toContain(`"${cle}":`);
  verifierLaLangue(chaines(b), chaines(servi));
}

/** Toutes les suites d'un scénario, jusqu'à `n` décisions. */
export const suitesDe = (s: Scenario, n: number): string[][] => (n === 0 ? [[]] : suitesDe(s, n - 1).flatMap((x) => s.decisions[n - 1]!.options.map((o) => [...x, o])));

/** Un scénario : sa taille, chaque suite calculée, au moins deux fins, une meilleure suite unique, sa langue. */
export function verifierUnScenario(s: Scenario) {
  verifierLeChapitre(s);
  expect(s.decisions.length).toBeGreaterThanOrEqual(2);
  expect(s.decisions.length).toBeLessThanOrEqual(3);
  for (const d of s.decisions) expect(d.options, d.id).toHaveLength(3);
  const textes: string[] = [...chaines(s.accueil), ...chaines(s.questions), s.titre, s.accroche, ...s.objectifs];
  const servis: string[] = [...chaines(servirLeScenario(s))];
  const fins = new Set<string>();
  const meilleures: string[] = [];
  for (let n = 1; n <= s.decisions.length; n++) {
    for (const suite of suitesDe(s, n)) {
      const r = corrigerAuScenario(s, { geste: "choisir", suite });
      expect("geste" in r, suite.join("/")).toBe(true);
      servis.push(...chaines(r));
      textes.push(...chaines(r));
      if ("geste" in r && r.geste === "choisir" && r.bilan) {
        fins.add(r.bilan.fin.code);
        if (r.bilan.meilleure) meilleures.push(suite.join("/"));
      }
    }
  }
  expect(fins.size).toBeGreaterThanOrEqual(2);
  expect(meilleures).toHaveLength(1);
  verifierLesQuestions(s.questions.questions);
  // La première décision servie ne dit rien de la suite.
  const premiere = espacesOrdinaires(JSON.stringify(servirLeScenario(s)));
  for (const cle of ["consequence", "bilan", "meilleure", "juste", "retour", "comparaison"]) expect(premiere, cle).not.toContain(`"${cle}":`);
  verifierLaLangue(textes, servis);
  return meilleures[0]!.split("/");
}
