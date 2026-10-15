import type { BalanceSheet, CompanyState } from "../types";
import type { ConfigDeGroupe, EmissionDuTour, EtatDeGroupe, ValeurDeLEntreprise } from "./types";

/**
 * LA VALEUR DE L'ENTREPRISE, À CHAQUE TOUR (niveau 7).
 *
 *   EBE des douze derniers mois  E = (k / w) × Σ des w derniers EBE
 *   valeur de rendement          VR = multiple × max(0, E)
 *   actif économique             AE = immobilisations + écart d'acquisition + BFR
 *   valeur d'entreprise          VE = max(VR, AE)
 *   dette nette                  DN = dettes financières + découvert − disponibilités − placements
 *   valeur des capitaux propres  VCP = max(0, VE − DN)
 *   valeur par action            V = VCP / actions
 *   rentabilité totale           RTA = (V + dividendes reçus par action) / V₀ − 1
 *
 * k est le nombre de tours dans l'année (4 au trimestre), w la fenêtre, quatre
 * tours au plus : au trimestre, l'année entière, ce qui efface la saison. Tant
 * que l'historique est plus court que la fenêtre, il est complété par l'EBE de
 * référence, celui qui donne à l'entreprise de départ exactement sa valeur
 * comptable : VCP₀ = capitaux propres d'ouverture.
 *
 * LA VALEUR PATRIMONIALE EST UN PLANCHER. Un trimestre de pertes (NOVA perd au
 * premier, faute de stock et de saison) ne fait pas tomber à zéro une
 * entreprise dont l'outil tourne : elle vaut au moins ce que son bilan porte
 * d'actif économique. Sans ce plancher, toute augmentation de capital du tour
 * 2 se serait faite à une action sans valeur.
 *
 * Pur : rien n'est tiré, rien n'est écrit.
 */

export const toursParAn = (roundDays: number): number => 360 / roundDays;

export const tailleDeLaFenetre = (roundDays: number): number =>
  Math.max(1, Math.min(4, Math.round(toursParAn(roundDays))));

/** Somme des `n` derniers EBE, l'historique complété à gauche par l'EBE de référence. */
function sommeDesDerniers(g: Pick<EtatDeGroupe, "ebe" | "ebeReference">, n: number): number {
  if (n <= 0) return 0;
  const derniers = g.ebe.slice(-n);
  const manque = n - derniers.length;
  return manque * g.ebeReference + derniers.reduce((s, x) => s + x, 0);
}

export function ebeDouzeMois(g: Pick<EtatDeGroupe, "ebe" | "ebeReference">, roundDays: number): number {
  const w = tailleDeLaFenetre(roundDays);
  return (sommeDesDerniers(g, w) * toursParAn(roundDays)) / w;
}

export function detteNette(b: BalanceSheet): number {
  return b.financialDebt + b.overdraft - b.cash - (b.shortTermInvestment ?? 0);
}

/** Immobilisations, écart d'acquisition et besoin en fonds de roulement : ce que le test de dépréciation compare. */
export function actifEconomique(b: BalanceSheet): number {
  return (
    b.fixedAssetsNet +
    (b.goodwill ?? 0) +
    b.inventoryValue +
    b.receivables -
    b.payables -
    (b.vatLiability ?? 0)
  );
}

export function valoriser(args: {
  groupe: EtatDeGroupe;
  finance: BalanceSheet;
  roundDays: number;
  multiple: number;
  /** Dette nette à ajouter (la normalisation de fin de partie : la caisse d'une économie non reconductible). */
  detteEnPlus?: number;
}): ValeurDeLEntreprise {
  const { groupe: g, finance: b } = args;
  const ebe = ebeDouzeMois(g, args.roundDays);
  const rendement = args.multiple * Math.max(0, ebe);
  const ae = actifEconomique(b);
  const ve = Math.max(rendement, ae);
  const dn = args.detteEnPlus ? detteNette(b) + args.detteEnPlus : detteNette(b);
  const vcp = Math.max(0, ve - dn);
  const v = g.actions > 0 ? vcp / g.actions : 0;
  return {
    ebeDouzeMois: ebe,
    valeurDeRendement: rendement,
    valeurEntreprise: ve,
    detteNette: dn,
    valeurCapitauxPropres: vcp,
    actions: g.actions,
    valeurParAction: v,
    rentabiliteTotale: (v + g.dividendesParAction) / g.valeurInitialeParAction - 1,
    dividendesParAction: g.dividendesParAction,
    actifEconomique: ae,
  };
}

