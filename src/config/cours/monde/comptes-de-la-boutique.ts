import { chargesFixesDuMois, indicateursDuMois, referenceDe, seuilDuPointDeVente } from "./boutique";
import type { CodeDeFournisseur, CodeDeReference, FicheDeLaBoutique } from "./maille-et-co";

/**
 * LES COMPTES DE MAILLE & CO : LA FACTURE, L'EXERCICE, LE BILAN ET LA RÉNOVATION (BTS MCO, bloc 3).
 *
 * La fiche de la boutique (monde/maille-et-co.ts) dit un mois, janvier N, et un trimestre. Les quatre
 * chapitres de la gestion et de la finance du point de vente (« Facturer et se faire payer », « Le
 * compte de résultat de la boutique », « Le bilan et le BFR de la boutique », « Rénover la boutique »)
 * ont besoin de ce que la fiche ne dit pas : une facture à un comité d'entreprise, l'exercice N − 1
 * clos le 31 décembre (et N − 2 pour comparer), le bilan à cette date, un projet d'investissement et
 * son financement. Tout est ici, en constantes nommées et commentées, et se calcule en fonctions
 * pures sur la fiche. La garde tests/cours/comptes-de-la-boutique.test.ts refait chaque chiffre.
 *
 * CE QUI VIENT DE LA FICHE, ET NE S'ÉCRIT DONC PAS ICI. Les articles vendus de N − 2 et N − 1 (la
 * série des trois années passées), le prix moyen d'un article en N − 1 (celui de janvier N − 1 :
 * 89 600 € pour 1 600 articles, 56 €), les charges du mois (loyer et ses frais, publicité,
 * entretien, usure du rayonnage) et la paie de l'équipe (14 342 € par mois) multipliées par douze,
 * le stock au 31 décembre N − 1 (le stock du 1er janvier N, référence par référence, à son coût
 * d'achat : 24 990 €), le délai de règlement des comités et celui des façonniers, le taux de TVA,
 * les prix et les coûts de la gamme, la marge du mois et ce que cinq jours de fermeture en font perdre
 * (le cas « Fermé pour travaux »).
 *
 * CE QUI EST CHOISI (hypothèses du cours, chacune dite à sa place) : le prix moyen de N − 2, le coût
 * d'achat moyen d'un article, la part de taxes locales dans les frais du loyer, la paie et le loyer de
 * N − 2, la provision pour litige, l'immobilisation du droit au bail, le capital et l'emprunt (ceux du
 * cas figé de la boutique, cas-des-entreprises.ts), les créances et les dettes de fin d'année, les
 * conditions des banques, le projet de rénovation.
 *
 * L'ÉCHELLE. Janvier, un mois creux, laisse déjà 13 555 € de résultat au point de vente ; le
 * trimestre de Noël vend deux fois plus. L'exercice dégage donc un gros résultat, et la trésorerie de
 * fin d'année le garde tant que les associés ne se le sont pas versé : c'est la question du bilan.
 *
 * CONVENTIONS : tout est hors taxes, sauf les créances, les dettes et ce que la banque finance (toutes
 * taxes comprises). Les intérêts de la banque se comptent sur une année de 360 jours, comme la banque
 * les compte ; les délais de paiement sur le calendrier (une année N non bissextile).
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const plafond = (x: number) => Math.ceil(x - 1e-9);
const plancher = (x: number) => Math.floor(x + 1e-9);

/** L'année de la banque : 360 jours (intérêts du découvert, de l'escompte, de l'affacturage). */
export const JOURS_DE_LA_BANQUE = 360;

// ═════════════════════════════════════════════════════════════════════════════
// 1. LA FACTURE D'UN COMITÉ D'ENTREPRISE, ET SON RÈGLEMENT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LA COMMANDE DE FÉVRIER D'UN COMITÉ D'ENTREPRISE (hypothèse du cours) : 50 articles, la composition
 * des commandes de janvier ramenée au quart (20 pulls col rond, 5 mérinos, 15 écharpes, 10 bonnets),
 * facturée le 10 février aux prix de la gamme. C'est la première commande qui atteint le seuil de la
 * remise des nouvelles conditions de vente.
 */
export const COMMANDE_DU_COMITE = {
  lignes: [
    { reference: "col-rond", quantite: 20 },
    { reference: "merinos", quantite: 5 },
    { reference: "echarpe", quantite: 15 },
    { reference: "bonnet", quantite: 10 },
  ] as readonly { reference: CodeDeReference; quantite: number }[],
  date: { jour: 10, mois: 2 },
} as const;

/**
 * LES NOUVELLES CONDITIONS DE VENTE AUX COMITÉS (hypothèse du cours) : une remise de 5 % à partir
 * de 50 articles commandés, et le règlement au délai de la fiche (45 jours date de facture) ; ou, au
 * choix du comité, un escompte de 2 % s'il paie comptant, à la commande. Les commandes de janvier
 * n'atteignaient pas 50 articles : elles ont été facturées au prix de la gamme.
 */
export const CONDITIONS_DE_VENTE = { seuilDeLaRemise: 50, remise: 0.05, escompte: 0.02 } as const;

/**
 * LES DÉLAIS LÉGAUX DE PAIEMENT ENTRE PROFESSIONNELS (code de commerce, article L441-10, en vigueur en
 * 2026) : 60 jours à compter de la date d'émission de la facture, ou 45 jours fin de mois si les deux
 * parties l'ont écrit au contrat. Un comité d'entreprise achète pour ses salariés : c'est un acheteur
 * professionnel, ces plafonds s'appliquent.
 */
export const DELAIS_LEGAUX = { dateDeFacture: 60, finDeMois: 45 } as const;

/**
 * LES PÉNALITÉS DE RETARD (code de commerce, article L441-10) : au taux de la facture, au moins trois
 * fois le taux d'intérêt légal ; à défaut, le taux de refinancement de la Banque centrale européenne
 * majoré de 10 points. S'y ajoute une indemnité forfaitaire pour frais de recouvrement de 40 €. Le
 * taux et l'indemnité doivent figurer sur la facture.
 */
