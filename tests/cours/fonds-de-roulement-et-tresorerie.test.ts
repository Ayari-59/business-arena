import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { FONDS_DE_ROULEMENT, fondsDeRoulement } from "../../src/config/cours/chapitres/fonds-de-roulement-et-tresorerie";
import { bilanFonctionnel } from "../../src/config/cours/chapitres/bilan-fonctionnel";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * FONDS DE ROULEMENT, BESOIN ET TRÉSORERIE, AU 31 DÉCEMBRE DE L'ARÈNE.
 *
 * Les trois grandeurs simplifiées sont celles du bilan fonctionnel ; fonds de roulement moins
 * besoin redonne la trésorerie à l'euro près.
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

describe.each(ENTREPRISES_DU_COURS)("le fonds de roulement chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const k = fondsDeRoulement(cas);
  const chapitre = chapitreDuCas(FONDS_DE_ROULEMENT, cas);

  it("les trois grandeurs sont celles du bilan fonctionnel, et se tiennent", () => {
    const b = bilanFonctionnel(cas);
    expect(k.frng).toBeCloseTo(b.apres.frng, 0);
    expect(k.bfr).toBeCloseTo(b.apres.bfr, 1);
    expect(k.tn).toBeCloseTo(b.apres.tn, 1);
    expect(Math.abs(k.frng - k.bfr - k.tn)).toBeLessThanOrEqual(1);
  });

  it("les textes suivent les chiffres : signes, centime d'arrondi, TVA due, poids des créances", () => {
    const etat = { soldes: {} };
    const etape = (id: string) => chapitre.etapes.find((e) => e.id === id)!;
    const calculs = chapitre.etapes.flatMap((e) => (e.type === "montants" ? e.champs(cas, etat).map((c) => c.calcul) : []));
    expect(calculs.join(" "), "un signe doublé dans un calcul").not.toMatch(/[+−-] -/);
    const tresorerie = etape("tresorerie");
    if (tresorerie.type !== "montants") throw new Error("Pas d'étape tresorerie");
    const ecart = Math.round((k.frng - k.bfr) * 100) !== Math.round(k.tn * 100);
    expect(tresorerie.explication(cas, etat).join(" ").includes("au centime d'arrondi près")).toBe(ecart);
    const bfr = etape("bfr");
    if (bfr.type !== "montants") throw new Error("Pas d'étape bfr");
    if (k.bfr < 0) expect(bfr.explication(cas, etat).join(" ").includes("l'État")).toBe(k.f.tva > 0);
    const clients = etape("clients");
    if (clients.type !== "choix") throw new Error("Pas d'étape clients");
    const juste = clients.options(cas, etat).find((o) => o.juste)!;
    expect(juste.retour).not.toMatch(/premier levier/);
    expect(juste.retour).toContain("que le cycle immobilise");
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
  const toutes = ENTREPRISES_DU_COURS.map((c) => fondsDeRoulement(casDeLEntreprise(c)));
  it("un besoin négatif, un fonds de roulement négatif, une trésorerie négative, un centime d'arrondi", () => {
    expect(toutes.some((k) => k.bfr < 0)).toBe(true);
    expect(toutes.some((k) => k.frng < 0)).toBe(true);
    expect(toutes.some((k) => k.tn < 0)).toBe(true);
    expect(toutes.some((k) => Math.round((k.frng - k.bfr) * 100) !== Math.round(k.tn * 100))).toBe(true);
  });
});
