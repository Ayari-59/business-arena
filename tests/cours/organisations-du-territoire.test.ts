import { describe, expect, it } from "vitest";
import { ENTREPRISES_DU_COURS } from "@/config/cours/metiers";
import { HAUT_VERDASSE, SOUTIEN_AU_HANDBALL, VALEUR_DE_LA_MISE_A_DISPOSITION, totalDe } from "@/config/cours/monde/haut-verdasse";
import { HAUT_VERDASSE_HANDBALL } from "@/config/cours/monde/haut-verdasse-handball";
import { ORGANISATIONS_DU_TERRITOIRE } from "@/config/cours/monde/organisations-du-territoire";

/**
 * LA COMMUNAUTÉ DE COMMUNES DU HAUT-VERDASSE ET SON CLUB DE HANDBALL : les deux fiches se répondent
 * et chaque total se refait à la main.
 */
describe("les organisations du territoire", () => {
  const cc = HAUT_VERDASSE;
  const club = HAUT_VERDASSE_HANDBALL;

  it("le budget de fonctionnement de la communauté est voté en équilibre", () => {
    expect(totalDe(cc.budget.recettes)).toBe(3_100_000 + 5_200_000 + 700_000);
    expect(totalDe(cc.budget.depenses)).toBe(totalDe(cc.budget.recettes));
    // L'autofinancement est l'écart des recettes sur les dépenses courantes.
    const courantes = cc.budget.depenses.filter((l) => l.code !== "autofinancement");
    expect(totalDe(cc.budget.recettes) - totalDe(courantes)).toBe(500_000);
  });

  it("les chiffres de la communauté se recoupent : usagers, personnel, agents des services", () => {
    expect(totalDe(cc.recettesDesUsagers)).toBe(cc.budget.recettes.find((l) => l.code === "usagers")!.montant);
    expect(cc.agents.effectif * cc.agents.coutMoyenAnnuel).toBe(cc.budget.depenses.find((l) => l.code === "personnel")!.montant);
    expect(cc.services.reduce((n, s) => n + s.agents, 0)).toBeLessThan(cc.agents.effectif);
    expect(cc.services.map((s) => s.code)).toEqual(["piscine", "gymnase", "mediatheque"]);
  });

  it("le budget du club dégage un excédent expliqué, mis en réserve", () => {
    const cotisations = club.categories.reduce((n, c) => n + c.adherents * c.cotisation, 0);
    expect(cotisations).toBe(club.budget.recettes.find((l) => l.code === "cotisations")!.montant);
    expect(club.categories.reduce((n, c) => n + c.adherents, 0)).toBe(240);
    expect(totalDe(club.budget.recettes)).toBe(68_000);
    expect(totalDe(club.budget.depenses)).toBe(66_000);
    expect(totalDe(club.budget.recettes) - totalDe(club.budget.depenses)).toBe(2_000);
    expect(club.affectationDeLExcedent).toContain("réserve");
  });

  it("la subvention et le prêt du gymnase sont les mêmes des deux côtés", () => {
    expect(club.budget.recettes.find((l) => l.code === "subvention")!.montant).toBe(SOUTIEN_AU_HANDBALL.subvention);
    expect(SOUTIEN_AU_HANDBALL.subvention).toBe(18_000);
    expect(SOUTIEN_AU_HANDBALL.subvention).toBeLessThan(cc.budget.depenses.find((l) => l.code === "subventions")!.montant);
    expect(VALEUR_DE_LA_MISE_A_DISPOSITION).toBe(6 * 32 * 25);
    expect(club.contributionsEnNature[0]!.montant).toBe(VALEUR_DE_LA_MISE_A_DISPOSITION);
    expect(cc.services.some((s) => s.code === "gymnase")).toBe(true);
  });

  it("le club a son bureau, ses bénévoles, ses salariés et son assemblée générale", () => {
    expect(club.bureau.map((m) => m.role)).toEqual(["présidente", "trésorier", "secrétaire"]);
    expect(club.benevoles).toBeGreaterThan(club.salaries.length);
    expect(club.assembleeGenerale.ordreDuJour.length).toBeGreaterThan(0);
  });

  it("les deux organisations sont au registre, publique et associative, et ne sont pas des entreprises jouables", () => {
    expect(ORGANISATIONS_DU_TERRITOIRE.map((o) => [o.code, o.categorie])).toEqual([
      ["haut-verdasse", "publique"],
      ["haut-verdasse-handball", "associative"],
    ]);
    for (const o of ORGANISATIONS_DU_TERRITOIRE) expect(ENTREPRISES_DU_COURS).not.toContain(o.code);
  });
});
