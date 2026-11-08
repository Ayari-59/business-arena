import { auCentime } from "./amortissement";
import { ENTREPRISES_DE_LA_DIRECTION, FICHE_DE_DIRECTION } from "./direction-de-nova";
import { APPORT_EN_CAPITAL, CONTRAT_DE_PRET, EQUIPEMENT } from "./exercice-de-nova";
import { MOIS_PAR_TRIMESTRE } from "./nova-capacite";

/**
 * LE MONDE DU COURS : L'ACTION COLLECTIVE CHEZ NOVA (management de première STMG, question 1.1, lot B).
 *
 * Avant NOVA, son fondateur montait des enceintes seul, dans un atelier de quartier : il achetait les
 * composants, montait, vendait, tenait ses comptes. NOVA est née quand il a réuni des associés, une
 * banque, une ligne de montage et quatre opérateurs autour d'un objectif commun. Ce fichier ne recopie
 * aucun chiffre de NOVA : l'apport, l'emprunt et la ligne viennent d'exercice-de-nova.ts, l'équipe et
 * le temps de montage de nova-capacite.ts (lus par direction-de-nova.ts).
 *
 * HYPOTHÈSES DU COURS (le fondateur seul, avant NOVA) :
 *   · seul, il ne monte que la moitié de ses heures de travail du mois, 75 heures : l'autre moitié
 *     part dans les achats, la vente et les comptes, qu'aucun collègue ne lui reprend ;
 *   · sans poste spécialisé ni outillage de série, une enceinte lui demande 0,4 heure (24 minutes),
 *     contre 0,25 heure sur un poste de la ligne.
 * Il monte donc 75 ÷ 0,4 = 187,5 enceintes par mois, 562 par trimestre (à l'unité inférieure), quand
 * un opérateur de la ligne en monte 600 par mois. Les mêmes 21 € de marge par enceinte.
 *
 * LE CAS DU CHAPITRE (hypothèse du cours) : le fondateur et un ami artisan, qui monte comme lui,
 * hésitent à s'associer. Ensemble, l'un monte à plein temps sur un poste de série, l'autre reprend
 * les achats, la vente et les comptes des deux.
 */

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_DE_L_ACTION_COLLECTIVE = ENTREPRISES_DE_LA_DIRECTION;

export const FONDATEUR_SEUL = { heuresDeMontageParMois: 75, heuresParEnceinte: 0.4 } as const;

const f = FICHE_DE_DIRECTION;
const auDessous = (x: number) => Math.floor(x + 1e-9);

/** Ce qu'une personne seule monte par mois et par trimestre, et ce qu'un opérateur de la ligne monte. */
export function seulOuOrganise() {
  const seulParMois = FONDATEUR_SEUL.heuresDeMontageParMois / FONDATEUR_SEUL.heuresParEnceinte;
  const seulParTrimestre = auDessous(seulParMois * MOIS_PAR_TRIMESTRE);
  const operateurParMois = f.operateurs.heuresParMois / f.operateurs.heuresParEnceinte;
  const operateurParTrimestre = operateurParMois * MOIS_PAR_TRIMESTRE;
  const equipe = Math.min(f.operateurs.nombre * operateurParTrimestre, f.ligne.capaciteParTrimestre);
  return {
    seulParMois,
    seulParTrimestre,
    operateurParMois,
    operateurParTrimestre,
    /** Combien de fois plus monte un opérateur de la ligne qu'une personne seule, au dixième. */
    rapport: Math.round((operateurParMois / seulParMois) * 10) / 10,
    operateurs: f.operateurs.nombre,
    /** Ce que l'équipe organisée monte par trimestre : la plus petite de l'équipe et de la ligne. */
    equipe,
    /** Le plus petit nombre de personnes seules qui monterait autant que l'équipe organisée. */
    artisansPourLEquipe: Math.ceil(equipe / seulParTrimestre - 1e-9),
    marge: auCentime(f.enceinte.prix - f.enceinte.coutVariable.composants - f.enceinte.coutVariable.autres),
    heuresParEnceinte: f.operateurs.heuresParEnceinte,
    heuresDeMontage: f.operateurs.heuresParMois,
  };
}

/** Les ressources financières de la création : l'apport des associés et l'emprunt, et la ligne qu'elles paient. */
export function ressourcesDeLaCreation() {
  const apport = APPORT_EN_CAPITAL.montant;
  const emprunt = CONTRAT_DE_PRET.capital;
  return {
    apport,
    emprunt,
    ligne: EQUIPEMENT.ht,
    postes: f.ligne.postes,
    operateurs: f.operateurs.nombre,
    /** La part de l'argent de départ apportée par les associés, en pour cent au dixième. */
    partDesAssocies: Math.round((apport / (apport + emprunt)) * 1000) / 10,
  };
}

/** Le cas : deux personnes, chacune seule, ou associées (l'une monte, l'autre fait le reste). */
export function deuxAteliersOuUn() {
  const s = seulOuOrganise();
  const separes = 2 * s.seulParTrimestre;
  const associes = s.operateurParTrimestre;
  const enPlus = associes - separes;
  return { separes, associes, enPlus, margeEnPlus: auCentime(enPlus * s.marge), marge: s.marge };
}
