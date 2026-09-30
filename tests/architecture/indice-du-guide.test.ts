import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SCENARIOS, DEFAULT_SCENARIO_CODE, scenarioByCode } from "@/config/scenarios/registry";
import { BPI_V2_DIMENSIONS, INDICE, V2_DIMENSION_LABELS, scoringWeightsV2 } from "@/scoring/bpi";

/**
 * LE TABLEAU DE L'INDICE DIT CE QUE LE MOTEUR CALCULE.
 *
 * Six intitulés et six pourcentages, écrits à la main dans le guide : exacts
 * le jour où on les a tapés, et reliés à rien. Une repondération aurait fait
 * mentir cette page en silence — aucune erreur, aucun test, juste une page
 * que personne ne relit parce qu'elle n'a pas changé. C'était la dernière
 * occurrence d'un chiffre recopié dans le dépôt.
 *
 * LA GARDE TIENT DEUX CHOSES, ET LA SECONDE EST LA PLUS IMPORTANTE.
 *
 * Que la page LISE le moteur plutôt que de le recopier.
 *
 * Et que les quinze scénarios portent bien les mêmes poids. C'est une
 * propriété des données, pas du code : les poids appartiennent à un scénario,
 * et le guide les annonce comme LA règle. Tant qu'ils sont identiques, la
 * phrase est vraie. Le jour où deux divergeraient, elle deviendrait fausse
 * sans que rien ne bouge dans le guide — c'est exactement le défaut qu'on
 * vient de retirer, en pire, parce qu'il naîtrait ailleurs.
 */

const GUIDE = readFileSync(join(process.cwd(), "src/app/guide/page.tsx"), "utf8");
const poidsDe = (code: string) => scoringWeightsV2(scenarioByCode(code).scenario.scoring);

describe("l'indice, dans le guide", () => {
  it("lit le moteur au lieu de recopier ses valeurs", () => {
    for (const lecture of ["BPI_V2_DIMENSIONS", "V2_DIMENSION_LABELS", "scoringWeightsV2", "INDICE"]) {
      expect(GUIDE, `le guide n'utilise pas ${lecture}`).toContain(lecture);
    }
    // Et plus aucun pourcentage écrit à la main dans le tableau.
    expect(GUIDE).not.toMatch(/"\d+ %"/);
  });

  it("annonce des poids que TOUS les scénarios partagent", () => {
    const reference = poidsDe(DEFAULT_SCENARIO_CODE);
    const divergents: string[] = [];
    for (const s of SCENARIOS) {
      const w = poidsDe(s.code);
      for (const d of BPI_V2_DIMENSIONS) {
        if (Math.abs(w[d] - reference[d]) > 1e-9) {
          divergents.push(`${s.code} · ${V2_DIMENSION_LABELS[d]} : ${w[d]} au lieu de ${reference[d]}`);
        }
      }
    }
    expect(
      divergents,
      `le guide annonce des poids qui ne valent pas pour tous les scénarios :\n${divergents.join("\n")}`,
    ).toEqual([]);
  });

  it("pondère cent pour cent, sur six dimensions", () => {
    const w = poidsDe(DEFAULT_SCENARIO_CODE);
    const somme = BPI_V2_DIMENSIONS.reduce((s, d) => s + w[d], 0);
    expect(Math.round(somme * 100)).toBe(100);
    // Arrondis compris : un tableau qui affiche 30, 20, 15, 20, 10 et 5 doit
    // aussi faire cent, sans quoi le lecteur additionne et ne tombe pas juste.
    expect(BPI_V2_DIMENSIONS.reduce((s, d) => s + Math.round(w[d] * 100), 0)).toBe(100);
    expect(BPI_V2_DIMENSIONS).toHaveLength(6);
  });

  it("nomme l'indice comme le produit le nomme", () => {
    // Le code et la base gardent « bpi », l'élève et l'enseignant lisent
    // « IPG » : c'est le registre qui tranche, pas la page.
    expect(GUIDE).toContain("INDICE.sigle");
    expect(INDICE.sigle).toBe("IPG");
  });
});
