import { auCentime } from "./amortissement";
import { impotSurLesSocietes, type BaremeDeLImpot } from "./cloture";
import {
  ACOMPTES,
  CONDITIONS_DU_TAUX_REDUIT,
  PLAFOND_DU_REPORT_EN_ARRIERE,
  PLAFOND_DU_REPORT_EN_AVANT,
  PLAFOND_DU_TAUX_REDUIT,
  TAUX_DE_L_IMPOT_DES_PROJETS,
  TAUX_NORMAL,
  TAUX_REDUIT,
  type ActifDuProjet,
  type BilanFinancier,
  type ExerciceFiscal,
  type ProjetDInvestissement,
} from "./projets-et-financement";

/**
 * LE MODÈLE DE LA FINANCE ET DE L'IMPÔT SUR LES SOCIÉTÉS DU COURS.
 *
 * Des fonctions pures, sur la fiche monde/projets-et-financement.ts. Celles qu'un laboratoire lira
 * prennent leurs leviers en paramètres (le taux d'actualisation, la durée, les ventes, le levier,
 * le taux de la dette, le bénéfice fiscal…). Rien ici ne lit l'arène ; la garde
 * tests/cours/projets-et-financement.test.ts refait chaque chiffre à la main.
 *
 *   1. L'ACTUALISATION ET LES CRITÈRES : coefficient d'actualisation, valeur actuelle, VAN, indice
 *      de profitabilité, TRI par dichotomie, délai de récupération actualisé, taux de Fisher.
 *   2. LES FLUX D'UN PROJET : chiffre d'affaires, coûts variables, charges fixes, EBE, dotations,
 *      résultat d'exploitation, impôt sur ce résultat, flux d'exploitation, BFR et sa variation,
 *      valeur résiduelle nette d'impôt, récupération du BFR, flux de trésorerie disponibles.
 *   3. LA STRUCTURE FINANCIÈRE : MEDAF, bêta réendetté et désendetté (Hamada), CMPC, rentabilité
 *      économique et financière, effet de levier, seuil de massue, taux limite, EVA et résultat
 *      résiduel ; le bilan après un changement (un apport, un taux, un investissement) ; le coût du
 *      capital selon le levier.
 *   4. L'IMPÔT SUR LES SOCIÉTÉS : résultat fiscal, conditions et barème du taux réduit, taux
 *      effectif, acomptes et solde, report du déficit en avant (avec son plafond) et en arrière
 *      (avec sa créance), et la suite des exercices d'une entreprise.
 *
 * CONVENTIONS : les montants sont au centime (auCentime), les taux restent des fractions non
 * arrondies (aux chapitres de les arrondir pour l'élève). Les flux d'un projet sont rangés par
 * date, de 0 (le 1er janvier de la première année) à la durée (la fin de la dernière année).
 */

// ═════════════════════════════════════════════════════════════════════════════
// 1. L'ACTUALISATION ET LES CRITÈRES DE CHOIX
// ═════════════════════════════════════════════════════════════════════════════

/** Le coefficient d'actualisation de la date `annee` au taux `taux` : (1 + taux)^(−annee). */
export const coefficientDActualisation = (taux: number, annee: number) => (1 + taux) ** -annee;

/** La valeur actuelle, à la date 0, de flux rangés par date (le flux d'indice k tombe à la date k), au centime. */
export function valeurActuelle(flux: readonly number[], taux: number): number {
  return auCentime(flux.reduce((s, f, k) => s + f * coefficientDActualisation(taux, k), 0));
}

/** Les flux actualisés, date par date, au centime. */
export const fluxActualises = (flux: readonly number[], taux: number) => flux.map((f, k) => auCentime(f * coefficientDActualisation(taux, k)));

/** La valeur actuelle nette : la somme des flux actualisés, investissement (négatif) compris. */
export const van = (flux: readonly number[], taux: number) => valeurActuelle(flux, taux);

/**
 * L'indice de profitabilité : ce que rend, en valeur actuelle, chaque euro investi à la date 0.
 * IP = (VAN + investissement initial) ÷ investissement initial, où l'investissement initial est le
 * flux de la date 0 (en positif), BFR de départ compris ; les BFR des années suivantes sont dans la
 * VAN. Un IP au-dessus de 1 est une VAN positive.
 */
