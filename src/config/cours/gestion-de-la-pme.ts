import { runGame } from "../../engine/simulation/runGame";
import type { CompanyRoundResult, CompanyState, EngineScenarioConfig, RoundDecisions } from "../../engine/types";
import { scenarioByCode } from "../scenarios/registry";
import { GRAINE_DU_COURS } from "./cas";
import { decisionsDuCours, scenarioDuCours } from "./arene-du-cours";

/**
 * L'ANNÉE DE LA PME REJOUÉE AVEC UNE DÉCISION DE GESTION (parcours BTS GPME).
 *
 * Les chapitres du BTS Gestion de la PME prennent leurs chiffres dans l'arène : les offres des
 * fournisseurs, le délai de paiement des clients, l'escompte et l'affacturage, l'assurance et
 * les aléas qu'elle couvre, le budget de qualité et les rebuts, la maintenance et la
 * disponibilité de l'outil, les départs et les embauches. Tout cela est dans le scénario de
 * chaque entreprise, et le moteur le joue.
 *
 * Comme le parcours des ressources humaines (ressources-humaines.ts), l'arène rejoue l'année du
 * cours : même réglage, même graine, mêmes concurrents (`anneeJouee`), une seule chose change.
 * Ici, ce peut être n'importe quelle décision du trimestre (`change`), ou un paramètre du
 * scénario (`scenario`), quand le chapitre compare deux conditions que l'entreprise ne décide
 * pas seule, comme le délai qu'accorde un fournisseur.
 *
 * Les trimestres se comptent comme le moteur les compte, à partir de 1. Une décision absente
 * laisse le trimestre tel que la gestion équilibrée le joue. `cle` nomme la variante, pour ne la
 * jouer qu'une fois.
 */

/** La décision du trimestre, telle que la gestion équilibrée la prend : le point de départ de `change`. */
export type Changement = (tour: number, decision: RoundDecisions) => RoundDecisions | undefined;

const annees = new Map<string, CompanyRoundResult[]>();

export function rejouerAvec(
  code: string,
  cle: string,
  change: Changement,
  scenario: (s: EngineScenarioConfig) => EngineScenarioConfig = (s) => s,
): CompanyRoundResult[] {
  const k = `${code}:${cle}`;
  const deja = annees.get(k);
  if (deja) return deja;
  const def = scenarioByCode(code);
  const joue = scenario(scenarioDuCours(def.scenario, 4));
  const entreprises: CompanyState[] = [
    def.company("joueur", def.playerTeamName, "bot", "balanced"),
    ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const partie = runGame({
    scenario: joue,
    initialCompanies: entreprises,
    seed: GRAINE_DU_COURS,
    providers: decisionsDuCours(entreprises, joue, change),
  });
  const resultats = partie.rounds.map((t) => t.results["joueur"]!);
  annees.set(k, resultats);
  return resultats;
}

/** L'année du cours, sans rien changer : la référence de chaque comparaison. */
export const anneeDeReference = (code: string) => rejouerAvec(code, "reference", () => undefined);

/** Une somme sur les trimestres de l'année rejouée. */
export const surLAnnee = (annee: readonly CompanyRoundResult[], f: (r: CompanyRoundResult) => number) =>
  annee.reduce((t, r) => t + f(r), 0);
