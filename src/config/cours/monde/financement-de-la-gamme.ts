import { auCentime } from "./amortissement";
import { CONTRAT_DE_PRET, PLACEMENT } from "./exercice-de-nova";
import { fluxDuProjet, tri, van } from "./finance";
import { COMPTE_COURANT, remboursements } from "./financement-du-lycee";
import { INVESTISSEMENT_ENVISAGE } from "./nova-gestion";
import { PROJET_LIGNE_SEMI_AUTOMATIQUE, TAUX_DE_L_IMPOT_DES_PROJETS, type ActifDuProjet } from "./projets-et-financement";

/**
 * LE MONDE DU COURS : FINANCER LA GAMME DE N+1 (BTS CG P6 6.5.2, DCG UE6 4.1 et 4.4).
 *
 * Fiche figée et modèle des deux chapitres « Emprunt ou crédit-bail : le coût après impôt » et « Le
 * plan de financement », et de leurs cas. Elle ne lit jamais l'arène. Elle reprend, sans les
 * recopier, les chiffres que les autres chapitres de NOVA ont posés (une seule NOVA) :
 *   · LA LIGNE est la ligne semi-automatique du projet B (monde/projets-et-financement.ts), celle que
 *     le chapitre « Le TRI et le choix entre deux projets » retient : 150 000 € hors taxes, amortie
 *     en linéaire sur 6 ans ; les moules de Go et de Studio, 40 000 €, l'accompagnent ;
 *   · LA BANQUE prête au taux du prêt de NOVA (exercice-de-nova.ts, 5 %), sur 5 ans, le capital
 *     remboursé en parts égales chaque année : le prêt bancaire de « Financer autrement »
 *     (monde/financement-du-lycee.ts, `remboursements`), une annuité par an ;
 *   · L'IMPÔT est le taux marginal de NOVA, 25 % (TAUX_DE_L_IMPOT_DES_PROJETS) : son bénéfice dépasse
 *     déjà le plafond du taux réduit, chaque euro de charge déductible épargne 25 centimes d'impôt ;
 *   · LA RÉSERVE est le compte à terme de l'exercice (PLACEMENT, 133 000 €), échu le 6 janvier N+1 et
 *     gardé pour la gamme ;
 *   · LES FLUX D'EXPLOITATION ET LE BFR de la gamme sont ceux de `fluxDuProjet` (monde/finance.ts) ;
 *   · LE COMPTE COURANT des associés est celui de « Financer autrement » (3 %, remboursé en une fois
 *     au bout de 5 ans).
 *
 * CONVENTIONS : les montants sont hors taxes, au centime ; les taux sont des fractions. Les flux d'un
 * financement sont rangés par date, de 0 (le 1er janvier N+1, le jour de l'achat) à la fin de la
 * dernière année ; ils se lisent du côté de NOVA (positif : ce qui lui reste en caisse, négatif : ce
 * qui en sort). L'économie d'impôt d'une année se compte à la fin de cette année, avec ses charges.
 */

// ═════════════════════════════════════════════════════════════════════════════
// 1. EMPRUNT OU CRÉDIT-BAIL
// ═════════════════════════════════════════════════════════════════════════════

/** La ligne à financer : la ligne semi-automatique du projet B, 150 000 € HT, amortie sur 6 ans. */
export const LIGNE_A_FINANCER: ActifDuProjet = PROJET_LIGNE_SEMI_AUTOMATIQUE.actifs[0]!;

/** Les moules de Go et de Studio, payés comptant avec la ligne. */
export const MOULES: ActifDuProjet = PROJET_LIGNE_SEMI_AUTOMATIQUE.actifs[1]!;

/** Le taux de l'impôt qui pèse sur chaque euro de résultat de NOVA en N+1 : 25 %. */
export const TAUX_DE_L_IMPOT = TAUX_DE_L_IMPOT_DES_PROJETS;

