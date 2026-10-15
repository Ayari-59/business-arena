import type { CompanyState } from "../types";
import type { DecisionDeModule } from "./ouverture";

/**
 * ARRÊTER CE QUI TOURNE : LA DÉCISION D'ARRÊT, LUE À L'OUVERTURE DU TOUR.
 *
 * Une stratégie de prix, une action RSE, un plan de crise, un marché à
 * l'export, une politique RH, une action de marque, un partenariat… une fois
 * lancés, couraient jusqu'à leur terme ou jusqu'à la fin de la partie. L'arrêt
 * les retire de l'état AVANT tout calcul du tour : ils ne coûtent plus rien et
 * ne font plus rien dès ce tour.
 *
 * Rien n'est remboursé : le droit d'entrée d'un partenariat, l'investissement
 * d'entrée sur un marché, ce qu'a coûté un projet digital, une innovation ou
 * un programme R&D encore en cours sont perdus. Un projet digital achevé peut
 * s'arrêter aussi : sa maintenance cesse, son effet avec.
 *
 * Ne s'arrêtent pas : les démarches qualité et les actions d'hygiène et
 * sécurité (payées une fois, sans coût qui court), une innovation déjà lancée
 * (rien ne court plus), un contrat fournisseur (un engagement de volume se
 * tient jusqu'à son terme) et un emprunt (il se rembourse, par anticipation
 * s'il le faut).
 */

type Retrait = (etat: CompanyState, id: string) => Partial<CompanyState>;

const sauf = <T>(liste: T[] | undefined, garde: (x: T) => boolean): T[] | undefined => {
  if (!liste) return liste;
  const reste = liste.filter(garde);
  return reste.length > 0 ? reste : undefined;
};

/** Ce qu'un arrêt retire de l'état, par module arrêtable. */
const RETRAITS: Partial<Record<DecisionDeModule, Retrait>> = {
  activePricingStrategyIds: (e, id) => ({ activePricingStrategies: sauf(e.activePricingStrategies, (x) => x !== id) }),
  activeRseActionIds: (e, id) => ({ activeRseActions: sauf(e.activeRseActions, (x) => x.id !== id) }),
  activeCrisisPlanIds: (e, id) => ({ activeCrisisPlans: sauf(e.activeCrisisPlans, (x) => x !== id) }),
  enteredMarketIds: (e, id) => ({ activeInternationalMarkets: sauf(e.activeInternationalMarkets, (x) => x.id !== id) }),
  activeHRPolicyIds: (e, id) => ({ activeHRPolicies: sauf(e.activeHRPolicies, (x) => x.id !== id) }),
  activeBrandActionIds: (e, id) => ({ activeBrandActions: sauf(e.activeBrandActions, (x) => x.id !== id) }),
  activatePartnershipIds: (e, id) => ({ activePartnerships: sauf(e.activePartnerships, (x) => x.id !== id) }),
  activeCapacityOptionIds: (e, id) => ({ activeCapacityOptions: sauf(e.activeCapacityOptions, (x) => x.id !== id) }),
  activeCommercialActionIds: (e, id) => ({
    activeCommercialActions: sauf(e.activeCommercialActions, (x) => x.id !== id),
  }),
  trainingEnrollments: (e, id) => ({
    activeTrainingPrograms: sauf(e.activeTrainingPrograms, (x) => x.programId !== id),
  }),
  startDigitalProjectIds: (e, id) => ({
    digitalProjectsInProgress: sauf(e.digitalProjectsInProgress, (x) => x.id !== id),
    completedDigitalProjects: sauf(e.completedDigitalProjects, (x) => x !== id),
  }),
  startedInnovationIds: (e, id) => ({ innovationsInDev: sauf(e.innovationsInDev, (x) => x.id !== id) }),
  startedRdActionIds: (e, id) => ({ rdActionsInProgress: sauf(e.rdActionsInProgress, (x) => x.id !== id) }),
};

/** Les modules dont un élément en cours peut s'arrêter. */
export const MODULES_ARRETABLES = Object.keys(RETRAITS) as DecisionDeModule[];

export function moduleArretable(module: string): module is DecisionDeModule {
  return (MODULES_ARRETABLES as string[]).includes(module);
}

/**
 * L'état d'ouverture, les arrêts du tour retirés. Sans arrêt, l'état est rendu
 * TEL QUEL (même objet) : une partie qui n'arrête rien suit le chemin d'avant.
 */
export function retirerLesArrets(
  etat: CompanyState,
  arrets: { module: string; id: string }[] | undefined,
): CompanyState {
  if (!arrets || arrets.length === 0) return etat;
  let suivant: CompanyState = etat;
  for (const a of arrets) {
    if (!moduleArretable(a.module)) continue;
    const retrait = RETRAITS[a.module]!;
    const champs = retrait(suivant, a.id);
    // Un retrait qui ne change rien (élément absent) laisse l'état intact.
    const change = Object.entries(champs).some(
      ([k, v]) => JSON.stringify(v) !== JSON.stringify((suivant as unknown as Record<string, unknown>)[k]),
    );
    if (change) suivant = { ...suivant, ...champs };
  }
  return suivant;
}
