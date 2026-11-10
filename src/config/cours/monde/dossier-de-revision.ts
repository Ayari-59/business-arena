import { aLUnite, nombreAuCentieme, pct, produit2, qte } from "../../../pedagogy/cours/deux-decimales";
import { auCentime } from "./amortissement";
import { impotDuBenefice, resultatFiscal } from "./finance";
import { HYPOTHESES_DU_REALISE, salariesDeLAnnee } from "./masse-salariale-de-nova";
import { NOVA_CAPACITE, QUALITE } from "./nova-capacite";
import { qualiteAuBudget } from "./production-et-logistique";
import { EXERCICE_N1_DE_NOVA, MAJORATION_DE_RETARD } from "./projets-et-financement";
import { TAUX_PATRONAL } from "./ressources-humaines-de-nova";

/**
 * LE MONDE DU COURS : LE DOSSIER DE RÉVISION DE NOVA À LA CLÔTURE DE N + 1 (le chapitre « Le dossier
 * de révision : contrôler l'inventaire, cycle par cycle » et son cas ; BTS CG P2 2.3.5, et les manques
 * de 2.3.1 et 2.3.3).
 *
 * UNE SEULE NOVA : LE RÉSULTAT QUI SORT DU DOSSIER EST CELUI DU CHAPITRE DE L'IMPÔT. Le second exercice
 * de NOVA gagne 118 460 € avant impôt (projets-et-financement.ts, EXERCICE_N1_DE_NOVA), le résultat
 * que « L'impôt sur les sociétés » lit. Ce fichier ne le change pas : il dit d'où il vient. La balance
 * de N + 1 avant révision porte un résultat provisoire plus haut ; les travaux de révision (le compte
 * d'attente, les congés payés, la participation, la provision pour amende, la dépréciation des
 * batteries, la provision pour garantie) le ramènent, au centime, à 118 460 €. Le résultat
 * provisoire se calcule donc à rebours : 118 460 € plus les charges de la révision.
 *
 * Les travaux d'inventaire déjà enseignés ailleurs (l'amortissement des deux lignes, les
 * régularisations, la reprise des risques de N) sont faits avant la révision : le dossier les relit,
 * il ne les refait pas.
 *
 * LES HYPOTHÈSES DU CHAPITRE sont les constantes ci-dessous, chacune nommée et commentée. La garde
 * tests/cours/le-dossier-de-revision.test.ts refait chaque chiffre à la main.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LE COMPTE D'ATTENTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE COMPTE D'ATTENTE 471 AU 31 DÉCEMBRE N + 1 (hypothèse du cours), deux lignes saisies faute de pièce :
 *   · au crédit, 3 600 € reçus par virement le 29 décembre, au libellé illisible. La révision les
 *     identifie : un acompte du comité social d'une entreprise de la région, pour 60 enceintes à livrer
 *     en janvier N + 2. Une vente de biens n'est pas faite tant qu'ils ne sont pas livrés : c'est un
 *     acompte reçu sur commande (4191), pas une vente, et sans TVA, qui naît à la livraison ;
 *   · au débit, 180 € prélevés par la banque le 31 décembre, sans pièce : l'avis de la banque, retrouvé,
 *     dit des frais de tenue de compte et de virement du semestre (627), exonérés de TVA.
 */
