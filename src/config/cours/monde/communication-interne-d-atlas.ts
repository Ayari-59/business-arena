import { auCentime } from "./amortissement";
import { ATLAS_CONSEIL, CONSULTANTS } from "./atlas-conseil";

/**
 * LE MONDE DU COURS : LA COMMUNICATION INTERNE ET LA MARQUE EMPLOYEUR D'ATLAS CONSEIL (enseignement
 * spécifique de ressources humaines et communication de terminale STMG, thème 3, question 3.3, lot E).
 *
 * CE QUI VIENT DES FICHES : les 10 consultants du cabinet, leur coût de l'année et les journées qu'ils
 * peuvent facturer (atlas-conseil.ts) ; d'où le coût d'une journée de consultant, 220 € (52 800 € ÷ 240
 * journées), celui que le cabinet retient pour mesurer ses missions.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · UNE JOURNÉE DE CONSULTANT compte 7 heures ;
 *   · L'OUTIL COLLABORATIF (un réseau social d'entreprise, un espace de documents partagés, une messagerie
 *     instantanée et la visioconférence) coûte 12 € par consultant et par mois ;
 *   · LE CAS : une réunion au cabinet prend une demi-journée à chaque consultant ; la directrice hésite
 *     entre une réunion chaque mois, ou l'outil et une réunion chaque trimestre.
 */

export const ENTREPRISES_DE_LA_COMMUNICATION_INTERNE = [ATLAS_CONSEIL.code] as const;

export const HEURES_D_UNE_JOURNEE = 7;
export const OUTIL_COLLABORATIF = { parConsultantEtParMois: 12 } as const;
export const REUNION = { partDeJournee: 0.5 } as const;

/** Le coût d'une journée de consultant : leur coût de l'année ÷ les journées qu'ils peuvent facturer. */
export const COUT_D_UNE_JOURNEE = auCentime(CONSULTANTS.coutAnnuel / (CONSULTANTS.joursFacturablesParTrimestre * 4));

/** Le coût d'une minute de consultant. */
const coutDUneMinute = () => COUT_D_UNE_JOURNEE / (HEURES_D_UNE_JOURNEE * 60);

/** Ce que valent des minutes gagnées par mois, pour un consultant. */
export const valeurDesMinutes = (minutes: number) => auCentime(minutes * coutDUneMinute());

/** Le plus petit nombre de minutes gagnées par mois qui paie l'outil, pour un consultant. */
export const minutesQuiPaientLOutil = () => Math.ceil(OUTIL_COLLABORATIF.parConsultantEtParMois / coutDUneMinute() - 1e-9);

/** Le cas : une réunion chaque mois, l'outil seul, ou l'outil et une réunion par trimestre, sur l'année. */
export function reunionOuOutil() {
  const consultants = CONSULTANTS.nombre;
  const reunion = auCentime(consultants * REUNION.partDeJournee * COUT_D_UNE_JOURNEE);
  const chaqueMois = auCentime(reunion * 12);
  const outil = auCentime(consultants * OUTIL_COLLABORATIF.parConsultantEtParMois * 12);
  const outilEtTrimestre = auCentime(outil + reunion * 4);
  return { consultants, coutDUneJournee: COUT_D_UNE_JOURNEE, partDeJournee: REUNION.partDeJournee, reunion, chaqueMois, parMois: OUTIL_COLLABORATIF.parConsultantEtParMois, outil, outilEtTrimestre, ecart: auCentime(chaqueMois - outilEtTrimestre) };
}
