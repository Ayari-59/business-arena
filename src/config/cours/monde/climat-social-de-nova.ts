import { auCentime } from "./amortissement";
import { margeUnitaire } from "./capacite";
import { ENTREPRISES_DE_LA_DIRECTION, FICHE_DE_DIRECTION } from "./direction-de-nova";
import { HEURES_LEGALES_PAR_MOIS, TAUX_PATRONAL, remunerationDeNPlus1 } from "./ressources-humaines-de-nova";
import { HAUSSE_DEMANDEE } from "../situations/par-chapitre/l-equipe-demande-une-augmentation";

/**
 * LE MONDE DU COURS : LE CLIMAT SOCIAL ET LE CONFLIT CHEZ NOVA (enseignement spécifique de ressources
 * humaines et communication de terminale STMG, thème 3, question 3.1, lot E).
 *
 * CE QUI VIENT DES FICHES : les 4 opérateurs, leur salaire brut, 0,25 heure de montage par enceinte et la
 * marge d'une enceinte (nova-capacite.ts, capacite.ts) ; la durée légale mensualisée et le taux des
 * cotisations patronales (ressources-humaines-de-nova.ts) ; la hausse de 10 % que les opérateurs demandent
 * en janvier de N + 1, et son coût sur l'année (le cas « L'équipe demande une augmentation »).
 *
 * CE QUI VIENT DU DROIT : un jour de grève n'est pas payé, la retenue étant proportionnelle au temps
 * d'arrêt ; l'employeur ne peut ni sanctionner un gréviste (sauf faute lourde) ni le remplacer par un
 * salarié en CDD ou en intérim.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LE CONFLIT : le président refuse la hausse ; en décembre, les 4 opérateurs cessent le travail. Une
 *     journée compte 7 heures ; en décembre, la ligne est pleine, et chaque enceinte non montée est une
 *     vente perdue ;
 *   · LE CAS : après 2 jours de grève, le président propose 5 % de hausse et un accord d'intéressement.
 */

export const ENTREPRISES_DU_CLIMAT_SOCIAL = ENTREPRISES_DE_LA_DIRECTION;

export const JOURNEE = { heures: 7 } as const;
export const COMPROMIS = { joursDeGreve: 2, hausse: 0.05 } as const;

const f = FICHE_DE_DIRECTION;

/** La hausse revendiquée, par mois et par opérateur, et son coût sur l'année. */
export function revendication() {
  const augmentation = auCentime(f.operateurs.salaireBrutMensuel * HAUSSE_DEMANDEE);
  return { taux: HAUSSE_DEMANDEE * 100, augmentation, coutDeLAnnee: remunerationDeNPlus1(augmentation).coutDeLAugmentation };
}

/** Une journée de grève de toute l'équipe : la marge perdue, les salaires non versés, et le coût net. */
export function journeeDeGreve() {
  const operateurs = f.operateurs.nombre;
  const enceintes = operateurs * (JOURNEE.heures / f.operateurs.heuresParEnceinte);
  const marge = auCentime(enceintes * margeUnitaire(f));
  const retenueParOperateur = auCentime((f.operateurs.salaireBrutMensuel / HEURES_LEGALES_PAR_MOIS) * JOURNEE.heures * (1 + TAUX_PATRONAL));
  const salaires = auCentime(operateurs * retenueParOperateur);
  return { operateurs, enceintes, margeUnitaire: margeUnitaire(f), marge, retenueParOperateur, salaires, cout: auCentime(marge - salaires) };
}

/** Ce que coûtent n jours de grève. */
export const coutDeLaGreve = (jours: number) => auCentime(jours * journeeDeGreve().cout);

/** Le premier nombre de jours de grève qui coûte autant que la hausse refusée, sur l'année. */
export const joursQuiCoutentLaHausse = () => Math.ceil(revendication().coutDeLAnnee / journeeDeGreve().cout - 1e-9);

/** Le cas : ce que la grève a coûté, ce que coûte le compromis, et la hausse entière. */
export function leCompromis() {
  const augmentation = auCentime(f.operateurs.salaireBrutMensuel * COMPROMIS.hausse);
  const compromis = remunerationDeNPlus1(augmentation).coutDeLAugmentation;
  const entiere = revendication().coutDeLAnnee;
  return { jours: COMPROMIS.joursDeGreve, coutDUneJournee: journeeDeGreve().cout, greve: coutDeLaGreve(COMPROMIS.joursDeGreve), taux: COMPROMIS.hausse * 100, augmentation, operateurs: f.operateurs.nombre, coefficient: 1 + TAUX_PATRONAL, compromis, entiere, economie: auCentime(entiere - compromis) };
}
