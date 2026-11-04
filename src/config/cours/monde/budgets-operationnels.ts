import { budgetDeTresorerie, type LeviersDuSemestre } from "./couts-et-budgets";
import { LIVRAISONS_DU_MOIS } from "./exercice-de-nova";
import { ACTIVITE_NORMALE_DU_MOIS, type CodeDeClientele, type FicheDeGestion } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LES BUDGETS OPÉRATIONNELS DE NOVA, DES VENTES AUX ACHATS.
 *
 * Le chapitre « Des ventes aux achats : l'enchaînement des budgets » le lit. Il bâtit, sur le
 * semestre du budget de trésorerie (monde/nova-gestion.ts, les mêmes ventes mois par mois, le même
 * prix, les mêmes composants), la chaîne des budgets opérationnels :
 *
 *   ventes (en quantités, puis en valeur) → production (compte tenu du stock d'enceintes finies)
 *   → consommations de jeux de composants → approvisionnements (compte tenu du stock de jeux)
 *   → achats, puis paiements au fournisseur, qui entrent dans le budget de trésorerie.
 *
 * Les formules, celles d'un énoncé :
 *   · production du mois = ventes du mois + stock final d'enceintes − stock initial d'enceintes ;
 *   · consommation de jeux = production × jeux par enceinte (un jeu par enceinte) ;
 *   · achats de jeux = consommation + stock final de jeux − stock initial de jeux ;
 *   · le stock final d'un mois est le stock initial du suivant.
 *
 * LA FICHE, D'ABORD : NOVA n'a pas de stock (nova-gestion.ts). Ses stocks sont nuls à chaque fin de
 * mois, la production vaut les ventes, les achats valent les consommations : c'est exactement le
 * budget de trésorerie du chapitre « Le budget de trésorerie », au centime (la garde le vérifie).
 *
 * PUIS LA POLITIQUE QUE LE DIRIGEANT ÉTUDIE EN JANVIER (hypothèse du cours, POLITIQUE_ENVISAGEE) :
 * tenir un stock de sécurité. Elle n'a pas été retenue (exercice-de-nova.ts : de janvier à novembre,
 * NOVA achète ce qu'elle consomme) ; le chapitre la chiffre pour montrer ce qu'elle aurait coûté.
 * Elle passe dans le budget de trésorerie du modèle par son seul levier `jeuxAchetes`.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
/** Arrondi à l'entier supérieur, sans qu'un calcul en virgule flottante ne fasse monter un entier exact. */
const plafond = (x: number) => Math.ceil(x - 1e-9);

/** Un jeu de composants par enceinte (la nomenclature de NOVA One). */
export const JEUX_PAR_ENCEINTE = 1;

/**
 * LES VENTES PRÉVUES APRÈS JUIN, pour les stocks de fin de semestre : celles de juillet et d'août de
 * l'exercice (exercice-de-nova.ts, les particuliers et CampusTech), que le dirigeant prévoit dès
 * janvier. Le stock d'enceintes de juin dépend des ventes de juillet ; le stock de jeux de juin, de la
 * production de juillet, donc des ventes d'août.
 */
export const VENTES_PREVUES_APRES_JUIN: readonly number[] = [LIVRAISONS_DU_MOIS[6]!, LIVRAISONS_DU_MOIS[7]!];

/** Une politique de stock : le stock final de chaque mois, en part du mois suivant. */
export interface PolitiqueDeStock {
  /** Le stock final d'enceintes finies, en part des ventes du mois suivant (0,1 : 10 %). */
  enceintes: number;
  /** Le stock final de jeux de composants, en part de la production du mois suivant. */
  jeux: number;
}

/** La fiche : aucun stock, ni d'enceintes ni de jeux. */
export const SANS_STOCK: PolitiqueDeStock = { enceintes: 0, jeux: 0 };

/**
 * LA POLITIQUE DE STOCK ENVISAGÉE (hypothèse du cours) : finir chaque mois avec 10 % des ventes du
 * mois suivant en enceintes finies (une commande imprévue de CampusTech se sert sans attendre), et
 * 20 % de la production du mois suivant en jeux de composants (une livraison en retard n'arrête pas
 * la ligne). Chaque stock s'arrondit à l'unité supérieure. Les stocks partent de zéro au 1er janvier.
 */
export const POLITIQUE_ENVISAGEE: PolitiqueDeStock = { enceintes: 0.1, jeux: 0.2 };

/*
 * HYPOTHÈSE DU COURS, AVEC UN STOCK : les autres coûts variables (emballage, transport, énergie de la
 * chaîne) restent payés enceinte vendue par enceinte vendue, comme dans la fiche (le modèle les lit
 * sur les ventes) ; seuls les jeux de composants suivent la production et les achats. Une enceinte en
 * stock n'immobilise donc que son jeu.
 */

/** Une ligne du budget des ventes : une clientèle, ses quantités et sa valeur hors taxes, mois par mois. */
export interface VentesDUneClientele {
  code: CodeDeClientele;
  nom: string;
  quantites: readonly number[];
  valeurs: readonly number[];
}

/** Le budget des ventes du semestre, en quantités et en valeur hors taxes, clientèle par clientèle. */
export function budgetDesVentes(f: FicheDeGestion) {
  const prix = f.moisDeReference.prix;
  const clienteles: VentesDUneClientele[] = f.semestre.clienteles.map((c) => ({ code: c.code, nom: c.nom, quantites: c.quantites, valeurs: c.quantites.map((q) => auCentime(q * prix)) }));
  const n = f.semestre.mois.length;
  const quantites = Array.from({ length: n }, (_, k) => clienteles.reduce((t, c) => t + c.quantites[k]!, 0));
  return {
    prix,
    clienteles,
    quantites,
    valeurs: quantites.map((q) => auCentime(q * prix)),
    totalQuantite: quantites.reduce((t, q) => t + q, 0),
    totalValeur: auCentime(quantites.reduce((t, q) => t + q, 0) * prix),
  };
}

/** Un mois des budgets de production et des approvisionnements. */
export interface MoisDesBudgets {
  nom: string;
  ventes: number;
  enceintes: { initial: number; final: number };
  production: number;
  consommation: number;
  jeux: { initial: number; final: number };
  achats: number;
  achatsHt: number;
  achatsTtc: number;
}

/**
 * LES BUDGETS DE PRODUCTION ET DES APPROVISIONNEMENTS du semestre, pour une politique de stock. Les
 * stocks finaux se calculent sur les mois suivants : juillet pour les enceintes de juin, juillet et
 * août pour les jeux de juin (VENTES_PREVUES_APRES_JUIN).
 */
export function budgetsDeProduction(f: FicheDeGestion, politique: PolitiqueDeStock = SANS_STOCK) {
  const ventes = [...budgetDesVentes(f).quantites, ...VENTES_PREVUES_APRES_JUIN];
  const n = f.semestre.mois.length;
  // Le stock final d'enceintes du mois k, pour k de janvier à juillet (celui de juillet sert au stock de jeux de juin).
  const stockDEnceintes = Array.from({ length: n + 1 }, (_, k) => plafond(politique.enceintes * ventes[k + 1]!));
  const production = Array.from({ length: n + 1 }, (_, k) => ventes[k]! + stockDEnceintes[k]! - (k === 0 ? 0 : stockDEnceintes[k - 1]!));
  const stockDeJeux = Array.from({ length: n }, (_, k) => plafond(politique.jeux * production[k + 1]! * JEUX_PAR_ENCEINTE));
  const composants = f.moisDeReference.coutVariable.composants;
  const tva = f.semestre.tauxDeTva;
  const mois: MoisDesBudgets[] = f.semestre.mois.map((m, k) => {
    const consommation = production[k]! * JEUX_PAR_ENCEINTE;
    const initial = k === 0 ? 0 : stockDeJeux[k - 1]!;
    const achats = consommation + stockDeJeux[k]! - initial;
    const achatsHt = auCentime(achats * composants);
    return {
      nom: m.nom,
      ventes: ventes[k]!,
      enceintes: { initial: k === 0 ? 0 : stockDEnceintes[k - 1]!, final: stockDEnceintes[k]! },
      production: production[k]!,
      consommation,
      jeux: { initial, final: stockDeJeux[k]! },
      achats,
      achatsHt,
      achatsTtc: auCentime(achatsHt * (1 + tva)),
    };
  });
  const fin = mois.at(-1)!;
  return {
    politique,
    mois,
    /** La production et les ventes de juillet, qui ont servi aux stocks de juin. */
    juillet: { ventes: ventes[n]!, production: production[n]! },
    /** Les jeux achetés chaque mois : le levier du budget de trésorerie. */
    jeuxAchetes: mois.map((m) => m.achats),
    /** Les stocks du 30 juin, et les composants qu'ils immobilisent, hors taxes. */
    stocksDeFin: { enceintes: fin.enceintes.final, jeux: fin.jeux.final, composantsHt: auCentime((fin.enceintes.final * JEUX_PAR_ENCEINTE + fin.jeux.final) * composants) },
    /** La production de chaque trimestre, à comparer à la capacité de la ligne. */
    productionParTrimestre: [0, 1].map((t) => mois.slice(3 * t, 3 * t + 3).reduce((s, m) => s + m.production, 0)),
    /** Le mois le plus chargé, à comparer à l'activité normale. */
    productionLaPlusForte: Math.max(...mois.map((m) => m.production)),
    activiteNormale: ACTIVITE_NORMALE_DU_MOIS,
    capaciteDuTrimestre: f.decision.capacite,
  };
}

/** Le budget de trésorerie du semestre quand NOVA suit une politique de stock : les achats du budget des approvisionnements. */
export function tresorerieAvecLeStock(f: FicheDeGestion, politique: PolitiqueDeStock = SANS_STOCK, leviers: Partial<LeviersDuSemestre> = {}) {
  return budgetDeTresorerie(f, { ...leviers, jeuxAchetes: budgetsDeProduction(f, politique).jeuxAchetes });
}

/**
 * Ce que la politique de stock coûte à la trésorerie du 30 juin, face à la fiche : les jeux achetés
 * en plus jusqu'en mai, au prix hors taxes. Achetés en plus le mois k, ils se paient TTC le mois
 * suivant, et leur TVA déductible allège la déclaration payée le même mois : seul le hors taxes
 * manque. Ceux de juin ne se paient qu'en juillet.
 */
export function ecartDeTresorerieAuTrenteJuin(f: FicheDeGestion, politique: PolitiqueDeStock) {
  const b = budgetsDeProduction(f, politique);
  const base = budgetsDeProduction(f, SANS_STOCK);
  const enPlusJusquEnMai = b.mois.slice(0, -1).reduce((t, m, k) => t + m.achats - base.mois[k]!.achats, 0);
  return { jeuxEnPlusJusquEnMai: enPlusJusquEnMai, montant: auCentime(-enPlusJusquEnMai * f.moisDeReference.coutVariable.composants) };
}