/** Un emprunt remboursé en parts égales chaque année, une annuité par an. */
export interface OffreDEmprunt {
  montant: number;
  taux: number;
  dureeAns: number;
}

/** L'OFFRE DE LA BANQUE pour la ligne : tout son prix, au taux du prêt de NOVA, 5 %, sur 5 ans. */
export const EMPRUNT_DE_LA_LIGNE: OffreDEmprunt = { montant: LIGNE_A_FINANCER.montant, taux: CONTRAT_DE_PRET.tauxAnnuel, dureeAns: 5 };

/**
 * Un contrat de crédit-bail : le crédit-bailleur achète le bien et le loue à l'entreprise, qui
 * peut le racheter à la fin pour le prix de l'option.
 */
export interface ContratDeCreditBail {
  /** Le prix du bien, que l'entreprise n'a pas à payer le jour de l'achat. */
  valeur: number;
  /** La redevance annuelle hors taxes, payée à la fin de chaque année (terme échu). */
  redevance: number;
  dureeAns: number;
  /** Le prix de rachat du bien à la fin du contrat. */
  option: number;
  /** Les années sur lesquelles le bien racheté s'amortit, à partir de l'année qui suit le contrat. */
  dureeDAmortissementDeLOption: number;
  /** Le dépôt de garantie versé à la signature, rendu à la fin du contrat (sans intérêts). */
  depot: number;
}

/**
 * L'OFFRE DU CRÉDIT-BAILLEUR (hypothèse du cours) : cinq redevances de 33 000 € HT, payées le 31
 * décembre de chaque année de N+1 à N+5, et une option d'achat de 15 000 € (10 % du prix) levée à la
 * fin du contrat. Rachetée, la ligne d'occasion s'amortit sur l'année d'usage qui lui reste (la
 * sixième). Aucun dépôt de garantie dans l'offre de base ; le chapitre en chiffre un, d'une redevance.
 */
export const CREDIT_BAIL_DE_LA_LIGNE: ContratDeCreditBail = { valeur: LIGNE_A_FINANCER.montant, redevance: 33_000, dureeAns: 5, option: 15_000, dureeDAmortissementDeLOption: 1, depot: 0 };

/** LE DÉPÔT DE GARANTIE que demanderait le crédit-bailleur, à l'étape d'expert : une redevance. */
export const DEPOT_DE_GARANTIE = CREDIT_BAIL_DE_LA_LIGNE.redevance;

/** Le coût d'un emprunt après impôt : ses intérêts sont déductibles, taux × (1 − taux de l'impôt). */
export const coutApresImpot = (taux: number, tauxDeLImpot = TAUX_DE_L_IMPOT) => taux * (1 - tauxDeLImpot);

/** Une année de l'emprunt : l'annuité, l'économie d'impôt sur ses intérêts, ce qui sort vraiment. */
export interface AnneeDeLEmprunt {
  annee: number;
  capitalDebut: number;
  interets: number;
  amortissement: number;
  annuite: number;
  economieDImpot: number;
  decaissementNet: number;
}

/**
 * LES FLUX DE L'EMPRUNT, du côté de NOVA : à la date 0, le capital prêté ; à la fin de chaque
 * année, l'annuité moins l'économie d'impôt sur les intérêts. L'amortissement de la ligne n'y est
 * pas : NOVA l'a avec tout achat, emprunté ou non. C'est le crédit-bail qui le perd.
 */
export function fluxDeLEmprunt(e: OffreDEmprunt, tauxDeLImpot = TAUX_DE_L_IMPOT) {
  let du = e.montant;
  const annees: AnneeDeLEmprunt[] = remboursements({ taux: e.taux, dureeAns: e.dureeAns, mode: "amortissement-constant" }, e.montant).map((r) => {
    const economieDImpot = auCentime(r.interets * tauxDeLImpot);
    const a = { annee: r.annee, capitalDebut: du, interets: r.interets, amortissement: r.capital, annuite: r.total, economieDImpot, decaissementNet: auCentime(r.total - economieDImpot) };
    du = auCentime(du - r.capital);
    return a;
  });
  const flux = [e.montant, ...annees.map((a) => -a.decaissementNet)];
  return { annees, flux, interets: auCentime(annees.reduce((s, a) => s + a.interets, 0)) };
}