export function indiceDeProfitabilite(flux: readonly number[], taux: number): number {
  const mise = -flux[0]!;
  return (van(flux, taux) + mise) / mise;
}

/**
 * LE TAUX DE RENTABILITÉ INTERNE, par dichotomie : le taux qui annule la VAN. On part d'un
 * intervalle où la VAN change de signe, on le coupe en deux, et on garde la moitié où elle change
 * encore de signe, jusqu'à un intervalle plus étroit que la précision (un dix-millième de point par
 * défaut : le TRI est sûr au centième de point). Rend null si la VAN ne change pas de signe sur
 * l'intervalle (un projet sans TRI). La VAN se calcule ici sans arrondi.
 */
export function tri(flux: readonly number[], { bas = -0.99, haut = 10, precision = 1e-6 }: { bas?: number; haut?: number; precision?: number } = {}): number | null {
  const v = (t: number) => flux.reduce((s, f, k) => s + f * coefficientDActualisation(t, k), 0);
  let b = bas;
  let h = haut;
  if (v(b) * v(h) > 0) return null;
  while (h - b > precision) {
    const m = (b + h) / 2;
    if (v(b) * v(m) <= 0) h = m;
    else b = m;
  }
  return (b + h) / 2;
}

/**
 * LE DÉLAI DE RÉCUPÉRATION ACTUALISÉ, en années : la date où les flux actualisés cumulés, depuis
 * la date 0, repassent à zéro, en interpolant linéairement dans l'année où ils y repassent. Rend
 * null si le projet ne récupère jamais sa mise sur sa durée.
 */
export function delaiDeRecuperationActualise(flux: readonly number[], taux: number): number | null {
  const actualises = flux.map((f, k) => f * coefficientDActualisation(taux, k));
  let cumul = 0;
  for (let k = 0; k < actualises.length; k++) {
    const avant = cumul;
    cumul += actualises[k]!;
    if (k > 0 && avant < 0 && cumul >= 0) return k - 1 + -avant / actualises[k]!;
  }
  return null;
}

/** Les flux différentiels de deux projets, B moins A, date par date. */
export const fluxDifferentiels = (a: readonly number[], b: readonly number[]) =>
  Array.from({ length: Math.max(a.length, b.length) }, (_, k) => auCentime((b[k] ?? 0) - (a[k] ?? 0)));

/** LE TAUX D'INTERSECTION DE FISHER : le taux où deux projets ont la même VAN, le TRI de leurs flux différentiels. */
export const tauxDeFisher = (a: readonly number[], b: readonly number[], options?: Parameters<typeof tri>[1]) => tri(fluxDifferentiels(a, b), options);

/** Un taux annuel en son taux équivalent sur une période plus courte : (1 + taux)^(1 ÷ périodes) − 1. */
export const tauxEquivalent = (tauxAnnuel: number, periodesParAn: number) => (1 + tauxAnnuel) ** (1 / periodesParAn) - 1;

// ═════════════════════════════════════════════════════════════════════════════
// 2. LES FLUX D'UN PROJET
// ═════════════════════════════════════════════════════════════════════════════

/** Les leviers d'un projet : sa durée, ses ventes (en part du plan de la fiche), son taux d'impôt, un prix changé. */
export interface LeviersDuProjet {
  /** La durée du projet, en années (au plus celle de la fiche) : il s'arrête et revend ses équipements à la fin. */
  duree: number;
  /** Les quantités de chaque produit, en part de celles de la fiche (1 : le plan). */
  ventes: number;
  tauxDeLImpot: number;
  /** Un prix de vente changé, par code de produit. */
  prix: Readonly<Record<string, number>>;
}

/** La valeur nette comptable d'un équipement au bout de `annees` années pleines. */
export const valeurNetteComptable = (a: ActifDuProjet, annees: number) => auCentime(a.montant - (a.montant * Math.min(annees, a.dureeDAmortissement)) / a.dureeDAmortissement);

/**
 * La valeur résiduelle nette d'impôt d'un équipement revendu au bout de `annees` années : le prix
 * de cession (le taux de reprise × la valeur nette comptable), plus l'impôt économisé sur la
 * moins-value (ou moins l'impôt payé sur la plus-value) : prix − taux × (prix − VNC).
 */
