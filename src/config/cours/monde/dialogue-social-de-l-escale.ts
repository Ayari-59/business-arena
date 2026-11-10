import { auCentime } from "./amortissement";
import { COUT_HORAIRE_DE_L_ESCALE } from "./equipe-de-l-escale";
import { L_ESCALE } from "./l-escale";

/**
 * LE MONDE DU COURS : LE DIALOGUE SOCIAL À L'ESCALE (enseignement spécifique de ressources humaines et
 * communication de terminale STMG, thème 3, question 3.2, lot E).
 *
 * CE QUI VIENT DES FICHES : les 14 salariés de l'hôtel (l-escale.ts) et le coût d'une heure de travail
 * (equipe-de-l-escale.ts).
 *
 * CE QUI VIENT DU DROIT (Code du travail) : le comité social et économique (CSE) est mis en place dans les
 * entreprises d'au moins 11 salariés, quand l'effectif est atteint 12 mois de suite ; de 11 à 24 salariés,
 * il compte 1 titulaire et 1 suppléant, élus pour 4 ans en principe. Le délégué syndical, la base de
 * données économiques, sociales et environnementales (BDESE) et les attributions économiques du CSE
 * viennent à partir de 50 salariés ; le bilan social, à partir de 300. Sans délégué syndical, une
 * entreprise de 11 à 49 salariés peut conclure un accord avec les élus du CSE ou un salarié mandaté par un
 * syndicat. L'hôtellerie travaille le dimanche par dérogation permanente ; la loi n'y impose pas de
 * majoration des heures du dimanche, qui se négocie.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LES DIMANCHES : l'équipe travaille 2 100 heures le dimanche dans l'année ; l'élue du CSE demande une
 *     majoration de ces heures ; la directrice dispose pour cela d'une enveloppe de 8 000 € par an, et la
 *     majoration se négocie au point près.
 */

export const ENTREPRISES_DU_DIALOGUE_SOCIAL = [L_ESCALE.code] as const;

export const SEUILS = { cse: 11, moisDeSuite: 12, delegueSyndical: 50, bdese: 50, bilanSocial: 300 } as const;
export const DIMANCHES = { heures: 2_100, enveloppe: 8_000 } as const;

/** L'effectif de l'hôtel. */
export const EFFECTIF = L_ESCALE.equipe.effectif;

/** Ce que coûte une majoration des heures du dimanche (en %), sur l'année. */
export const coutDeLaMajoration = (taux: number) => auCentime((DIMANCHES.heures * COUT_HORAIRE_DE_L_ESCALE * taux) / 100);

/** La plus haute majoration, au point près, qui tient dans l'enveloppe. */
export const majorationLaPlusHaute = () => Math.floor((DIMANCHES.enveloppe * 100) / (DIMANCHES.heures * COUT_HORAIRE_DE_L_ESCALE) + 1e-9);

/** Le cas : l'accord à la majoration retenue, par heure et sur l'année. */
export function accordDuDimanche() {
  const taux = majorationLaPlusHaute();
  return { taux, coutHoraire: COUT_HORAIRE_DE_L_ESCALE, parHeure: auCentime((COUT_HORAIRE_DE_L_ESCALE * taux) / 100), heures: DIMANCHES.heures, annee: coutDeLaMajoration(taux), enveloppe: DIMANCHES.enveloppe };
}
