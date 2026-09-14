import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SCENARIOS } from "@/config/scenarios/registry";
import { detectSituations } from "@/pedagogy/detection";
import type { CompanyRoundResult } from "@/engine/types";

/**
 * UN ÉNONCÉ QUE LES CHIFFRES DÉMENTENT N'ENSEIGNE RIEN.
 *
 * « Le paradoxe du succès » raconte un trimestre record avec la caisse dans le
 * rouge : c'est la leçon du besoin en fonds de roulement, et elle est bonne —
 * quand elle arrive au bon moment. Elle s'ouvrait au tour 4 QUELLES QUE SOIENT
 * les performances, et une équipe qui venait de perdre 108 000 € s'est vu
 * raconter son trimestre record. On n'apprend pas le paradoxe comme ça : on
 * apprend que les énoncés ne parlent pas de nous, donc qu'il est inutile de
 * lire ses résultats.
 *
 * Une situation scriptée peut désormais poser la condition que son énoncé
 * suppose (`trigger.requires`). Sans condition déclarée, rien ne change.
 */

/** Ce que la détection lit : résultat et trésorerie, rien d'autre. */
const resultat = (netIncome: number, netTreasury: number) =>
  ({
    incomeStatement: { netIncome },
    functionalBalance: { netTreasury },
    market: { bySegment: {} },
    production: { utilizationRate: 0.5 },
    balanceSheet: { cash: 0 },
  }) as unknown as CompanyRoundResult;

describe("les situations qui affirment un résultat posent leur condition", () => {
  /**
   * Les trois énoncés qui affirment « le résultat est positif, et pourtant la
   * caisse est vide ». Leur liste est écrite ici plutôt que déduite : une
   * heuristique sur le texte trouverait « dans les cartons » et « la meilleure
   * réputation » d'un concurrent, qui n'affirment rien du résultat de l'équipe.
   */
  const PARADOXES = [
    { scenario: "nova", code: "nova_t4_paradox" },
    { scenario: "nova-gamme", code: "novag_t4_paradoxe" },
    { scenario: "batiment", code: "batiment_t3_bfr" },
  ];

  for (const { scenario, code } of PARADOXES) {
    it(`${scenario} · ${code} exige un résultat positif et une caisse négative`, () => {
      const def = SCENARIOS.find((s) => s.code === scenario)!;
      const situation = def.situations.find((s) => s.code === code)!;
      expect(situation, `${code} introuvable`).toBeDefined();
      expect("round" in situation.trigger).toBe(true);
      if ("round" in situation.trigger) {
        expect(situation.trigger.requires).toBe("profitable_illiquid");
      }
    });
  }

  it("la condition ne se vérifie que dans le cas que l'énoncé décrit", () => {
    // Bénéfice ET caisse dans le rouge : le paradoxe a bien eu lieu.
    expect(detectSituations(resultat(40000, -20000), { placement: false })).toContain(
      "profitable_illiquid",
    );
    // Une perte : quoi qu'il arrive à la caisse, il n'y a pas de paradoxe.
    expect(detectSituations(resultat(-108000, -76000), { placement: false })).not.toContain(
      "profitable_illiquid",
    );
    // Un bénéfice avec la caisse pleine non plus : rien à expliquer.
    expect(detectSituations(resultat(40000, 50000), { placement: false })).not.toContain(
      "profitable_illiquid",
    );
  });

  it("le constructeur de situations refuse une condition inconnue", () => {
    // Une condition muette rouvrirait la porte qu'elle est censée fermer :
    // mieux vaut un scénario qui refuse de se charger.
    const source = readFileSync("src/config/scenarios/situation-build.ts", "utf-8");
    expect(source).toContain("Condition de déclenchement inconnue");
  });

  it("le service saute la situation dont la condition n'est pas remplie", () => {
    // Une garde de source : la faute serait de ne lire `requires` nulle part,
    // ce qui laisserait le champ déclaré et sans effet — pire que l'absence,
    // puisqu'on le croirait actif.
    const source = readFileSync("src/services/situation-instance.service.ts", "utf-8");
    expect(source).toContain("s.trigger.requires");
    expect(source).toContain("if (condition && !detected.has(condition)) continue;");
  });
});
