import { CAPACITE_DE_REMBOURSEMENT_MAXIMALE, ENDETTEMENT_MAXIMAL, INDEPENDANCE_MINIMALE } from "../financement";
import { auCentime } from "./amortissement";
import { cloture } from "./cloture";
import { affectationDuBeneficeDeN } from "./comptabilite-approfondie";
import { empruntALaCloture } from "./emprunt";
import { EXERCICES_DU_COURS, type FicheDeLExercice } from "./exercice-de-nova";
import { SEUILS_D_ALERTE } from "./nova-gestion";
import { PROJET_LIGNE_SEMI_AUTOMATIQUE } from "./projets-et-financement";

/**
 * LE MONDE DU COURS : LA STRUCTURE FINANCIÈRE DE NOVA, SES RATIOS ET SON BILAN FINANCIER (BTS CG P6,
 * 6.3.2 et 6.4.1 ; DCG UE6, 2.3, 2.5 et 4.2).
 *
 * Le chapitre « Ratios de structure et bilan financier » et son cas le lisent. Tout part de la clôture
 * du premier exercice de NOVA (cloture.ts, sur la fiche exercice-de-nova.ts), la même que celle des
 * chapitres « Bilan fonctionnel et BFR » et « Soldes intermédiaires de gestion et CAF » : le même bilan,
 * le même résultat, la même capacité d'autofinancement, le même emprunt (une seule NOVA).
 *
 * DEUX LECTURES DU MÊME BILAN :
 *   1. LES RATIOS DE STRUCTURE, sur le bilan fonctionnel : la couverture des emplois stables
 *      (ressources stables ÷ emplois stables), l'indépendance financière (ressources propres ÷
 *      ressources stables, les ressources propres étant les capitaux propres, les amortissements, les
 *      dépréciations et les provisions), l'endettement (dettes financières ÷ capitaux propres) et la
 *      capacité de remboursement (dettes financières ÷ CAF). Les règles des banques sont celles du
 *      cours (config/cours/financement.ts), les mêmes qu'au lycée.
 *   2. LE BILAN FINANCIER, selon la liquidité de l'actif et l'exigibilité du passif, à plus ou à moins
 *      d'un an, en valeurs nettes et à la valeur de réalisation, après répartition du résultat : le
 *      fonds de roulement financier, la liquidité générale, réduite et immédiate, la solvabilité et
 *      l'autonomie financière.
 *
 * CE QUE LE BILAN FINANCIER RECLASSE, ET D'OÙ VIENT CHAQUE INFORMATION :
 *   · l'emprunt se coupe en deux : les échéances des douze mois à venir (emprunt.ts,
 *     `empruntALaCloture`, quatre échéances de 4 000 €) vont aux dettes à moins d'un an, le reste aux
 *     dettes à plus d'un an ; ses intérêts courus, payés le 3 janvier, sont à moins d'un an ;
 *   · la provision pour litige est une dette à moins d'un an : le jugement est attendu en mai N+1
 *     (exercice-de-nova.ts, SUITES_EN_N_PLUS_1) ;
 *   · le compte à terme échoit le 6 janvier N+1 : actif à moins d'un an ;
 *   · le résultat se lit après sa répartition, celle de l'affectation unique du cours
 *     (comptabilite-approfondie.ts, `affectationDuBeneficeDeN`) : le dividende de 2 € par action que
 *     votera l'assemblée de juin N+1 quitte les capitaux propres et devient une dette à moins d'un an ;
 *     les réserves et le report à nouveau restent aux capitaux propres ;
 *   · la ligne de montage se lit à sa valeur de revente (VALEUR_DE_REVENTE_DE_LA_LIGNE) : la
 *     moins-value latente sort de l'actif et des capitaux propres.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES HYPOTHÈSES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA VALEUR DE REVENTE DE LA LIGNE (hypothèse du cours) : un acheteur d'occasion donnerait au
 * 31 décembre 75 % du prix neuf de la ligne de montage, 45 000 €. Sa valeur nette comptable est plus
 * haute : le bilan financier constate une moins-value latente, retranchée de l'actif et des capitaux
 * propres. Une machine perd plus de valeur la première année que l'amortissement linéaire ne le dit.
 */
export const PART_DU_PRIX_NEUF_A_LA_REVENTE = 0.75;

/** Les bilans du cours n'ont qu'une entreprise tenue en comptabilité : NOVA. */
export const ENTREPRISES_DE_LA_STRUCTURE: readonly string[] = ["nova"];

/**
 * LE NOUVEL EMPRUNT DU LABORATOIRE (hypothèse du cours) : remboursé en cinq annuités de capital égales,
 * la première dans un an. Au 31 décembre, un cinquième en est donc exigible à moins d'un an.
 */