/** Une date des flux du crédit-bail, de 0 à la dernière année où il change quelque chose. */
export interface DateDuCreditBail {
  date: number;
  /** La redevance de l'année, hors taxes. */
  redevance: number;
  /** La redevance moins l'économie d'impôt qu'elle donne : redevance × (1 − taux). */
  redevanceNette: number;
  /** L'économie d'impôt sur l'amortissement de la ligne, que NOVA aurait eue en l'achetant. */
  economiePerdue: number;
  /** Le prix de l'option, à la fin du contrat. */
  option: number;
  /** L'économie d'impôt sur l'amortissement de la ligne rachetée. */
  economieSurLOption: number;
  /** Le dépôt de garantie : versé à la date 0 (négatif), rendu à la fin du contrat (positif). */
  depot: number;
  /** Le flux de la date, du côté de NOVA. */
  flux: number;
}

/**
 * LES FLUX DU CRÉDIT-BAIL APRÈS IMPÔT, comparés à l'achat, du côté de NOVA :
 *   · à la date 0, le prix de la ligne, que NOVA ne paie pas (moins le dépôt de garantie) ;
 *   · chaque année du contrat, la redevance, moins l'économie d'impôt qu'elle donne ;
 *   · chaque année d'amortissement de la ligne achetée, l'économie d'impôt que NOVA perd : le bien
 *     n'est pas à elle, elle ne l'amortit pas ;
 *   · à la fin du contrat, l'option (et le dépôt rendu) ; puis l'économie d'impôt sur
 *     l'amortissement de la ligne rachetée.
 */
export function fluxDuCreditBail(cb: ContratDeCreditBail, bien: Pick<ActifDuProjet, "montant" | "dureeDAmortissement">, tauxDeLImpot = TAUX_DE_L_IMPOT) {
  const horizon = Math.max(bien.dureeDAmortissement, cb.dureeAns + cb.dureeDAmortissementDeLOption);
  const dotation = bien.montant / bien.dureeDAmortissement;
  const dotationDeLOption = cb.option / cb.dureeDAmortissementDeLOption;
  const dates: DateDuCreditBail[] = Array.from({ length: horizon + 1 }, (_, k) => {
    const redevance = k >= 1 && k <= cb.dureeAns ? cb.redevance : 0;
    const redevanceNette = auCentime(redevance * (1 - tauxDeLImpot));
    const economiePerdue = k >= 1 && k <= bien.dureeDAmortissement ? auCentime(dotation * tauxDeLImpot) : 0;
    const option = k === cb.dureeAns ? cb.option : 0;
    const economieSurLOption = k > cb.dureeAns && k <= cb.dureeAns + cb.dureeDAmortissementDeLOption ? auCentime(dotationDeLOption * tauxDeLImpot) : 0;
    const depot = k === 0 ? -cb.depot : k === cb.dureeAns ? cb.depot : 0;
    const flux = auCentime((k === 0 ? cb.valeur : 0) + depot - redevanceNette - economiePerdue - option + economieSurLOption);
    return { date: k, redevance, redevanceNette, economiePerdue, option, economieSurLOption, depot, flux };
  });
  return { dates, flux: dates.map((d) => d.flux) };
}

/**
 * LE TAUX ACTUARIEL d'un financement : le taux qui égale ce qu'il apporte à la date 0 et la valeur
 * actuelle de ce qu'il coûte ensuite (la VAN de ses flux s'annule). Cherché entre 0 % et 100 %, où
 * les financements du cours n'en ont qu'un.
 */
export const tauxActuariel = (flux: readonly number[]) => tri(flux, { bas: 0, haut: 1 });

