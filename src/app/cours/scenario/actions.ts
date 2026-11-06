"use server";

import { scenarioParCode } from "@/config/cours/scenarios";
import { corrigerAuScenario, type RetourDuScenario } from "@/pedagogy/cours/scenario-servi";
import { chapitreOuvert } from "../acces";

/**
 * UN CHOIX DANS UN SCÉNARIO, CALCULÉ AU SERVEUR (pedagogy/cours/scenario-servi.ts).
 *
 * Comme au bureau (../bureau/actions.ts) : une action serveur est une adresse que n'importe qui peut
 * appeler ; l'accès se contrôle ici, à chaque choix, comme la page le contrôle à l'affichage (../acces.ts,
 * les droits d'un cas pratique du chapitre que le scénario reprend). L'envoi est lu comme inconnu, borné,
 * puis calculé ; le retour ne porte que la conséquence de ce choix et ce qui vient après.
 */
export async function corrigerAuScenarioAction(code: unknown, envoi: unknown): Promise<RetourDuScenario> {
  const scenario = typeof code === "string" ? scenarioParCode(code) : undefined;
  if (!scenario) return { refus: "scenario" };
  if (!(await chapitreOuvert(scenario))) return { refus: "licence" };
  return corrigerAuScenario(scenario, envoi);
}