export const DUREE_DU_NOUVEL_EMPRUNT = 5;

/**
 * LE PROJET DU LABORATOIRE : la gamme sur la ligne semi-automatique et ses moules
 * (projets-et-financement.ts, le projet B), payés hors taxes au 31 décembre, comme au lycée (la TVA,
 * récupérable, est le sujet du chapitre « Financer et placer la trésorerie »).
 */
export const INVESTISSEMENT_DE_LA_GAMME = PROJET_LIGNE_SEMI_AUTOMATIQUE.actifs.reduce((t, a) => t + a.montant, 0);

/** La mauvaise année que la banque teste : une CAF en baisse de 60 % (hypothèse du cours, un an de lancement difficile). */
export const BAISSE_DE_LA_CAF_TESTEE = 60;

/** Le matelas que le dirigeant veut garder en compte courant : le seuil d'alerte du tableau de bord (nova-gestion.ts). */
export const MATELAS_DU_COMPTE_COURANT = SEUILS_D_ALERTE.tresorerie;

/** Les règles des banques du cours, et celle de la liquidité générale (au moins autant d'actif à moins d'un an que de dettes à moins d'un an). */
export const REGLES_DE_LA_BANQUE = {
  capaciteDeRemboursement: CAPACITE_DE_REMBOURSEMENT_MAXIMALE,
  independance: INDEPENDANCE_MINIMALE,
  endettement: ENDETTEMENT_MAXIMAL,
  liquiditeGenerale: 1,
} as const;

/** Un ratio au centième. */
export const auCentieme = (x: number) => Math.round(x * 100) / 100 + 0;

// ─────────────────────────────────────────────────────────────────────────────
// LA STRUCTURE AU 31 DÉCEMBRE
// ─────────────────────────────────────────────────────────────────────────────

export const ficheDeLaStructure = (code: string): FicheDeLExercice => EXERCICES_DU_COURS[code]!;

