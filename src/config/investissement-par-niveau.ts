import type { EngineScenarioConfig, EventDefinitionConfig, EventModifier } from "../engine/types";

/**
 * L'INVESTISSEMENT SE DÉCLENCHE, À CHAQUE NIVEAU, PAR UNE HISTOIRE.
 *
 * Le financement et l'investissement sont ouverts dès le premier niveau. Les
 * ouvrir ne suffit pas : une décision que rien n'appelle reste une case qu'on
 * laisse à zéro, et l'élève ne réfléchit à l'investissement que le jour où il
 * a déjà refusé des clients. Ce module donne à chaque niveau des événements qui
 * posent la question avant que la place ne manque.
 *
 * Cinq étapes, du plus simple au plus stratégique. Chacune est un événement du
 * moteur, scripté (un tour dit, pas de tirage) :
 *
 *   signal        un premier signe, faible, que la demande va monter ;
 *   grand_compte  la demande monte pour de bon, trois tours. Une capacité
 *                 achetée au tour du signal sert au tour suivant : le dilemme
 *                 d'investir avant d'être sûr ;
 *   taux          une fenêtre de financement : les intérêts baissent deux tours.
 *                 Emprunter pour investir coûte moins, tant qu'elle est ouverte ;
 *   concurrent    un concurrent investit : la demande se partage. Investir
 *                 devient défensif, pas seulement offensif ;
 *   retournement  l'opportunité retombe. Celui qui a tout misé sur elle garde
 *                 une capacité inemployée et un amortissement à payer.
 *
 * Les deux premières valent dès le niveau 1 : une histoire, une décision. Les
 * suivantes ajoutent un arbitrage chacune : le coût du financement (3), la
 * pression d'un concurrent (4), le risque de surinvestir (5).
 *
 * CE QUE CE MODULE NE TOUCHE PAS : le moteur. Les étapes n'emploient que des
 * modificateurs qu'il connaît (demande, taux). Leurs définitions portent une
 * probabilité NULLE, qui ne consomme aucun tirage (voir `drawEvents`) : ajouter
 * ces cartes aux scénarios ne déplace pas le hasard des parties déjà écrites.
 * Seul le calendrier, posé à la création de la partie, les fait tomber.
 */

export type EtapeDInvestissement = "signal" | "grand_compte" | "taux" | "concurrent" | "retournement";

interface EtapeDef {
  suffixe: EtapeDInvestissement;
  /** Premier niveau auquel l'étape tombe. */
  niveauMin: number;
  /** Tour auquel elle tombe (visible à l'ouverture du tour, avant la décision). */
  tour: number;
  duration: number;
  modifiers: EventModifier[];
}

export const ETAPES_D_INVESTISSEMENT: readonly EtapeDef[] = [
  { suffixe: "signal", niveauMin: 1, tour: 2, duration: 1, modifiers: [{ target: "demand", op: "mul", value: 1.08 }] },
  { suffixe: "grand_compte", niveauMin: 1, tour: 3, duration: 3, modifiers: [{ target: "demand", op: "mul", value: 1.3 }] },
  { suffixe: "taux", niveauMin: 3, tour: 2, duration: 2, modifiers: [{ target: "interest_rate", op: "mul", value: 0.6 }] },
  { suffixe: "concurrent", niveauMin: 4, tour: 4, duration: 2, modifiers: [{ target: "demand", op: "mul", value: 0.92 }] },
  { suffixe: "retournement", niveauMin: 5, tour: 5, duration: 2, modifiers: [{ target: "demand", op: "mul", value: 0.88 }] },
];

/** Le code de l'événement d'un secteur : `<préfixe>_inv_<étape>`. Le courrier porte le même. */
export const codeDeLEtape = (prefixe: string, suffixe: EtapeDInvestissement) => `${prefixe}_inv_${suffixe}`;

/**
 * Les cinq événements d'un secteur, à ajouter À LA FIN de sa liste. Probabilité
 * nulle : jamais tirés, seulement scriptés, ou posés par l'animateur.
 */
export function evenementsDInvestissement(prefixe: string): EventDefinitionConfig[] {
  return ETAPES_D_INVESTISSEMENT.map((e) => ({
    code: codeDeLEtape(prefixe, e.suffixe),
    scope: "market",
    probability: 0,
    duration: e.duration,
    modifiers: e.modifiers,
  }));
}

/** Les étapes qui tombent à ce niveau, dans l'ordre des tours. */
export function etapesDuNiveau(niveau: number): EtapeDef[] {
  return ETAPES_D_INVESTISSEMENT.filter((e) => niveau >= e.niveauMin).sort((a, b) => a.tour - b.tour);
}

/**
 * Pose le calendrier d'un niveau sur un scénario. Une étape n'est posée que si
 * le scénario en porte l'événement (un scénario de l'enseignant n'en a pas) et
 * s'il reste un tour après elle : investir au dernier tour ne sert à rien,
 * l'événement n'apprendrait que l'inutile.
 */
export function avecInvestissementParNiveau(
  scenario: EngineScenarioConfig,
  niveau: number,
): EngineScenarioConfig {
  const poses: EngineScenarioConfig["scriptedEvents"] = [];
  for (const etape of etapesDuNiveau(niveau)) {
    if (etape.tour > scenario.roundsCount - 1) continue;
    const def = scenario.events.find((e) => e.code.endsWith(`_inv_${etape.suffixe}`));
    if (!def) continue;
    const dejaPose = scenario.scriptedEvents.some(
      (s) => s.round === etape.tour && s.eventCode === def.code,
    );
    if (!dejaPose) poses.push({ round: etape.tour, eventCode: def.code });
  }
  return poses.length === 0
    ? scenario
    : { ...scenario, scriptedEvents: [...scenario.scriptedEvents, ...poses] };
}