export function valeurResiduelleNette(a: ActifDuProjet, annees: number, tauxDeLImpot: number) {
  const vnc = valeurNetteComptable(a, annees);
  const prixDeCession = auCentime(a.tauxDeReprise * vnc);
  const plusOuMoinsValue = auCentime(prixDeCession - vnc);
  const impot = auCentime(tauxDeLImpot * plusOuMoinsValue);
  return { vnc, prixDeCession, plusOuMoinsValue, impot, nette: auCentime(prixDeCession - impot) };
}

/** Une année d'exploitation du projet (la date de l'année est son rang, de 1 à la durée). */
export interface AnneeDuProjet {
  annee: number;
  chiffreDAffaires: number;
  coutsVariables: number;
  chargesFixes: number;
  excedentBrut: number;
  dotations: number;
  resultatDExploitation: number;
  impot: number;
  /** Le résultat d'exploitation après impôt, plus les dotations, qui ne sortent pas d'argent. */
  fluxDExploitation: number;
  /** Le BFR que l'année demande, constitué au début de l'année. */
  bfr: number;
}

/**
 * LES FLUX DE TRÉSORERIE DISPONIBLES D'UN PROJET, date par date, et leur détail :
 *   · chaque année : CA − coûts variables − charges fixes = EBE ; EBE − dotations = résultat
 *     d'exploitation ; l'impôt est ce résultat × le taux (négatif : une économie d'impôt) ; le flux
 *     d'exploitation est l'EBE moins cet impôt ;
 *   · la date 0 : l'investissement et le BFR de la première année ;
 *   · la date k (de 1 à la durée − 1) : le flux d'exploitation de l'année k, moins la variation du
 *     BFR de l'année k + 1 (constitué au début de cette année-là) ;
 *   · la dernière date : le flux d'exploitation, la valeur résiduelle nette des équipements, et la
 *     récupération du BFR.
 */
export function fluxDuProjet(p: ProjetDInvestissement, leviers: Partial<LeviersDuProjet> = {}) {
  const duree = Math.min(leviers.duree ?? p.duree, p.duree);
  const ventes = leviers.ventes ?? 1;
  const t = leviers.tauxDeLImpot ?? TAUX_DE_L_IMPOT_DES_PROJETS;
  const prixDe = (code: string, prix: number) => leviers.prix?.[code] ?? prix;

  const annees: AnneeDuProjet[] = Array.from({ length: duree }, (_, i) => {
    const q = (pr: ProjetDInvestissement["produits"][number]) => pr.quantites[i]! * ventes;
    const chiffreDAffaires = auCentime(p.produits.reduce((s, pr) => s + q(pr) * prixDe(pr.code, pr.prix), 0));
    const coutsVariables = auCentime(p.produits.reduce((s, pr) => s + q(pr) * pr.coutVariable, 0));
    const chargesFixes = auCentime(p.charges.reduce((s, c) => s + c.montants[i]!, 0));
    const excedentBrut = auCentime(chiffreDAffaires - coutsVariables - chargesFixes);
    const dotations = auCentime(p.actifs.reduce((s, a) => s + (i < a.dureeDAmortissement ? a.montant / a.dureeDAmortissement : 0), 0));
    const resultatDExploitation = auCentime(excedentBrut - dotations);
    const impot = auCentime(resultatDExploitation * t);
    return {
      annee: i + 1,
      chiffreDAffaires,
      coutsVariables,
      chargesFixes,
      excedentBrut,
      dotations,
      resultatDExploitation,
      impot,
      fluxDExploitation: auCentime(excedentBrut - impot),
      bfr: auCentime(chiffreDAffaires * p.partDuBfr),
    };
  });

  const investissement = auCentime(p.actifs.reduce((s, a) => s + a.montant, 0));
  /** La variation du BFR à chaque date : à la date k, le BFR de l'année k + 1 moins celui de l'année k. */
  const variationsDuBfr = Array.from({ length: duree + 1 }, (_, k) => (k < duree ? auCentime(annees[k]!.bfr - (k > 0 ? annees[k - 1]!.bfr : 0)) : 0));
  const recuperationDuBfr = duree > 0 ? annees[duree - 1]!.bfr : 0;
  const residuels = p.actifs.map((a) => ({ libelle: a.libelle, ...valeurResiduelleNette(a, duree, t) }));
  const valeurResiduelle = auCentime(residuels.reduce((s, r) => s + r.nette, 0));

  const flux = Array.from({ length: duree + 1 }, (_, k) => {
    const exploitation = k > 0 ? annees[k - 1]!.fluxDExploitation : 0;
    const fin = k === duree ? valeurResiduelle + recuperationDuBfr : 0;
    return auCentime((k === 0 ? -investissement : 0) - variationsDuBfr[k]! + exploitation + fin);
  });

  return { duree, annees, investissement, variationsDuBfr, recuperationDuBfr, residuels, valeurResiduelle, flux };
}

