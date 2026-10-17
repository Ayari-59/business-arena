import { describe, expect, it } from "vitest";
import { SCENARIO_CHOICES, scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { presetByLevel, type LeviersDuNiveau } from "@/config/difficulty";
import type { BotProfile } from "@/engine/bots";
import { investissementPlafonne } from "@/engine/investment/plafond";
import type { EngineScenarioConfig } from "@/engine/types";
import { commeEnBase, partieFigee, rejouer, type PartieARejouer } from "@/pedagogy/merite/rejeu";
import { decisionDeLaGestionNeutre, rejeuxDeLEtalon } from "@/pedagogy/merite/etalons";
import { GRAINES_DU_MERITE, marcheRejoue } from "@/pedagogy/merite/verdict";
import { GRILLE_BUSINESS_ARENA_2026, noterLaCopie, referenceDeLaGrille } from "@/config/examen/grille";

/**
 * LA NOTE JUGE LA QUALITÉ DES DÉCISIONS, PAS LA DIFFICULTÉ DU NIVEAU.
 *
 * Décision du propriétaire : un candidat de niveau 6 n'est pas noté plus sévèrement
 * parce que le jeu y est plus dur ; il est jugé sur la façon dont il a décidé avec ce
 * qu'il avait. Le niveau ouvre des leviers et durcit les concurrents, il ne pèse pas
 * dans le barème. Un écart de note entre niveaux à qualité de décisions constante n'est
 * donc pas une progression à installer : c'est une dérive à surveiller.
 *
 * LA MESURE. La même gestion, la gestion neutre du secteur, est jouée dans les neuf
 * entreprises à trois niveaux, puis notée. La moyenne des neuf secteurs par niveau doit
 * rester plate : c'est la moyenne qui compte, pas chaque cellule, parce qu'un secteur
 * change aussi de variante (gamme) d'un niveau à l'autre et que son économie bouge pour
 * des raisons qui ne sont pas le barème.
 *
 * LA BORNE, ET POURQUOI CELLE-LÀ. Elle est prise entre ce que la dérive vaut et ce que
 * vaudrait une pondération.
 *
 *   · LA DÉRIVE MESURÉE. Sur les six graines d'un lot : 1,2 point avant le gel de
 *     l'étalon, 1,1 après, et 1,9 face aux concurrents corrigés. Sur la graine unique
 *     de cette garde : 1,0 et 1,5.
 *   · LA PLUS PETITE PONDÉRATION. Un point de note par niveau, la plus légère qu'on
 *     puisse écrire, fait quatre points entre le niveau 2 et le niveau 6. Essayée ici
 *     sur les mesures du jour, elle porte l'écart à 3,0 points dans le monde de
 *     l'examen (la dérive naturelle en annule une partie) et à 5,6 face aux concurrents
 *     corrigés.
 *
 * La borne est donc posée à DEUX POINTS ET DEMI : au-dessus de la dérive la plus forte
 * jamais mesurée, et au-dessous du pire des deux cas de la pondération la plus légère.
 * Si une mesure la dépasse, ce n'est pas la borne qu'il faut élargir.
 */

const NIVEAUX = [2, 4, 6] as const;
/** Deux points et demi : au-dessus de la dérive mesurée, au-dessous de la pondération la plus légère. */
const ECART_MAXIMAL_ENTRE_NIVEAUX = 2.5;

function noteDeLaGestionNeutre(entreprise: string, niveau: number, assainis: boolean): number {
  const brut = scenarioByCode(scenarioCodeForLevel(entreprise, niveau));
  const def = assainis
    ? { ...brut, scenario: { ...brut.scenario, bots: { ...(brut.scenario.bots ?? {}), concurrentsAssainis: true } } }
    : brut;
  const ouverts: LeviersDuNiveau = presetByLevel.get(niveau as 3)!.decisions;
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
            level: niveau,
            concurrents: equipes.length,
            periodicity: "quarter",
            investmentStories: true,
            leviers: ouverts,
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
  const partie = partieFigee(base, (c) => decisionDeLaGestionNeutre(c, ouverts));
  const joueur = GRAINES_DU_MERITE.map((g) => rejouer(partie, g));
  const reference = rejeuxDeLEtalon(partie, ouverts, referenceDeLaGrille(GRILLE_BUSINESS_ARENA_2026).code);
  return noterLaCopie(
    GRILLE_BUSINESS_ARENA_2026,
    { sur: joueur[0]!.sur, joueur: joueur.map(marcheRejoue), reference: reference.map(marcheRejoue), situations: null },
    { questions: false },
  ).note;
}

const moyenne = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

describe("le niveau ne pèse pas dans la note", () => {
  for (const assainis of [false, true]) {
    it(`la même gestion est notée pareil à tous les niveaux (${assainis ? "concurrents corrigés" : "concurrents de l'examen"})`, () => {
      const parNiveau = NIVEAUX.map((n) => moyenne(SCENARIO_CHOICES.map((c) => noteDeLaGestionNeutre(c.code, n, assainis))));
      const ecart = Math.max(...parNiveau) - Math.min(...parNiveau);
      const dit = NIVEAUX.map((n, i) => `n${n} ${parNiveau[i]!.toFixed(1)}`).join(" · ");
      expect(ecart, `moyennes par niveau : ${dit}`).toBeLessThanOrEqual(ECART_MAXIMAL_ENTRE_NIVEAUX);
    }, 300_000);
  }
});
