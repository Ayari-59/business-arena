import { auCentime } from "./amortissement";
import { cloture } from "./cloture";
import { CAMPUSTECH, ELECTRO_COMPOSANTS, EXERCICE_DE_NOVA, PAIE_DU_MOIS, VENTES_AUX_PARTICULIERS, type FicheDeLExercice } from "./exercice-de-nova";
import { AUTRES_COUTS_PAR_ENCEINTE, COMPOSANTS_PAR_ENCEINTE, DELAI_CONVENU_DE_CAMPUSTECH, JOURS_DU_MOIS_COMMERCIAL, PRIX_DE_L_ENCEINTE, TAUX_DE_TVA } from "./nova-gestion";
import { bulletinDePaie } from "./paie";

/**
 * LE MONDE DU COURS : LE BFR D'EXPLOITATION NORMATIF DE NOVA (DCG UE6 2.2).
 *
 * Le chapitre « Le BFR d'exploitation normatif » et son cas le lisent. « Bilan fonctionnel et BFR » a
 * lu le besoin d'exploitation sur la photo du 31 décembre (32 200,73 €), puis l'a dit en jours de
 * chiffre d'affaires d'un bloc. Ici, le besoin se reconstruit POSTE PAR POSTE, à partir des délais et
 * de la structure des flux d'une année type : chaque poste vaut son temps d'écoulement multiplié par
 * son coefficient de structure (son flux rapporté au chiffre d'affaires hors taxes), en jours de
 * chiffre d'affaires hors taxes. C'est un besoin moyen, de régime de croisière, qui sert à prévoir.
 *
 * UNE SEULE NOVA : les délais sont ceux de la fiche (exercice-de-nova.ts et nova-gestion.ts), aucun
 * n'est réinventé :
 *   · les particuliers paient à la commande (0 jour) ;
 *   · CampusTech paie 80 jours après sa facture pour 60 convenus (DELAI_DE_CAMPUSTECH) ;
 *   · Électro-Composants livre et facture le 10, et se paie à 22 jours ;
 *   · les autres coûts variables (emballage, transport, énergie) se paient dans le mois ;
 *   · la paie : le net le 28 du mois, les cotisations et le prélèvement à la source le 15 du mois
 *     suivant ; la TVA se déclare chaque mois et se paie le mois suivant ;
 *   · les prix : l'enceinte à 59 € hors taxes, le jeu de composants à 22 €, les autres coûts à 16 €,
 *     la TVA à 20 %.
 * La garde tests/cours/le-bfr-d-exploitation-normatif.test.ts refait chaque chiffre à la main, et
 * tests/cours/une-seule-nova.test.ts vérifie que les délais et les prix sont bien ceux de la fiche.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES HYPOTHÈSES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'ANNÉE TYPE (hypothèse du cours) : l'activité régulière du premier exercice, celle qui se répète.
 * Les particuliers achètent les enceintes de l'exercice (18 789) ; CampusTech, son contrat de
 * 320 enceintes par mois. Sonora (en redressement, puis liquidée) et la commande urgente de décembre
 * sont des opérations exceptionnelles : un besoin normatif ne les prolonge pas.
 */
export const ANNEE_TYPE = {
  particuliers: VENTES_AUX_PARTICULIERS.reduce((t, q) => t + q, 0),
  campustech: 12 * CAMPUSTECH.enceintesParFacture,
} as const;

/**
 * LE STOCK MOYEN DE COMPOSANTS (hypothèse du cours) : Électro-Composants livre le 10 de chaque mois
 * les jeux du mois ; le stock part d'un mois de consommation et descend à zéro. Il vaut en moyenne
 * la moitié d'un mois : 15 jours de consommation.
 */
export const STOCK_EN_JOURS_DE_CONSOMMATION = JOURS_DU_MOIS_COMMERCIAL / 2;

/**
 * LE JOUR DE PAIEMENT DE LA TVA (hypothèse du cours, qui précise la fiche) : la déclaration d'un mois
 * se paie le 20 du mois suivant. La TVA d'un mois naît en moyenne au milieu du mois : elle reste due
 * 15 jours, puis 20 jours, 35 jours en tout ; la TVA déductible se récupère au même rythme.
 */
export const JOUR_DE_PAIEMENT_DE_LA_TVA = 20;
export const DELAI_DE_LA_TVA = JOURS_DU_MOIS_COMMERCIAL / 2 + JOUR_DE_PAIEMENT_DE_LA_TVA;

/**
 * LES DÉLAIS DE LA PAIE (ceux de la fiche) : le travail d'un mois naît en moyenne le 15 ; le net se
 * vire le 28 (13 jours plus tard) ; les cotisations et le prélèvement à la source se versent le 15 du
 * mois suivant (30 jours plus tard). La paie ne suit pas le chiffre d'affaires : c'est la PART FIXE
 * du besoin, en euros et non en jours.
 */
