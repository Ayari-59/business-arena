import type { CompanyState, EngineScenarioConfig, EventInstance } from "../types";
import { simulateRound } from "../simulation";

/**
 * CE QUI DÉGÈLE RÉELLEMENT UNE ENTREPRISE DÉFAILLANTE.
 *
 * Une entreprise défaillante est à l'arrêt : ni production, ni vente, ni
 * charge. Elle ne repart que si un tour se clôt hors cessation de paiements,
 * c'est-à-dire avec un découvert revenu sous le plafond que la banque consent
 * POUR CE TOUR-LÀ. Une subvention exceptionnelle de l'animateur peut l'y
 * ramener ; encore faut-il qu'elle soit du bon montant.
 *
 * Le « manque » que l'écran calculait (trésorerie de la dernière clôture
 * moins le plafond du tour à jouer) n'y suffisait jamais, pour deux raisons
 * mesurées, qui s'additionnent au centime près :
 *
 *  · le premier tour d'arrêt creuse encore le découvert : l'entreprise y
 *    règle ce qu'elle devait sans plus rien encaisser, et le trou du tour
 *    joué n'est pas celui de la dernière clôture ;
 *  · la subvention est un produit exceptionnel, donc IMPOSÉE dès que le
 *    report déficitaire ne l'absorbe plus : une part repart en impôt.
 *
 * Plutôt que de recopier ces mécanismes dans une formule qui finirait
 * par diverger du moteur, on demande au moteur lui-même : le tour de
 * l'entreprise gelée est joué seule, sans marché (une entreprise gelée ne vend
 * rien), avec une subvention candidate, et l'on cherche la plus petite qui
 * ramène la clôture hors crise. La trésorerie de clôture croît avec la
 * subvention (l'impôt n'en reprend jamais qu'une part) : la recherche par
 * dichotomie est donc exacte.
 *
 * Le montant rendu est arrondi à la centaine d'euros supérieure : c'est celui
 * que l'équipe se voit proposer, et que l'animateur accorde d'un geste.
 *
 * `null` : l'entreprise n'est pas défaillante, le scénario ne modélise pas la
 * cessation de paiements, ou aucun montant raisonnable n'y suffit.
 */
export function subventionQuiDegele(dossier: {
  scenario: EngineScenarioConfig;
  /** L'état d'ouverture du tour à jouer. */
  state: CompanyState;
  roundIndex: number;
  /** Les événements qui joueront ce tour, tels qu'ils sont connus à l'ouverture. */
  events: EventInstance[];
}): number | null {
  const { scenario, state } = dossier;
  if (state.status !== "defaillant" || !scenario.treasury) return null;
  const premier = scenario.market.segments[0];
  const enCrise = (subvention: number): boolean => {
    const sortie = simulateRound({
      scenario,
      roundIndex: dossier.roundIndex,
      companies: [state],
      // Une entreprise gelée voit ses décisions remplacées par le moteur : ce
      // qui est saisi ici ne joue pas.
      decisions: {
        [state.id]: {
          price: premier?.refPrice ?? 0,
          productionPlan: 0,
          marketingBudget: 0,
          qualityBudget: 0,
          maintenanceBudget: 0,
        },
      },
      activeEvents: dossier.events,
      seed: 0,
      ...(subvention > 0 ? { rescueSubsidies: { [state.id]: subvention } } : {}),
      estimation: { demand: { [state.id]: {} }, orderOffer: null },
    });
    return sortie.results[state.id]?.treasury?.crisis === true;
  };

  if (!enCrise(0)) return 0;
  const PLAFOND_DE_RECHERCHE = 1e12;
  let haut = 1_000;
  while (enCrise(haut)) {
    haut *= 2;
    if (haut > PLAFOND_DE_RECHERCHE) return null;
  }
  let bas = haut / 2 < 1_000 ? 0 : haut / 2;
  // À l'euro près : au-delà, l'arrondi à la centaine absorbe tout.
  while (haut - bas > 1) {
    const milieu = Math.floor((bas + haut) / 2);
    if (enCrise(milieu)) bas = milieu;
    else haut = milieu;
  }
  return Math.ceil(haut / 100) * 100;
}