// À VÉRIFIER : le taux de refinancement de la BCE retenu pour 2026 (2,15 %, celui de juin 2025).
export const TAUX_DE_LA_BCE = 0.0215;
export const MAJORATION_DES_PENALITES = 0.1;
export const INDEMNITE_FORFAITAIRE = 40;

/** LE RETARD (hypothèse du cours) : le comité paie 30 jours après l'échéance, sans avoir pris l'escompte. */
export const RETARD_DU_COMITE = 30;

/**
 * LE FINANCEMENT D'UNE CRÉANCE PAR LA BANQUE DE LA BOUTIQUE (hypothèses du cours, conditions d'une
 * banque de centre-ville en 2026). Le découvert autorisé coûte 7,5 % l'an sur les jours utilisés.
 * L'escompte d'une lettre de change relevé (LCR) avance la créance au taux de 6 %, plus une
 * commission de 8 € par effet. L'affacturage avance la créance au taux de 6,2 %, plus une commission
 * de 0,9 % du montant toutes taxes comprises ; il garantit en échange l'impayé et se charge du
 * recouvrement. Tous comptent les intérêts sur les jours qui restent jusqu'à l'échéance.
 */
export const BANQUE_DE_LA_BOUTIQUE = {
  decouvert: { taux: 0.075 },
  escompte: { taux: 0.06, commissionParEffet: 8 },
  affacturage: { taux: 0.062, commission: 0.009 },
} as const;

export type ModeDeFinancement = "decouvert" | "escompte" | "affacturage";

/**
 * LES MODES DE RÈGLEMENT D'UN COMITÉ (hypothèses du cours pour les coûts, tarifs de la banque de la
 * boutique). Les espèces sont exclues : entre professionnels, un paiement en espèces est plafonné à
 * 1 000 € (code monétaire et financier, article D112-3).
 */
export const MODES_DE_REGLEMENT = [
  { code: "virement", libelle: "Virement", cout: "0,20 € par virement reçu", quand: "à l'échéance, sur le compte", risque: "le comité peut ne pas l'émettre" },
  { code: "lcr", libelle: "Lettre de change relevé (LCR)", cout: "0,90 € par effet", quand: "à l'échéance, à l'initiative de la boutique", risque: "le comité peut refuser l'effet à l'échéance" },
  { code: "cheque", libelle: "Chèque", cout: "aucun, mais une remise en banque", quand: "après sa remise en banque", risque: "le chèque sans provision" },
  { code: "carte", libelle: "Carte bancaire", cout: "0,8 % du montant", quand: "à la commande, garanti", risque: "aucun, une fois la carte acceptée" },
] as const;

/** Le nombre de jours de chaque mois d'une année non bissextile. */
const JOURS_DES_MOIS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;
const NOMS_DES_MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"] as const;

export interface DateDuCalendrier {
  jour: number;
  mois: number;
}

/** Une date plus un nombre de jours, sur le calendrier d'une année non bissextile. */
export function plusDeJours(d: DateDuCalendrier, jours: number): DateDuCalendrier {
  let jour = d.jour + jours;
  let mois = d.mois;
  while (jour > JOURS_DES_MOIS[(mois - 1) % 12]!) {
    jour -= JOURS_DES_MOIS[(mois - 1) % 12]!;
    mois += 1;
  }
  return { jour, mois };
}

/** Le dernier jour du mois d'une date. */
export const finDeMois = (d: DateDuCalendrier): DateDuCalendrier => ({ jour: JOURS_DES_MOIS[(d.mois - 1) % 12]!, mois: d.mois });

/** « 27 mars », « 1er avril ». */
export const dateEcrite = (d: DateDuCalendrier) => `${d.jour === 1 ? "1er" : d.jour} ${NOMS_DES_MOIS[(d.mois - 1) % 12]}`;

/** Les jours entre deux dates de la même année. */
export function joursEntre(a: DateDuCalendrier, b: DateDuCalendrier) {
  const rang = (d: DateDuCalendrier) => somme(JOURS_DES_MOIS.slice(0, d.mois - 1)) + d.jour;
  return rang(b) - rang(a);
}

/** Les leviers de la facture : le taux de remise et celui de l'escompte (0 : pas d'escompte). */
export interface LeviersDeLaFacture {
  remise: number;
  escompte: number;
}

/**
 * LA FACTURE DU COMITÉ. Montant brut = quantités × prix de la gamme ; la remise s'applique au brut
 * (net commercial) ; l'escompte, réduction financière pour paiement comptant, au net commercial (net
 * financier). La TVA se calcule sur le net financier : c'est la base imposable (la somme réellement
 * payée, hors taxes). Sans escompte, le net financier est le net commercial.
 */
export function factureDuComite(f: FicheDeLaBoutique, leviers: Partial<LeviersDeLaFacture> = {}) {
  const lignes = COMMANDE_DU_COMITE.lignes.map((l) => {
    const r = referenceDe(f, l.reference);
    return { reference: l.reference, nom: r.nom, quantite: l.quantite, prixHt: r.prixHt, montant: auCentime(l.quantite * r.prixHt) };
  });
  const articles = somme(lignes.map((l) => l.quantite));
  const tauxDeRemise = leviers.remise ?? (articles >= CONDITIONS_DE_VENTE.seuilDeLaRemise ? CONDITIONS_DE_VENTE.remise : 0);
  const tauxDEscompte = leviers.escompte ?? 0;
  const brut = auCentime(somme(lignes.map((l) => l.montant)));
  const remise = auCentime(brut * tauxDeRemise);
  const netCommercial = auCentime(brut - remise);
  const escompte = auCentime(netCommercial * tauxDEscompte);
  const netFinancier = auCentime(netCommercial - escompte);
  const tauxTva = f.gamme[0]!.tauxTva;
  const tva = auCentime(netFinancier * tauxTva);
  return { lignes, articles, tauxDeRemise, tauxDEscompte, brut, remise, netCommercial, escompte, netFinancier, tauxTva, tva, ttc: auCentime(netFinancier + tva) };
}

