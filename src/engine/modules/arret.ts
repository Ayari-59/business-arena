import type { CompanyState } from "../types";
import type { DecisionDeModule } from "./ouverture";

/**
 * ARRÊTER CE QUI TOURNE : LA DÉCISION D'ARRÊT, LUE À L'OUVERTURE DU TOUR.
 *
 * Un programme de R&D en cours se paie à chaque tour de travaux. L'arrêt le
 * retire de l'état AVANT tout calcul du tour : il ne coûte plus rien dès ce
 * tour, et ce qu'il a déjà coûté est perdu. Un programme achevé ne s'arrête
 * pas (rien ne court plus), ni une démarche qualité (payée une fois).
 */

type Retrait = (etat: CompanyState, id: string) => Partial<CompanyState>;

const sauf = <T>(liste: T[] | undefined, garde: (x: T) => boolean): T[] | undefined => {
  if (!liste) return liste;
  const reste = liste.filter(garde);
  return reste.length > 0 ? reste : undefined;
};

/** Ce qu'un arrêt retire de l'état, par module arrêtable. */
const RETRAITS: Partial<Record<DecisionDeModule, Retrait>> = {
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
 * Un arrêt qui vise un module retiré depuis (une partie en cours) est ignoré.
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
