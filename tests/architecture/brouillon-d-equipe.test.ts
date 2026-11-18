import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { champDeLaFeuille } from "@/config/brouillon-d-equipe";

/**
 * LE BROUILLON D'ÉQUIPE N'ENREGISTRE QUE LES CHAMPS DE LA FEUILLE (`config/brouillon-d-equipe.ts`).
 *
 * Le serveur écarte tout champ qu'il ne connaît pas, comme la validation écarte ce que le
 * schéma ne connaît pas. La liste doit donc suivre la feuille : un champ ajouté à la feuille
 * et oublié ici ne s'enregistrerait plus pour l'équipe, sans bruit. Cette garde lit les noms
 * littéraux de la feuille et de ses îlots, et les passe un à un.
 */

const SOURCES = [
  "src/components/decision-form.tsx",
  "src/components/modules-de-decision.tsx",
  "src/components/decisions-du-groupe.tsx",
];

const noms = SOURCES.flatMap((f) =>
  [...readFileSync(join(process.cwd(), f), "utf8").matchAll(/\bname(?:=|: )"([A-Za-z0-9_.-]+)"/g)].map((m) => m[1]!),
);

describe("le brouillon d'équipe connaît chaque champ de la feuille", () => {
  it("la feuille porte bien des champs nommés", () => {
    expect(noms.length).toBeGreaterThan(30);
  });

  it("chaque nom littéral de la feuille s'enregistre", () => {
    const oublies = [...new Set(noms)].filter((n) => !champDeLaFeuille(n));
    expect(oublies, "champs de la feuille que le brouillon écarterait").toEqual([]);
  });

  it("les champs nommés par référence, module, machine ou filiale s'enregistrent", () => {
    for (const n of [
      "product.bonnet.price",
      "ventesEstimees.bonnet",
      "module.qualityActions.iso",
      "module.arret.qualityActions.iso",
      "equipmentBuy.presse",
      "sousTraitance.bonnet",
      "reseauEtranger.filiale.bonnet",
      "fabricationEtrangere.filiale.bonnet",
    ]) {
      expect(champDeLaFeuille(n), n).toBe(true);
    }
  });

  it("le reste ne s'enregistre pas", () => {
    for (const n of ["teamId", "seed", "gameId", "product.", "product.<script>", "", "x".repeat(200)]) {
      expect(champDeLaFeuille(n), n).toBe(false);
    }
  });
});
