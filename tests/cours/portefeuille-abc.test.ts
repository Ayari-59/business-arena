import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { PORTEFEUILLES, PORTEFEUILLE_ABC, portefeuilleABC } from "../../src/config/cours/chapitres/portefeuille-abc";
import { gammeDuMois } from "../../src/config/cours/gamme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { familyOf, scenarioByCode } from "../../src/config/scenarios/registry";
import { COMPTES_POUR_UN_CLASSEMENT, PART_DES_COMPTES_D_UN_PORTEFEUILLE_CONCENTRE, PART_D_UN_COMPTE_QUI_FAIT_COURIR_UN_RISQUE, SEUILS_ABC } from "../../src/config/cours/negociation";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LA MÉTHODE ABC, SUR LES CLIENTÈLES DE LA GAMME QUE L'ARÈNE JOUE.
 *
 * Le chapitre se joue là où la gamme compte assez de comptes ; chaque compte est une clientèle
 * d'une référence, et leur chiffre d'affaires refait celui de la gamme ; le classement suit les
 * seuils de la méthode ; la bonne réponse sur la concentration et sur la marge suit les chiffres.
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    case "tri":
      return [e.question(cas), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(cas)];
    default:
      return [];
  }
}

it("le chapitre se joue là où la gamme compte assez de comptes pour trois classes, et seulement là", () => {
  const assez = ENTREPRISES_DU_COURS.filter((code) => (gammeDuMois(code)?.comptes.length ?? 0) >= COMPTES_POUR_UN_CLASSEMENT);
  expect([...PORTEFEUILLES]).toEqual(assez);
});

describe.each(PORTEFEUILLES)("le portefeuille ABC chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const p = portefeuilleABC(cas);
  const chapitre = chapitreDuCas(PORTEFEUILLE_ABC, cas);

  it("chaque compte est une clientèle d'une référence, et leur chiffre d'affaires refait celui de la gamme", () => {
    const g = gammeDuMois(code)!;
    const ca = g.references.reduce((t, r) => t + r.chiffreDAffaires, 0);
    expect(Math.abs(p.total - ca) / ca).toBeLessThan(0.01);
    expect(new Set(p.comptes.map((k) => k.code)).size).toBe(p.comptes.length);
    for (const k of p.comptes) expect(g.references.map((r) => r.nom)).toContain(k.reference);
  });

  it("la marge d'un compte retire le coût variable de sa référence et la commission de son canal", () => {
    const g = gammeDuMois(code)!;
    const produits = scenarioByCode(familyOf(code)!.gamme).scenario.products ?? [];
    for (const k of p.comptes) {
      const cv = g.references.find((r) => r.nom === k.reference)!.coutVariableUnitaire;
      const taux = produits.flatMap((d) => d.market.segments).find((x) => x.code === k.code)?.commissionRate ?? 0;
      const attendue = k.chiffreDAffaires * (1 - taux) - k.quantite * cv;
      expect(Math.abs(k.marge - attendue), k.nom).toBeLessThanOrEqual(cv + 2);
    }
  });

  it("le classement suit les seuils de la méthode, dans l'ordre décroissant", () => {
    for (let i = 1; i < p.comptes.length; i++) expect(p.comptes[i]!.chiffreDAffaires).toBeLessThanOrEqual(p.comptes[i - 1]!.chiffreDAffaires);
    for (const [i, k] of p.comptes.entries()) {
      const attendue = i === 0 || k.cumul <= SEUILS_ABC.a ? "A" : k.cumul <= SEUILS_ABC.b ? "B" : "C";
      expect(k.classe, k.nom).toBe(attendue);
    }
    expect(p.comptes.at(-1)!.cumul).toBeCloseTo(100, 0);
    expect(p.classes.C.length).toBeGreaterThan(0);
  });

  it("la bonne réponse sur la concentration et sur la marge suit les chiffres", () => {
    const concentration = chapitre.etapes.find((e) => e.id === "concentration");
    if (concentration?.type !== "choix") throw new Error("Pas d'étape concentration");
    const juste = concentration.options(cas, { soldes: {} }).find((o) => o.juste)!;
    expect(juste.texte).toMatch(p.partDesComptesEnA <= PART_DES_COMPTES_D_UN_PORTEFEUILLE_CONCENTRE ? /^Il est concentré/ : /peu concentré/);
    if (!/^Il est concentré/.test(juste.texte)) expect(juste.retour.includes("Attention pourtant")).toBe(p.premier.part >= PART_D_UN_COMPTE_QUI_FAIT_COURIR_UN_RISQUE);
    const marge = chapitre.etapes.find((e) => e.id === "marge");
    if (marge?.type !== "choix") throw new Error("Pas d'étape marge");
    const deuxieme = [...p.comptes].sort((a, b) => b.marge - a.marge)[1]!;
    expect(marge.options(cas, { soldes: {} }).find((o) => o.juste)!.texte).toBe(deuxieme.nom);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) les? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bde [aeiouyéèê]/i);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bque [AEIOUYÉ]/);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