/** Le bilan de NOVA au 31 décembre, ses ratios de structure et son bilan financier. */
export function structureDeNova(f: FicheDeLExercice) {
  const k = cloture(f);
  const b = k.bilan;
  const fo = k.fonctionnel;
  const e = empruntALaCloture(f.pret);

  // Les postes du bilan comptable, en valeurs nettes.
  const postes = {
    immobilisationsNettes: b.actif.immobilisations.net,
    stock: b.actif.stocks.net,
    clientsNets: b.actif.clients.net,
    autresCreances: b.actif.autresCreances,
    chargesConstateesDAvance: b.actif.chargesConstateesDAvance,
    placement: b.actif.valeursMobilieresDePlacement,
    banque: b.actif.disponibilites,
    capital: b.passif.capitauxPropres.capital,
    resultat: b.passif.capitauxPropres.resultat,
    /** Le dividende voté sur le résultat, à payer en juin N+1 : l'affectation unique du cours. */
    dividende: affectationDuBeneficeDeN().dividendes,
    provision: b.passif.provisions,
    capitalRestantDu: e.capitalRestantDu,
    interetsCourus: auCentime(b.passif.emprunts - e.capitalRestantDu),
    fournisseurs: b.passif.fournisseurs,
    dettesFiscalesEtSociales: b.passif.dettesFiscalesEtSociales,
    impot: k.impot.impot,
    produitConstateDAvance: b.passif.produitsConstatesDAvance,
  };

  // 1. LES RATIOS DE STRUCTURE, sur le bilan fonctionnel.
  const capitauxPropres = b.passif.capitauxPropres.total;
  const ressourcesPropres = auCentime(fo.ressourcesStables.capitauxPropres + fo.ressourcesStables.amortissementsEtDepreciations + fo.ressourcesStables.provisions);
  const ressourcesStables = fo.ressourcesStables.total;
  const emploisStables = fo.emploisStables;
  const dettesFinancieres = fo.ressourcesStables.dettesFinancieres;
  const caf = k.caf.additive;
  const ratios = {
    couverture: auCentieme(ressourcesStables / emploisStables),
    /** En pour cent, au centième. */
    independance: auCentieme((ressourcesPropres / ressourcesStables) * 100),
    endettement: auCentieme(dettesFinancieres / capitauxPropres),
    capacite: auCentieme(dettesFinancieres / caf),
  };
  // Jusqu'où emprunter de plus, au 31 décembre, sans rien acheter : à l'euro près.
  const permis = {
    parLaCapacite: Math.floor(REGLES_DE_LA_BANQUE.capaciteDeRemboursement * caf - dettesFinancieres + 1e-9),
    parLEndettement: Math.floor(REGLES_DE_LA_BANQUE.endettement * capitauxPropres - dettesFinancieres + 1e-9),
    parLIndependance: Math.floor(ressourcesPropres / REGLES_DE_LA_BANQUE.independance - ressourcesStables + 1e-9),
  };

  // 2. LE BILAN FINANCIER.
  const valeurDeRevente = auCentime(f.equipement.ht * PART_DU_PRIX_NEUF_A_LA_REVENTE);
  const moinsValueLatente = auCentime(postes.immobilisationsNettes - valeurDeRevente);
  const creances = auCentime(postes.clientsNets + postes.autresCreances + postes.chargesConstateesDAvance);
  const actifMoinsDUnAn = auCentime(postes.stock + creances + postes.placement + postes.banque);
  const actifPlusDUnAn = valeurDeRevente;
  const totalActif = auCentime(actifPlusDUnAn + actifMoinsDUnAn);
  // Après répartition : le dividende voté sort des capitaux propres, la moins-value latente aussi.
  const capitauxPropresFinanciers = auCentime(capitauxPropres - postes.dividende - moinsValueLatente);
  const echeancesAMoinsDUnAn = e.partAMoinsDUnAn;
  const dettesPlusDUnAn = auCentime(postes.capitalRestantDu - echeancesAMoinsDUnAn);
  const autresDettesAMoinsDUnAn = auCentime(postes.interetsCourus + postes.fournisseurs + postes.dettesFiscalesEtSociales + postes.produitConstateDAvance);
  const dettesMoinsDUnAn = auCentime(echeancesAMoinsDUnAn + postes.provision + autresDettesAMoinsDUnAn + postes.dividende);
  const totalPassif = auCentime(capitauxPropresFinanciers + dettesPlusDUnAn + dettesMoinsDUnAn);
  const capitauxPermanents = auCentime(capitauxPropresFinanciers + dettesPlusDUnAn);
  const dettesTotales = auCentime(dettesPlusDUnAn + dettesMoinsDUnAn);
  const financier = {
    valeurDeRevente,
    moinsValueLatente,
    creances,
    actifPlusDUnAn,
    actifMoinsDUnAn,
    totalActif,
    capitauxPropres: capitauxPropresFinanciers,
    dettesPlusDUnAn,
    echeancesAMoinsDUnAn,
    autresDettesAMoinsDUnAn,
    dettesMoinsDUnAn,
    totalPassif,
    capitauxPermanents,
    dettesTotales,
    fondsDeRoulementFinancier: auCentime(capitauxPermanents - actifPlusDUnAn),
    liquiditeGenerale: auCentieme(actifMoinsDUnAn / dettesMoinsDUnAn),
    liquiditeReduite: auCentieme((actifMoinsDUnAn - postes.stock) / dettesMoinsDUnAn),
    liquiditeImmediate: auCentieme(postes.banque / dettesMoinsDUnAn),
    /** La liquidité immédiate, le compte à terme revenu le 6 janvier. */
    liquiditeAuSixJanvier: auCentieme((postes.banque + postes.placement) / dettesMoinsDUnAn),
    solvabilite: auCentieme(totalActif / dettesTotales),
    /** En pour cent, au centième. */
    autonomie: auCentieme((capitauxPropresFinanciers / totalPassif) * 100),
  };

  return {
    f,
    k,
    entreprise: f.entreprise,
    postes,
    capitauxPropres,
    ressourcesPropres,
    ressourcesStables,
    emploisStables,
    dettesFinancieres,
    amortissementsEtDepreciations: fo.ressourcesStables.amortissementsEtDepreciations,
    caf,
    ratios,
    permis,
    financier,
  };
}

export type StructureDeNova = ReturnType<typeof structureDeNova>;

// ─────────────────────────────────────────────────────────────────────────────
// LE CURSEUR : UN INVESTISSEMENT PAYÉ COMPTANT LE 31 DÉCEMBRE
// ─────────────────────────────────────────────────────────────────────────────

/** Un investissement payé comptant le 31 décembre, en milliers d'euros : le fonds de roulement financier et le compte courant. */
export function investissementComptant(s: StructureDeNova, milliers: number) {
  const montant = milliers * 1_000;
  const actifPlusDUnAn = auCentime(s.financier.actifPlusDUnAn + montant);
  return {
    montant,
    actifPlusDUnAn,
    capitauxPermanents: s.financier.capitauxPermanents,
    fondsDeRoulementFinancier: auCentime(s.financier.capitauxPermanents - actifPlusDUnAn),
    compteCourant: auCentime(s.postes.banque - montant),
  };
}

/** Le plus gros investissement payé comptant, en milliers d'euros, qui garde le fonds de roulement financier positif ou nul. */
export const investissementComptantMaximal = (s: StructureDeNova) => Math.floor(s.financier.fondsDeRoulementFinancier / 1_000 + 1e-9);