/** Le taux du crédit-bail avant impôt, celui que le crédit-bailleur fait payer : redevances et option seules. */
export function tauxAvantImpot(cb: ContratDeCreditBail) {
  const flux = Array.from({ length: cb.dureeAns + 1 }, (_, k) => (k === 0 ? cb.valeur - cb.depot : -cb.redevance - (k === cb.dureeAns ? cb.option - cb.depot : 0)));
  return tauxActuariel(flux);
}

/** Les leviers de la comparaison : la redevance, l'option, le taux de la banque, le dépôt. */
export interface LeviersDeLaComparaison {
  redevance: number;
  option: number;
  tauxDeLEmprunt: number;
  depot: number;
}

/**
 * LA COMPARAISON DES DEUX FINANCEMENTS de la ligne : le coût de l'emprunt après impôt, le taux
 * actuariel du crédit-bail après impôt, et la VAN des flux du crédit-bail au coût de l'emprunt après
 * impôt. Une VAN négative : le crédit-bail coûte plus que l'emprunt ; positive, il coûte moins.
 */
export function comparaison(l: Partial<LeviersDeLaComparaison> = {}, bien: ActifDuProjet = LIGNE_A_FINANCER, base: { cb: ContratDeCreditBail; emprunt: OffreDEmprunt } = { cb: CREDIT_BAIL_DE_LA_LIGNE, emprunt: EMPRUNT_DE_LA_LIGNE }) {
  const cb: ContratDeCreditBail = { ...base.cb, redevance: l.redevance ?? base.cb.redevance, option: l.option ?? base.cb.option, depot: l.depot ?? base.cb.depot };
  const offre: OffreDEmprunt = { ...base.emprunt, taux: l.tauxDeLEmprunt ?? base.emprunt.taux };
  const emprunt = fluxDeLEmprunt(offre);
  const creditBail = fluxDuCreditBail(cb, bien);
  const coutDeLEmprunt = coutApresImpot(offre.taux);
  return {
    cb,
    offre,
    emprunt,
    creditBail,
    coutDeLEmprunt,
    tauxDuCreditBail: tauxActuariel(creditBail.flux)!,
    tauxAvantImpot: tauxAvantImpot(cb)!,
    vanDuCreditBail: van(creditBail.flux, coutDeLEmprunt),
    vanDeLEmprunt: van(emprunt.flux, coutDeLEmprunt),
  };
}

/**
 * LE BANC DE MESURE EN CRÉDIT-BAIL (le cas « Le banc en crédit-bail », hypothèse du cours) : le banc
 * de nova-gestion.ts (30 000 € HT, amorti sur 60 mois), proposé en crédit-bail sur 5 ans, 6 600 € de
 * redevance à la fin de chaque année, une option de 1 500 € (5 % du prix), le banc racheté amorti sur
 * un an. La banque le prêterait aux conditions de la ligne : 5 %, sur 5 ans, en parts égales.
 */
export const BANC: ActifDuProjet = { libelle: INVESTISSEMENT_ENVISAGE.libelle, montant: INVESTISSEMENT_ENVISAGE.montantHt, dureeDAmortissement: INVESTISSEMENT_ENVISAGE.dureeDAmortissementMois / 12, tauxDeReprise: 0 };
export const CREDIT_BAIL_DU_BANC: ContratDeCreditBail = { valeur: BANC.montant, redevance: 6_600, dureeAns: 5, option: 1_500, dureeDAmortissementDeLOption: 1, depot: 0 };
export const EMPRUNT_DU_BANC: OffreDEmprunt = { montant: BANC.montant, taux: CONTRAT_DE_PRET.tauxAnnuel, dureeAns: 5 };

/** La comparaison du cas du banc. */
export const comparaisonDuBanc = (l: Partial<LeviersDeLaComparaison> = {}) => comparaison(l, BANC, { cb: CREDIT_BAIL_DU_BANC, emprunt: EMPRUNT_DU_BANC });