export const DELAI_DES_SALAIRES_NETS = PAIE_DU_MOIS.jourDuVirement - JOURS_DU_MOIS_COMMERCIAL / 2;
export const DELAI_DES_COTISATIONS = JOURS_DU_MOIS_COMMERCIAL - JOURS_DU_MOIS_COMMERCIAL / 2 + PAIE_DU_MOIS.jourDesCotisations;

/**
 * LE REPÈRE DU SECTEUR (hypothèse du cours, un ordre de grandeur et non une statistique réelle) : les
 * petits fabricants d'électronique grand public qui vendent surtout à des distributeurs. Ils gardent
 * un mois de stock, sont payés à 55 jours, paient leurs fournisseurs à 45 jours, et leur besoin
 * d'exploitation tourne autour de 30 jours de chiffre d'affaires hors taxes.
 */
export const SECTEUR = { stock: 30, clients: 55, fournisseurs: 45, bfre: 30 } as const;

/** Les délais que le chapitre juge tenables : CampusTech au délai convenu, le fournisseur à l'usage du secteur, un stock de sécurité de 10 jours. */
export const DELAIS_TENABLES = { campustech: DELAI_CONVENU_DE_CAMPUSTECH, fournisseur: SECTEUR.fournisseurs, stockMinimal: 10 } as const;

/** La croissance que le chapitre chiffre : 20 % de chiffre d'affaires en plus, celle du chapitre « Bilan fonctionnel et BFR ». */
export const CROISSANCE_NORMATIVE = 0.2;

// ─────────────────────────────────────────────────────────────────────────────
// LE MODÈLE
// ─────────────────────────────────────────────────────────────────────────────

const auDixMillieme = (x: number) => Math.round(x * 10_000) / 10_000 + 0;

/** Les délais du calcul, en jours : ceux de la fiche par défaut, que le laboratoire et le cas déplacent. */
export interface DelaisNormatifs {
  campustech: number;
  fournisseur: number;
  stock: number;
}

export const DELAIS_DE_LA_FICHE: DelaisNormatifs = { campustech: CAMPUSTECH.delai, fournisseur: ELECTRO_COMPOSANTS.delai, stock: STOCK_EN_JOURS_DE_CONSOMMATION };

/** Une année type : les enceintes de chaque clientèle. */
export interface StructureDesVentes {
  particuliers: number;
  campustech: number;
}

export type CodeDuPoste = "stock" | "campustech" | "particuliers" | "tva-deductible" | "fournisseur" | "tva-collectee";

/** Un poste du besoin normatif : son temps d'écoulement, son coefficient de structure, ses jours de chiffre d'affaires. */
export interface PosteNormatif {
  code: CodeDuPoste;
  libelle: string;
  sens: "besoin" | "ressource";
  delai: number;
  /** Le flux du poste sur l'année type, en euros (hors taxes ou TTC, selon le poste). */
  flux: number;
  /** Le flux rapporté au chiffre d'affaires hors taxes, au dix-millième. */
  coefficient: number;
  /** Le délai × le coefficient, au centième : des jours de chiffre d'affaires hors taxes. */
  jours: number;
  /** Comment se calcule le coefficient, dit à l'élève. */
  calcul: string;
}

/**
 * LE BESOIN NORMATIF D'UNE ANNÉE TYPE, poste par poste. La part variable est la somme des besoins moins
 * celle des ressources, en jours ; la part fixe (la paie), une ressource en euros ; le besoin en euros
 * vaut la part variable × chiffre d'affaires ÷ 360, moins la part fixe.
 */
