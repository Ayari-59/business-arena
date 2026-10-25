import { describe, expect, it } from "vitest";
import { anneeJouee } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { ECART_D_INDICE, EMBAUCHES, rejouerLAnnee } from "../../src/config/cours/ressources-humaines";
import { scenarioByCode } from "../../src/config/scenarios/registry";

/**
 * L'ANNÉE REJOUÉE AVEC UNE DÉCISION DE RESSOURCES HUMAINES.
 *
 * Sans décision, c'est l'année du cours, au centime. Une embauche décidée au premier trimestre
 * arrive au deuxième : le moteur compte les trimestres à partir de 1, et une décision posée au
 * « trimestre 0 » ne serait jamais jouée, sans que rien n'échoue. Une baisse de salaire sous le
 * seuil fait partir un salarié par trimestre, tant qu'il en reste plus d'un.
 */

describe.each(ENTREPRISES_DU_COURS)("l'année rejouée chez %s", (code) => {
  it("sans décision, c'est l'année du cours", () => {
    const rejouee = rejouerLAnnee(code, "base", () => undefined);
    const jouee = anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!);
    expect(rejouee.map((r) => r.incomeStatement.netIncome)).toEqual(jouee.map((r) => r.incomeStatement.netIncome));
  });

  it("l'embauche du premier trimestre arrive au deuxième, et la baisse de salaire fait partir un salarié par trimestre", () => {
    const hr = scenarioByCode(code).scenario.hr!;
    const embauche = rejouerLAnnee(code, "embauche", (t) => (t === 1 ? { hire: EMBAUCHES } : undefined));
    expect(embauche[0]!.hr!.headcount).toBe(hr.includedHeadcount);
    expect(embauche[1]!.hr!.headcount).toBe(hr.includedHeadcount + EMBAUCHES);
    expect(1 - ECART_D_INDICE).toBeLessThan(hr.attritionThreshold);
    const baisse = rejouerLAnnee(code, "salaires-baisses", () => ({ salaryIndex: 1 - ECART_D_INDICE }));
    // Un départ par trimestre, sauf à ne garder qu'un salarié : le moteur ne vide jamais l'équipe.
    for (const r of baisse) expect(r.hr!.departed).toBe(r.hr!.headcount > 1 ? 1 : 0);
  });
});
