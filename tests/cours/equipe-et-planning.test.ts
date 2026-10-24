import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { EQUIPE_ET_PLANNING, equipe } from "../../src/config/cours/chapitres/equipe-et-planning";
import { seuilDuPointDeVente } from "../../src/config/cours/chapitres/seuil-du-point-de-vente";
import { COMMERCES } from "../../src/config/cours/chapitres/taux-de-marque";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * L'ÉQUIPE DU POINT DE VENTE, SUR LES HEURES ET LA PAIE DE L'ARÈNE.
 *
 * Les heures d'un salarié sont celles de l'arène (la durée légale, par mois) ; le coût horaire,
 * la productivité et la part du personnel se recomposent ; la charge compare les heures que
 * l'activité demande à celles que l'équipe donne, et la bonne réponse sur le goulot suit ces
 * chiffres ; une embauche se paie par la marge du chiffre d'affaires qu'elle fait réaliser.
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

describe.each(COMMERCES)("l'équipe chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const e = equipe(cas);
  const chapitre = chapitreDuCas(EQUIPE_ET_PLANNING, cas);

  it("les heures d'un salarié sont celles de l'arène, et la durée légale d'un mois", () => {
    const def = scenarioByCode(code);
    const depart = def.company("joueur", def.playerTeamName, "bot", "balanced");
    expect(e.heuresParSalarie).toBeCloseTo(depart.hoursPerEmployee / 3, 2);
    expect(e.heuresParSalarie).toBeCloseTo((35 * 52) / 12, 1);
    expect(e.heuresParUnite).toBe(def.scenario.product.hoursPerUnit);
    expect(e.effectif).toBe(cas.personnel.effectif);
  });

  it("le coût horaire, la productivité et la part du personnel se recomposent", () => {
    // Les taux sont au centime : multipliés par des centaines d'heures, ils retrouvent le total au millième près.
    expect(Math.abs(e.coutHoraire * e.heuresPayees - cas.personnel.cout) / cas.personnel.cout).toBeLessThan(0.001);
    expect(Math.abs(e.caParHeure * e.heuresPayees - cas.gestion.chiffreDAffaires) / cas.gestion.chiffreDAffaires).toBeLessThan(0.001);
    expect(e.partDuPersonnel).toBeCloseTo((cas.personnel.cout / cas.gestion.chiffreDAffaires) * 100, 0);
  });

  it("la charge et le goulot suivent les heures ; une embauche se paie par sa marge", () => {
    expect(e.heuresNecessaires).toBeCloseTo(cas.gestion.quantite * e.heuresParUnite, 1);
    expect(e.capaciteDeLEquipe * e.heuresParUnite).toBeLessThanOrEqual(e.heuresPayees + 1e-9);
    const goulot = chapitre.etapes.find((x) => x.id === "goulot");
    if (goulot?.type !== "choix") throw new Error("Pas d'étape goulot");
    const juste = goulot.options(cas, { soldes: {} }).find((o) => o.juste)!;
    expect(juste.texte).toMatch(e.capaciteDeLEquipe > cas.gestion.quantite * 1.05 ? /^Non/ : /^Oui/);
    expect(e.tauxMcv).toBe(seuilDuPointDeVente(cas).tauxMcv);
    expect((e.caPourUneEmbauche * e.tauxMcv) / 100).toBeGreaterThanOrEqual(e.coutParSalarie - 0.01);
    expect(((e.caPourUneEmbauche - 1) * e.tauxMcv) / 100).toBeLessThan(e.coutParSalarie);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, x] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const t of textesDe(x, cas, etat)) {
        expect(t, `${x.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(t, `${x.id} : ${t}`).not.toMatch(/\b(de|à) les? /);
        expect(t, `${x.id} : ${t}`).not.toMatch(/ [-–—] /);
        expect(t, `${x.id} : ${t}`).not.toMatch(/\bde [aeiouyéèê]/i);
      }
      if (x.type === "choix") expect(x.options(cas, etat).filter((o) => o.juste), x.id).toHaveLength(1);
      for (const n of x.notions ?? []) expect(codes.has(n), `${x.id} : ${n}`).toBe(true);
    }
  });
});
