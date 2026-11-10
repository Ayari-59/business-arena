import { CONSULTANTS, COUT_VARIABLE_D_UNE_JOURNEE, JOURNEES_DEMANDEES, JOURNEES_VENDUES, PRIX_CATALOGUE } from "./atlas-conseil";

/**
 * LE MONDE DU COURS : LES LIENS DE TRAVAIL D'ATLAS CONSEIL (le chapitre « Qualification, compétences et
 * nouveaux liens de travail », SGN de première T1.3).
 *
 * Tout vient de la fiche du cabinet (atlas-conseil.ts) : 10 consultants salariés à 52 800 € par an
 * chacun, 60 jours facturables par trimestre, les journées demandées et vendues de N (le trimestre 4
 * plein, 80 journées refusées), le prix catalogue de 800 € et les 150 € de coût variable d'une journée.
 *
 * UNE SEULE HYPOTHÈSE DU COURS : un consultant indépendant (un travailleur non salarié, qui facture
 * ses journées au cabinet) coûte 480 € la journée, payée seulement quand il travaille. Le cabinet
 * peut aussi embaucher un onzième consultant salarié, payé toute l'année, qu'il ait des missions ou
 * non. Le prix et le coût variable d'une journée sont les mêmes, qui la fasse.
 */

export const JOURNEE_D_UN_INDEPENDANT = 480;

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

/** Ce que peut facturer l'équipe d'un trimestre : consultants × jours facturables. */
export const CAPACITE_DU_TRIMESTRE = CONSULTANTS.nombre * CONSULTANTS.joursFacturablesParTrimestre;

/** Les jours facturables d'un consultant sur l'année. */
export const JOURS_D_UN_CONSULTANT = 4 * CONSULTANTS.joursFacturablesParTrimestre;

/** Ce que laisse une journée vendue, avant de payer celui qui la fait : prix − frais et supports. */
export const MARGE_D_UNE_JOURNEE = PRIX_CATALOGUE - (COUT_VARIABLE_D_UNE_JOURNEE.fraisDeMission + COUT_VARIABLE_D_UNE_JOURNEE.supports);

/** Les indicateurs d'activité de l'équipe, trimestre par trimestre. */
export function activiteDAtlas() {
  const trimestres = JOURNEES_VENDUES.map((vendues, i) => ({
    numero: i + 1,
    demandees: JOURNEES_DEMANDEES[i]!,
    vendues,
    refusees: JOURNEES_DEMANDEES[i]! - vendues,
    occupationPct: auDixieme((vendues / CAPACITE_DU_TRIMESTRE) * 100),
  }));
  return {
    trimestres,
    capacite: CAPACITE_DU_TRIMESTRE,
    refusees: trimestres.reduce((n, t) => n + t.refusees, 0),
    /** Le coût d'une journée de consultant salarié : son coût de l'année ÷ ses jours facturables. */
    coutJournalier: auCentime(CONSULTANTS.coutAnnuel / JOURS_D_UN_CONSULTANT),
  };
}

/** Les journées par an à partir desquelles un salarié coûte moins que les mêmes journées confiées à un indépendant. */
export const JOURNEES_OU_L_EMBAUCHE_SE_PAIE = Math.ceil(CONSULTANTS.coutAnnuel / JOURNEE_D_UN_INDEPENDANT - 1e-9);

/**
 * SERVIR LES JOURNÉES REFUSÉES DU TRIMESTRE 4 : embaucher des consultants salariés pour l'année, et
 * confier des journées à des indépendants. Un salarié ajoute 60 journées au trimestre 4 et coûte toute
 * son année (les trimestres 1 à 3 avaient déjà de la place : il n'y vendrait rien de plus) ; un
 * indépendant est payé pour chaque journée retenue. Le gain est la marge des journées servies en plus,
 * moins ce qu'elles coûtent.
 */
export function servirLeTrimestre4(embauches: number, journeesDIndependants: number) {
  const refusees = JOURNEES_DEMANDEES[3]! - JOURNEES_VENDUES[3]!;
  const offertes = embauches * CONSULTANTS.joursFacturablesParTrimestre + journeesDIndependants;
  const servies = Math.min(refusees, offertes);
  const cout = auCentime(embauches * CONSULTANTS.coutAnnuel + journeesDIndependants * JOURNEE_D_UN_INDEPENDANT);
  return { refusees, offertes, servies, encoreRefusees: refusees - servies, marge: servies * MARGE_D_UNE_JOURNEE, cout, gain: auCentime(servies * MARGE_D_UNE_JOURNEE - cout) };
}

/**
 * LA CROISSANCE DE N + 1 (hypothèse du cas « Un contrat de 150 journées ») : un grand compte signe un
 * contrat de 150 journées réparties sur l'année, au prix catalogue. Les trimestres 1 à 3 ont de la
 * place, mais le cabinet veut garder ses consultants disponibles pour leurs clients habituels : il les
 * confiera à un salarié de plus, ou à des indépendants.
 */
export const CONTRAT_DE_150_JOURNEES = 150;
