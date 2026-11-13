import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { phraseDuRang, pourquoiCeRang, raisonsDuRang } from "@/scoring/pourquoi-ce-rang";
import { scoringWeightsByName } from "@/scoring/bpi";
import { novaScenario } from "@/config/scenarios/nova";

/**
 * POURQUOI CE RANG (séance d'essai, P1-6). Le mur dit, sous chaque équipe, les
 * deux composantes de l'IPG qui ont le plus pesé sur son rang, en mots
 * simples, sans toucher aux poids.
 */
const poids = scoringWeightsByName(novaScenario.scoring);

const equipe = (teamId: string, d: Partial<Record<string, number>>, defaillant = false) => ({
  teamId,
  defaillant,
  dimensions: { economic: 50, financial: 20, commercial: 50, rse: 50, pilotage: 50, decision_mastery: 50, ...d } as Record<string, number>,
});

describe("pourquoi ce rang", () => {
  const classe = [
    equipe("a", { commercial: 80, decision_mastery: 90 }),
    equipe("b", { commercial: 30, decision_mastery: 20 }),
    equipe("c", {}),
  ];

  it("retient les composantes qui s'écartent le plus de la classe, pondérées", () => {
    const r = raisonsDuRang(classe, poids);
    expect(r.get("a")!.map((x) => x.composante).sort()).toEqual(["commercial", "decision_mastery"]);
    expect(r.get("a")!.every((x) => x.ecart > 0)).toBe(true);
    expect(r.get("b")!.every((x) => x.ecart < 0)).toBe(true);
  });

  it("une composante où toutes les équipes se valent n'explique aucun rang", () => {
    const r = raisonsDuRang(classe, poids);
    for (const raisons of r.values()) {
      expect(raisons.map((x) => x.composante)).not.toContain("financial");
    }
  });

  it("parle en mots simples", () => {
    const phrases = pourquoiCeRang(classe, poids);
    expect(phrases.get("a")).toMatch(/^Points forts : les (ventes|analyses de situations) et les (ventes|analyses de situations)$/);
    expect(phrases.get("b")).toMatch(/^Points faibles : /);
    expect(phrases.get("c")).toMatch(/points? forts?|points? faibles?|Dans la moyenne/i);
    for (const p of phrases.values()) expect(p).not.toMatch(/IPG|BPI|economic|commercial|decision_mastery/);
  });

  it("mêle point fort et point faible quand il le faut", () => {
    expect(
      phraseDuRang(
        [
          { composante: "commercial", ecart: 3 },
          { composante: "decision_mastery", ecart: -2 },
        ],
        false,
      ),
    ).toBe("Point fort : les ventes · point faible : les analyses de situations");
  });

  it("dit qu'une entreprise défaillante est à l'arrêt", () => {
    expect(phraseDuRang([], true)).toBe("À l'arrêt : cessation de paiements");
  });

  it("ne change pas les poids de l'indice", () => {
    const source = readFileSync(join(process.cwd(), "src/scoring/pourquoi-ce-rang.ts"), "utf8");
    expect(source).not.toMatch(/weights\s*[.[]/);
  });
});