/** Le délai de règlement des comités, celui de la fiche. */
export const delaiDesComites = (f: FicheDeLaBoutique) => f.clienteles.find((c) => c.code === "comites")!.delaiDeReglement;

/** L'échéance de la facture au délai convenu, et les deux plafonds légaux. */
export function echeancesDeLaFacture(f: FicheDeLaBoutique) {
  const emission = COMMANDE_DU_COMITE.date;
  const convenue = plusDeJours(emission, delaiDesComites(f));
  const plafondDateDeFacture = plusDeJours(emission, DELAIS_LEGAUX.dateDeFacture);
  // 45 jours fin de mois : la pratique la plus courante ajoute 45 jours, puis va à la fin du mois.
  const plafondFinDeMois = finDeMois(plusDeJours(emission, DELAIS_LEGAUX.finDeMois));
  return { emission, convenue, plafondDateDeFacture, plafondFinDeMois, joursAuPlafondFinDeMois: joursEntre(emission, plafondFinDeMois) };
}

/** Le taux des pénalités de retard : le taux de la BCE majoré de 10 points. */
export const tauxDesPenalites = () => TAUX_DE_LA_BCE + MAJORATION_DES_PENALITES;

/**
 * Les pénalités d'un retard : montant toutes taxes comprises × taux × jours de retard ÷ 365 (le code
 * de commerce compte sur l'année civile), plus l'indemnité forfaitaire de 40 €.
 */
export function penalitesDeRetard(ttc: number, joursDeRetard: number) {
  const taux = tauxDesPenalites();
  const penalites = auCentime((ttc * taux * joursDeRetard) / 365);
  return { taux, joursDeRetard, penalites, indemnite: INDEMNITE_FORFAITAIRE, total: auCentime(penalites + INDEMNITE_FORFAITAIRE) };
}

/**
 * Ce que coûte de financer une créance toutes taxes comprises sur un nombre de jours : intérêts =
 * montant × taux × jours ÷ 360 ; plus la commission de l'escompte (par effet) ou de l'affacturage
 * (en part du montant). La TVA se finance aussi : la boutique la doit à l'État dès la facture, avant
 * de l'encaisser.
 */
export function coutDuFinancement(ttc: number, jours: number, mode: ModeDeFinancement) {
  const b = BANQUE_DE_LA_BOUTIQUE;
  const taux = b[mode].taux;
  const interets = auCentime((ttc * taux * jours) / JOURS_DE_LA_BANQUE);
  const commission = mode === "escompte" ? b.escompte.commissionParEffet : mode === "affacturage" ? auCentime(ttc * b.affacturage.commission) : 0;
  return { mode, taux, jours, interets, commission, cout: auCentime(interets + commission) };
}

/**
 * L'escompte face au crédit accordé. Escompter coûte la réduction hors taxes (la TVA en moins, la
 * boutique la reverse en moins à l'État) ; attendre coûte le financement de la créance toutes taxes
 * comprises jusqu'à l'échéance. Le taux annuel de l'escompte rapporte la réduction à ce que le comité
 * paie comptant, sur l'année de la banque.
 */