// ═════════════════════════════════════════════════════════════════════════════
// 2. LE PLAN DE FINANCEMENT DE LA GAMME, DE N+1 À N+5
// ═════════════════════════════════════════════════════════════════════════════

/** Les cinq années du plan. */
export const ANNEES_DU_PLAN = ["N+1", "N+2", "N+3", "N+4", "N+5"] as const;

/** LA RÉSERVE : le compte à terme de l'exercice, 133 000 €, échu le 6 janvier N+1, gardé pour la gamme. */
export const RESERVE_DE_LA_GAMME = PLACEMENT.montant;

/**
 * LE PLAN S'ARRÊTE AU 31 DÉCEMBRE N+5 (hypothèse du cours) : la ligne se revend et le BFR de la gamme
 * se récupère au début de N+6, hors du plan. Les annuités d'un emprunt plus long que cinq ans tombent
 * aussi après le plan.
 */
export const DUREE_DU_PLAN = ANNEES_DU_PLAN.length;

/** Les leviers du plan : l'emprunt de N+1 et sa durée, la ligne achetée ou en crédit-bail, l'apport en compte courant. */
export interface LeviersDuPlan {
  emprunt: number;
  dureeDeLEmprunt: number;
  creditBail: boolean;
  compteCourant: number;
}

export const PLAN_SANS_EMPRUNT: LeviersDuPlan = { emprunt: 0, dureeDeLEmprunt: EMPRUNT_DE_LA_LIGNE.dureeAns, creditBail: false, compteCourant: 0 };

/** Une année du plan : la CAF qui la finance, ses emplois, ses ressources, et ce qui reste. */
export interface AnneeDuPlan {
  annee: (typeof ANNEES_DU_PLAN)[number];
  excedentBrut: number;
  redevance: number;
  dotations: number;
  interets: number;
  resultat: number;
  /** L'impôt du résultat de la gamme ; négatif, l'impôt qu'il fait économiser sur le reste du bénéfice de NOVA. */
  impot: number;
  caf: number;
  investissements: number;
  augmentationDuBfr: number;
  remboursements: number;
  option: number;
  emplois: number;
  reserve: number;
  emprunt: number;
  compteCourant: number;
  diminutionDuBfr: number;
  ressources: number;
  solde: number;
  cumul: number;
}

/**
 * LE PLAN DE FINANCEMENT DE LA GAMME, année par année :
 *   · la CAF : l'EBE de la gamme (fluxDuProjet ; moins la redevance si la ligne est en crédit-bail),
 *     moins les intérêts des financements nouveaux, moins l'impôt du résultat (EBE − dotations −
 *     intérêts) au taux de 25 % ; un résultat négatif fait économiser de l'impôt sur le reste du
 *     bénéfice de NOVA ;
 *   · les emplois : la ligne et les moules (les moules seuls en crédit-bail), l'augmentation du BFR,
 *     le capital remboursé, la levée de l'option ;
 *   · les ressources : la réserve, l'emprunt, l'apport en compte courant, la CAF, la diminution du BFR ;
 *   · le solde de l'année, ressources moins emplois, et son cumul.
 */
