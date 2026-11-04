import { auCentime } from "./amortissement";
import { SANS_STOCK, budgetDesVentes, budgetsDeProduction } from "./budgets-operationnels";
import { fixesDesCentres } from "./centres-de-nova";
import { budgetDeTresorerie, tableauDeBord } from "./couts-et-budgets";
import { COMMANDES_DE_JANVIER, methodeABC } from "./couts-par-activites";
import { NOVA_CAPACITE, type FicheDeLaCapacite } from "./nova-capacite";
import { NOVA_GESTION, type FicheDeGestion } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LA DÉMARCHE BUDGÉTAIRE DE NOVA (le chapitre « La démarche budgétaire » et son cas ;
 * DCG UE11 2025, § 3.1 ; DSCG UE3 ; BUT GEA).
 *
 * En décembre, NOVA prépare le budget du semestre. Le chapitre suit la démarche, pas la construction
 * fine des budgets : celle-ci est faite dans « Des ventes aux achats » (monde/budgets-operationnels.ts),
 * dont ce fichier relit les totaux sans rien recalculer. AUCUN CHIFFRE NOUVEAU SUR CE QUI S'EST PASSÉ :
 *   · nova-gestion.ts et couts-et-budgets.ts : le semestre, ses charges fixes, le budget de trésorerie
 *     et ses leviers (l'investissement, la publicité), le matelas que le dirigeant veut garder ;
 *   · budgets-operationnels.ts : le réseau des budgets, des ventes aux achats, sans stock (la fiche) ;
 *   · centres-de-nova.ts : les charges fixes de l'atelier et du service commercial ;
 *   · couts-par-activites.ts : l'activité « traiter les commandes » et le coût de son inducteur ;
 *   · nova-capacite.ts : les 4 opérateurs, leurs heures de montage, le quart d'heure par enceinte.
 *
 * LES HYPOTHÈSES DU CHAPITRE, nommées ci-dessous : ce que demandent les centres pendant la navette (le
 * banc en avril, la publicité), le matelas que la responsable commerciale a mis dans sa demande et
 * l'abattement de la direction, et, pour le cas, les actions de publicité justifiées une à une. Ce sont
 * des projets de budget : dans la fiche, le dirigeant a tranché sans publicité ni banc au semestre
 * (nova-gestion.ts), et c'est le budget que bâtissent les chapitres de trésorerie. La garde
 * tests/cours/la-demarche-budgetaire.test.ts refait chaque chiffre à la main.
 *
 * CONVENTIONS : hors taxes, sauf la trésorerie (toutes taxes comprises) ; les montants au centime.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. LE RÉSEAU DES BUDGETS, DÉJÀ BÂTI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Le réseau des budgets du semestre, en totaux : les ventes, la production, les achats de jeux, les
 * paiements au fournisseur et la trésorerie. Ce sont ceux du chapitre « Des ventes aux achats », sans
 * stock : la production vaut les ventes, les achats valent les consommations.
 */
export function reseauDesBudgets(f: FicheDeGestion = NOVA_GESTION) {
  const ventes = budgetDesVentes(f);
  const production = budgetsDeProduction(f, SANS_STOCK);
  const tresorerie = budgetDeTresorerie(f);
  return {
    ventes: { quantite: ventes.totalQuantite, valeur: ventes.totalValeur },
    production: production.mois.reduce((t, m) => t + m.production, 0),
    achatsHt: auCentime(production.mois.reduce((t, m) => t + m.achatsHt, 0)),
    paiementsAuFournisseur: auCentime(tresorerie.mois.reduce((t, m) => t + m.decaissements.fournisseur, 0)),
    tresorerieFin: tresorerie.tresorerieFin,
    plusBas: tresorerie.plusBas,
    resultat: tableauDeBord(f).semestre.resultat,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DU PROGRAMME AU BUDGET
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE PROGRAMME DE MAIN-D'ŒUVRE DU SEMESTRE, en heures (un programme se dit en unités physiques), face
 * au budget du personnel, en euros : les heures de montage que demande la production, celles que les
 * opérateurs donnent, le taux d'occupation, et la paie du semestre, qui ne suit pas les heures.
 */
export function programmeEtBudget(f: FicheDeGestion = NOVA_GESTION, c: FicheDeLaCapacite = NOVA_CAPACITE) {
  const mois = f.semestre.mois.length;
  const production = reseauDesBudgets(f).production;
  const heuresDeMontage = auCentime(production * c.operateurs.heuresParEnceinte);
  const heuresDisponibles = c.operateurs.nombre * c.operateurs.heuresParMois * mois;
  return {
    mois,
    production,
    heuresParEnceinte: c.operateurs.heuresParEnceinte,
    operateurs: c.operateurs.nombre,
    heuresParMois: c.operateurs.heuresParMois,
    heuresDeMontage,
    heuresDisponibles,
    occupation: heuresDeMontage / heuresDisponibles,
    personnelDuMois: f.moisDeReference.chargesFixes.personnel,
    budgetDuPersonnel: auCentime(mois * f.moisDeReference.chargesFixes.personnel),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BUDGETS PAR CENTRE, PAR ACTIVITÉ
// ─────────────────────────────────────────────────────────────────────────────

/** Les charges fixes du semestre de chaque centre de responsabilité : son budget de structure. */
export function budgetsParCentre(f: FicheDeGestion = NOVA_GESTION) {
  const mois = f.semestre.mois.length;
  const parMois = fixesDesCentres(f);
  const atelier = auCentime(mois * parMois.atelier);
  const commercial = auCentime(mois * parMois.commercial);
  return { mois, parMois, atelier, commercial, total: auCentime(atelier + commercial) };
}

/** L'activité dont le chapitre bâtit le budget : traiter les commandes et le service client. */
export const ACTIVITE_BUDGETEE = "commandes" as const;

/** Le mois dont le chapitre bâtit le budget d'activité : juin, le plus chargé du semestre. */
export const MOIS_DU_BUDGET_D_ACTIVITE = 5;

/**
 * LES COMMANDES D'UN MOIS : une commande par enceinte vendue en ligne, et les commandes de CampusTech,
 * qui passe chaque mois une seule commande groupée (COMMANDES_DE_JANVIER, couts-par-activites.ts).
 */
export function commandesDuMois(f: FicheDeGestion = NOVA_GESTION, mois: number) {
  const enLigne = f.semestre.clienteles.find((c) => c.code === "particuliers")!.quantites[mois]!;
  return { enLigne, campustech: COMMANDES_DE_JANVIER.campustech.commandes, total: enLigne + COMMANDES_DE_JANVIER.campustech.commandes };
}

/**
 * LE BUDGET D'UNE ACTIVITÉ : le volume prévu de son inducteur × le coût de l'inducteur de janvier (la
 * méthode ABC). Face à lui, le budget reconduit : le coût de l'activité en janvier, le même chaque mois.
 */
export function budgetDActivite(f: FicheDeGestion = NOVA_GESTION, mois = MOIS_DU_BUDGET_D_ACTIVITE) {
  const a = methodeABC().activites.find((x) => x.code === ACTIVITE_BUDGETEE)!;
  const commandes = commandesDuMois(f, mois);
  return {
    libelle: a.libelle,
    coutDeLInducteur: a.coutDeLInducteur,
    coutDeJanvier: a.cout,
    volumeDeJanvier: a.volume,
    commandes,
    budget: auCentime(commandes.total * a.coutDeLInducteur),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. LA NAVETTE : LES DEMANDES DES CENTRES FACE À LA TRÉSORERIE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CE QUE LES CENTRES DEMANDENT EN NOVEMBRE (hypothèse du cours) : le chef d'atelier, le banc de mesure
 * de la fiche, livré et payé en avril ; la responsable commerciale, 1 000 € de publicité hors taxes
 * chaque mois du semestre. Ni l'un ni l'autre ne change les ventes de la fiche.
 */
export const DEMANDES_DES_CENTRES = {
  banc: { mois: NOVA_GESTION.semestre.investissement.mois, montantHt: NOVA_GESTION.semestre.investissement.montantHt },
  publicite: 1_000,
} as const;

/** Les mois où le banc peut être livré dans la navette : avril, mai ou juin. */
export const MOIS_POSSIBLES_DU_BANC: readonly number[] = [3, 4, 5];

/** La publicité que le curseur et le laboratoire essaient, par mois, hors taxes. */
export const PUBLICITES_ESSAYEES = { min: 0, max: 2_000, pasDuLaboratoire: 100 } as const;

/** Le semestre consolidé pour un banc livré le mois `moisDuBanc` et une publicité mensuelle. */
export function navette(f: FicheDeGestion = NOVA_GESTION, v: { moisDuBanc: number; publicite: number } = { moisDuBanc: DEMANDES_DES_CENTRES.banc.mois, publicite: DEMANDES_DES_CENTRES.publicite }) {
  const leviers = { investissement: { mois: v.moisDuBanc, montantHt: DEMANDES_DES_CENTRES.banc.montantHt }, budgetMarketing: v.publicite };
  const t = tableauDeBord(f, leviers);
  return { ...v, plusBas: t.budget.plusBas, tresorerieFin: t.budget.tresorerieFin, resultat: t.semestre.resultat, matelas: f.seuilsDAlerte.tresorerie, tient: t.budget.plusBas.tresorerie >= f.seuilsDAlerte.tresorerie };
}

/** La plus forte publicité mensuelle, à l'euro, qui garde le matelas avec le banc livré ce mois-là (null : aucune). */
export function publiciteMaximale(f: FicheDeGestion = NOVA_GESTION, moisDuBanc: number) {
  let max: number | null = null;
  for (let p = PUBLICITES_ESSAYEES.min; p <= PUBLICITES_ESSAYEES.max; p++) if (navette(f, { moisDuBanc, publicite: p }).tient) max = p;
  return max;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. LA NÉGOCIATION : LE SLACK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE SLACK DE LA DEMANDE (hypothèse du cours) : la responsable commerciale sait que 800 € par mois
 * suffiraient. Elle majore sa demande de 25 % (les 1 000 € de DEMANDES_DES_CENTRES), la direction
 * abat toutes les demandes de 10 %, et elle dépense 880 € par mois : son budget finit avec un écart
 * favorable, alors qu'elle a dépensé plus que le besoin.
 */
export const NEGOCIATION_DE_LA_PUBLICITE = { besoin: 800, majoration: 0.25, abattement: 0.1, depense: 880 } as const;

export function slackDeLaPublicite(n = NEGOCIATION_DE_LA_PUBLICITE) {
  const demande = auCentime(n.besoin * (1 + n.majoration));
  const alloue = auCentime(demande * (1 - n.abattement));
  return { ...n, demande, alloue, ecartFavorable: auCentime(alloue - n.depense), auDelaDuBesoin: auCentime(n.depense - n.besoin), slackAlloue: auCentime(alloue - n.besoin) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. LE BUDGET BASE ZÉRO DE LA PUBLICITÉ (le cas)
// ─────────────────────────────────────────────────────────────────────────────

export interface ActionDePublicite {
  code: string;
  libelle: string;
  /** Le coût par mois, hors taxes, lissé sur le semestre. */
  parMois: number;
  /** Essentielle (sans elle, la mission n'est pas remplie) ou complémentaire (utile, mais différable). */
  nature: "essentielle" | "complementaire";
  /** Le score que le comité lui donne, de 1 à 6 : l'ordre où les actions complémentaires passent. */
  score: number;
}

/**
 * LES ACTIONS DE PUBLICITÉ JUSTIFIÉES UNE À UNE (hypothèse du cas « La publicité, ligne par ligne ») :
 * leur somme est le besoin de NEGOCIATION_DE_LA_PUBLICITE, 800 € par mois.
 */
export const ACTIONS_DE_PUBLICITE: readonly ActionDePublicite[] = [
  { code: "annonces", libelle: "Annonces en ligne ciblées", parMois: 500, nature: "essentielle", score: 6 },
  { code: "salon", libelle: "Stand au salon de la rentrée étudiante", parMois: 150, nature: "complementaire", score: 5 },
  { code: "echantillons", libelle: "Enceintes de démonstration prêtées aux revendeurs", parMois: 150, nature: "complementaire", score: 3 },
];

/** Le mois où le chef d'atelier tient à recevoir le banc, dans le cas : mai. */
export const MOIS_DU_BANC_DU_CAS = 4;

/**
 * LE BUDGET BASE ZÉRO : les actions essentielles d'abord, puis les complémentaires par score décroissant,
 * tant que leur total reste sous la limite que la trésorerie permet. Les autres sont différées.
 */
export function budgetBaseZero(limite: number, actions: readonly ActionDePublicite[] = ACTIONS_DE_PUBLICITE) {
  const ordre = [...actions].sort((a, b) => (a.nature === b.nature ? b.score - a.score : a.nature === "essentielle" ? -1 : 1));
  const retenues: ActionDePublicite[] = [];
  const differees: ActionDePublicite[] = [];
  let total = 0;
  for (const a of ordre) {
    if (total + a.parMois <= limite) {
      retenues.push(a);
      total = auCentime(total + a.parMois);
    } else differees.push(a);
  }
  return { justifie: auCentime(actions.reduce((t, a) => t + a.parMois, 0)), retenues, differees, total };
}