export function escompteOuCredit(f: FicheDeLaBoutique, leviers: { escompte?: number; jours?: number; mode?: ModeDeFinancement } = {}) {
  const tauxDEscompte = leviers.escompte ?? CONDITIONS_DE_VENTE.escompte;
  const jours = leviers.jours ?? delaiDesComites(f);
  const aTerme = factureDuComite(f);
  const comptant = factureDuComite(f, { escompte: tauxDEscompte });
  const financement = coutDuFinancement(aTerme.ttc, jours, leviers.mode ?? "decouvert");
  const coutDeLEscompte = comptant.escompte;
  return {
    aTerme,
    comptant,
    jours,
    tauxDEscompte,
    financement,
    coutDeLEscompte,
    /** Le taux annuel de l'escompte : réduction ÷ (net commercial − réduction) × 360 ÷ jours gagnés. */
    tauxAnnuelDeLEscompte: jours > 0 ? (coutDeLEscompte / comptant.netFinancier) * (JOURS_DE_LA_BANQUE / jours) : 0,
    /** Le gain à garder le crédit et à le financer, plutôt qu'à escompter (négatif : l'escompte coûte moins). */
    gainDuCredit: auCentime(coutDeLEscompte - financement.cout),
    /** Le plus long délai où financer la créance au découvert coûte au plus l'escompte. */
    delaiQuiEgaleLEscompte: plancher((coutDeLEscompte * JOURS_DE_LA_BANQUE) / (aTerme.ttc * BANQUE_DE_LA_BOUTIQUE.decouvert.taux)),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. L'EXERCICE : LE COMPTE DE RÉSULTAT DE N − 2 ET DE N − 1
// ═════════════════════════════════════════════════════════════════════════════

export type CodeDExercice = "N-2" | "N-1";

/**
 * LES HYPOTHÈSES DE L'EXERCICE (hypothèses du cours). Le coût d'achat moyen d'un article vendu est de
 * 24,50 € les deux années, et ses autres coûts variables (emballages, étiquettes, frais de carte) de
 * 3,20 € : ceux de janvier N, arrondis (25,05 € et 3,19 €). Le prix moyen de N − 1 est celui de
 * janvier N − 1 (lu sur la fiche) ; celui de N − 2, 57,50 €, avant que la boutique ne multiplie les
 * remises. Les frais du loyer comprennent 650 € par mois de taxes locales (la cotisation foncière des
 * entreprises et la taxe sur la publicité extérieure) : au compte de résultat, ils passent en impôts et
 * taxes. En N − 2, le loyer hors taxes locales était de 12 550 € par mois (le bail a été révisé au
 * 1er janvier N − 1) et l'équipe coûtait 9 450 € bruts par mois (avant l'embauche à temps partiel et
 * les hausses de N − 1). Les stocks de fin d'année sont ceux d'un 31 décembre, après Noël.
 */
export const HYPOTHESES_DE_L_EXERCICE = {
  coutDAchatMoyen: 24.5,
  autresCoutsVariables: 3.2,
  taxesLocalesDuMois: 650,
  prixMoyenDeNMoins2: 57.5,
  loyerDuMoisDeNMoins2: 12_550,
  brutDuMoisDeNMoins2: 9_450,
  stockAu31DecembreNMoins3: 22_100,
  stockAu31DecembreNMoins2: 23_400,
} as const;

/**
 * LA PROVISION POUR LITIGE (hypothèse du cours) : un comité d'entreprise conteste une commande de
 * décembre N − 1 livrée après Noël et réclame 5 000 € de dédommagement. L'avocat de la boutique juge
 * la perte probable : le risque est né dans l'exercice, il se provisionne en N − 1 (dotation aux
 * provisions d'exploitation), même si rien n'est encore payé.
 */
export const PROVISION_POUR_LITIGE = 5_000;

/**
 * LES IMMOBILISATIONS (hypothèses du cours) : le droit au bail payé à l'ouverture, le 1er janvier
 * N − 3, 45 000 € (une immobilisation incorporelle qui ne s'use pas : elle ne s'amortit pas) ; le
 * rayonnage de la fiche, 16 000 € achetés le même jour et amortis en linéaire sur 4 ans (les 333 € par
 * mois de la fiche sont 4 000 € par an arrondis à l'euro).
 */
export const IMMOBILISATIONS = {
  droitAuBail: 45_000,
  rayonnage: { valeur: 16_000, duree: 4 },
  anneeDAcquisition: 3,
} as const;

/**
 * LE FINANCEMENT DE L'OUVERTURE (celui du cas figé de la boutique, cas-des-entreprises.ts) : 97 510 €
 * de capital et un emprunt de 70 000 € à 5,2 %, contracté le 1er janvier N − 3 et remboursé par
 * amortissements constants de 14 000 € à chaque 31 décembre, sur 5 ans. Les réserves au 31 décembre
 * N − 1 (hypothèse du cours) : 60 000 €, dont la réserve légale, déjà à son plafond (10 % du capital).
 * Les associés se sont versé, chaque année, l'essentiel du résultat de l'année d'avant.
 */
export const FINANCEMENT_DE_L_OUVERTURE = {
  capital: 97_510,
  emprunt: { capital: 70_000, taux: 0.052, remboursementAnnuel: 14_000 },
  reserves: 60_000,
} as const;

/** La réserve légale : 10 % du capital au plus, déjà atteinte. */
export const reserveLegale = () => auCentime(FINANCEMENT_DE_L_OUVERTURE.capital * 0.1);

/**
 * L'IMPÔT SUR LES SOCIÉTÉS (code général des impôts, article 219, en vigueur en 2026) : 15 % jusqu'à
 * 42 500 € de bénéfice pour une PME (chiffre d'affaires sous 10 millions d'euros, capital entièrement
 * libéré et détenu à 75 % au moins par des personnes physiques, ce qui est le cas de MAILLE & CO), 25 %
 * au-delà.
 */
export const IMPOT_SUR_LES_SOCIETES = { tauxReduit: 0.15, plafondDuTauxReduit: 42_500, tauxNormal: 0.25 } as const;

/** L'impôt sur les sociétés d'un bénéfice (rien sur une perte). */
export function impotSurLesSocietes(benefice: number) {
  const i = IMPOT_SUR_LES_SOCIETES;
  if (benefice <= 0) return 0;
  return auCentime(Math.min(benefice, i.plafondDuTauxReduit) * i.tauxReduit + Math.max(0, benefice - i.plafondDuTauxReduit) * i.tauxNormal);
}

/** Les articles vendus d'une année de la série de la fiche. */
export const articlesDeLAnnee = (f: FicheDeLaBoutique, annee: "N-3" | CodeDExercice) => somme(f.historique.filter((h) => h.annee === annee).map((h) => h.ventes));

/** Le stock du 1er janvier N (référence par référence, à son coût d'achat) : celui du 31 décembre N − 1. */
export const stockDu1erJanvier = (f: FicheDeLaBoutique) => auCentime(somme(f.gamme.map((r) => r.stockInitial * r.coutDAchat)));

/** Le capital de l'emprunt restant dû au début d'une année (rang 1 : N − 3). */
const capitalRestantAuDebut = (rang: number) => {
  const e = FINANCEMENT_DE_L_OUVERTURE.emprunt;
  return Math.max(0, e.capital - (rang - 1) * e.remboursementAnnuel);
};
/** Le rang d'un exercice depuis l'ouverture : N − 3 vaut 1. */
const rangDe = (annee: CodeDExercice) => (annee === "N-2" ? 2 : 3);

/** Les leviers du compte de résultat de N − 1 : le prix moyen, les articles vendus, une baisse de la paie. */
export interface LeviersDuCompteDeResultat {
  prixMoyen: number;
  articles: number;
  baisseDeLaPaie: number;
}

/** Les données d'un exercice : les ventes, les achats, les charges, chacune lue sur la fiche ou posée plus haut. */
export function donneesDeLExercice(f: FicheDeLaBoutique, annee: CodeDExercice) {
  const h = HYPOTHESES_DE_L_EXERCICE;
  const c = f.charges;
  const nMoins1 = annee === "N-1";
  const brutDuMois = nMoins1 ? somme(f.equipe.map((s) => s.brutMensuel)) : h.brutDuMoisDeNMoins2;
  return {
    annee,
    articles: articlesDeLAnnee(f, annee),
    prixMoyen: nMoins1 ? f.moisN1.chiffreDAffaires / f.moisN1.articles : h.prixMoyenDeNMoins2,
    coutDAchatMoyen: h.coutDAchatMoyen,
    autresCoutsVariables: h.autresCoutsVariables,
    stockInitial: nMoins1 ? h.stockAu31DecembreNMoins2 : h.stockAu31DecembreNMoins3,
    stockFinal: nMoins1 ? stockDu1erJanvier(f) : h.stockAu31DecembreNMoins2,
    loyer: 12 * (nMoins1 ? c.loyer - h.taxesLocalesDuMois : h.loyerDuMoisDeNMoins2),
    taxesLocales: 12 * h.taxesLocalesDuMois,
    publicite: 12 * c.publicite,
    entretien: 12 * c.entretien,
    salaires: 12 * brutDuMois,
    chargesSociales: auCentime(12 * brutDuMois * f.tauxPatronal),
    amortissements: IMMOBILISATIONS.rayonnage.valeur / IMMOBILISATIONS.rayonnage.duree,
    provisions: nMoins1 ? PROVISION_POUR_LITIGE : 0,
    interets: auCentime(capitalRestantAuDebut(rangDe(annee)) * FINANCEMENT_DE_L_OUVERTURE.emprunt.taux),
  };
}

/**
 * LE COMPTE DE RÉSULTAT D'UN EXERCICE, ET SES SOLDES INTERMÉDIAIRES DE GESTION.
 *   · ventes de marchandises = articles × prix moyen ; coût d'achat des marchandises vendues = articles
 *     × coût moyen ; achats = ce coût + stock final − stock initial (la variation de stock les relie) ;
 *   · marge commerciale = ventes − coût d'achat des marchandises vendues ;
 *   · valeur ajoutée = marge commerciale − consommations en provenance des tiers (autres coûts
 *     variables, loyer hors taxes locales, publicité, entretien) ;
 *   · EBE = valeur ajoutée − impôts et taxes − charges de personnel ;
 *   · résultat d'exploitation = EBE − dotations aux amortissements et aux provisions ;
 *   · résultat courant avant impôts = résultat d'exploitation − charges financières (intérêts) ;
 *   · résultat net = résultat courant − impôt sur les sociétés (pas d'opération exceptionnelle) ;
 *   · capacité d'autofinancement = résultat net + dotations (aucune reprise, aucune cession).
 */
export function compteDeResultat(f: FicheDeLaBoutique, annee: CodeDExercice = "N-1", leviers: Partial<LeviersDuCompteDeResultat> = {}) {
  const d = donneesDeLExercice(f, annee);
  const articles = leviers.articles ?? d.articles;
  const prixMoyen = leviers.prixMoyen ?? d.prixMoyen;
  const ventes = auCentime(articles * prixMoyen);
  const coutDAchatDesVendues = auCentime(articles * d.coutDAchatMoyen);
  const achats = auCentime(coutDAchatDesVendues + d.stockFinal - d.stockInitial);
  const variationDeStock = auCentime(d.stockInitial - d.stockFinal);
  const autresCoutsVariables = auCentime(articles * d.autresCoutsVariables);
  const consommationsExternes = auCentime(autresCoutsVariables + d.loyer + d.publicite + d.entretien);
  const personnel = auCentime(d.salaires + d.chargesSociales - (leviers.baisseDeLaPaie ?? 0));
  const margeCommerciale = auCentime(ventes - coutDAchatDesVendues);
  const valeurAjoutee = auCentime(margeCommerciale - consommationsExternes);
  const ebe = auCentime(valeurAjoutee - d.taxesLocales - personnel);
  const dotations = auCentime(d.amortissements + d.provisions);
  const resultatDExploitation = auCentime(ebe - dotations);
  const resultatCourant = auCentime(resultatDExploitation - d.interets);
  const impot = impotSurLesSocietes(resultatCourant);
  const resultatNet = auCentime(resultatCourant - impot);
  const chargesDExploitation = auCentime(achats + variationDeStock + consommationsExternes + d.taxesLocales + personnel + dotations);
  return {
    ...d,
    articles,
    prixMoyen,
    ventes,
    achats,
    variationDeStock,
    coutDAchatDesVendues,
    autresCoutsVariables,
    consommationsExternes,
    personnel,
    margeCommerciale,
    valeurAjoutee,
    ebe,
    dotations,
    resultatDExploitation,
    resultatCourant,
    impot,
    resultatNet,
    caf: auCentime(resultatNet + dotations),
    produitsDExploitation: ventes,
    chargesDExploitation,
    totalDesCharges: auCentime(chargesDExploitation + d.interets + impot),
    tauxDeMarqueMoyen: margeCommerciale / ventes,
    tauxDeValeurAjoutee: valeurAjoutee / ventes,
    tauxDEbe: ebe / ventes,
    rentabiliteNette: resultatNet / ventes,
    /** La marge d'un article après ses coûts variables : prix moyen − coût d'achat − autres coûts variables. */
    margeParArticle: auCentime(prixMoyen - d.coutDAchatMoyen - d.autresCoutsVariables),
  };
}

/**
 * L'ÉCART D'EBE ENTRE DEUX EXERCICES, CAUSE PAR CAUSE (les effets s'additionnent exactement) :
 *   · effet volume = articles en plus × marge commerciale d'un article de l'année d'avant ;
 *   · effet prix (les remises) = écart de prix moyen × articles de l'année ;
 *   · effet coût d'achat = −écart de coût moyen × articles de l'année (nul ici) ;
 *   · puis l'écart de chaque charge : autres coûts variables, loyer, publicité, entretien, taxes, personnel.
 */
export function ecartDEbe(f: FicheDeLaBoutique) {
  const a = compteDeResultat(f, "N-2");
  const b = compteDeResultat(f, "N-1");
  const effetVolume = auCentime((b.articles - a.articles) * (a.prixMoyen - a.coutDAchatMoyen));
  const effetPrix = auCentime((b.prixMoyen - a.prixMoyen) * b.articles);
  const effetCoutDAchat = auCentime(-(b.coutDAchatMoyen - a.coutDAchatMoyen) * b.articles);
  const effetAutresCoutsVariables = auCentime(-(b.autresCoutsVariables - a.autresCoutsVariables));
  const effetLoyer = auCentime(-(b.loyer - a.loyer));
  const effetPublicite = auCentime(-(b.publicite - a.publicite));
  const effetEntretien = auCentime(-(b.entretien - a.entretien));
  const effetTaxes = auCentime(-(b.taxesLocales - a.taxesLocales));
  const effetPersonnel = auCentime(-(b.personnel - a.personnel));
  const ecart = auCentime(b.ebe - a.ebe);
  return { a, b, ecart, effetVolume, effetPrix, effetCoutDAchat, effetAutresCoutsVariables, effetLoyer, effetPublicite, effetEntretien, effetTaxes, effetPersonnel };
}

/** Les articles qu'il aurait fallu vendre en N − 1, au prix de N − 1, pour retrouver l'EBE de N − 2. */
export function articlesPourLEbeDeNMoins2(f: FicheDeLaBoutique) {
  const a = compteDeResultat(f, "N-2");
  const b = compteDeResultat(f, "N-1");
  const fixes = auCentime(b.loyer + b.publicite + b.entretien + b.taxesLocales + b.personnel);
  return { fixes, margeParArticle: b.margeParArticle, ebeVise: a.ebe, articles: plafond((a.ebe + fixes) / b.margeParArticle) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LE BILAN AU 31 DÉCEMBRE N − 1
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LES CRÉANCES ET LES DETTES DU 31 DÉCEMBRE N − 1 (hypothèses du cours).
 *   · Les comités d'entreprise doivent les commandes de Noël facturées depuis le 16 novembre (45 jours) :
 *     32 000 € hors taxes, 38 400 € toutes taxes comprises.
 *   · Le façonnier de référence, payé à 45 jours, attend les achats de réassort du 16 novembre au
 *     31 décembre : 40 000 € hors taxes, 48 000 € toutes taxes comprises, soit 1 066,67 € d'achats
 *     toutes taxes comprises par jour de crédit.
 *   · Les dettes fiscales et sociales : les cotisations de la paie de décembre, salariales (22 % du
 *     brut, celles du cas figé) et patronales (42 %), et la TVA de décembre à reverser, 18 000 €.
 *   · L'impôt sur les sociétés de N − 1 a été payé en acomptes : il ne reste rien à payer.
 */
export const FIN_D_ANNEE = {
  creancesDesComitesHt: 32_000,
  achatsDuCreditFournisseurHt: 40_000,
  tauxDesCotisationsSalariales: 0.22,
  tvaADecaisser: 18_000,
} as const;

/** Les leviers du bilan : un dividende versé sur le résultat, et le délai du fournisseur des achats de fin d'année. */
export interface LeviersDuBilan {
  dividende: number;
  delaiFournisseur: number;
}

/** Le délai de paiement d'un façonnier de la fiche. */
export const delaiDu = (f: FicheDeLaBoutique, code: CodeDeFournisseur) => f.fournisseurs.find((x) => x.code === code)!.delaiDePaiement;

/**
 * LE BILAN COMPTABLE AU 31 DÉCEMBRE N − 1, AVANT ET APRÈS UN DIVIDENDE, ET SON BILAN FONCTIONNEL.
 * Les disponibilités sont ce qui équilibre le bilan : ce que la boutique a encaissé et pas dépensé.
 * Les dettes fournisseurs suivent le délai : achats toutes taxes comprises par jour × délai (à achats
 * égaux ; un délai plus court se paie en trésorerie). Un dividende sort des capitaux propres et des
 * disponibilités ; il ne dépasse pas le bénéfice distribuable (le résultat et les réserves libres).
 *
 * BILAN FONCTIONNEL CONDENSÉ : emplois stables = immobilisations brutes ; ressources stables = capitaux
 * propres + amortissements + provisions + emprunt ; actif circulant d'exploitation = stock + créances ;
 * passif circulant d'exploitation = dettes fournisseurs + dettes fiscales et sociales ; FRNG =
 * ressources stables − emplois stables ; BFR = actif circulant − passif circulant ; trésorerie nette =
 * FRNG − BFR = disponibilités − découverts.
 */
export function bilanDeLaBoutique(f: FicheDeLaBoutique, leviers: Partial<LeviersDuBilan> = {}) {
  const cr = compteDeResultat(f, "N-1");
  const o = FINANCEMENT_DE_L_OUVERTURE;
  const fin = FIN_D_ANNEE;
  const delaiDeReference = delaiDu(f, "faconnier");
  const delaiFournisseur = leviers.delaiFournisseur ?? delaiDeReference;
  const tva = f.gamme[0]!.tauxTva;
  const amortissementsCumules = IMMOBILISATIONS.anneeDAcquisition * cr.amortissements;
  const rayonnageNet = auCentime(IMMOBILISATIONS.rayonnage.valeur - amortissementsCumules);
  const stock = cr.stockFinal;
  const creances = auCentime(fin.creancesDesComitesHt * (1 + tva));
  const achatsParJour = (fin.achatsDuCreditFournisseurHt * (1 + tva)) / delaiDeReference;
  const dettesFournisseurs = auCentime(achatsParJour * delaiFournisseur);
  const brutDuMois = somme(f.equipe.map((s) => s.brutMensuel));
  const cotisations = auCentime(brutDuMois * (fin.tauxDesCotisationsSalariales + f.tauxPatronal));
  const dettesFiscalesEtSociales = auCentime(cotisations + fin.tvaADecaisser);
  const reservesLibres = auCentime(o.reserves - reserveLegale());
  const distribuable = auCentime(cr.resultatNet + reservesLibres);
  const dividende = Math.min(leviers.dividende ?? 0, distribuable);
  const emprunt = capitalRestantAuDebut(rangDe("N-1") + 1);
  const capitauxPropres = auCentime(o.capital + o.reserves + cr.resultatNet - dividende);
  const totalDuPassif = auCentime(capitauxPropres + PROVISION_POUR_LITIGE + emprunt + dettesFournisseurs + dettesFiscalesEtSociales);
  const disponibilites = auCentime(totalDuPassif - IMMOBILISATIONS.droitAuBail - rayonnageNet - stock - creances);
  // Le bilan fonctionnel.
  const emploisStables = IMMOBILISATIONS.droitAuBail + IMMOBILISATIONS.rayonnage.valeur;
  const ressourcesStables = auCentime(capitauxPropres + amortissementsCumules + PROVISION_POUR_LITIGE + emprunt);
  const frng = auCentime(ressourcesStables - emploisStables);
  const actifCirculant = auCentime(stock + creances);
  const passifCirculant = auCentime(dettesFournisseurs + dettesFiscalesEtSociales);
  const bfr = auCentime(actifCirculant - passifCirculant);
  const tresorerieActive = Math.max(0, disponibilites);
  const decouvert = Math.max(0, -disponibilites);
  const tresorerieNette = auCentime(tresorerieActive - decouvert);
  const dettesACourtTerme = auCentime(passifCirculant + decouvert);
  return {
    cr,
    dividende,
    distribuable,
    reservesLibres,
    delaiFournisseur,
    achatsParJour,
    // L'actif.
    droitAuBail: IMMOBILISATIONS.droitAuBail,
    rayonnageBrut: IMMOBILISATIONS.rayonnage.valeur,
    amortissementsCumules,
    rayonnageNet,
    stock,
    creances,
    disponibilites,
    totalDeLActif: auCentime(IMMOBILISATIONS.droitAuBail + rayonnageNet + stock + creances + disponibilites),
    // Le passif.
    capital: o.capital,
    reserves: o.reserves,
    resultat: cr.resultatNet,
    capitauxPropres,
    provision: PROVISION_POUR_LITIGE,
    emprunt,
    dettesFournisseurs,
    cotisations,
    tvaADecaisser: fin.tvaADecaisser,
    dettesFiscalesEtSociales,
    totalDuPassif,
    // Le bilan fonctionnel.
    emploisStables,
    ressourcesStables,
    frng,
    actifCirculant,
    passifCirculant,
    bfr,
    tresorerieActive,
    decouvert,
    tresorerieNette,
    // Les ratios.
    autonomieFinanciere: capitauxPropres / totalDuPassif,
    couvertureDesEmploisStables: ressourcesStables / emploisStables,
    liquiditeGenerale: (actifCirculant + tresorerieActive) / dettesACourtTerme,
    stockMoyen: auCentime((cr.stockInitial + cr.stockFinal) / 2),
    dureeDeStockage: ((cr.stockInitial + cr.stockFinal) / 2 / cr.coutDAchatDesVendues) * JOURS_DE_LA_BANQUE,
    /** Le plus court délai fournisseur, en jours entiers, où le BFR n'est plus un besoin (BFR ≤ 0). */
    delaiQuiAnnuleLeBfr: plafond((actifCirculant - dettesFiscalesEtSociales) / achatsParJour),
  };
}

/** LA TRÉSORERIE À GARDER APRÈS LE DIVIDENDE (hypothèse du cours) : deux mois de charges fixes du point de vente. */
export const MOIS_DE_CHARGES_A_GARDER = 2;
export const tresorerieAGarder = (f: FicheDeLaBoutique) => auCentime(MOIS_DE_CHARGES_A_GARDER * chargesFixesDuMois(f).total);

// ═════════════════════════════════════════════════════════════════════════════
// 4. RÉNOVER LA BOUTIQUE : L'INVESTISSEMENT ET SON FINANCEMENT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LE PROJET DE RÉNOVATION (hypothèses du cours, à la suite du cas « Fermé pour travaux »). Le rayonnage
 * de l'ouverture est amorti à la fin de N. Le gérant veut le remplacer au début de N + 1 par un
 * rayonnage modulable (24 000 €) et ajouter une borne de commande en ligne (6 000 €), qui retrouve en
 * boutique les tailles et les coloris manquants (les ventes manquées de la fiche). Ensemble, 30 000 €
 * hors taxes, amortis en linéaire sur 5 ans, sans valeur résiduelle.
 *   · Les ventes en plus : 500 articles par an, à la marge d'un article de N − 1 (prix moyen moins coût
 *     d'achat et autres coûts variables).
 *   · Les charges en plus : l'abonnement et la maintenance de la borne, 1 800 € par an.
 *   · La fermeture pour travaux, l'année 1 : celle du cas, 5 jours d'un mois comme janvier, ou 3 jours
 *     si la boutique paie à l'entreprise 2 500 € de supplément pour travailler le dimanche.
 *   · L'impôt : le bénéfice de la boutique dépasse 42 500 €, chaque euro de résultat en plus paie 25 %.
 *   · Le taux d'actualisation : 8 %, ce que les associés attendent d'un euro placé dans la boutique.
 */
export const PROJET_DE_RENOVATION = {
  rayonnage: 24_000,
  borne: 6_000,
  duree: 5,
  articlesEnPlus: 500,
  chargesEnPlus: 1_800,
  tauxDImpot: 0.25,
  tauxDActualisation: 0.08,
  fermeture: { jours: 5, joursAcceleres: 3, supplement: 2_500 },
} as const;

/**
 * LE FINANCEMENT PROPOSÉ (hypothèses du cours, offres de la banque de la boutique au début de N + 1).
 * Un emprunt de 30 000 € à 4,5 % sur 5 ans, remboursé par annuités constantes en fin d'année. Ou un
 * crédit-bail des mêmes équipements : 5 redevances annuelles de 7 150 € en fin d'année, puis une
 * option d'achat de 300 €. Ou l'autofinancement : la trésorerie de la boutique, qu'elle pourrait
 * sinon placer à 3 % l'an (le taux d'un compte à terme en 2026).
 */
export const FINANCEMENT_DE_LA_RENOVATION = {
  emprunt: { taux: 0.045, duree: 5 },
  creditBail: { redevance: 7_150, duree: 5, optionDAchat: 300 },
  tauxDePlacement: 0.03,
} as const;

/** Les leviers du projet : les articles en plus par an, les jours de fermeture, le taux d'actualisation. */
export interface LeviersDuProjet {
  articlesEnPlus: number;
  joursDeFermeture: number;
  tauxDActualisation: number;
}

/**
 * LE PROJET, ANNÉE PAR ANNÉE. Résultat en plus = marge des articles en plus − charges en plus −
 * amortissement (− la marge perdue pendant la fermeture et le supplément, l'année 1) ; impôt = 25 % de
 * ce résultat ; flux net de trésorerie = résultat après impôt + amortissement (une charge qui ne se
 * décaisse pas). VAN = − investissement + Σ flux ÷ (1 + taux)^année ; délai de récupération = le temps
 * où les flux cumulés rattrapent l'investissement (la dernière année au prorata).
 */
export function projetDeRenovation(f: FicheDeLaBoutique, leviers: Partial<LeviersDuProjet> = {}) {
  const p = PROJET_DE_RENOVATION;
  const investissement = p.rayonnage + p.borne;
  const amortissement = investissement / p.duree;
  const margeParArticle = compteDeResultat(f, "N-1").margeParArticle;
  const articlesEnPlus = leviers.articlesEnPlus ?? p.articlesEnPlus;
  const jours = leviers.joursDeFermeture ?? p.fermeture.jours;
  const taux = leviers.tauxDActualisation ?? p.tauxDActualisation;
  const moisPlein = seuilDuPointDeVente(f).marge;
  const margePerdue = auCentime(moisPlein - seuilDuPointDeVente(f, { joursDeFermeture: jours }).marge);
  const supplement = jours === p.fermeture.joursAcceleres ? p.fermeture.supplement : 0;
  const margeEnPlus = auCentime(articlesEnPlus * margeParArticle);
  const annees = Array.from({ length: p.duree }, (_, i) => {
    const annee = i + 1;
    const fermeture = annee === 1 ? auCentime(margePerdue + supplement) : 0;
    const resultatAvantImpot = auCentime(margeEnPlus - p.chargesEnPlus - amortissement - fermeture);
    const impot = auCentime(resultatAvantImpot * p.tauxDImpot);
    const resultatNet = auCentime(resultatAvantImpot - impot);
    const flux = auCentime(resultatNet + amortissement);
    const coefficient = (1 + taux) ** -annee;
    return { annee, fermeture, resultatAvantImpot, impot, resultatNet, flux, coefficient, actualise: auCentime(flux * coefficient) };
  });
  let cumul = 0;
  const cumuls = annees.map((a) => (cumul = auCentime(cumul + a.flux)));
  const k = cumuls.findIndex((c) => c >= investissement);
  const delaiDeRecuperation = k < 0 ? null : k + (investissement - (k > 0 ? cumuls[k - 1]! : 0)) / annees[k]!.flux;
  const van = auCentime(somme(annees.map((a) => a.actualise)) - investissement);
  return {
    investissement,
    amortissement,
    margeParArticle,
    articlesEnPlus,
    margeEnPlus,
    joursDeFermeture: jours,
    margePerdue,
    supplement,
    taux,
    annees,
    cumuls,
    delaiDeRecuperation,
    van,
    /** L'indice de profitabilité : ce que rapporte, actualisé, un euro investi. */
    indiceDeProfitabilite: (van + investissement) / investissement,
  };
}

/** Le plus haut taux d'actualisation entier, en %, où la VAN reste positive ou nulle (le TRI, arrondi en dessous). */
export function tauxQuiAnnuleLaVan(f: FicheDeLaBoutique, leviers: Partial<Omit<LeviersDuProjet, "tauxDActualisation">> = {}) {
  let t = 0;
  while (t < 100 && projetDeRenovation(f, { ...leviers, tauxDActualisation: (t + 1) / 100 }).van >= 0) t++;
  return t;
}

/**
 * L'EMPRUNT À ANNUITÉS CONSTANTES : annuité = capital × taux ÷ (1 − (1 + taux)^−durée), au centime ;
 * chaque année, intérêts = capital restant × taux, amortissement = annuité − intérêts ; la dernière
 * annuité solde le capital. Coût du crédit = la somme des intérêts.
 */
export function empruntDeLaRenovation(capital: number, taux: number = FINANCEMENT_DE_LA_RENOVATION.emprunt.taux, duree: number = FINANCEMENT_DE_LA_RENOVATION.emprunt.duree) {
  const annuite = auCentime((capital * taux) / (1 - (1 + taux) ** -duree));
  let restant = capital;
  const lignes = Array.from({ length: duree }, (_, i) => {
    const debut = restant;
    const interets = auCentime(debut * taux);
    const amortissement = i === duree - 1 ? debut : auCentime(annuite - interets);
    restant = auCentime(debut - amortissement);
    return { annee: i + 1, debut, interets, amortissement, annuite: auCentime(interets + amortissement), fin: restant };
  });
  const coutDuCredit = auCentime(somme(lignes.map((l) => l.interets)));
  return { capital, taux, duree, annuite, lignes, coutDuCredit, totalVerse: auCentime(capital + coutDuCredit) };
}

/** Le crédit-bail : ce que la boutique verse en tout, et son surcoût sur le prix des équipements. */
export function creditBailDeLaRenovation(investissement: number) {
  const c = FINANCEMENT_DE_LA_RENOVATION.creditBail;
  const total = c.redevance * c.duree + c.optionDAchat;
  return { ...c, total, surcout: auCentime(total - investissement) };
}

/** Le chiffre d'affaires de la boutique, pour dire le poids d'un chiffre : celui du mois et celui de N − 1. */
export const chiffresDeReference = (f: FicheDeLaBoutique) => ({ mois: indicateursDuMois(f).chiffreDAffaires, annee: compteDeResultat(f, "N-1").ventes });
