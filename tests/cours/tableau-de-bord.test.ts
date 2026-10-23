import { describe, expect, it } from "vitest";
import { anneeJouee, casDeLEntreprise } from "../../src/config/cours/cas";
import type { Cas } from "../../src/config/cours/cas";
import { TABLEAU_DE_BORD } from "../../src/config/cours/chapitres/tableau-de-bord";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { premierDesaccord, premierSousLeSeuil, tableauDeBord } from "../../src/config/cours/tableau-de-bord";
import type { Etape } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";

/**
 * LE TABLEAU DE BORD LIT L'ANNÉE DE L'ARÈNE, DANS LES NEUF ENTREPRISES.
 *
 * Six indicateurs par trimestre, tirés des quatre trimestres joués ; les relations entre
 * eux tiennent (le seuil rend l'indice, l'indice dit le signe du résultat) ; les bonnes
 * réponses désignent le bon trimestre ; les deux cas du voyant existent (un trimestre sous
 * le seuil, une année sans).
 */

const chapitre = TABLEAU_DE_BORD;
const etat = { soldes: {} };

function textesDe(e: Etape, cas: Cas): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [...tableau, ...e.texte(cas), e.repere?.(cas) ?? ""];
    case "choix":
      return [...tableau, e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [...tableau, e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat)];
    default:
      return tableau;
  }
}

describe.each(ENTREPRISES_DU_COURS)("le tableau de bord chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const t = tableauDeBord(code);
  const { partie } = anneeJouee(code);

  it("quatre trimestres, tirés de l'année jouée par l'arène", () => {
    expect(t).toHaveLength(4);
    t.forEach((x, k) => {
      const r = partie.rounds[k]!.results["joueur"]!;
      expect(x.chiffreDAffaires).toBe(Math.round(r.incomeStatement.revenue));
      expect(x.resultat).toBe(Math.round(r.incomeStatement.operatingIncome));
      expect(x.tresorerie).toBe(Math.round(r.cashFlow.closing));
      expect(x.partDeMarche).toBeCloseTo(r.market.totalShare * 100, 0);
      // Le résultat d'exploitation est la marge moins les charges fixes, aux arrondis près.
      expect(Math.abs(x.marge - x.chargesFixes - x.resultat)).toBeLessThanOrEqual(2);
    });
  });

  it("le seuil rend l'indice, et l'indice dit le signe du résultat", () => {
    for (const x of t) {
      expect(Math.abs(x.seuil * (x.marge / x.chiffreDAffaires) - x.chargesFixes)).toBeLessThanOrEqual(1);
      expect(x.indiceDeSecurite).toBeCloseTo(((x.chiffreDAffaires - x.seuil) / x.chiffreDAffaires) * 100, 0);
      if (Math.abs(x.resultat) > 100) expect(Math.sign(x.indiceDeSecurite)).toBe(Math.sign(x.resultat));
    }
  });

  it("les bonnes réponses désignent le bon trimestre ; aucun texte ne sort undefined ou NaN ; des options distinctes", () => {
    const premier = t.findIndex((x) => x.indiceDeSecurite < 0);
    expect(premierSousLeSeuil(code)).toBe(premier < 0 ? null : premier + 1);
    const d = premierDesaccord(code);
    if (d) {
      const dr = t[d.a - 1]!.resultat - t[d.de - 1]!.resultat;
      const dt = t[d.a - 1]!.tresorerie - t[d.de - 1]!.tresorerie;
      expect(dr * dt).toBeLessThan(0);
    }
    for (const e of chapitre.etapes) {
      for (const s of textesDe(e, cas)) expect(s, `${e.id} : ${s}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      if (e.type === "choix") {
        const options = e.options(cas, etat);
        expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
        expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      }
      if (e.type === "montants") for (const c of e.champs(cas, etat)) expect(Number.isFinite(c.attendu), e.id).toBe(true);
    }
  });
});

describe("le tableau de bord, quelle que soit l'entreprise", () => {
  it("les deux cas du voyant existent : un trimestre sous le seuil, une année sans ; et un désaccord résultat et trésorerie", () => {
    const premiers = ENTREPRISES_DU_COURS.map((c) => premierSousLeSeuil(c));
    expect(premiers.some((p) => p === null)).toBe(true);
    expect(premiers.some((p) => p !== null)).toBe(true);
    expect(ENTREPRISES_DU_COURS.some((c) => premierDesaccord(c) !== null)).toBe(true);
  });

  it("est réservé (décision du propriétaire : la suite du cours sous licence), au palier 4, ses notions sont des fiches, ses étapes uniques", () => {
    expect(chapitre.libre).toBe(false);
    expect(chapitre.palier).toBe(4);
    const codes = new Set(CONCEPTS.map((c) => c.code));
    for (const e of chapitre.etapes) for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    expect(new Set(chapitre.etapes.map((e) => e.id)).size).toBe(chapitre.etapes.length);
  });
});