/**
 * L'ÉMISSION D'ACTIONS DU TOUR. Les apports en numéraire du tour (augmentation
 * de capital des associés, investisseurs entrants d'un rachat) deviennent des
 * actions à la valeur de clôture du tour HORS apport :
 *
 *   prix   p = (VCP de clôture − apports) / actions d'avant
 *   émises n = apport des associés / p + apport des investisseurs / (p × (1 − décote))
 *
 * Une levée qui dort en caisse est neutre : VCP − C est la valeur qu'aurait
 * l'entreprise sans elle, et VCP / (N + n) la redonne aux actions d'origine.
 * Une levée employée fait entrer ses souscripteurs dans la valeur créée ensuite :
 * les fonds propres ne sont plus gratuits face aux intérêts d'un emprunt.
 * Plancher du prix : un centième de la valeur initiale par action, pour qu'une
 * entreprise sans valeur émette beaucoup d'actions, pas une infinité.
 */
export function emettre(args: {
  groupe: Pick<EtatDeGroupe, "actions" | "valeurInitialeParAction">;
  valeurCapitauxPropres: number;
  apportDesAssocies: number;
  apportDesInvestisseurs: number;
  decote: number;
}): EmissionDuTour | null {
  const apport = args.apportDesAssocies + args.apportDesInvestisseurs;
  if (apport <= 0 || args.groupe.actions <= 0) return null;
  const plancher = args.groupe.valeurInitialeParAction / 100;
  const prix = Math.max(plancher, (args.valeurCapitauxPropres - apport) / args.groupe.actions);
  const actionsEmises =
    args.apportDesAssocies / prix + args.apportDesInvestisseurs / (prix * (1 - args.decote));
  return { apport, prixParAction: prix, actionsEmises };
}

/**
 * L'état de groupe d'une entreprise à sa première ouverture : la valeur de
 * départ est la valeur comptable (rapport valeur sur capitaux propres de 1).
 */
export function initialiserLeGroupe(
  state: Pick<CompanyState, "finance">,
  cfg: ConfigDeGroupe,
  roundDays: number,
): EtatDeGroupe {
  const cp0 = Math.max(1, state.finance.equity);
  const dn0 = detteNette(state.finance);
  const m = cfg.valorisation.multipleEBE;
  return {
    actions: cfg.valorisation.actionsInitiales,
    valeurInitialeParAction: cp0 / cfg.valorisation.actionsInitiales,
    ebeReference: Math.max(0, cp0 + dn0) / (m * toursParAn(roundDays)),
    ebe: [],
    discretionnaires: [],
    dividendesParAction: 0,
    sites: [],
    diligences: [],
    filiales: [],
    achats: {},
  };
}

/**
 * LA NORMALISATION DE FIN DE PARTIE. Au dernier tour, couper le marketing ou la
 * qualité gonflerait l'EBE, donc la valeur, sans rien coûter : il n'y a plus de
 * tour pour en payer la demande perdue. L'économie faite sous la moyenne des
 * trois tours précédents est donc retranchée de l'EBE retenu pour la valeur, et
 * la caisse qu'elle a laissée compte comme une dette : une dépense reportée.
 */
export function economieDeFinDePartie(discretionnaire: number, precedents: readonly number[]): number {
  const derniers = precedents.slice(-3);
  if (derniers.length === 0) return 0;
  const moyenne = derniers.reduce((s, x) => s + x, 0) / derniers.length;
  return Math.max(0, moyenne - discretionnaire);
}

/**
 * LA VALEUR CRÉÉE POUR LES ACTIONNAIRES D'ORIGINE, en euros : la rentabilité
 * totale par action appliquée à la valeur de départ de leurs actions. La
 * valeur de départ se relit de la valeur du tour : (valeur + dividendes reçus)
 * / (1 + rentabilité totale). Le classement et le bilan de partie la lisent
 * de cette même fonction.
 */
export function valeurCreee(
  v: Pick<ValeurDeLEntreprise, "valeurParAction" | "dividendesParAction" | "rentabiliteTotale">,
  actionsInitiales: number,
): number {
  const depart = (v.valeurParAction + v.dividendesParAction) / (v.rentabiliteTotale + 1);
  return Number.isFinite(depart) ? v.rentabiliteTotale * depart * actionsInitiales : 0;
}
