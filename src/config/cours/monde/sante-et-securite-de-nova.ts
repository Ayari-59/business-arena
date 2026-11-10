import { auCentime } from "./amortissement";
import { COUT_D_UN_JOUR_D_ABSENCE } from "./cohesion-de-nova";
import { ENTREPRISES_DE_LA_DIRECTION, FICHE_DE_DIRECTION } from "./direction-de-nova";

/**
 * LE MONDE DU COURS : LA SANTÉ ET LA SÉCURITÉ AU TRAVAIL CHEZ NOVA (enseignement spécifique de ressources
 * humaines et communication de terminale STMG, thème 2, question 2.2, lot E).
 *
 * CE QUI VIENT DES FICHES : les 4 opérateurs et leurs 150 heures de montage par mois (nova-capacite.ts) ;
 * le coût d'un jour d'absence, 400 € (cohesion-de-nova.ts, celui de « Fédérer les acteurs »).
 *
 * LES INDICATEURS (les définitions de l'INRS et de l'Assurance maladie) : le taux de fréquence, les
 * accidents du travail avec arrêt pour un million d'heures travaillées ; le taux de gravité, les journées
 * perdues par ces accidents pour mille heures travaillées.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · L'ANNÉE N + 1 : un accident du travail avec arrêt (un opérateur se coupe la main en ouvrant un carton
 *     de composants), 9 jours d'arrêt ; une tendinite du poignet au poste de vissage, reconnue comme
 *     maladie professionnelle, 15 jours d'arrêt ;
 *   · LA PRÉVENTION : une visseuse ergonomique, suspendue et à réaction compensée, coûte 1 800 € par
 *     poste ; la ligne compte 2 postes de vissage, et le médecin du travail estime qu'équipés, ils
 *     éviteraient les arrêts de la tendinite.
 */

export const ENTREPRISES_DE_LA_SANTE = ENTREPRISES_DE_LA_DIRECTION;

export const ANNEE_DE_LA_SANTE = { accidentsAvecArret: 1, joursDArretDesAccidents: 9, joursDArretDeLaMaladie: 15 } as const;
export const VISSEUSE = { prix: 1_800, postes: 2 } as const;

const f = FICHE_DE_DIRECTION;

/** Les heures travaillées de l'année : 4 opérateurs, 150 heures de montage par mois, 12 mois. */
export const HEURES_TRAVAILLEES = f.operateurs.nombre * f.operateurs.heuresParMois * 12;

/** Le taux de fréquence et le taux de gravité de l'année, au dixième et au centième. */
export function indicateursDeSecurite() {
  const a = ANNEE_DE_LA_SANTE;
  const frequence = Math.round(((a.accidentsAvecArret * 1_000_000) / HEURES_TRAVAILLEES) * 10) / 10;
  const gravite = Math.round(((a.joursDArretDesAccidents * 1_000) / HEURES_TRAVAILLEES) * 100) / 100;
  return { heures: HEURES_TRAVAILLEES, frequence, gravite };
}

/** Ce que valent des jours d'absence évités, au coût d'un jour de l'équipe. */
export const valeurDesJoursEvites = (jours: number) => auCentime(jours * COUT_D_UN_JOUR_D_ABSENCE);

/** Le plus petit nombre de jours d'arrêt évités qui paie une visseuse. */
export const joursQuiPaientUneVisseuse = () => Math.ceil(VISSEUSE.prix / COUT_D_UN_JOUR_D_ABSENCE - 1e-9);

/** Le cas : équiper les postes de vissage, ce que cela coûte, ce que cela évite. */
export function equiperLesPostes() {
  const cout = auCentime(VISSEUSE.postes * VISSEUSE.prix);
  const evites = valeurDesJoursEvites(ANNEE_DE_LA_SANTE.joursDArretDeLaMaladie);
  return { postes: VISSEUSE.postes, prix: VISSEUSE.prix, cout, jours: ANNEE_DE_LA_SANTE.joursDArretDeLaMaladie, coutDUnJour: COUT_D_UN_JOUR_D_ABSENCE, evites, gain: auCentime(evites - cout) };
}

export { COUT_D_UN_JOUR_D_ABSENCE };
