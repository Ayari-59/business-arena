import { runGame } from "../../engine/simulation/runGame";
import type { CompanyState } from "../../engine/types";
import { scenarioByCode } from "../scenarios/registry";
import { GRAINE_DU_COURS, decisionsDuCours, scenarioDuCours } from "./arene-du-cours";

/**
 * L'ANNÉE DU COURS JOUÉE PAR L'ARÈNE : les quatre trimestres d'une entreprise, joués une fois par
 * le moteur dans le réglage du cours (arene-du-cours.ts), face aux deux premiers concurrents du
 * scénario. Seuls les chapitres qui ne sont pas encore passés sur le monde du cours la lisent ; le
 * cas de chaque entreprise (cas.ts) n'en dépend plus.
 */

/** Les trimestres de l'année du cours. */
const TRIMESTRES_DE_L_ANNEE = 4;

const annees = new Map<string, { partie: ReturnType<typeof runGame>; depart: CompanyState }>();

/** Les quatre trimestres de l'arène, joués une fois par entreprise, dans le réglage du cours. */
export function anneeJouee(code: string) {
  const deja = annees.get(code);
  if (deja) return deja;
  const def = scenarioByCode(code);
  // L'année de l'arène telle qu'une partie créée aujourd'hui la joue (arene-du-cours.ts).
  const scenario = scenarioDuCours(def.scenario, TRIMESTRES_DE_L_ANNEE);
  const entreprises: CompanyState[] = [
    def.company("joueur", def.playerTeamName, "bot", "balanced"),
    ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const partie = runGame({
    scenario,
    initialCompanies: entreprises,
    seed: GRAINE_DU_COURS,
    providers: decisionsDuCours(entreprises, scenario),
  });
  const jouee = { partie, depart: entreprises[0]! };
  annees.set(code, jouee);
  return jouee;
}