export type FluxDuProjet = ReturnType<typeof fluxDuProjet>;

/** Tous les critères d'un projet à un taux d'actualisation : VAN, IP, TRI, délai de récupération actualisé. */
export function criteresDuProjet(flux: readonly number[], taux: number) {
  return {
    van: van(flux, taux),
    indiceDeProfitabilite: indiceDeProfitabilite(flux, taux),
    tri: tri(flux),
    delai: delaiDeRecuperationActualise(flux, taux),
  };
}

/** La VAN d'un projet à chaque taux d'une liste : la courbe d'un laboratoire (elle n'est pas une droite). */
export const courbeDeLaVan = (flux: readonly number[], taux: readonly number[]) => taux.map((x) => ({ taux: x, van: van(flux, x) }));

// ═════════════════════════════════════════════════════════════════════════════
// 3. LA STRUCTURE FINANCIÈRE ET LA CRÉATION DE VALEUR
// ═════════════════════════════════════════════════════════════════════════════

/** LE MEDAF : le coût des capitaux propres = taux sans risque + β × prime de risque du marché. */
export const coutDesCapitauxPropres = (tauxSansRisque: number, beta: number, prime: number) => tauxSansRisque + beta * prime;

/** HAMADA, le bêta réendetté : βcp = βa × (1 + (1 − t) × D ÷ CP). */
export const betaReendette = (betaDeLActif: number, levier: number, tauxDeLImpot: number) => betaDeLActif * (1 + (1 - tauxDeLImpot) * levier);

/** HAMADA, le bêta désendetté : βa = βcp ÷ (1 + (1 − t) × D ÷ CP). */
export const betaDesendette = (betaDesCapitauxPropres: number, levier: number, tauxDeLImpot: number) => betaDesCapitauxPropres / (1 + (1 - tauxDeLImpot) * levier);

/** LE COÛT MOYEN PONDÉRÉ DU CAPITAL : kcp × CP ÷ (CP + D) + i × D ÷ (CP + D), i après impôt. */
export const cmpc = (kcp: number, i: number, capitauxPropres: number, dette: number) => (kcp * capitauxPropres + i * dette) / (capitauxPropres + dette);

/** La rentabilité des capitaux propres par la relation du levier : Re + (Re − i) × D ÷ CP. */
export const rentabiliteParLeLevier = (re: number, i: number, levier: number) => re + (re - i) * levier;

/** L'effet de levier : ce que la dette ajoute (ou retire) à la rentabilité des associés, (Re − i) × D ÷ CP. */
export const effetDeLevier = (re: number, i: number, levier: number) => (re - i) * levier;

/** LE SEUIL DE MASSUE : le résultat d'exploitation où Re égale i, charges financières × actif économique ÷ endettement net (l'impôt s'y simplifie). */
export const seuilDeMassue = (chargesFinancieres: number, actifEconomique: number, endettementNet: number) => auCentime((chargesFinancieres * actifEconomique) / endettementNet);

/** LE TAUX LIMITE : à endettement net inchangé, le coût de la dette suit le taux de l'emprunt ; le levier s'inverse au taux × Re ÷ i. */
export const tauxLimite = (tauxDeLEmprunt: number, re: number, i: number) => (tauxDeLEmprunt * re) / i;

/** L'EVA : (Re − CMPC) × actif économique, la valeur que l'année laisse au-delà de ce qu'exigent ceux qui financent l'outil. */
export const eva = (re: number, coutDuCapital: number, actifEconomique: number) => auCentime((re - coutDuCapital) * actifEconomique);