export const COMPTE_D_ATTENTE = {
  acompte: { montant: 3_600, date: "29 décembre", de: "le comité social d'une entreprise de la région", enceintes: 60 },
  frais: { montant: 180, date: "31 décembre" },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LES CONGÉS PAYÉS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA DETTE DE CONGÉS PAYÉS AU 31 DÉCEMBRE N + 1 (hypothèse du cours). La période de référence court du
 * 1er juin au 31 mai. Au 31 décembre, chaque salarié a acquis des congés depuis le 1er juin qu'il n'a
 * pas encore pris (les congés de Noël se prennent sur la période précédente) : une dette de N + 1, que
 * le cours mesure par la règle du dixième, sur le brut de juin à décembre (le réalisé de N + 1,
 * masse-salariale-de-nova.ts), et ses cotisations patronales, au taux du cours (42 %).
 * Le premier exercice ne l'a pas constatée (la clôture de N, dans le cours, la laisse de côté) : le
 * dossier de N + 1 la pose pour la première fois.
 */
export const PREMIER_MOIS_DE_LA_PERIODE = 6;
export const REGLE_DU_DIXIEME = 0.1;
export const CONGES_DEJA_PRIS_SUR_LA_PERIODE = 0;

// ─────────────────────────────────────────────────────────────────────────────
// LA PARTICIPATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA PARTICIPATION DE N + 1 (hypothèse du cours, montant donné comme le référentiel le veut) : NOVA,
 * moins de 50 salariés, n'y est pas tenue ; le président signe en N + 1 un accord de participation
 * volontaire, et le cabinet calcule la réserve spéciale de l'exercice : 6 000 €, due aux salariés
 * (691, 4284).
 * LE FORFAIT SOCIAL : aucun chez NOVA, la participation des entreprises de moins de 50 salariés en est
 * exonérée ; une entreprise de 50 salariés ou plus paierait 20 % (la variante du chapitre).
 * // À VÉRIFIER : exonération de forfait social de la participation sous 50 salariés (loi PACTE, 2019) ;
 * // taux normal du forfait social, 20 %.
 */
export const PARTICIPATION_DE_N_PLUS_1 = 6_000;
export const TAUX_DU_FORFAIT_SOCIAL = 0.2; // À VÉRIFIER
/** Le seuil d'effectif sous lequel la participation est exonérée de forfait social. // À VÉRIFIER */
export const SEUIL_DU_FORFAIT_SOCIAL = 50;
export const FORFAIT_SOCIAL_DE_NOVA = 0;

// ─────────────────────────────────────────────────────────────────────────────
// LA PROVISION POUR AMENDE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA MAJORATION CONTESTÉE (hypothèse du cours, sur la majoration de projets-et-financement.ts) : la
 * déclaration de TVA de mars N + 1, déposée en retard, a valu à NOVA une majoration de 480 €. NOVA l'a
 * contestée : la déclaration serait partie à temps, mais l'accusé de réception du portail n'a pas été
 * archivé. Au 31 décembre, l'administration n'a pas répondu, et l'expert-comptable juge probable que
 * la majoration soit maintenue : une provision pour amendes et pénalités (1514), au montant probable.
 * C'est la charge que « L'impôt sur les sociétés » réintègre : une pénalité ne se déduit pas, même
 * provisionnée.
 */
export const MAJORATION_CONTESTEE = MAJORATION_DE_RETARD;

// ─────────────────────────────────────────────────────────────────────────────
// LA DÉPRÉCIATION DU STOCK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES BATTERIES DE L'ANCIEN MODÈLE (hypothèse du cours) : après l'incendie de novembre N (le litige du
 * cours), NOVA a changé de modèle de batterie. Au 31 décembre N + 1, 500 batteries de l'ancien modèle
 * restent au stock de matières, à leur coût d'achat de 6 € ; elles ne serviront plus. Un recycleur les
 * reprend à 1,20 € : leur valeur actuelle. Le stock garde son coût, la dépréciation constate l'écart.
 */