export function planDeFinancementDeLaGamme(l: Partial<LeviersDuPlan> = {}) {
  const p: LeviersDuPlan = { ...PLAN_SANS_EMPRUNT, ...l };
  const projet = fluxDuProjet(PROJET_LIGNE_SEMI_AUTOMATIQUE);
  const cb = CREDIT_BAIL_DE_LA_LIGNE;
  const tableauDeLEmprunt = remboursements({ taux: EMPRUNT_DE_LA_LIGNE.taux, dureeAns: p.dureeDeLEmprunt, mode: "amortissement-constant" }, p.emprunt);
  const tableauDuCompteCourant = remboursements(COMPTE_COURANT, p.compteCourant);
  const dotationDeLaLigne = LIGNE_A_FINANCER.montant / LIGNE_A_FINANCER.dureeDAmortissement;
  let cumul = 0;
  const annees: AnneeDuPlan[] = ANNEES_DU_PLAN.map((annee, i) => {
    const a = projet.annees[i]!;
    const e = tableauDeLEmprunt[i];
    const k = tableauDuCompteCourant[i];
    const redevance = p.creditBail && i < cb.dureeAns ? cb.redevance : 0;
    const excedentBrut = auCentime(a.excedentBrut - redevance);
    const dotations = auCentime(a.dotations - (p.creditBail ? dotationDeLaLigne : 0));
    const interets = auCentime((e?.interets ?? 0) + (k?.interets ?? 0));
    const resultat = auCentime(excedentBrut - dotations - interets);
    const impot = auCentime(resultat * TAUX_DE_L_IMPOT);
    const caf = auCentime(excedentBrut - interets - impot);
    const variation = projet.variationsDuBfr[i]!;
    const investissements = i === 0 ? auCentime(MOULES.montant + (p.creditBail ? 0 : LIGNE_A_FINANCER.montant)) : 0;
    const augmentationDuBfr = Math.max(0, variation);
    const remboursementsDeLAnnee = auCentime((e?.capital ?? 0) + (k?.capital ?? 0));
    const option = p.creditBail && i === cb.dureeAns - 1 ? cb.option : 0;
    const emplois = auCentime(investissements + augmentationDuBfr + remboursementsDeLAnnee + option);
    const reserve = i === 0 ? RESERVE_DE_LA_GAMME : 0;
    const emprunt = i === 0 ? p.emprunt : 0;
    const compteCourant = i === 0 ? p.compteCourant : 0;
    const diminutionDuBfr = Math.max(0, -variation);
    const ressources = auCentime(reserve + emprunt + compteCourant + caf + diminutionDuBfr);
    const solde = auCentime(ressources - emplois);
    cumul = auCentime(cumul + solde);
    return { annee, excedentBrut, redevance, dotations, interets, resultat, impot, caf, investissements, augmentationDuBfr, remboursements: remboursementsDeLAnnee, option, emplois, reserve, emprunt, compteCourant, diminutionDuBfr, ressources, solde, cumul };
  });
  const plusPetit = annees.reduce((m, a) => (a.solde < m.solde ? a : m), annees[0]!);
  return {
    leviers: p,
    annees,
    tableauDeLEmprunt,
    tableauDuCompteCourant,
    /** Chaque année, les ressources couvrent les emplois. */
    equilibre: annees.every((a) => a.solde >= 0),
    plusPetit,
    cumulFinal: annees.at(-1)!.cumul,
    interets: auCentime(annees.reduce((s, a) => s + a.interets, 0)),
  };
}

export type PlanDeLaGamme = ReturnType<typeof planDeFinancementDeLaGamme>;

/** Le plus petit emprunt, par pas donné, qui équilibre chaque année du plan, toutes choses égales par ailleurs. */
export function plusPetitEmpruntQuiEquilibre(l: Partial<LeviersDuPlan> = {}, pas = 10_000, plafond = 300_000) {
  for (let e = 0; e <= plafond; e += pas) if (planDeFinancementDeLaGamme({ ...l, emprunt: e }).equilibre) return e;
  return null;
}

/** L'EMPRUNT QUI ÉQUILIBRE LE PLAN de la ligne achetée, sur 5 ans : 80 000 €, au millier et à la dizaine de milliers. */
export const EMPRUNT_DU_PLAN_EQUILIBRE = 80_000;

/**
 * LA BANQUE PLAFONNE SON PRÊT (le cas « La banque plafonne son prêt », hypothèse du cours) : elle ne
 * prête que 60 000 € pour la gamme, sur 5 ans. Le reste peut venir des associés, en compte courant.
 */
export const PLAFOND_DE_LA_BANQUE = 60_000;
