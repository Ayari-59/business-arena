import { describe, expect, it } from "vitest";
import { anneeJouee, casDeLEntreprise } from "../../src/config/cours/cas";
import { RENTABILITE, rentabilite } from "../../src/config/cours/chapitres/rentabilite";
import { bilanFonctionnel } from "../../src/config/cours/chapitres/bilan-fonctionnel";
import { soldesDeGestion } from "../../src/config/cours/chapitres/soldes-intermediaires";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LA RENTABILITÉ, SUR L'ANNÉE ET LE BILAN DE L'ARÈNE.
 *
 * Les rentabilités se recomposent sur les soldes et le bilan fonctionnel ; les deux comparaisons
 * au taux de l'emprunt suivent les chiffres.
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
    default:
      return [];
  }
}

describe.each(ENTREPRISES_DU_COURS)("la rentabilité chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const r = rentabilite(cas);
  const chapitre = chapitreDuCas(RENTABILITE, cas);
  const juste = (id: string) => {
    const e = chapitre.etapes.find((x) => x.id === id);
    if (e?.type !== "choix") throw new Error(`Pas d'étape ${id}`);
    return e.options(cas, { soldes: {} }).find((o) => o.juste)!.texte;
  };

  it("les rentabilités se recomposent sur les soldes et le bilan", () => {
    const s = soldesDeGestion(cas);
    const b = bilanFonctionnel(cas);
    expect(r.resultatNet).toBeCloseTo(s.resultatNet, 1);
    expect(r.capitauxPropres).toBeCloseTo(anneeJouee(code).partie.rounds.at(-1)!.results["joueur"]!.balanceSheet.equity, 1);
    expect(r.capitauxInvestis).toBeCloseTo(b.fin.immobilisationsNettes + b.apres.bfr, 1);
    expect(r.financiere).toBeCloseTo((r.resultatNet / r.capitauxPropres) * 100, 1);
    expect(r.economique).toBeCloseTo((r.resultatExploitation / r.capitauxInvestis) * 100, 1);
    expect(r.tauxDeLEmprunt).toBeCloseTo(cas.pret.tauxAnnuel * 100, 1);
  });

  it("les comparaisons au taux de l'emprunt suivent les chiffres", () => {
    expect(juste("associes")).toMatch(r.financiere > r.tauxDeLEmprunt ? /plus que/ : /moins que/);
    expect(juste("emprunter")).toMatch(r.economique > r.tauxDeLEmprunt ? /^Oui/ : /^Non/);
  });

  it("les textes suivent les signes : besoin négatif, activité qui rapporte plus qu'elle ne mobilise, bénéfice ou perte", () => {
    const calcul = chapitre.etapes.find((e) => e.id === "calcul");
    if (calcul?.type !== "montants") throw new Error("Pas d'étape calcul");
    const champs = calcul.champs(cas, { soldes: {} });
    expect(champs.map((c) => c.calcul).join(" "), "« + − » dans un calcul").not.toMatch(/\+ -/);
    const explication = calcul.explication(cas, { soldes: {} }).join(" ");
    expect(explication.includes("plus que tout ce qu'elle mobilise")).toBe(r.resultatExploitation > r.capitauxInvestis);
    const emprunter = chapitre.etapes.find((e) => e.id === "emprunter");
    if (emprunter?.type !== "choix") throw new Error("Pas d'étape emprunter");
    const juste = emprunter.options(cas, { soldes: {} }).find((o) => o.juste)!;
    if (r.economique <= r.tauxDeLEmprunt)
      expect(juste.retour).toMatch(r.economique > 0 ? /réduirait le bénéfice/ : /creuserait les pertes/);
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
  const toutes = ENTREPRISES_DU_COURS.map((c) => rentabilite(casDeLEntreprise(c)));
  it("un besoin négatif, un emprunt qui réduit un bénéfice ou creuse une perte, et plus d'activité qui rapporte plus qu'elle ne mobilise", () => {
    expect(toutes.some((r) => r.bfr < 0)).toBe(true);
    // Dans l'année du bon gestionnaire, deux activités rapportent en un an plus que tout ce qu'elles
    // mobilisent (la boutique et le commerce en ligne, au besoin en fonds de roulement négatif) : la
    // phrase de l'étape « calcul » sur ce cas est lue.
    expect(toutes.filter((r) => r.resultatExploitation > r.capitauxInvestis)).toHaveLength(2);
    expect(Math.max(...toutes.map((r) => r.economique))).toBe(638);
    // Et toutes rapportent plus que leur emprunt ne coûte (la plus faible, l'hôtel, 20,2 % pour un
    // emprunt à 4,2 %) : la réponse « Non : chaque euro emprunté coûterait plus qu'il ne rapporte »
    // n'est plus la bonne nulle part, et ses deux retours (bénéfice réduit, perte creusée) ne sont
    // plus lus. Si le cas revient, ces gardes le diront.
    expect(toutes.filter((r) => r.economique <= r.tauxDeLEmprunt)).toHaveLength(0);
    expect(Math.min(...toutes.map((r) => r.economique))).toBe(20.2);
  });
});
