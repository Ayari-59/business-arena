import { auCentime } from "./amortissement";
import { HEURES_D_UN_TEMPS_COMPLET } from "./equipe-de-la-boutique";
import { LA_TABLE_D_AUGUSTIN } from "./la-table-d-augustin";

/**
 * LE MONDE DU COURS : LA QUALITÉ DE VIE ET LES CONDITIONS DE TRAVAIL À LA TABLE D'AUGUSTIN (enseignement
 * spécifique de ressources humaines et communication de terminale STMG, thème 2, question 2.1, lot E).
 *
 * CE QUI VIENT DES FICHES : l'équipe du bistrot et son coût par trimestre, charges comprises
 * (la-table-d-augustin.ts) ; le temps complet mensualisé du cours, 151,67 heures (equipe-de-la-boutique.ts).
 * L'heure d'un salarié coûte donc 7 200 € ÷ (3 × 151,67 h), au centime.
 *
 * CE QUI VIENT DU DROIT (Code du travail) : la durée légale de 35 heures par semaine ; les heures
 * supplémentaires majorées de 25 % pour les 8 premières de la semaine, de 50 % au-delà, sauf accord qui
 * fixe un autre taux (au moins 10 %) ; la durée minimale d'un temps partiel, 24 heures par semaine, sauf
 * exceptions ; le repos quotidien de 11 heures consécutives ; au plus 10 heures de travail par jour et 48
 * heures par semaine ; une pause de 20 minutes dès 6 heures de travail.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LE TAUX DES HEURES SUPPLÉMENTAIRES : le bistrot applique la majoration du Code du travail (dans la
 *     restauration, la convention collective de la branche fixe ses propres taux, que le cours ne suit pas)
 *     et le coût de l'heure monte du même pourcentage ;
 *   · LA SEMAINE DE SARAH : 39 heures de travail, en service coupé, de 10 h à 15 h et de 18 h 30 à 23 h 30 ;
 *   · LE CAS : l'équipe fait 22 heures supplémentaires par semaine, sur 52 semaines ; un serveur à temps
 *     partiel de 24 heures permettrait de les reprendre et de passer deux serveurs en service continu.
 */

export const ENTREPRISES_DES_CONDITIONS_DE_TRAVAIL = [LA_TABLE_D_AUGUSTIN.code] as const;

export const DROIT_DU_TEMPS = { dureeLegale: 35, majoration: 0.25, tempsPartielMinimal: 24, reposQuotidien: 11, maximumParJour: 10, maximumParSemaine: 48 } as const;

export const SEMAINE_DE_SARAH = { heures: 39, finDuSoir: 23.5 } as const;

export const HEURES_SUPPLEMENTAIRES_DE_L_EQUIPE = { parSemaine: 22, semaines: 52 } as const;

/** Le coût d'une heure de travail au bistrot, charges comprises, au centime. */
export const COUT_HORAIRE_DE_LA_TABLE = auCentime(LA_TABLE_D_AUGUSTIN.equipe.coutParSalarieParTrimestre / (3 * HEURES_D_UN_TEMPS_COMPLET));

/** Le coût d'une heure supplémentaire, majorée. */
export const COUT_D_UNE_HEURE_SUPPLEMENTAIRE = auCentime(COUT_HORAIRE_DE_LA_TABLE * (1 + DROIT_DU_TEMPS.majoration));

/** La semaine de Sarah : ses heures supplémentaires, les heures payées et ce qu'elles coûtent. */
export function semaineDeSarah() {
  const d = DROIT_DU_TEMPS;
  const supplementaires = SEMAINE_DE_SARAH.heures - d.dureeLegale;
  const payees = auCentime(d.dureeLegale + supplementaires * (1 + d.majoration));
  return { supplementaires, payees, cout: auCentime(payees * COUT_HORAIRE_DE_LA_TABLE) };
}

/** Le coût d'une semaine en heures supplémentaires et celui d'un temps partiel minimal. */
export function heuresOuTempsPartiel(heures: number) {
  return { heures, supplementaires: auCentime(heures * COUT_D_UNE_HEURE_SUPPLEMENTAIRE), tempsPartiel: auCentime(DROIT_DU_TEMPS.tempsPartielMinimal * COUT_HORAIRE_DE_LA_TABLE) };
}

/** Le plus petit nombre d'heures supplémentaires par semaine qui coûte au moins un temps partiel. */
export function seuilDuTempsPartiel() {
  return Math.ceil((DROIT_DU_TEMPS.tempsPartielMinimal * COUT_HORAIRE_DE_LA_TABLE) / COUT_D_UNE_HEURE_SUPPLEMENTAIRE - 1e-9);
}

/** L'heure la plus tôt où Sarah peut reprendre le lendemain : sa fin de service plus le repos quotidien. */
export const repriseAuPlusTot = () => SEMAINE_DE_SARAH.finDuSoir + DROIT_DU_TEMPS.reposQuotidien - 24;

/** Le cas : une année d'heures supplémentaires, ou un temps partiel qui les reprend. */
export function supprimerLeServiceCoupe() {
  const h = HEURES_SUPPLEMENTAIRES_DE_L_EQUIPE;
  const k = heuresOuTempsPartiel(h.parSemaine);
  const supplementaires = auCentime(k.supplementaires * h.semaines);
  const tempsPartiel = auCentime(k.tempsPartiel * h.semaines);
  return { ...h, coutDUneHeure: COUT_D_UNE_HEURE_SUPPLEMENTAIRE, coutHoraire: COUT_HORAIRE_DE_LA_TABLE, heuresDuTempsPartiel: DROIT_DU_TEMPS.tempsPartielMinimal, supplementaires, tempsPartiel, ecart: auCentime(supplementaires - tempsPartiel) };
}
