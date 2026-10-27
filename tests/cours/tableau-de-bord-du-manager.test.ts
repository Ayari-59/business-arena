import { describe, expect, it } from "vitest";
import { anneeJouee, casDeLEntreprise } from "../../src/config/cours/cas";
import {
  AXES_DU_TABLEAU,
  TABLEAU_DE_BORD_DU_MANAGER,
  deuxTrimestres,
  indicateursDuParcours,
} from "../../src/config/cours/chapitres/tableau-de-bord-du-manager";
import { COMMERCES } from "../../src/config/cours/chapitres/taux-de-marque";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LE TABLEAU DE BORD RASSEMBLE LE PARCOURS ET LIT DEUX TRIMESTRES DE L'ARÈNE.
 *
 * Chaque axe du tableau a ses indicateurs ; les deux trimestres sont les deux premiers de
 * l'année de l'arène ; le voyant se lit d'abord sur l'offre (la demande est-elle servie ?),
 * puis sur la demande ; les commerces n'allument pas tous le même voyant.
 *
 * Dans l'année du bon gestionnaire, aucun commerce n'allume « croissance » : la demande des
 * deux premiers trimestres recule (la boutique, qui la sert presque toute) ou n'est pas toute
 * servie (le site marchand, le bistrot). La bonne réponse « croissance » ne se lit plus ; ses textes
 * restent, comme options fausses. Si un commerce l'allume de nouveau, la garde rougit : il
 * faudra revenir à trois voyants différents.
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    case "tri":
      return [e.question(cas), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(cas)];
    default:
      return [];
  }
}

it("les commerces n'allument pas tous le même voyant : l'un lit un repli, les autres des ventes bloquées", () => {
  const voyants = new Set(COMMERCES.map((code) => deuxTrimestres(casDeLEntreprise(code)).voyant));
  expect([...voyants].sort()).toEqual(["repli", "ventes-bloquees"]);
});

describe.each(COMMERCES)("le tableau de bord chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const d = deuxTrimestres(cas);
  const chapitre = chapitreDuCas(TABLEAU_DE_BORD_DU_MANAGER, cas);

  it("chaque axe a ses indicateurs, et chaque indicateur un axe", () => {
    const lignes = indicateursDuParcours(cas);
    for (const axe of AXES_DU_TABLEAU) expect(lignes.some((l) => l.axe === axe.code), axe.code).toBe(true);
    expect(new Set(lignes.map((l) => l.libelle)).size).toBe(lignes.length);
  });

  it("les deux trimestres sont ceux de l'arène, et leurs évolutions se recomposent", () => {
    const [r1, r2] = anneeJouee(code).partie.rounds;
    expect(d.t1.ca).toBe(Math.round(r1!.results["joueur"]!.incomeStatement.revenue / 3));
    expect(d.t2.ca).toBe(Math.round(r2!.results["joueur"]!.incomeStatement.revenue / 3));
    expect(d.evolutionCa).toBeCloseTo((d.t2.ca / d.t1.ca - 1) * 100, 0);
    expect(d.transformation2).toBeCloseTo((d.t2.ventes / d.t2.demande) * 100, 0);
  });

  it("le voyant se lit d'abord sur l'offre, puis sur la demande, et la bonne réponse le suit", () => {
    const attendu = d.t2.ventes / d.t2.demande < 0.95 ? "ventes-bloquees" : d.t2.demande / d.t1.demande - 1 < -0.05 ? "repli" : "croissance";
    expect(d.voyant).toBe(attendu);
    const voyant = chapitre.etapes.find((e) => e.id === "voyant");
    if (voyant?.type !== "choix") throw new Error("Pas d'étape voyant");
    const juste = voyant.options(cas, { soldes: {} }).find((o) => o.juste)!;
    expect(juste.texte).toMatch(attendu === "ventes-bloquees" ? /ne suivent pas/ : attendu === "repli" ? /demande baisse/ : /progresse/);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\b(de|à) les? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bde [aeiouyéèê]/i);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