/** Le résultat résiduel : le résultat net moins l'exigence des associés, kcp × CP. Il égale l'EVA. */
export const resultatResiduel = (resultatNet: number, kcp: number, capitauxPropres: number) => auCentime(resultatNet - kcp * capitauxPropres);

/**
 * L'ANALYSE D'UN BILAN : l'actif économique, son financement et ses rentabilités.
 *   · BFR = stocks + créances − dettes fournisseurs − dettes fiscales et sociales ;
 *   · actif économique = immobilisations nettes + BFR ; endettement net = emprunt − disponibilités ;
 *   · charges financières = taux × capital dû au 1er janvier ; résultat net = (REX − charges) × (1 − t) ;
 *   · Re = REX × (1 − t) ÷ actif économique ; i = charges × (1 − t) ÷ endettement net ;
 *     levier = endettement net ÷ capitaux propres ; Rcp = résultat net ÷ capitaux propres.
 */
export function analyseDuBilan(b: BilanFinancier) {
  const t = b.tauxDeLImpot;
  const bfr = auCentime(b.stocks + b.creancesClients - b.dettesFournisseurs - b.dettesFiscalesEtSociales);
  const actifEconomique = auCentime(b.immobilisationsNettes + bfr);
  const endettementNet = auCentime(b.emprunt - b.disponibilites);
  const chargesFinancieres = auCentime(b.tauxDeLEmprunt * b.empruntAuPremierJanvier);
  const resultatDExploitationApresImpot = auCentime(b.resultatDExploitation * (1 - t));
  const chargesFinancieresApresImpot = auCentime(chargesFinancieres * (1 - t));
  const resultatAvantImpot = auCentime(b.resultatDExploitation - chargesFinancieres);
  const impot = auCentime(resultatAvantImpot * t);
  const resultatNet = auCentime(resultatAvantImpot - impot);
  const re = resultatDExploitationApresImpot / actifEconomique;
  const i = chargesFinancieresApresImpot / endettementNet;
  const levier = endettementNet / b.capitauxPropres;
  return {
    bfr,
    actifEconomique,
    endettementNet,
    capitauxPropres: b.capitauxPropres,
    chargesFinancieres,
    resultatDExploitationApresImpot,
    chargesFinancieresApresImpot,
    resultatAvantImpot,
    impot,
    resultatNet,
    re,
    i,
    tauxDuContratApresImpot: b.tauxDeLEmprunt * (1 - t),
    levier,
    rcp: resultatNet / b.capitauxPropres,
    effetDeLevier: effetDeLevier(re, i, levier),
    seuilDeMassue: seuilDeMassue(chargesFinancieres, actifEconomique, endettementNet),
    tauxLimite: tauxLimite(b.tauxDeLEmprunt, re, i),
    /** Les capitaux propres avant le résultat de l'année : ce que le bilan apportait au 1er janvier. */
    capitauxPropresAvantResultat: auCentime(b.capitauxPropres - resultatNet),
  };
}

/** Un changement du 1er janvier : un autre taux, un apport qui rembourse l'emprunt, un investissement payé par un nouvel emprunt. */
export interface ChangementDuBilan {
  tauxDeLEmprunt: number;
  apport: number;
  investissement: { montant: number; dureeDAmortissement: number; excedentBrutEnPlus: number };
}

/**
 * LE BILAN REFAIT APRÈS UN CHANGEMENT AU 1ER JANVIER (à la place des rejeux de l'arène) : un
 * apport rembourse autant d'emprunt ; un investissement s'ajoute aux immobilisations (amorti dès la
 * première année) et à l'emprunt du 1er janvier, sans annuité la première année ; le taux s'applique
 * au capital dû au 1er janvier. Le nouveau résultat net entre dans les capitaux propres ; la
 * trésorerie absorbe tout le reste, si bien que l'actif économique ne bouge que de
 * l'investissement net de sa dotation.
 */
