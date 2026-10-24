import { describe, expect, it } from "vitest";
import { anneeJouee, casDeLEntreprise } from "../../src/config/cours/cas";
import { LIRE_LE_BILAN, bilanDeFinDAnnee } from "../../src/config/cours/chapitres/lire-le-bilan";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LE BILAN, AU 31 DÉCEMBRE DE L'ANNÉE DE L'ARÈNE.
 *
 * Les postes sont ceux du bilan du moteur ; l'actif égale le passif ; les équilibres se
 * recomposent ; la bonne réponse sur la trésorerie suit la banque et le découvert.
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

describe.each(ENTREPRISES_DU_COURS)("le bilan chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const b = bilanDeFinDAnnee(cas);
  const chapitre = chapitreDuCas(LIRE_LE_BILAN, cas);

  it("les postes sont ceux du bilan du moteur, et l'actif égale le passif", () => {
    const r = anneeJouee(code).partie.rounds.at(-1)!.results["joueur"]!.balanceSheet;
    expect(b.f.capitauxPropres).toBeCloseTo(r.equity, 1);
    expect(b.f.emprunts).toBeCloseTo(r.financialDebt, 1);
    expect(b.f.creances).toBeCloseTo(r.receivables, 1);
    expect(Math.abs(b.actif - b.passif)).toBeLessThan(1);
  });

  it("les équilibres se recomposent, et la réponse sur la trésorerie suit la banque et le découvert", () => {
    expect(b.autonomie).toBeCloseTo((b.f.capitauxPropres / b.passif) * 100, 1);
    expect(b.endettement).toBeCloseTo(b.f.emprunts / b.f.capitauxPropres, 2);
    const etape = chapitre.etapes.find((e) => e.id === "tresorerie");
    if (etape?.type !== "choix") throw new Error("Pas d'étape tresorerie");
    const juste = etape.options(cas, { soldes: {} }).find((o) => o.juste)!;
    expect(juste.texte).toMatch(b.f.decouvert > b.disponible ? /négative/ : /positive/);
    // Payer ses dettes à court terme sans attendre ses clients se vérifie, ne s'affirme pas.
    expect(b.aCourtTerme).toBeCloseTo(b.f.fournisseurs + Math.max(b.f.tva, 0) + b.f.decouvert, 2);
    if (b.f.decouvert <= b.disponible)
      expect(juste.retour).toMatch(b.disponible >= b.aCourtTerme ? /pourrait régler toutes ses dettes/ : /dépassent pourtant/);
  });

  it("l'égalité de l'actif et du passif se dit au centime d'arrondi près quand les sommes diffèrent", () => {
    const etape = chapitre.etapes.find((e) => e.id === "equilibre");
    if (etape?.type !== "montants") throw new Error("Pas d'étape equilibre");
    const texte = etape.explication(cas, etatAvant(chapitre, cas, chapitre.etapes.indexOf(etape))).join(" ");
    expect(texte.includes("au centime d'arrondi près")).toBe(Math.round(b.actif * 100) !== Math.round(b.passif * 100));
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bque [AEIOUYÉ]/);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});

describe("les cas que le chapitre distingue se rencontrent dans le cours", () => {
  // Sans cela, une branche du texte ne serait jamais lue par aucun élève, ni vérifiée par aucun test.
  const bilans = ENTREPRISES_DU_COURS.map((c) => bilanDeFinDAnnee(casDeLEntreprise(c)));
  it("une trésorerie négative, des dettes à court terme couvertes et non couvertes, un centime d'arrondi", () => {
    expect(bilans.some((b) => b.f.decouvert > b.disponible)).toBe(true);
    expect(bilans.some((b) => b.f.decouvert <= b.disponible && b.disponible >= b.aCourtTerme)).toBe(true);
    expect(bilans.some((b) => b.f.decouvert <= b.disponible && b.disponible < b.aCourtTerme)).toBe(true);
    expect(bilans.some((b) => Math.round(b.actif * 100) !== Math.round(b.passif * 100))).toBe(true);
  });
});
