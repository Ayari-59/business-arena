import { DEPARTS_PAR_POINT_SOUS_LE_SEUIL, PART_MAXIMALE_DES_DEPARTS } from "../../src/engine/hr";
import { describe, expect, it } from "vitest";
import { anneeJouee } from "../../src/config/cours/annee-de-l-arene";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { ECART_D_INDICE, EMBAUCHES, rejouerLAnnee } from "../../src/config/cours/ressources-humaines";
import { scenarioByCode } from "../../src/config/scenarios/registry";

/**
 * L'ANNÉE REJOUÉE AVEC UNE DÉCISION DE RESSOURCES HUMAINES.
 *
 * Sans décision, c'est l'année du cours, au centime. Une embauche décidée au premier trimestre
 * arrive au deuxième : le moteur compte les trimestres à partir de 1, et une décision posée au
 * « trimestre 0 » ne serait jamais jouée, sans que rien n'échoue. Une baisse de salaire sous le
 * seuil fait partir, chaque trimestre, une part de l'équipe qui croît avec l'écart au seuil, et
 * chaque départ est remplacé (équilibre du moteur 0.2.0).
 */

describe.each(ENTREPRISES_DU_COURS)("l'année rejouée chez %s", (code) => {
  it("sans décision, c'est l'année du cours", () => {
    const rejouee = rejouerLAnnee(code, "base", () => undefined);
    const jouee = anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!);
    expect(rejouee.map((r) => r.incomeStatement.netIncome)).toEqual(jouee.map((r) => r.incomeStatement.netIncome));
  });

  it("l'embauche du premier trimestre arrive au deuxième, et la baisse de salaire fait partir une part de l'équipe, remplacée", () => {
    const hr = scenarioByCode(code).scenario.hr!;
    const embauche = rejouerLAnnee(code, "embauche", (t) => (t === 1 ? { hire: EMBAUCHES } : undefined));
    expect(embauche[0]!.hr!.headcount).toBe(hr.includedHeadcount);
    expect(embauche[1]!.hr!.headcount).toBe(hr.includedHeadcount + EMBAUCHES);
    expect(1 - ECART_D_INDICE).toBeLessThan(hr.attritionThreshold);
    const baisse = rejouerLAnnee(code, "salaires-baisses", () => ({ salaryIndex: 1 - ECART_D_INDICE }));
    // À l'équilibre du moteur 0.2.0 (novembre 2026), les départs sont proportionnels à
    // l'équipe et à l'écart au seuil, et chacun est remplacé : l'équipe ne fond plus.
    const attendus = (n: number) =>
      Math.min(n - 1, Math.ceil(n * Math.min(PART_MAXIMALE_DES_DEPARTS, DEPARTS_PAR_POINT_SOUS_LE_SEUIL * (hr.attritionThreshold - (1 - ECART_D_INDICE)))));
    for (const r of baisse) {
      expect(r.hr!.departed).toBe(attendus(r.hr!.headcount));
      expect(r.hr!.remplaces).toBe(r.hr!.departed);
      expect(r.hr!.nextHeadcount).toBe(r.hr!.headcount);
    }
  });
});