export function bilanApres(b: BilanFinancier, c: Partial<ChangementDuBilan>): BilanFinancier {
  const a = analyseDuBilan(b);
  const apport = c.apport ?? 0;
  const inv = c.investissement;
  const dotation = inv ? inv.montant / inv.dureeDAmortissement : 0;
  const empruntAuPremierJanvier = auCentime(b.empruntAuPremierJanvier - apport + (inv?.montant ?? 0));
  const emprunt = auCentime(b.emprunt - apport + (inv?.montant ?? 0));
  const tauxDeLEmprunt = c.tauxDeLEmprunt ?? b.tauxDeLEmprunt;
  const resultatDExploitation = auCentime(b.resultatDExploitation + (inv ? inv.excedentBrutEnPlus - dotation : 0));
  const resultatNet = auCentime((resultatDExploitation - tauxDeLEmprunt * empruntAuPremierJanvier) * (1 - b.tauxDeLImpot));
  const capitauxPropres = auCentime(a.capitauxPropresAvantResultat + apport + resultatNet);
  const immobilisationsNettes = auCentime(b.immobilisationsNettes + (inv ? inv.montant - dotation : 0));
  const actifEconomique = auCentime(immobilisationsNettes + a.bfr);
  const endettementNet = auCentime(actifEconomique - capitauxPropres);
  return { ...b, immobilisationsNettes, capitauxPropres, emprunt, empruntAuPremierJanvier, tauxDeLEmprunt, resultatDExploitation, disponibilites: auCentime(emprunt - endettementNet) };
}

/** Le marché financier et le risque de l'activité : ce que le MEDAF et Hamada lisent. */
export interface RisqueDeLActivite {
  tauxSansRisque: number;
  prime: number;
  betaDeLActif: number;
}

/**
 * LA CRÉATION DE VALEUR D'UN BILAN, aux pondérations du bilan : le bêta des capitaux propres
 * (Hamada, au levier du bilan), leur coût (MEDAF), le CMPC, l'EVA et le résultat résiduel. Le coût
 * des capitaux propres peut être imposé (l'exigence d'un fonds) à la place du MEDAF.
 */
export function creationDeValeur(b: BilanFinancier, r: RisqueDeLActivite, kcpImpose?: number) {
  const a = analyseDuBilan(b);
  const betaDesCapitauxPropres = betaReendette(r.betaDeLActif, a.levier, b.tauxDeLImpot);
  const kcp = kcpImpose ?? coutDesCapitauxPropres(r.tauxSansRisque, betaDesCapitauxPropres, r.prime);
  const coutDuCapital = cmpc(kcp, a.i, a.capitauxPropres, a.endettementNet);
  return {
    ...a,
    betaDesCapitauxPropres,
    kcp,
    poidsDesCapitauxPropres: a.capitauxPropres / a.actifEconomique,
    poidsDeLaDette: a.endettementNet / a.actifEconomique,
    cmpc: coutDuCapital,
    eva: eva(a.re, coutDuCapital, a.actifEconomique),
    exigenceDesAssocies: auCentime(kcp * a.capitauxPropres),
    resultatResiduel: resultatResiduel(a.resultatNet, kcp, a.capitauxPropres),
    /** Le résultat d'exploitation qui annule l'EVA : CMPC × actif économique ÷ (1 − t). */
    resultatDExploitationMinimal: auCentime((coutDuCapital * a.actifEconomique) / (1 - b.tauxDeLImpot)),
  };
}

/**
 * LE COÛT DU CAPITAL SELON LE LEVIER (le laboratoire de la structure financière). L'actif
 * économique et le résultat d'exploitation restent ceux du bilan ; seul le partage entre capitaux
 * propres et endettement net change, au levier donné. Le coût de l'endettement net suit le taux
 * de l'emprunt, qui monte de la marge de crédit par unité de levier au-delà de celui du bilan
 * (proportionnel, comme au taux limite) ; le bêta des capitaux propres se réendette (Hamada). Rend
 * le coût des capitaux propres, celui de la dette, le CMPC, la Rcp et l'EVA : aucun n'est affine
 * dès que la marge n'est pas nulle.
 */