export function bfrNormatif(d: Partial<DelaisNormatifs> = {}, ventes: StructureDesVentes = ANNEE_TYPE, f: FicheDeLExercice = EXERCICE_DE_NOVA) {
  const delais = { ...DELAIS_DE_LA_FICHE, ...d };
  const t = TAUX_DE_TVA;
  const enceintes = ventes.particuliers + ventes.campustech;
  const caHt = auCentime(enceintes * PRIX_DE_L_ENCEINTE);
  const campustechTtc = auCentime(ventes.campustech * PRIX_DE_L_ENCEINTE * (1 + t));
  const particuliersTtc = auCentime(ventes.particuliers * PRIX_DE_L_ENCEINTE * (1 + t));
  const consommation = auCentime(enceintes * COMPOSANTS_PAR_ENCEINTE);
  const achatsTtc = auCentime(consommation * (1 + t));
  const autresCouts = auCentime(enceintes * AUTRES_COUTS_PAR_ENCEINTE);
  const tvaDeductible = auCentime((consommation + autresCouts) * t);
  const tvaCollectee = auCentime(caHt * t);
  const poste = (code: CodeDuPoste, libelle: string, sens: PosteNormatif["sens"], delai: number, flux: number, calcul: string): PosteNormatif => {
    const coefficient = auDixMillieme(flux / caHt);
    return { code, libelle, sens, delai, flux, coefficient, jours: auCentime(delai * coefficient), calcul };
  };
  const postes: PosteNormatif[] = [
    poste("stock", "Stock de composants", "besoin", delais.stock, consommation, "consommation de composants HT ÷ chiffre d'affaires HT"),
    poste("campustech", "Clients : CampusTech", "besoin", delais.campustech, campustechTtc, "ventes TTC à CampusTech ÷ chiffre d'affaires HT"),
    poste("particuliers", "Clients : les particuliers", "besoin", 0, particuliersTtc, "ventes TTC aux particuliers ÷ chiffre d'affaires HT"),
    poste("tva-deductible", "TVA déductible", "besoin", DELAI_DE_LA_TVA, tvaDeductible, "TVA sur les composants et les autres coûts ÷ chiffre d'affaires HT"),
    poste("fournisseur", "Fournisseur de composants", "ressource", delais.fournisseur, achatsTtc, "achats de composants TTC ÷ chiffre d'affaires HT"),
    poste("tva-collectee", "TVA collectée", "ressource", DELAI_DE_LA_TVA, tvaCollectee, "TVA collectée ÷ chiffre d'affaires HT"),
  ];
  const besoins = auCentime(postes.filter((p) => p.sens === "besoin").reduce((s, p) => s + p.jours, 0));
  const ressources = auCentime(postes.filter((p) => p.sens === "ressource").reduce((s, p) => s + p.jours, 0));
  const joursVariables = auCentime(besoins - ressources);
  const unJour = auCentime(caHt / 360);
  const partVariable = auCentime((joursVariables * caHt) / 360);

  // La part fixe : les dettes sociales de la paie d'un mois, à leur délai.
  const b = bulletinDePaie(f.paie.brut, f.tauxDeLaPaie);
  const salairesNets = auCentime((b.netAPayer * DELAI_DES_SALAIRES_NETS) / JOURS_DU_MOIS_COMMERCIAL);
  const cotisations = auCentime((b.aVerser.total * DELAI_DES_COTISATIONS) / JOURS_DU_MOIS_COMMERCIAL);
  const partFixe = auCentime(salairesNets + cotisations);
  const bfre = auCentime(partVariable - partFixe);
  return {
    delais,
    ventes,
    enceintes,
    caHt,
    unJour,
    campustechTtc,
    particuliersTtc,
    consommation,
    achatsTtc,
    autresCouts,
    tvaDeductible,
    tvaCollectee,
    postes,
    poste: (code: CodeDuPoste) => postes.find((p) => p.code === code)!,
    besoins,
    ressources,
    joursVariables,
    partVariable,
    paie: { netAPayer: b.netAPayer, aVerser: b.aVerser.total, salairesNets, cotisations },
    partFixe,
    bfre,
    /** Le besoin, part fixe comprise, en jours de chiffre d'affaires hors taxes, au centième. */
    bfreEnJours: auCentime((bfre / caHt) * 360),
  };
}

export type BfrNormatif = ReturnType<typeof bfrNormatif>;

/** Le besoin d'exploitation lu au bilan fonctionnel du 31 décembre (la photo), celui de « Bilan fonctionnel et BFR ». */
export const besoinAuBilan = (f: FicheDeLExercice = EXERCICE_DE_NOVA) => cloture(f).fonctionnel.besoinDExploitation;

/** Le plus petit délai fournisseur, au jour près, où les ressources variables couvrent les besoins variables. */
export function delaiFournisseurQuiCouvre(x: BfrNormatif = bfrNormatif()) {
  const f = x.poste("fournisseur");
  const reste = auCentime(x.besoins - x.poste("tva-collectee").jours);
  return Math.ceil(reste / f.coefficient - 1e-9);
}

/** Le besoin normatif après une croissance du chiffre d'affaires, à structure et délais constants : la part variable suit, la part fixe non. */
export function apresCroissance(x: BfrNormatif = bfrNormatif(), croissance = CROISSANCE_NORMATIVE) {
  const caHt = auCentime(x.caHt * (1 + croissance));
  const partVariable = auCentime((x.joursVariables * caHt) / 360);
  const bfre = auCentime(partVariable - x.partFixe);
  return { caHt, partVariable, bfre, supplement: auCentime(bfre - x.bfre), hausse: (bfre - x.bfre) / x.bfre };
}

/** Les écarts au secteur, poste par poste, en jours de leur flux (positif : NOVA est au-dessus du secteur). */
export function ecartsAuSecteur(x: BfrNormatif = bfrNormatif()) {
  return {
    stock: x.delais.stock - SECTEUR.stock,
    clients: x.delais.campustech - SECTEUR.clients,
    fournisseurs: x.delais.fournisseur - SECTEUR.fournisseurs,
    bfre: auCentime(x.bfreEnJours - SECTEUR.bfre),
  };
}

/**
 * LE CAS « CAMPUSTECH DOUBLE SA COMMANDE » (hypothèse du cas) : CampusTech propose 640 enceintes par mois
 * au lieu de 320, toujours payées comme aujourd'hui. Les particuliers ne changent pas.
 */
export const COMMANDE_DOUBLEE: StructureDesVentes = { particuliers: ANNEE_TYPE.particuliers, campustech: 2 * ANNEE_TYPE.campustech };
