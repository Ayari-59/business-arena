import { describe, expect, it } from "vitest";
import { anneeJouee } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { anneeDeReference, rejouerAvec } from "../../src/config/cours/gestion-de-la-pme";
import { rejouerLAnnee } from "../../src/config/cours/ressources-humaines";

/**
 * L'ANNÉE DE LA PME REJOUÉE (parcours BTS GPME).
 *
 * Sans changement, c'est l'année du cours, au centime, et la même que celle des ressources
 * humaines. Un changement de décision au premier trimestre se joue bien au premier trimestre :
 * le moteur compte à partir de 1, et une décision posée ailleurs ne serait jamais jouée.
 */
describe.each(ENTREPRISES_DU_COURS)("l'année de la PME chez %s", (code) => {
  it("sans changement, c'est l'année du cours", () => {
    const jouee = anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!);
    expect(anneeDeReference(code).map((r) => r.incomeStatement.netIncome)).toEqual(jouee.map((r) => r.incomeStatement.netIncome));
    expect(anneeDeReference(code).map((r) => r.incomeStatement.netIncome)).toEqual(
      rejouerLAnnee(code, "base", () => undefined).map((r) => r.incomeStatement.netIncome),
    );
  });

  it("un changement du premier trimestre se joue au premier trimestre, pas avant", () => {
    // L'assurance, que les neuf entreprises proposent, se paie au trimestre même où on la prend.
    const assuree = rejouerAvec(code, "test-assurance-t1", (t, d) => (t === 1 ? { ...d, insurance: true } : undefined));
    expect(assuree[0]!.insurance?.premium ?? 0).toBeGreaterThan(0);
    expect(anneeDeReference(code)[0]!.insurance?.premium ?? 0).toBe(0);
  });

  it("un paramètre du scénario se change sans toucher aux décisions", () => {
    const rejouee = rejouerAvec(code, "test-scenario-identique", () => undefined, (s) => ({ ...s }));
    expect(rejouee.map((r) => r.incomeStatement.netIncome)).toEqual(anneeDeReference(code).map((r) => r.incomeStatement.netIncome));
  });
});
