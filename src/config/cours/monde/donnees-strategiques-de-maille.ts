import { quotient2 } from "../../../pedagogy/cours/deux-decimales";
import { FICHIER_DE_MAILLE } from "./fichier-de-maille";
import { MAILLE_ET_CO } from "./maille-et-co";

/**
 * LE MONDE DU COURS : DONNÉES ET ALGORITHMES, LES RESPONSABILITÉS DU NUMÉRIQUE, CHEZ MAILLE & CO
 * (enseignement commun de terminale STMG, question 3.3, lot C).
 *
 * CE QUI VIENT DES FICHES : le fichier des clientes de la carte de fidélité (fichier-de-maille.ts :
 * 1 200 inscrites). Le chapitre de première (« Données personnelles et données ouvertes ») faisait
 * appliquer les règles du règlement général sur la protection des données ; celui-ci regarde les
 * responsabilités : la sécurité des données, les données stratégiques, les algorithmes et la chaîne de
 * blocs.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LES DONNÉES STRATÉGIQUES de la boutique : le fichier des clientes, les prix négociés avec les
 *     façonniers, les modèles de la collection d'hiver. Si l'ordinateur qui les garde tombe en panne
 *     sans sauvegarde, il faut 60 heures de travail pour les reconstituer en partie, à 30 € de l'heure
 *     charges comprises, et la campagne de la collection, qui laisse 1 800 € de marge, ne peut pas
 *     partir ;
 *   · LA SAUVEGARDE externe et chiffrée coûte 20 € par mois ;
 *   · LE CAS : la boutique a 3 ordinateurs portables. Les chiffrer coûte 6 € par poste et par mois ; une
 *     vendeuse a déjà oublié le sien dans un train (il a été retrouvé).
 */

export const ENTREPRISES_DES_DONNEES_STRATEGIQUES = [MAILLE_ET_CO.code] as const;

export const PERTE_DES_DONNEES = { heures: 60, coutHoraire: 30, campagnePerdue: 1_800 } as const;
export const SAUVEGARDE = { parMois: 20 } as const;
export const CHIFFREMENT = { postes: 3, parPosteEtParMois: 6 } as const;
/** Le délai pour signaler une violation de données à l'autorité de contrôle (la CNIL), en heures. */
export const DELAI_DE_NOTIFICATION = 72;

export const INSCRITES = FICHIER_DE_MAILLE.inscrites;

/** Ce que coûterait la perte des données stratégiques, et ce que coûte la sauvegarde de l'année. */
export function perteOuSauvegarde() {
  const p = PERTE_DES_DONNEES;
  const reconstitution = p.heures * p.coutHoraire;
  const perte = reconstitution + p.campagnePerdue;
  const sauvegarde = SAUVEGARDE.parMois * 12;
  return { ...p, reconstitution, perte, sauvegarde, rapport: quotient2(perte, sauvegarde) };
}

/** Le cas : chiffrer les ordinateurs portables. */
export function chiffrement() {
  const c = CHIFFREMENT;
  return { ...c, parAn: c.postes * c.parPosteEtParMois * 12, inscrites: INSCRITES, parCliente: Math.round(((c.postes * c.parPosteEtParMois * 12) / INSCRITES) * 100) / 100 };
}
