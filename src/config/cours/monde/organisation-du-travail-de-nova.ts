import { auCentime } from "./amortissement";
import { FICHE_DE_DIRECTION } from "./direction-de-nova";
import { ENTREPRISES_DU_NUMERIQUE, jourDArret } from "./numerique-de-la-ligne";

/**
 * LE MONDE DU COURS : ORGANISER LE TRAVAIL ET COORDONNER CHEZ NOVA (enseignement commun de terminale
 * STMG, question 1.5, lot C).
 *
 * CE QUI VIENT DES FICHES : la ligne de 4 postes en série, tenue par les 4 opérateurs (nova-capacite.ts),
 * et la marge qu'un poste fait perdre en un jour d'arrêt (numerique-de-la-ligne.ts : 30 enceintes à 21 €).
 * Les postes sont en série : quand un opérateur manque et que personne ne sait tenir son poste, toute la
 * ligne s'arrête la journée.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LES ABSENCES : 24 jours d'absence imprévue dans l'année, pour toute l'équipe ;
 *   · LA POLYVALENCE : un opérateur formé à tous les postes remplace celui qui manque. Les absences se
 *     chevauchent et un polyvalent peut lui-même manquer : un premier polyvalent couvre 12 jours, un
 *     deuxième 8 de plus, un troisième les 4 qui restent, un quatrième rien de plus. Former un opérateur
 *     à tous les postes coûte 6 000 € (la formation et le temps passé à apprendre) ;
 *   · LE CAS : 30 commandes urgentes par an. Le président, seul à pouvoir les accepter, est absent une
 *     fois sur 3 ; la réponse attend alors 2 jours, et le client part une fois sur 2. Une commande urgente
 *     vaut en moyenne 40 enceintes. Déléguer la décision au chef d'équipe, avec un compte rendu chaque
 *     semaine, coûte une prime de responsabilité de 150 € par mois.
 */

export const ENTREPRISES_DE_L_ORGANISATION_DU_TRAVAIL = ENTREPRISES_DU_NUMERIQUE;

const f = FICHE_DE_DIRECTION;

export const ABSENCES_DE_L_ANNEE = 24;
export const JOURS_COUVERTS_PAR_POLYVALENT: readonly number[] = [12, 8, 4, 0];
export const FORMATION_POLYVALENTE = 6_000;

/** Ce que coûte un jour où un poste manque : toute la ligne s'arrête. */
export function jourSansOperateur() {
  const j = jourDArret();
  return { ...j, enceintesPerdues: j.parJour * f.ligne.postes, margePerdue: j.margePerdue * f.ligne.postes };
}

/** La polyvalence : k opérateurs formés à tous les postes, les jours couverts, la marge sauvée et le gain. */
export function polyvalence(k: number) {
  const couverts = JOURS_COUVERTS_PAR_POLYVALENT.slice(0, k).reduce((t, x) => t + x, 0);
  const j = jourSansOperateur();
  const marge = couverts * j.margePerdue;
  const cout = k * FORMATION_POLYVALENTE;
  return { k, couverts, nonCouverts: ABSENCES_DE_L_ANNEE - couverts, marge, cout, gain: auCentime(marge - cout) };
}

/** Le nombre de polyvalents qui rapporte le plus. */
export function polyvalentsQuiRapportentLePlus() {
  let meilleur = 0;
  for (let k = 1; k <= f.operateurs.nombre; k++) if (polyvalence(k).gain > polyvalence(meilleur).gain) meilleur = k;
  return meilleur;
}

/** Le cas : déléguer l'acceptation des commandes urgentes. */
export const COMMANDES_URGENTES = { parAn: 30, absenceDuPresident: 3, departDuClient: 2, enceintes: 40, prime: 150 } as const;

export function delegation() {
  const k = COMMANDES_URGENTES;
  const perdues = k.parAn / k.absenceDuPresident / k.departDuClient;
  const margePerdue = perdues * k.enceintes * jourDArret().marge;
  const prime = k.prime * 12;
  return { ...k, perdues, margeParCommande: k.enceintes * jourDArret().marge, margePerdue, primeDeLAnnee: prime, gain: auCentime(margePerdue - prime) };
}
