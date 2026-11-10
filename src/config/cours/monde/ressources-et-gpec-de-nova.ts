import { auCentime } from "./amortissement";
import { coutEmployeurMensuel } from "./capacite";
import { bilanDuLycee, exerciceDe } from "./comptes-du-lycee";
import { ENTREPRISES_DE_LA_DIRECTION, FICHE_DE_DIRECTION } from "./direction-de-nova";

/**
 * LE MONDE DU COURS : LES RESSOURCES POUR PRODUIRE ET LA GPEC DE NOVA (enseignement commun de terminale
 * STMG, question 1.2, lot C ; le chapitre cite aussi le thème 1 de ressources humaines et communication).
 *
 * CE QUI VIENT DES FICHES : le bilan du 31 décembre N (comptes-du-lycee.ts : le fonds de roulement net
 * global, le besoin en fonds de roulement et la trésorerie nette) ; l'équipe de montage (nova-capacite.ts :
 * 4 opérateurs, 150 heures de montage par mois, 0,25 heure par enceinte, soit 600 enceintes par mois et
 * 7 200 par an chacun ; le coût employeur d'un opérateur, capacite.ts ; le coût d'un recrutement, 3 000 €).
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LA PRÉVISION DE N + 2 : avec un cinquième poste manuel sur la ligne, NOVA prévoit d'en monter
 *     34 200 enceintes dans l'année ;
 *   · LES DÉPARTS : un opérateur part à la retraite à la fin de N + 1 ;
 *   · LE CAS : un opérateur s'absente pour un congé de 4 mois ; un contrat à durée déterminée (CDD) de
 *     remplacement coûte le coût employeur d'un opérateur chaque mois, plus un recrutement ; une agence
 *     d'intérim facture 2 fois le salaire brut chaque mois, sans recrutement à payer.
 */

export const ENTREPRISES_DES_RESSOURCES = ENTREPRISES_DE_LA_DIRECTION;

const f = FICHE_DE_DIRECTION;

export const PREVISION_DE_N_PLUS_2 = 34_200;
export const DEPARTS_EN_RETRAITE = 1;
export const REMPLACEMENT = { mois: 4, coefficientDeLInterim: 2 } as const;

/** Ce qu'un opérateur monte dans l'année, à plein temps. */
export const enceintesParOperateurEtParAn = () => (f.operateurs.heuresParMois / f.operateurs.heuresParEnceinte) * 12;

/** Le fonds de roulement net global, le besoin en fonds de roulement et la trésorerie nette du 31 décembre N. */
export function equilibreDuBilan() {
  const b = bilanDuLycee(exerciceDe("nova"));
  return { ressourcesStables: b.ressourcesDurables, emploisStables: auCentime(b.ressourcesDurables - b.fondsDeRoulement), frng: b.fondsDeRoulement, bfr: b.besoin, tn: auCentime(b.fondsDeRoulement - b.besoin) };
}

/** La GPEC de N + 2 : les opérateurs nécessaires, ceux qui resteront, et les recrutements. */
export function gpecDeN2(operateurs?: number) {
  const parOperateur = enceintesParOperateurEtParAn();
  const besoin = Math.ceil(PREVISION_DE_N_PLUS_2 / parOperateur - 1e-9);
  const q = operateurs ?? besoin;
  const presents = f.operateurs.nombre - DEPARTS_EN_RETRAITE;
  return { parOperateur, besoin, capacite: q * parOperateur, prevision: PREVISION_DE_N_PLUS_2, effectif: f.operateurs.nombre, departs: DEPARTS_EN_RETRAITE, presents, recrutements: Math.max(0, besoin - presents) };
}

/** Le cas : remplacer un opérateur absent, en CDD ou en intérim. */
export function remplacement() {
  const r = REMPLACEMENT;
  const mensuel = coutEmployeurMensuel(f);
  const cdd = auCentime(mensuel * r.mois + f.personnel.coutDUnRecrutement);
  const interim = auCentime(f.operateurs.salaireBrutMensuel * r.coefficientDeLInterim * r.mois);
  return { mois: r.mois, mensuel, recrutement: f.personnel.coutDUnRecrutement, brut: f.operateurs.salaireBrutMensuel, coefficient: r.coefficientDeLInterim, cdd, interim, ecart: auCentime(interim - cdd) };
}
