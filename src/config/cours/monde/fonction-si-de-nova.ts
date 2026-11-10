import { auCentime } from "./amortissement";
import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { PGI_EN_NUAGE, PGI_POUR_TOUTE_L_EQUIPE } from "./processus-de-commande";
import { PLAN_DE_SAUVEGARDE } from "./securite-du-si-de-nova";

/**
 * LE MONDE DU COURS : LA FONCTION SYSTÈME D'INFORMATION DE NOVA (enseignement spécifique de systèmes
 * d'information de gestion de terminale STMG, thème 2, question 2.1, lot F).
 *
 * CE QUI VIENT DES FICHES : les 6 postes de toute l'équipe et le PGI en nuage à 75 € par poste et par
 * mois, pris pour 4 postes (processus-de-commande.ts) ; le plan de sauvegarde et de reprise du site, à
 * 3 000 € par an (securite-du-si-de-nova.ts).
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · AUJOURD'HUI, le président s'occupe lui-même de l'informatique, le soir ;
 *   · L'INFOGÉRANCE : un prestataire prend en charge les postes (installation, mises à jour, assistance,
 *     surveillance) pour 85 € par poste et par mois. Son contrat promet un site disponible 99,5 % du
 *     temps et 90 % des incidents résolus en moins de 4 heures ;
 *   · UN TECHNICIEN À MI-TEMPS, salarié de NOVA, coûterait 1 700 € par mois, charges comprises ;
 *   · LE MATÉRIEL : un ordinateur coûte 900 € et sert 3 ans ; la formation de l'année coûte 600 € ;
 *   · LE TABLEAU DE BORD DE MARS : 3,6 heures d'arrêt du site sur 30 jours ; 12 incidents, résolus en 30
 *     heures au total, dont 10 en moins de 4 heures ;
 *   · LE CAS : le prestataire passe à 110 € par poste et par mois, et NOVA aura 8 postes.
 */

export const ENTREPRISES_DE_LA_FONCTION_SI = ENTREPRISES_DE_LA_DIRECTION;

export const POSTES_DE_NOVA = PGI_POUR_TOUTE_L_EQUIPE.postes;
export const INFOGERANCE = { parPosteEtParMois: 85, disponibilitePromisePct: 99.5, partResolueEn4HeuresPct: 90 } as const;
export const TECHNICIEN_A_MI_TEMPS = { parMois: 1_700 } as const;
export const MATERIEL = { prixDUnPoste: 900, duree: 3 } as const;
export const FORMATION_DE_L_ANNEE = 600;
export const MARS = { jours: 30, heuresDArret: 3.6, incidents: 12, heuresDeResolution: 30, resolusEnMoinsDe4Heures: 10 } as const;
export const NOUVELLE_OFFRE = { parPosteEtParMois: 110, postes: 8 } as const;

/** Ce que coûte l'infogérance de n postes, par mois. */
export const infogeranceDe = (postes: number) => auCentime(postes * INFOGERANCE.parPosteEtParMois);

/** Le plus grand nombre de postes où l'infogérance coûte moins qu'un technicien à mi-temps (ou autant). */
export const postesOuLInfogeranceCouteMoins = () => Math.floor(TECHNICIEN_A_MI_TEMPS.parMois / INFOGERANCE.parPosteEtParMois + 1e-9);

/** Le budget du système d'information de l'année, ligne par ligne. */
export function budgetDuSi() {
  const materiel = auCentime((POSTES_DE_NOVA * MATERIEL.prixDUnPoste) / MATERIEL.duree);
  const pgi = auCentime(PGI_EN_NUAGE.parPosteEtParMois * PGI_EN_NUAGE.postes * 12);
  const infogerance = auCentime(infogeranceDe(POSTES_DE_NOVA) * 12);
  const hebergement = PLAN_DE_SAUVEGARDE.parAn;
  const formation = FORMATION_DE_L_ANNEE;
  const total = auCentime(materiel + pgi + infogerance + hebergement + formation);
  return { postes: POSTES_DE_NOVA, materiel, pgi, infogerance, hebergement, formation, total, parPoste: auCentime(total / POSTES_DE_NOVA) };
}

/** Les indicateurs du tableau de bord de mars, au dixième. */
export function tableauDeBordDeMars() {
  const heures = MARS.jours * 24;
  const disponibilitePct = Math.round(((heures - MARS.heuresDArret) / heures) * 1_000) / 10;
  const delaiMoyen = Math.round((MARS.heuresDeResolution / MARS.incidents) * 10) / 10;
  const partEn4HeuresPct = Math.round((MARS.resolusEnMoinsDe4Heures / MARS.incidents) * 1_000) / 10;
  return { heures, disponibilitePct, delaiMoyen, partEn4HeuresPct };
}

/** Le cas : la nouvelle offre du prestataire, face au technicien, sur l'année. */
export function renouvelerLInfogerance() {
  const o = NOUVELLE_OFFRE;
  const offre = auCentime(o.postes * o.parPosteEtParMois * 12);
  const technicien = auCentime(TECHNICIEN_A_MI_TEMPS.parMois * 12);
  return { ...o, offre, technicien, ecart: auCentime(technicien - offre), partEn4HeuresPct: tableauDeBordDeMars().partEn4HeuresPct, promise: INFOGERANCE.partResolueEn4HeuresPct };
}