// ─────────────────────────────────────────────────────────────────────────────
// LE LABORATOIRE : INVESTIR, EMPRUNTER, APPORTER, ET UNE MAUVAISE ANNÉE
// ─────────────────────────────────────────────────────────────────────────────

/** Une position du laboratoire : l'investissement, l'emprunt et l'apport en euros, la baisse de la CAF en pour cent. */
export interface PositionDeLaStructure {
  investissement: number;
  emprunt: number;
  apport: number;
  baisse: number;
}

/**
 * LA STRUCTURE APRÈS UNE DÉCISION, au 31 décembre (comme au lycée : l'investissement, l'emprunt et
 * l'apport passent le 31 décembre). L'investissement, payé hors taxes, entre aux emplois stables et à
 * l'actif à plus d'un an pour son prix (une machine neuve vaut son prix) ; l'emprunt et l'apport
 * entrent en banque. L'emprunt va aux dettes financières, un cinquième à moins d'un an. La CAF de la
 * capacité de remboursement est celle de l'année, diminuée de la baisse testée.
 */
export function structureApres(s: StructureDeNova, p: PositionDeLaStructure) {
  const banque = auCentime(s.postes.banque - p.investissement + p.emprunt + p.apport);
  const emploisStables = auCentime(s.emploisStables + p.investissement);
  const ressourcesPropres = auCentime(s.ressourcesPropres + p.apport);
  const capitauxPropres = auCentime(s.capitauxPropres + p.apport);
  const dettesFinancieres = auCentime(s.dettesFinancieres + p.emprunt);
  const ressourcesStables = auCentime(ressourcesPropres + dettesFinancieres);
  const caf = auCentime(s.caf * (1 - p.baisse / 100));
  const actifMoinsDUnAn = auCentime(s.financier.actifMoinsDUnAn - p.investissement + p.emprunt + p.apport);
  const dettesMoinsDUnAn = auCentime(s.financier.dettesMoinsDUnAn + p.emprunt / DUREE_DU_NOUVEL_EMPRUNT);
  const r = {
    banque,
    dettesFinancieres,
    caf,
    plafondDeLaCapacite: auCentime(REGLES_DE_LA_BANQUE.capaciteDeRemboursement * caf),
    couverture: auCentieme(ressourcesStables / emploisStables),
    independance: auCentieme((ressourcesPropres / ressourcesStables) * 100),
    endettement: auCentieme(dettesFinancieres / capitauxPropres),
    capacite: caf > 0 ? auCentieme(dettesFinancieres / caf) : Number.POSITIVE_INFINITY,
    liquiditeGenerale: auCentieme(actifMoinsDUnAn / dettesMoinsDUnAn),
    fondsDeRoulementFinancier: auCentime(actifMoinsDUnAn - dettesMoinsDUnAn),
  };
  // Les règles se jugent sur les ratios exacts, pas sur leurs arrondis.
  const dansLesRegles =
    banque >= MATELAS_DU_COMPTE_COURANT &&
    dettesFinancieres <= REGLES_DE_LA_BANQUE.capaciteDeRemboursement * caf + 1e-9 &&
    ressourcesPropres >= REGLES_DE_LA_BANQUE.independance * ressourcesStables - 1e-9 &&
    dettesFinancieres <= REGLES_DE_LA_BANQUE.endettement * capitauxPropres + 1e-9 &&
    actifMoinsDUnAn >= REGLES_DE_LA_BANQUE.liquiditeGenerale * dettesMoinsDUnAn - 1e-9;
  return { ...r, dansLesRegles };
}

/** Le départ du laboratoire : rien de décidé, l'année telle quelle. */
export const DEPART_DE_LA_STRUCTURE: PositionDeLaStructure = { investissement: 0, emprunt: 0, apport: 0, baisse: 0 };

/** Le défi du laboratoire : la gamme payée, la CAF testée en baisse de 60 %, le matelas gardé, les règles tenues. */
export const defiDeLaStructure = (s: StructureDeNova, p: PositionDeLaStructure) =>
  p.investissement >= INVESTISSEMENT_DE_LA_GAMME && p.baisse >= BAISSE_DE_LA_CAF_TESTEE && structureApres(s, p).dansLesRegles;

/** L'emprunt le plus petit, au cran de 5 000 €, qui garde le matelas avec la gamme payée et sans apport. */
export const PAS_DE_L_EMPRUNT = 5_000;
export const empruntMinimalDeLaGamme = (s: StructureDeNova) => Math.ceil((INVESTISSEMENT_DE_LA_GAMME + MATELAS_DU_COMPTE_COURANT - s.postes.banque) / PAS_DE_L_EMPRUNT - 1e-9) * PAS_DE_L_EMPRUNT;
