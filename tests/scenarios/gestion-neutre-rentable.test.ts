import { describe, expect, it } from "vitest";
import { SCENARIO_CHOICES, scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { presetByLevel } from "@/config/difficulty";
import type { BotProfile } from "@/engine/bots";
import { investissementPlafonne } from "@/engine/investment/plafond";
import type { EngineScenarioConfig } from "@/engine/types";
import { commeEnBase, partieFigee, rejouer, type PartieARejouer } from "@/pedagogy/merite/rejeu";
import { decisionDeLaGestionNeutre } from "@/pedagogy/merite/etalons";
import { GRAINES_DU_MERITE } from "@/pedagogy/merite/verdict";

/**
 * AUCUN SECTEUR NE FAIT PERDRE DE L'ARGENT À UNE GESTION NORMALE.
 *
 * C'est un jeu avant d'être un barème : un élève qui tient la gestion que le formulaire
 * lui propose, sans jamais rien tenter, ne doit pas finir dans le rouge par construction.
 * Un secteur où elle perd n'est pas un secteur exigeant, c'est un secteur mal calibré, et
 * l'examen le lit ensuite comme une sévérité qui n'est pas celle du candidat.
 *
 * La mesure se fait comme l'examen la fait, sur les trente marchés possibles et non sur
 * le seul marché joué : un secteur peut être perdant sur une graine heureuse et sain sur
 * les autres, ou l'inverse. La gestion neutre décide sur le marché joué, puis ses
 * décisions sont rejouées telles quelles, exactement comme celles d'un candidat.
 *
 * Mesuré à l'ajout de cette garde (octobre 2026) : l'hôtel était le seul des neuf à être
 * perdant, à 42 000 € près, et seul 1 marché sur 30 y était bénéficiaire. Sa structure
 * décaissée est passée de 158 000 à 140 000 € par trimestre.
 */
describe("une gestion neutre ne perd pas d'argent par construction", () => {
  const NIVEAU = 4;

  function partieNeutre(entreprise: string) {
    const def = scenarioByCode(scenarioCodeForLevel(entreprise, NIVEAU));
    const ouverts = presetByLevel.get(NIVEAU as 3)!.decisions;
    const equipes = [
      { id: "a-joueur", controller: "human" as const, botProfile: null },
      ...def.bots.slice(0, 2).map((b, i) => ({ id: `b-${i}`, controller: "bot" as const, botProfile: b.profile as string })),
    ];
    const mondes = new Map<number, EngineScenarioConfig>();
    const scenarioPour = (g: number) => {
      if (!mondes.has(g)) {
        mondes.set(
          g,
          commeEnBase(
            composerLeScenarioJoue({
              scenario: def.scenario,
              seed: g,
              variableWorld: true,
              level: NIVEAU,
              concurrents: equipes.length,
              periodicity: "quarter",
              investmentStories: true,
              leviers: ouverts,
              // Les concurrents corrigés : ceux d'une partie créée aujourd'hui.
              concurrentsAssainis: true,
            }),
          ),
        );
      }
      return mondes.get(g)!;
    };
    const etats = equipes.map((t) =>
      applyPeriodicityToCompany(
        def.company(t.id, t.id, t.controller, (t.botProfile ?? undefined) as BotProfile | undefined),
        "quarter",
        { abonnement: def.scenario.subscription !== undefined },
      ),
    );
    const base: PartieARejouer = {
      graine: 4242,
      joueur: "a-joueur",
      equipes,
      etatsInitiaux: etats,
      tours: scenarioPour(4242).roundsCount,
      scenarioPour,
      decisions: [],
      reconduits: [],
      pedagogie: [],
      investissementPlafonne: investissementPlafonne(ouverts),
      leviers: ouverts,
    };
    return partieFigee(base, (c) => decisionDeLaGestionNeutre(c, ouverts));
  }

  for (const choix of SCENARIO_CHOICES) {
    it(`${choix.code} : la gestion neutre finit dans le vert`, () => {
      const partie = partieNeutre(choix.code);
      const resultats = GRAINES_DU_MERITE.map((g) => rejouer(partie, g).joueur.resultatNetCumule);
      const moyen = resultats.reduce((s, x) => s + x, 0) / resultats.length;
      const verts = resultats.filter((x) => x > 0).length;
      expect(moyen, `${choix.code} : résultat net cumulé moyen de ${Math.round(moyen / 1000)} k€`).toBeGreaterThan(0);
      // Et pas seulement en moyenne : la majorité des marchés possibles, sans quoi le
      // secteur reste une loterie où la gestion normale perd une fois sur deux.
      expect(verts, `${choix.code} : ${verts} marchés bénéficiaires sur ${resultats.length}`).toBeGreaterThan(resultats.length / 2);
    }, 120_000);
  }
});
