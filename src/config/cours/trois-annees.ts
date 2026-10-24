import { botDecisions, type BotProfile } from "../../engine/bots";
import { runGame } from "../../engine/simulation/runGame";
import type { CompanyState } from "../../engine/types";
import { scenarioByCode } from "../scenarios/registry";
import { prolongerLaPartie } from "../scenarios/rounds";
import { GRAINE_DU_COURS } from "./cas";

/**
 * TROIS ANNÉES DE L'ARÈNE, TRIMESTRE PAR TRIMESTRE : LA MATIÈRE D'UNE PRÉVISION.
 *
 * Le chapitre « Prévoir les ventes » observe deux années pour prévoir la troisième, puis
 * compare sa prévision à ce que l'arène joue vraiment. L'année du cas (`anneeJouee`) n'en a
 * qu'une : celle-ci prolonge la partie comme l'arène prolonge une partie longue
 * (`prolongerLaPartie` : la saison du métier se répète, la croissance s'arrête au dernier
 * tour écrit du scénario), avec les mêmes entreprises, la même graine et les mêmes
 * décisions que l'année du cas.
 *
 * Pour chaque trimestre : la demande que le marché a adressée à l'entreprise, et ce qu'elle
 * a vendu, que son stock ou sa capacité ont pu plafonner.
 */

export const TRIMESTRES_PAR_AN = 4;
export const ANNEES = 3;

export interface TrimestreJoue {
  annee: number;
  trimestre: number;
  demande: number;
  vendu: number;
}

const series = new Map<string, readonly TrimestreJoue[]>();

export function troisAnnees(code: string): readonly TrimestreJoue[] {
  const deja = series.get(code);
  if (deja) return deja;
  const def = scenarioByCode(code);
  const tours = ANNEES * TRIMESTRES_PAR_AN;
  const scenario = { ...prolongerLaPartie(def.scenario, tours), roundsCount: tours, impotSurLExercice: true };
  const entreprises: CompanyState[] = [
    def.company("joueur", def.playerTeamName, "bot", "balanced"),
    ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const partie = runGame({
    scenario,
    initialCompanies: entreprises,
    seed: GRAINE_DU_COURS,
    providers: Object.fromEntries(
      entreprises.map((e) => [
        e.id,
        (ctx: { state: CompanyState; roundIndex: number }) =>
          botDecisions(e.botProfile as BotProfile, { scenario, state: ctx.state, roundIndex: ctx.roundIndex }),
      ]),
    ),
  });
  const serie = partie.rounds.map((tour, k) => {
    const segments = Object.values(tour.results["joueur"]!.market.bySegment);
    return {
      annee: Math.floor(k / TRIMESTRES_PAR_AN) + 1,
      trimestre: (k % TRIMESTRES_PAR_AN) + 1,
      demande: Math.round(segments.reduce((t, s) => t + s.demandForCompany, 0)),
      vendu: Math.round(segments.reduce((t, s) => t + s.sold, 0)),
    };
  });
  series.set(code, serie);
  return serie;
}
