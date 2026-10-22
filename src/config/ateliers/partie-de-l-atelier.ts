import type { AtelierDefinition } from "./types";
import { scenarioByCode, type ScenarioDefinition } from "../scenarios/registry";
import { composerLeScenarioJoue, CORRECTIFS_DES_PARTIES_NOUVELLES } from "../scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "../scenarios/periodicity";

/**
 * LA PARTIE QUE L'ATELIER CRÉERA, vue avant qu'elle n'existe.
 *
 * Les dossiers et les outils d'un atelier (dossier de l'élève, dossiers des
 * responsables, tableau de bord, cockpit) se lisaient tous sur le scénario du
 * registre, écrit au trimestre. Pour un atelier au trimestre, c'est exactement la
 * partie : rien ne change, et cette fonction rend le registre lui même, le même
 * objet, pour que ce qui s'affiche ne bouge pas d'un octet.
 *
 * Pour un atelier à une autre durée de tour, le registre n'est pas la partie. Au
 * mois sur le calendrier (`calendrier-mensuel.ts`), le bistrot de l'atelier MCO
 * sert le tiers des couverts d'un trimestre, mois par mois de juin à novembre,
 * quand le registre annonce ceux d'un trimestre et un pic au quatrième tour. Le
 * dossier se compose donc ici comme la création composera la partie
 * (`createGameCore`) : le même
 * `composerLeScenarioJoue`, avec la durée de tour, le mois de départ, le niveau, le
 * nombre de tours et la classe de l'atelier (équipes et concurrents simulés, qui
 * dimensionnent le marché) ; et l'état de départ de chaque entreprise redimensionné
 * comme la création le fait (`applyPeriodicityToCompany`).
 *
 * Ce qui ne se prévoit pas avant la partie reste fixé : le monde variable est
 * pris décoché (une graine tirée à la création ne se connaît pas d'avance), et
 * les histoires d'investissement cochées, comme le formulaire les propose. Ni
 * l'un ni l'autre ne change un chiffre des dossiers.
 */
const GRAINE_DES_DOSSIERS = 1;

export function partieDeLAtelier(atelier: Pick<AtelierDefinition, "reglages">): ScenarioDefinition {
  const r = atelier.reglages;
  const definition = scenarioByCode(r.scenarioCode);
  if (r.periodicite === "quarter") return definition;
  const scenario = composerLeScenarioJoue({
    scenario: definition.scenario,
    seed: GRAINE_DES_DOSSIERS,
    variableWorld: false,
    level: r.niveau,
    concurrents: r.equipes + r.bots,
    roundsCount: r.tours,
    periodicity: r.periodicite,
    // Toute partie au mois naît sur le calendrier, en janvier sans autre choix.
    moisDeDepart: r.periodicite === "month" ? (r.moisDeDepart ?? 1) : undefined,
    investmentStories: true,
    ...CORRECTIFS_DES_PARTIES_NOUVELLES,
  });
  // Quand l'unité vendue est une période, la capacité d'accueil est un stock de
  // places et ne suit pas la durée du tour (comme à la création).
  const abonnement = definition.scenario.subscription !== undefined;
  return {
    ...definition,
    scenario,
    company: (...args: Parameters<ScenarioDefinition["company"]>) =>
      applyPeriodicityToCompany(definition.company(...args), r.periodicite, { abonnement }),
  };
}

