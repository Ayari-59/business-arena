import { auCentime } from "./amortissement";
import { ENTREPRISES_DE_LA_DIRECTION, FICHE_DE_DIRECTION } from "./direction-de-nova";

/**
 * LE MONDE DU COURS : DÉVELOPPER LES COMPÉTENCES DE NOVA (enseignement spécifique de ressources humaines et
 * communication de terminale STMG, thème 1, question 1.3, lot E).
 *
 * CE QUI VIENT DES FICHES : les 4 opérateurs de montage (nova-capacite.ts).
 *
 * CE QUI VIENT DU DROIT (Code du travail, art. R6323-1, vérifié sur service-public.fr en novembre 2026) :
 * le compte personnel de formation d'un salarié qui travaille au moins à mi-temps est crédité de 500 €
 * par an, dans la limite de 5 000 € (les montants sont plus élevés pour un salarié peu qualifié, que le
 * chapitre ne traite pas). À mettre à jour si le décret change.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · MEHDI, opérateur de NOVA, veut devenir technicien de maintenance : la certification coûte 3 200 € ;
 *     son compte porte déjà 1 200 €, acquis dans ses emplois précédents ;
 *   · LE NOUVEAU POSTE DE SOUDURE : les 4 opérateurs doivent être formés au nouveau poste. Une journée en
 *     présentiel chez le fabricant coûte 900 € par opérateur, le parcours en e-learning avec un tuteur
 *     300 € ; le plan de développement des compétences y consacre 2 400 €, et les 2 opérateurs qui
 *     deviendront référents du poste doivent le manipuler avec le formateur, en présentiel.
 */

export const ENTREPRISES_DES_COMPETENCES = ENTREPRISES_DE_LA_DIRECTION;

/** Le droit : ce que le compte reçoit chaque année, et son plafond. */
export const CPF = { parAn: 500, plafond: 5_000 } as const;

export const PROJET_DE_MEHDI = { prenom: "Mehdi", certification: 3_200, dejaAcquis: 1_200 } as const;

export const FORMATION_AU_POSTE = { presentiel: 900, eLearning: 300, budget: 2_400, referents: 2 } as const;

/** Les opérateurs à former : toute l'équipe de montage. */
export const OPERATEURS_A_FORMER = FICHE_DE_DIRECTION.operateurs.nombre;

/** Le compte de Mehdi après un nombre d'années de travail, dans la limite du plafond. */
export const compteApres = (annees: number) => Math.min(CPF.plafond, PROJET_DE_MEHDI.dejaAcquis + CPF.parAn * annees);

/** Le plus petit nombre d'années après lequel le compte paie la certification. */
export function anneesPourLaCertification() {
  const p = PROJET_DE_MEHDI;
  return Math.ceil((p.certification - p.dejaAcquis) / CPF.parAn - 1e-9);
}

/** Le plan : former en présentiel et en e-learning, ce que cela coûte, et si le défi est tenu. */
export function formationDuPoste(presentiel: number, eLearning: number) {
  const f = FORMATION_AU_POSTE;
  const cout = auCentime(presentiel * f.presentiel + eLearning * f.eLearning);
  const formes = presentiel + eLearning;
  return { presentiel, eLearning, formes, cout, reste: auCentime(f.budget - cout), tenu: formes === OPERATEURS_A_FORMER && presentiel >= f.referents && cout <= f.budget };
}

/** La seule répartition qui forme toute l'équipe dans le budget, avec les référents en présentiel. */
export function repartitionDuPlan() {
  for (let p = 0; p <= OPERATEURS_A_FORMER; p++) for (let e = 0; e <= OPERATEURS_A_FORMER; e++) if (formationDuPoste(p, e).tenu) return { presentiel: p, eLearning: e };
  return { presentiel: 0, eLearning: 0 };
}

/** Le cas : ce qui manque au compte de Mehdi, et ce que NOVA abonderait. */
export function projetDeMehdi() {
  const p = PROJET_DE_MEHDI;
  return { ...p, manque: auCentime(p.certification - p.dejaAcquis), annees: anneesPourLaCertification(), parAn: CPF.parAn };
}
