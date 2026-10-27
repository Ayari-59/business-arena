import { describe, expect, it } from "vitest";
import { budgetDuTrimestre } from "../../src/config/cours/budget";
import { anneeJouee, casDeLEntreprise } from "../../src/config/cours/cas";
import type { Cas } from "../../src/config/cours/cas";
import { ANALYSE_DES_ECARTS, causeDuChiffreDAffaires } from "../../src/config/cours/chapitres/analyse-des-ecarts";
import { ecartsDuTrimestre } from "../../src/config/cours/ecarts";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import type { Etape } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { soldUnits } from "../../src/engine/simulation/runGame";

/**
 * L'ANALYSE DES ÉCARTS DÉCOMPOSE SANS RESTE, SUR LES CHIFFRES DE L'ARÈNE.
 *
 * Les deux écarts font l'écart total, sur le chiffre d'affaires comme sur la marge ; le
 * prévu est celui du budget de trésorerie, le réalisé le deuxième trimestre joué ; l'écart
 * sur résultat retrouve celui du résultat d'exploitation de l'arène, aux arrondis près.
 */

const chapitre = ANALYSE_DES_ECARTS;
const etat = { soldes: {} };

function textesDe(e: Etape, cas: Cas): string[] {
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

describe.each(ENTREPRISES_DU_COURS)("l'analyse des écarts chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const e = ecartsDuTrimestre(code);
  const { partie } = anneeJouee(code);
  const [r1, r2] = [0, 1].map((k) => partie.rounds[k]!.results["joueur"]!);

  it("les deux écarts font l'écart total, sur le chiffre d'affaires comme sur la marge", () => {
    expect(e.chiffreDAffaires.volume + e.chiffreDAffaires.prix).toBeCloseTo(e.chiffreDAffaires.total, 1);
    expect(e.marge.volume + e.marge.unitaire).toBeCloseTo(e.marge.total, 1);
    expect(e.resultat).not.toBe(0);
    expect(e.resultat).toBeCloseTo(e.marge.total - e.chargesFixes, 2);
    expect(e.chargesFixes).toBe(e.realise.chargesFixes - e.prevu.chargesFixes);
  });

  it("le prévu et le réalisé sont les trimestres de l'arène, et le prévu celui du budget de trésorerie", () => {
    for (const [r, t] of [[r1!, e.prevu], [r2!, e.realise]] as const) {
      expect(t.quantite).toBe(Math.round(soldUnits(r)));
      // Le prix moyen arrondi au centime : un demi-centime par unité, au plus.
      expect(Math.abs(t.chiffreDAffaires - r.incomeStatement.revenue)).toBeLessThanOrEqual(t.quantite * 0.005 + 0.5);
      expect(Math.abs(t.marge - r.incomeStatement.grossMargin)).toBeLessThanOrEqual(t.quantite * 0.005 + 0.5);
    }
    expect(Math.abs(e.prevu.chiffreDAffaires - budgetDuTrimestre(code).t1.ventes)).toBeLessThanOrEqual(e.prevu.quantite * 0.005 + 1);
    // L'écart sur résultat retrouve celui du résultat d'exploitation de l'arène.
    const arene = r2!.incomeStatement.operatingIncome - r1!.incomeStatement.operatingIncome;
    expect(Math.abs(e.resultat - arene)).toBeLessThanOrEqual((e.prevu.quantite + e.realise.quantite) * 0.005 + 2);
  });

  it("la bonne réponse désigne la cause qui pèse le plus ; aucun texte ne sort undefined ou NaN ; des options distinctes", () => {
    const ca = e.chiffreDAffaires;
    expect(causeDuChiffreDAffaires(cas)).toBe(Math.abs(ca.volume) >= Math.abs(ca.prix) ? "volume" : "prix");
    for (const etape of chapitre.etapes) {
      for (const t of textesDe(etape, cas)) expect(t, `${etape.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      if (etape.type === "choix") {
        const options = etape.options(cas, etat);
        expect(options.filter((o) => o.juste), etape.id).toHaveLength(1);
        expect(new Set(options.map((o) => o.texte)).size, etape.id).toBe(options.length);
        expect(options.length, etape.id).toBeGreaterThanOrEqual(3);
      }
      if (etape.type === "montants") for (const c of etape.champs(cas, etat)) expect(Number.isFinite(c.attendu), etape.id).toBe(true);
    }
  });
});

describe("l'analyse des écarts, quelle que soit l'entreprise", () => {
  it("les deux écarts existent (quantités, prix), dans les deux sens (favorables, défavorables)", () => {
    const causes = new Set(ENTREPRISES_DU_COURS.map((c) => causeDuChiffreDAffaires(casDeLEntreprise(c))));
    // Dans l'année corrigée, les quantités pèsent le plus partout : la réponse « des prix » n'est
    // plus juste nulle part, et son retour « Oui » n'est plus lu. Si le prix l'emporte de nouveau
    // quelque part, cette garde le dira.
    expect([...causes]).toEqual(["volume"]);
    // L'écart sur prix existe encore, favorable ici, défavorable là ; et il va parfois contre le
    // volume (la boutique vend moins, plus cher) : la décomposition dit ce qui compense quoi.
    const ca = ENTREPRISES_DU_COURS.map((c) => ecartsDuTrimestre(c).chiffreDAffaires);
    expect(ca.some((e) => e.prix > 0)).toBe(true);
    expect(ca.some((e) => e.prix < 0)).toBe(true);
    expect(ca.some((e) => e.prix !== 0 && Math.sign(e.prix) !== Math.sign(e.volume))).toBe(true);
    const resultats = ENTREPRISES_DU_COURS.map((c) => ecartsDuTrimestre(c).resultat);
    expect(resultats.some((r) => r > 0)).toBe(true);
    expect(resultats.some((r) => r < 0)).toBe(true);
  });

  it("est réservé (décision du propriétaire : la suite du cours sous licence), au palier 4, ses notions sont des fiches, ses étapes uniques", () => {
    expect(chapitre.libre).toBe(false);
    expect(chapitre.palier).toBe(4);
    const codes = new Set(CONCEPTS.map((c) => c.code));
    for (const e of chapitre.etapes) for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    expect(new Set(chapitre.etapes.map((e) => e.id)).size).toBe(chapitre.etapes.length);
  });
});
