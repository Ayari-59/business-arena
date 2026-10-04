/**
 * LA VITRINE DU SOLO PUBLIC : UNE ENTREPRISE COMPLÈTE, LES AUTRES JUSQU'À UN NIVEAU.
 *
 * Le solo public est un outil de découverte, pas le produit : le produit est la
 * classe, avec ses niveaux avancés (RH, RSE, investissement, dividende, placement)
 * et ses ateliers. Tout laisser ouvert à tout le monde ne donne aucune raison de
 * passer côté établissement ; tout fermer sauf une entreprise cache l'étendue —
 * « neuf métiers » est l'argument — et l'enseignant du BTP qui trouve son secteur
 * verrouillé repart.
 *
 * Deux étages, donc :
 *  · UNE entreprise vitrine, jouable à TOUS les niveaux : la profondeur ;
 *  · les AUTRES, jouables jusqu'à un niveau maximum : l'étendue.
 * Au-delà, un message clair — « réservé aux établissements », avec où s'adresser —,
 * jamais un bouton grisé muet.
 *
 * ÉTEINTE PAR DÉFAUT : sans réglage, tout reste ouvert, comme avant. L'administrateur
 * l'allume et l'ajuste depuis /admin, sans nouveau déploiement.
 */

/**
 * L'entreprise vitrine par défaut. Écrite ici plutôt que lue du registre : ce module est importé
 * par le formulaire (côté navigateur), et le registre des scénarios est lourd. Un test garde
 * l'égalité avec `DEFAULT_SCENARIO_CODE`.
 */
export const ENTREPRISE_VITRINE_PAR_DEFAUT = "nova";

export interface VitrineSolo {
  /** La vitrine est-elle allumée ? Éteinte : tout est ouvert. */
  active: boolean;
  /** Le code de l'entreprise jouable à tous les niveaux. */
  entrepriseOuverte: string;
  /** Le niveau maximum des autres entreprises (1 à 6). */
  niveauMaxAutres: number;
}

export const NIVEAU_MAX = 6;

export const VITRINE_SOLO_PAR_DEFAUT: VitrineSolo = {
  active: false,
  entrepriseOuverte: ENTREPRISE_VITRINE_PAR_DEFAUT,
  niveauMaxAutres: 3,
};

/** Colonne de JSON libre : une valeur absente ou hors bornes retombe sur le défaut. */
export function normaliserVitrine(brut: unknown): VitrineSolo {
  const v = (brut ?? {}) as Partial<VitrineSolo>;
  const niveau = Math.floor(Number(v.niveauMaxAutres));
  return {
    active: v.active === true,
    entrepriseOuverte:
      typeof v.entrepriseOuverte === "string" && v.entrepriseOuverte.trim() !== ""
        ? v.entrepriseOuverte.trim()
        : VITRINE_SOLO_PAR_DEFAUT.entrepriseOuverte,
    niveauMaxAutres:
      Number.isFinite(niveau) && niveau >= 1 && niveau <= NIVEAU_MAX
        ? niveau
        : VITRINE_SOLO_PAR_DEFAUT.niveauMaxAutres,
  };
}

/** Le niveau le plus haut qu'on peut jouer avec cette entreprise, en solo public. */
export function niveauMaxPour(vitrine: VitrineSolo, scenarioCode: string): number {
  if (!vitrine.active) return NIVEAU_MAX;
  return scenarioCode === vitrine.entrepriseOuverte ? NIVEAU_MAX : vitrine.niveauMaxAutres;
}

/** Ce niveau est-il fermé pour cette entreprise ? */
export function niveauReserve(vitrine: VitrineSolo, scenarioCode: string, niveau: number): boolean {
  return niveau > niveauMaxPour(vitrine, scenarioCode);
}

/** Le message qui dit pourquoi, et pour quoi s'adresser ailleurs. */
export function messageNiveauxReserves(vitrine: VitrineSolo): string {
  const premier = vitrine.niveauMaxAutres + 1;
  return premier >= NIVEAU_MAX
    ? `Le niveau ${NIVEAU_MAX} est réservé aux établissements.`
    : `Les niveaux ${premier} à ${NIVEAU_MAX} sont réservés aux établissements.`;
}