export const BATTERIES_DE_L_ANCIEN_MODELE = { quantite: 500, coutUnitaire: 6, prixDeReprise: 1.2 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// LA PROVISION POUR GARANTIE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA GARANTIE DONNÉE AUX CLIENTS (hypothèse du cours) : chaque enceinte est garantie un an. La qualité
 * de N + 1 est celle du cours (production-et-logistique.ts, au budget de prévention actuel) : 26 000
 * enceintes, 3,5 % de défauts, 80 % trouvés au contrôle ; les autres partent chez le client et
 * reviennent sous garantie, 100 € chacun (nova-capacite.ts). Au 31 décembre, la moitié de ces retours
 * est encore à venir : les ventes s'étalent sur l'année, et une enceinte vendue en décembre reste
 * garantie jusqu'en décembre N + 2. La provision couvre ces retours à venir.
 */
export const PART_DES_RETOURS_A_VENIR = 0.5;

// ─────────────────────────────────────────────────────────────────────────────
// LE DOSSIER
// ─────────────────────────────────────────────────────────────────────────────

/** Les estimations que le laboratoire fait varier : la part des retours à venir, le prix de reprise des batteries. */
export interface EstimationsDeLaRevision {
  partDesRetoursAVenir: number;
  prixDeReprise: number;
}

export const ESTIMATIONS_DU_DOSSIER: EstimationsDeLaRevision = { partDesRetoursAVenir: PART_DES_RETOURS_A_VENIR, prixDeReprise: BATTERIES_DE_L_ANCIEN_MODELE.prixDeReprise };

/** Le brut de N + 1 mois par mois, toute l'équipe : le réalisé de masse-salariale-de-nova.ts. */
export function brutDesMois() {
  const salaries = salariesDeLAnnee(HYPOTHESES_DU_REALISE);
  return Array.from({ length: 12 }, (_, i) => auCentime(salaries.reduce((t, x) => t + x.nombre * x.salaires[i]!, 0)));
}

/** La dette de congés payés : le dixième du brut de la période, moins les congés déjà pris, et ses cotisations patronales. */
export function congesPayes() {
  const mois = brutDesMois();
  const brutDeLaPeriode = auCentime(mois.slice(PREMIER_MOIS_DE_LA_PERIODE - 1).reduce((t, x) => t + x, 0));
  const dette = auCentime(brutDeLaPeriode * REGLE_DU_DIXIEME - CONGES_DEJA_PRIS_SUR_LA_PERIODE);
  const charges = auCentime(dette * TAUX_PATRONAL);
  const effectif = salariesDeLAnnee(HYPOTHESES_DU_REALISE).reduce((t, x) => t + (x.salaires[11]! > 0 ? x.nombre : 0), 0);
  return { brutDeLaPeriode, dette, charges, total: auCentime(dette + charges), tauxPatronal: TAUX_PATRONAL, effectif };
}

/** Les batteries : leur coût, leur valeur actuelle, la dépréciation. */
export function batteries(prixDeReprise: number = BATTERIES_DE_L_ANCIEN_MODELE.prixDeReprise) {
  const b = BATTERIES_DE_L_ANCIEN_MODELE;
  const cout = auCentime(b.quantite * b.coutUnitaire);
  const valeurActuelle = auCentime(b.quantite * prixDeReprise);
  return { ...b, prixDeReprise, cout, valeurActuelle, depreciation: auCentime(Math.max(0, cout - valeurActuelle)) };
}

/** La garantie : les défauts livrés de l'année, les retours encore à venir (à l'unité), la provision. */
export function garantie(part: number = PART_DES_RETOURS_A_VENIR) {
  const q = qualiteAuBudget(NOVA_CAPACITE);
  const cout = QUALITE.coutDUnDefautLivre;
  // Des retours se comptent à l'unité : le calcul à deux décimales, puis l'unité la plus proche (deux-decimales.ts).
  const retoursCalcules = produit2(q.livres, part);
  const retoursAVenir = aLUnite(retoursCalcules);
  return { volume: q.volume, tauxDeDefaut: q.tauxDeDefaut, tauxDeDetection: q.tauxDeDetection, defautsLivres: q.livres, part, retoursCalcules, retoursAVenir, coutDUnRetour: cout, provision: produit2(retoursAVenir, cout) };
}

/** Le calcul des retours à venir, tel que le corrigé l'écrit : « 182 × 75 % = 136,50, soit 137 retours… ». */
export const retoursEcrits = (g: Pick<ReturnType<typeof garantie>, "defautsLivres" | "part" | "retoursCalcules" | "retoursAVenir">) =>
  `${qte(g.defautsLivres)} × ${pct(g.part * 100)} = ${g.retoursCalcules === g.retoursAVenir ? qte(g.retoursAVenir) : `${nombreAuCentieme(g.retoursCalcules)}, soit ${qte(g.retoursAVenir)} retours à l'unité la plus proche : un retour ne se fractionne pas`}`;

/** L'impôt de N + 1 pour un résultat avant impôt : les réintégrations du chapitre de l'impôt, le taux réduit. */
export function impotDeNPlus1(resultatAvantImpot: number) {
  const base = resultatFiscal({ ...EXERCICE_N1_DE_NOVA, resultatComptable: resultatAvantImpot });
  return { resultatFiscal: base, impot: impotDuBenefice(base, true).impot };
}

/**
 * LE DOSSIER DE RÉVISION, travail par travail : ce que chacun retire du résultat, le résultat
 * provisoire (à rebours), et le résultat révisé, à des estimations données. Aux estimations du
 * dossier, le résultat révisé est celui d'EXERCICE_N1_DE_NOVA.
 */
export function dossierDeRevision(e: EstimationsDeLaRevision = ESTIMATIONS_DU_DOSSIER) {
  const cp = congesPayes();
  const dossier = {
    frais: COMPTE_D_ATTENTE.frais.montant,
    conges: cp.total,
    participation: PARTICIPATION_DE_N_PLUS_1,
    amende: MAJORATION_CONTESTEE,
    batteries: batteries(ESTIMATIONS_DU_DOSSIER.prixDeReprise).depreciation,
    garantie: garantie(ESTIMATIONS_DU_DOSSIER.partDesRetoursAVenir).provision,
  };
  const chargesDuDossier = auCentime(Object.values(dossier).reduce((t, x) => t + x, 0));
  const resultatProvisoire = auCentime(EXERCICE_N1_DE_NOVA.resultatComptable + chargesDuDossier);
  const travaux = { ...dossier, batteries: batteries(e.prixDeReprise).depreciation, garantie: garantie(e.partDesRetoursAVenir).provision };
  const charges = auCentime(Object.values(travaux).reduce((t, x) => t + x, 0));
  const resultatRevise = auCentime(resultatProvisoire - charges);
  const i = impotDeNPlus1(resultatRevise);
  return {
    travaux,
    charges,
    resultatProvisoire,
    resultatRevise,
    resultatFiscal: i.resultatFiscal,
    impot: i.impot,
    resultatNet: auCentime(resultatRevise - i.impot),
    acompteAReclasser: COMPTE_D_ATTENTE.acompte.montant,
    soldeDuCompteDAttente: auCentime(COMPTE_D_ATTENTE.acompte.montant - COMPTE_D_ATTENTE.frais.montant),
  };
}

export type DossierDeRevision = ReturnType<typeof dossierDeRevision>;
