import { describe, expect, it } from "vitest";
import { anneeJouee, casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { BILAN_FONCTIONNEL, bilanFonctionnel } from "../../src/config/cours/chapitres/bilan-fonctionnel";
import { soldesDeGestion } from "../../src/config/cours/chapitres/soldes-intermediaires";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LE BILAN FONCTIONNEL TIENT DANS LES NEUF ENTREPRISES.
 *
 * Le bilan de l'arène s'équilibre aux deux dates ; la trésorerie nette vaut le fonds de
 * roulement moins le besoin en fonds de roulement, au début comme à la fin ; elle est celle du
 * tableau de trésorerie de l'arène ; le découvert est de la trésorerie, pas une ressource
 * stable ; la variation du fonds de roulement est la CAF, moins les investissements, plus
 * l'emprunt net ; aucun texte ne sort un « undefined ».
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? ""];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat)];
    default:
      return [];
  }
}

describe.each(ENTREPRISES_DU_COURS)("le bilan fonctionnel chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const b = bilanFonctionnel(cas);
  const chapitre = chapitreDuCas(BILAN_FONCTIONNEL, cas);

  it("le bilan de l'arène s'équilibre, et la trésorerie nette vaut le fonds de roulement moins le besoin, aux deux dates", () => {
    for (const [m, f] of [
      [b.debut, b.avant],
      [b.fin, b.apres],
    ] as const) {
      const actif = m.immobilisationsNettes + m.stocks + m.creances + m.placements + m.banque + Math.max(0, -m.tva);
      const passif = m.capitauxPropres + m.emprunts + m.fournisseurs + m.decouvert + Math.max(0, m.tva);
      expect(actif).toBeCloseTo(passif, 1);
      expect(f.tn).toBeCloseTo(f.frng - f.bfr, 1);
    }
  });

  it("la trésorerie nette est celle de l'arène, découvert compris, et le découvert n'est pas une ressource stable", () => {
    const tours = anneeJouee(code).partie.rounds;
    expect(b.avant.tn).toBeCloseTo(tours[0]!.results["joueur"]!.cashFlow.opening, 1);
    expect(b.apres.tn).toBeCloseTo(tours[tours.length - 1]!.results["joueur"]!.cashFlow.closing, 1);
    expect(b.variationTn).toBeCloseTo(soldesDeGestion(cas).tresorerie.variation, 1);
    expect(b.apres.ressourcesStables).toBeCloseTo(b.fin.capitauxPropres + b.apres.amortissements + b.fin.emprunts, 1);
  });

  it("la variation du fonds de roulement est la CAF, moins les investissements, plus l'emprunt net", () => {
    // L'impôt de la CAF est arrondi à l'euro, celui des capitaux propres de l'arène non : moins d'un euro.
    expect(Math.abs(b.variationFrng - (b.caf - b.investissements + b.empruntNet))).toBeLessThan(1);
    expect(b.arrondiDeLImpot).toBeCloseTo(b.variationFrng - (b.caf - b.investissements + b.empruntNet), 2);
    expect(b.variationTn).toBeCloseTo(b.variationFrng - b.variationBfr, 1);
    expect(b.apres.amortissements).toBeCloseTo(soldesDeGestion(cas).dotation, 2);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent ; le bilan se montre", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const t of textesDe(e, cas, etat)) {
        expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(t, `${e.id} : ${t}`).not.toMatch(/\b(de|à) les? /);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
    const tableau = chapitre.etapes[0]!.tableau!(cas);
    for (const l of tableau.lignes) {
      expect(l.valeurs, l.libelle).toHaveLength(2);
      for (const v of l.valeurs) expect(v, l.libelle).not.toMatch(/undefined|NaN/);
    }
  });
});
