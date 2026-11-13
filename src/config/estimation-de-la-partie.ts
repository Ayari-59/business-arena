import { DIFFICULTY_PRESETS } from "./difficulty";
import { champsOuverts, dureeDuTour, signesDeCadrage, signesDeSituation } from "./duree-du-tour";
import type { EstimationDuScenario } from "./seances";

export type { EstimationDuScenario } from "./seances";

/**
 * LA DURÉE D'UNE PARTIE, AVANT DE LA CRÉER (séance d'essai, P0-1).
 *
 * Le formulaire de création annonce, sous « Tours joués », combien de séances
 * de 55 min la partie demandera. Le calcul se fait dans le navigateur, à chaque
 * réglage changé ; le serveur lui donne, pour chaque entreprise et chaque
 * niveau, la durée du premier tour et celle d'un tour suivant, avec et sans
 * questions dans les situations. Le modèle est celui du pilotage
 * (`config/duree-du-tour.ts`), en partie de classe.
 */
type Scenario = Parameters<typeof signesDeCadrage>[0] & {
  scenario: { roundsCount: number };
  situations: Parameters<typeof signesDeSituation>[0];
};

/** Les durées de chaque niveau pour un scénario, au trimestre. */
export function estimationDuScenario(def: Scenario): EstimationDuScenario {
  const ecrits = def.scenario.roundsCount;
  const parNiveau: EstimationDuScenario["parNiveau"] = {};
  for (const preset of DIFFICULTY_PRESETS) {
    const champs = champsOuverts(preset.decisions);
    const tour = (t: number, avecQuiz: boolean) =>
      dureeDuTour({
        signesDeCadrage: signesDeCadrage(def),
        signesDeSituation: signesDeSituation(def.situations, t),
        champs,
        premierTour: t === 1,
        avecQuiz,
        enClasse: true,
      }).minutes;
    // Un tour suivant : le plus long des tours écrits, pour ne pas promettre court.
    const suivants = (avecQuiz: boolean) =>
      Math.max(...Array.from({ length: Math.max(1, Math.min(ecrits, 6) - 1) }, (_, i) => tour(i + 2, avecQuiz)));
    parNiveau[preset.level] = [tour(1, true), suivants(true), tour(1, false), suivants(false)];
  }
  return { toursEcrits: ecrits, parNiveau };
}

