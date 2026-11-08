import { expect, it } from "vitest";
import { BUREAUX, bureauxDuChapitre } from "../../src/config/cours/bureaux";
import type { Bureau, EtapeDeReponse } from "../../src/config/cours/bureaux/types";
import { ENQUETES, enquetesDuChapitre } from "../../src/config/cours/enquetes";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SCENARIOS, scenariosDuChapitre, type Scenario } from "../../src/config/cours/scenarios";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { corrigerAuBureau, servirLeBureau } from "../../src/pedagogy/cours/bureau-servi";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import { corrigerAuScenario, servirLeScenario } from "../../src/pedagogy/cours/scenario-servi";
import { corrigerLeTableau, incoherencesDuTableau, solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { LEXIQUE_INTERDIT, espacesOrdinairesFautives, phrasesLongues, tiretsAuMilieu, tutoiements } from "./textes-du-depot";

/**
 * LES GARDES COMMUNES DES ACTIVITÉS DU LOT C (novembre 2026) : un bureau, une enquête ou un scénario par
 * chapitre de financement. Chaque garde d'activité refait ses chiffres à la main ; celles-ci vérifient ce
 * que toutes partagent : le registre, la taille, les écritures équilibrées au plan du cours, les tableaux
 * justes avec leurs propres valeurs, une seule bonne option jamais la plus longue, et la langue.
 */

/** Toutes les chaînes d'une valeur, sauf les codes. */
export function chaines(x: unknown, sortie: string[] = []): string[] {
  if (typeof x === "string") sortie.push(x);
  else if (Array.isArray(x)) x.forEach((v) => chaines(v, sortie));
  else if (x && typeof x === "object")
    for (const [k, v] of Object.entries(x)) if (!["code", "id", "categorie", "piece", "pieces", "compte", "sens", "type", "nature", "raison", "format", "etape", "dans"].includes(k)) chaines(v, sortie);
  return sortie;
}

/** Une seule bonne option par question, jamais la plus longue, aucune en double. */
export function verifierLesQuestions(e: Pick<EtapeDeReponse, "questions">) {
  for (const q of e.questions) {
    const justes = q.options.filter((o) => o.juste);
    expect(justes, q.id).toHaveLength(1);
    expect(new Set(q.options.map((o) => o.texte)).size, q.id).toBe(q.options.length);
    const plusLongue = Math.max(...q.options.filter((o) => !o.juste).map((o) => o.texte.length));
    expect(justes[0]!.texte.length, q.id).toBeLessThan(plusLongue);
  }
}

/** Les règles de la maison sur des textes : ni tiret au milieu, ni tutoiement, le signe « − », aucun nombre en lettres. */
export function verifierLaLangue(textes: readonly string[], servis: readonly string[]) {
  expect(textes.length).toBeGreaterThan(40);
  expect(textes.flatMap(tiretsAuMilieu)).toEqual([]);
  expect(textes.flatMap(tutoiements)).toEqual([]);
  for (const { mot, re } of LEXIQUE_INTERDIT) expect(textes.filter((t) => re.test(t)), mot).toEqual([]);
  for (const t of textes) {
    expect(t, t).not.toMatch(/(^|[\s(×÷])-\d/);
    expect(t, t).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
    expect(t, t).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|vingt|trente|quarante|cinquante|soixante|cent|mille)\s+(€|euros|%|actions|échéances|jours|mois|ans|points)\b/i);
    expect(t, t).not.toMatch(/évènement/i);
    expect(t, t).not.toMatch(/la présidente|\bdu gérant|la gérante/i);
  }
  expect([...phrasesLongues(textes)]).toEqual([]);
  expect(servis.flatMap(espacesOrdinairesFautives)).toEqual([]);
}