export function structureAuLevier(b: BilanFinancier, r: RisqueDeLActivite, levier: number, margeDeCredit = 0) {
  const a = analyseDuBilan(b);
  const taux = b.tauxDeLEmprunt + margeDeCredit * (levier - a.levier);
  const i = (a.i * taux) / b.tauxDeLEmprunt;
  const kcp = coutDesCapitauxPropres(r.tauxSansRisque, betaReendette(r.betaDeLActif, levier, b.tauxDeLImpot), r.prime);
  const capitauxPropres = a.actifEconomique / (1 + levier);
  const dette = a.actifEconomique - capitauxPropres;
  const coutDuCapital = cmpc(kcp, i, capitauxPropres, dette);
  return { levier, tauxDeLEmprunt: taux, i, kcp, cmpc: coutDuCapital, rcp: rentabiliteParLeLevier(a.re, i, levier), eva: eva(a.re, coutDuCapital, a.actifEconomique) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. L'IMPÔT SUR LES SOCIÉTÉS
// ═════════════════════════════════════════════════════════════════════════════

/** Le résultat fiscal : le résultat comptable avant impôt, plus les réintégrations, moins les déductions. */
export function resultatFiscal(e: ExerciceFiscal): number {
  const somme = (l: readonly { montant: number }[]) => l.reduce((s, x) => s + x.montant, 0);
  return auCentime(e.resultatComptable + somme(e.reintegrations) - somme(e.deductions));
}

/** Les conditions du taux réduit : un chiffre d'affaires sous 10 000 000 €, un capital libéré, et détenu pour 75 % au moins par des personnes physiques. */
export function eligibleAuTauxReduit(c: { chiffreDAffaires: number; capitalEntierementLibere: boolean; partDesPersonnesPhysiques: number }): boolean {
  return c.chiffreDAffaires < CONDITIONS_DU_TAUX_REDUIT.chiffreDAffairesMaximal && c.capitalEntierementLibere && c.partDesPersonnesPhysiques >= CONDITIONS_DU_TAUX_REDUIT.partMinimaleDesPersonnesPhysiques;
}

/** Le barème du cours, avec ou sans le taux réduit. */
export const bareme = (eligible: boolean): BaremeDeLImpot => ({ tauxReduit: TAUX_REDUIT, plafondDuTauxReduit: PLAFOND_DU_TAUX_REDUIT, tauxNormal: TAUX_NORMAL, eligibleAuTauxReduit: eligible });

/**
 * L'IMPÔT D'UN BÉNÉFICE IMPOSABLE (le levier du laboratoire de l'impôt) : le taux réduit jusqu'à
 * 42 500 € pour une société qui y a droit, le taux normal au-delà, arrondi à l'euro (le modèle de
 * la clôture, monde/cloture.ts, le même pour toutes les entreprises du cours) ; rien sur une perte.
 * Le taux effectif est l'impôt rapporté au bénéfice : il n'est pas une droite du bénéfice.
 */
export function impotDuBenefice(benefice: number, eligible: boolean) {
  const r = impotSurLesSocietes(benefice, bareme(eligible));
  return { ...r, tauxEffectif: benefice > 0 ? r.impot / benefice : 0 };
}

/** Les quatre acomptes d'un exercice : chacun le quart de l'impôt de référence, aucun sous le seuil de 3 000 €. */
export function acomptes(impotDeReference: number): number[] {
  if (impotDeReference < ACOMPTES.seuilDeDispense) return ACOMPTES.dates.map(() => 0);
  return ACOMPTES.dates.map(() => auCentime(impotDeReference * ACOMPTES.part));
}

/** Le solde d'un exercice : son impôt moins les acomptes versés (négatif : l'État rend l'excédent). */
export const solde = (impot: number, acomptesVerses: readonly number[]) => auCentime(impot - acomptesVerses.reduce((s, a) => s + a, 0));

/** Le plafond d'imputation d'un déficit sur un bénéfice : 1 000 000 €, plus 50 % du bénéfice au-delà. */
export const plafondDImputation = (benefice: number) => auCentime(PLAFOND_DU_REPORT_EN_AVANT.fixe + PLAFOND_DU_REPORT_EN_AVANT.partDuBeneficeAuDela * Math.max(0, benefice - PLAFOND_DU_REPORT_EN_AVANT.fixe));

/**
 * LE REPORT EN AVANT sur un exercice (le levier : le bénéfice fiscal) : le déficit s'impute sur le
 * bénéfice, dans la limite du plafond ; le bénéfice imposable est ce qui reste, le déficit
 * restant attend l'exercice suivant. Un exercice en perte n'impute rien, et ajoute sa perte.
 */
export function reportEnAvant(beneficeFiscal: number, deficitReportable: number) {
  if (beneficeFiscal <= 0) return { impute: 0, beneficeImposable: 0, deficitRestant: auCentime(deficitReportable - beneficeFiscal) };
  const impute = auCentime(Math.min(deficitReportable, beneficeFiscal, plafondDImputation(beneficeFiscal)));
  return { impute, beneficeImposable: auCentime(beneficeFiscal - impute), deficitRestant: auCentime(deficitReportable - impute) };
}

/**
 * LE REPORT EN ARRIÈRE, sur option : le déficit s'impute sur le bénéfice de l'exercice précédent,
 * non distribué, dans la limite de 1 000 000 € ; la créance sur l'État vaut le déficit reporté ×
 * le taux normal. Le reste du déficit se reporte en avant.
 */
export function reportEnArriere(deficit: number, beneficePrecedentNonDistribue: number, tauxNormal = TAUX_NORMAL) {
  const reporte = auCentime(Math.max(0, Math.min(deficit, beneficePrecedentNonDistribue, PLAFOND_DU_REPORT_EN_ARRIERE)));
  return { reporte, creance: auCentime(reporte * tauxNormal), deficitEnAvant: auCentime(deficit - reporte) };
}

/** Un exercice de la suite : son résultat fiscal, l'imputation du déficit, son impôt, la créance utilisée et ce qui reste à payer. */
export interface ExerciceDeLaSuite {
  exercice: string;
  resultatFiscal: number;
  deficitImpute: number;
  beneficeImposable: number;
  impot: number;
  deficitRestant: number;
  /** La créance de report en arrière née cet exercice-là. */
  creanceNee: number;
  /** La part de la créance qui paie l'impôt de l'exercice. */
  creanceUtilisee: number;
  impotPaye: number;
}

/**
 * LA SUITE DES EXERCICES D'UNE ENTREPRISE (le laboratoire du déficit) : exercice après exercice,
 * le résultat fiscal, le déficit reporté en avant (et, sur option, en arrière pour l'exercice en
 * perte de rang `enArriere`, sur le bénéfice de l'exercice précédent, tout mis en réserve), puis
 * l'impôt. La créance de report en arrière paie l'impôt des exercices suivants ; ce qui en resterait
 * au bout de cinq ans serait remboursé (le modèle rend la créance restante, sans dater ce
 * remboursement : les suites du cours ne vont pas si loin). Le premier exercice de la liste
 * ouvre sans déficit à reporter. Les leviers : les résultats, l'option, le taux réduit.
 */
export function suiteDesExercices(exercices: readonly ExerciceFiscal[], options: { enArriere?: number; eligible?: boolean } = {}) {
  const eligible = options.eligible ?? false;
  let deficit = 0;
  let creance = 0;
  const lignes: ExerciceDeLaSuite[] = [];
  exercices.forEach((e, k) => {
    const rf = resultatFiscal(e);
    let creanceNee = 0;
    let deficitImpute = 0;
    let beneficeImposable = 0;
    if (rf < 0 && options.enArriere === k && k > 0) {
      const precedent = lignes[k - 1]!;
      const r = reportEnArriere(-rf, precedent.beneficeImposable);
      creanceNee = r.creance;
      creance = auCentime(creance + creanceNee);
      deficit = auCentime(deficit + r.deficitEnAvant);
    } else {
      const r = reportEnAvant(rf, deficit);
      deficitImpute = r.impute;
      beneficeImposable = r.beneficeImposable;
      deficit = r.deficitRestant;
    }
    const impot = impotDuBenefice(beneficeImposable, eligible).impot;
    const creanceUtilisee = creanceNee > 0 ? 0 : Math.min(creance, impot);
    creance = auCentime(creance - creanceUtilisee);
    lignes.push({ exercice: e.exercice, resultatFiscal: rf, deficitImpute, beneficeImposable, impot, deficitRestant: deficit, creanceNee, creanceUtilisee, impotPaye: auCentime(impot - creanceUtilisee) });
  });
  const somme = (g: (l: ExerciceDeLaSuite) => number) => auCentime(lignes.reduce((s, l) => s + g(l), 0));
  return {
    exercices: lignes,
    /** L'impôt de tous les exercices, moins les créances nées : ce que l'entreprise doit en tout. */
    impotNet: auCentime(somme((l) => l.impot) - somme((l) => l.creanceNee)),
    impotPaye: somme((l) => l.impotPaye),
    deficitRestant: deficit,
    creanceRestante: creance,
  };
}
