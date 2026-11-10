/**
 * LE NOMBRE DE CAS DÉDIÉS DU COURS (config/cours/situations, CAS_PAR_CHAPITRE), écrit une fois.
 *
 * Plusieurs gardes vérifient qu'une activité (un bureau, un scénario, une enquête) n'entre pas dans
 * les cas dédiés : le compte ne bouge que lorsqu'un chapitre arrive avec son cas. Chaque lot ajoute
 * ici les siens, sur sa ligne, au lieu de réécrire le nombre dans chaque garde.
 */
export const NOMBRE_DE_CAS_DEDIES =
  197 +
  // lot A STMG : les cas des chapitres de sciences de gestion et numérique de première.
  11 +
  // lot B STMG : les cas des chapitres de management de première.
  7 +
  // lot C STMG : les cas des chapitres de la partie commune de terminale et de la gestion et finance.
  14 +
  // lot D STMG : les cas des chapitres de mercatique de terminale.
  8 +
  // lot E STMG : les cas des chapitres de ressources humaines et communication de terminale.
  9 +
  // lot F STMG : les cas des chapitres de systèmes d'information de gestion de terminale.
  9;