/** Les gardes d'un bureau ou d'une enquête du lot C, reprise d'un chapitre. */
export function gardesDuBureau(b: Bureau, chapitre: string) {
  const enquete = b.format === "enquete";
  it("est enregistré, réservé, repris de son chapitre, au même parcours et chez NOVA, sans compter parmi les cas dédiés", () => {
    expect(enquete ? ENQUETES : BUREAUX).toContain(b);
    expect((enquete ? enquetesDuChapitre(chapitre) : bureauxDuChapitre(chapitre)).map((x) => x.code)).toContain(b.code);
    expect(b.libre).toBe(false);
    expect(b.reprend).toEqual([chapitre]);
    const ch = CHAPITRES.find((x) => x.code === chapitre)!;
    expect(b.parcours).toBe(ch.parcours);
    expect(b.palier).toBe(ch.palier);
    expect(b.entreprise).toEqual({ code: "nova", nom: "NOVA" });
    expect(b.commanditaire).toBe("Le président");
    expect(CAS_PAR_CHAPITRE.length).toBe(205);
    expect(CAS_PAR_CHAPITRE.some((s) => s.code === b.code)).toBe(false);
  });

  it("une pile aux pièces uniques, que chaque étape cite, et trois à six étapes", () => {
    expect(new Set(b.pile.map((p) => p.code)).size).toBe(b.pile.length);
    expect(b.pile[0]!.nature).toBe("courriel");
    expect(b.etapes.length).toBeGreaterThanOrEqual(3);
    expect(b.etapes.length).toBeLessThanOrEqual(6);
    for (const e of b.etapes) for (const p of e.pieces) expect(b.pile.map((x) => x.code), `${e.id} ${p}`).toContain(p);
    for (const e of b.etapes) if (e.type === "classement") for (const x of e.elements) if (x.piece) expect(b.pile.map((p) => p.code), x.code).toContain(x.piece);
  });

  it("chaque classement emploie ses catégories ; chaque tableau est juste avec ses propres valeurs ; chaque écriture est équilibrée, au plan du cours", () => {
    for (const e of b.etapes) {
      if (e.type === "classement") for (const x of e.elements) expect(e.categories.map((k) => k.code), x.code).toContain(x.categorie);
      if (e.type === "etat") {
        expect(incoherencesDuTableau(e.grille), e.id).toEqual([]);
        expect(corrigerLeTableau(e.grille, solutionsDuTableau(e.grille)).juste, e.id).toBe(true);
      }
      const ecritures = e.type === "journal" ? e.ecritures : e.type === "rectification" ? e.ecritures : [];
      for (const x of ecritures) {
        expect(equilibree(enEcriture(x.ecriture)), x.id).toBe(true);
        expect(corriger(enSaisie(x.ecriture), x.ecriture).juste, x.id).toBe(true);
        for (const l of x.ecriture.lignes) expect(compteDuPlan(l.compte), `${x.id} ${l.compte}`).toBeDefined();
      }
      if (e.type === "reponse") verifierLesQuestions(e);
      if (e.type === "rectification") {
        for (const x of e.ecritures) expect(e.raisons.map((r) => r.code), x.id).toContain(x.raison);
        const longueurs = e.raisons.map((r) => r.libelle.length);
        const justes = new Set(e.ecritures.map((x) => x.raison));
        expect(justes.has(e.raisons[longueurs.indexOf(Math.max(...longueurs))]!.code)).toBe(false);
      }
    }
  });

  it("la langue : la maison, dans la configuration, ce que la page sert et chaque corrigé", () => {
    const servi = servirLeBureau(b);
    const corriges = b.etapes.map((e) => corrigerAuBureau(b, { etape: e.id, geste: "montrer" }));
    verifierLaLangue([...chaines(b), ...chaines(corriges)], [...chaines(servi), ...chaines(corriges)]);
  });
}

/** Toutes les suites, de longueur 1 à n, d'un scénario. */
export function suitesDe(sc: Scenario, n = sc.decisions.length): string[][] {
  return n === 0 ? [[]] : suitesDe(sc, n - 1).flatMap((x) => sc.decisions[n - 1]!.options.map((o) => [...x, o]));
}

/** Les gardes d'un scénario du lot C, repris d'un chapitre. */
export function gardesDuScenario(sc: Scenario, chapitre: string) {
  it("est enregistré, réservé, repris de son chapitre, chez NOVA, sans compter parmi les cas dédiés", () => {
    expect(SCENARIOS).toContain(sc);
    expect(scenariosDuChapitre(chapitre).map((x) => x.code)).toContain(sc.code);
    expect(sc.libre).toBe(false);
    expect(sc.reprend).toEqual([chapitre]);
    const ch = CHAPITRES.find((x) => x.code === chapitre)!;
    expect([sc.parcours, sc.palier]).toEqual([ch.parcours, ch.palier]);
    expect(sc.entreprise).toEqual({ code: "nova", nom: "NOVA" });
    expect(CAS_PAR_CHAPITRE.length).toBe(205);
  });

  it("deux ou trois décisions à trois options ; au moins deux fins ; une seule meilleure suite", () => {
    expect(sc.decisions.length).toBeGreaterThanOrEqual(2);
    expect(sc.decisions.length).toBeLessThanOrEqual(3);
    for (const d of sc.decisions) expect(d.options.length, d.id).toBe(3);
    const bilans = suitesDe(sc).map((s) => sc.bilan(s));
    expect(new Set(bilans.map((b) => b.fin.code)).size).toBeGreaterThanOrEqual(2);
    expect(bilans.filter((b) => b.meilleure)).toHaveLength(1);
  });

  it("chaque situation sert ses options dans l'ordre de la décision ; la meilleure option n'est jamais la plus longue", () => {
    const meilleure = suitesDe(sc).find((s) => sc.bilan(s).meilleure)!;
    for (let i = 0; i < sc.decisions.length; i++) {
      const sit = sc.situation(meilleure.slice(0, i));
      expect(sit.options.map((o) => o.code)).toEqual(sc.decisions[i]!.options);
      const longueurs = sit.options.map((o) => o.texte.length);
      const k = sit.options.findIndex((o) => o.code === meilleure[i]);
      expect(longueurs[k], sc.decisions[i]!.id).toBeLessThan(Math.max(...longueurs));
    }
    verifierLesQuestions(sc.questions);
  });

  it("la langue : la maison, dans tout ce que la page et chaque choix servent", () => {
    const servis = [servirLeScenario(sc), ...suitesDe(sc, 1), ...suitesDe(sc, 2), ...(sc.decisions.length > 2 ? suitesDe(sc, 3) : [])]
      .map((x) => (Array.isArray(x) ? corrigerAuScenario(sc, { geste: "choisir", suite: x }) : x))
      .concat([corrigerAuScenario(sc, { etape: sc.questions.id, geste: "montrer" })]);
    verifierLaLangue([...chaines(servis), ...chaines(sc.questions), ...chaines(sc.accueil)], chaines(servis));
  });
}
