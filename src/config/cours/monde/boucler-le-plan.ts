import { auCentime } from "./amortissement";
import {
  ANNEES_DU_PLAN,
  EMPRUNT_DE_LA_LIGNE,
  LIGNE_A_FINANCER,
  MOULES,
  PLAN_SANS_EMPRUNT,
  planDeFinancementDeLaGamme,
  plusPetitEmpruntQuiEquilibre,
  type PlanDeLaGamme,
} from "./financement-de-la-gamme";

/**
 * LE MONDE DU COURS : BOUCLER LE PLAN DE LA GAMME, EN DÉCISIONS (décision du propriétaire, novembre
 * 2026 : une activité par chapitre ; le format « scénario à embranchements » ; BTS CG P6 6.5.2, DCG UE6
 * 4.4).
 *
 * La suite du chapitre « Le plan de financement » : début janvier N+1, le plan ébauché de la gamme
 * manque d'argent en N+1, et le président doit dire à la banque ce qu'il lui demande. Deux décisions
 * à la suite : le financement (un emprunt, et son montant, ou la ligne en crédit-bail), puis la durée
 * de l'emprunt. Le scénario
 * (config/cours/scenarios/boucler-le-plan-de-la-gamme.ts) lit tout ici ; chaque branche se CALCULE par
 * le plan du chapitre (`planDeFinancementDeLaGamme`), aucune ne s'écrit à la main.
 *
 * CE QUI VIENT DU MONDE, ET NE S'ÉCRIT DONC PAS ICI : la gamme, ses flux et son BFR, la réserve placée,
 * la banque de NOVA à 5 %, le capital remboursé en parts égales, l'impôt à 25 %, le plan qui s'arrête
 * fin N+5, le crédit-bail de la ligne (monde/financement-de-la-gamme.ts).
 *
 * CE QUI EST CHOISI (les options du scénario, chacune lue dans le monde) : les quatre financements
 * (le manque de N+1 de l'ébauche, au millier d'euros au-dessus ; le plus petit emprunt qui équilibre le
 * plan, celui du chapitre ; tout le prix de la ligne ; la ligne en crédit-bail, l'offre du chapitre,
 * avec un emprunt des seuls moules, que le crédit-bail ne finance pas) et les trois durées (celles du
 * laboratoire du chapitre). Aucune hypothèse nouvelle sur NOVA : le crédit-bail et l'emprunt des moules
 * se combinent dans le laboratoire du chapitre (LEVIERS_DU_PLAN).
 */

/**
 * LE JOUR DU SCÉNARIO (hypothèse du scénario) : le 4 janvier N+1, deux jours avant l'échéance de la
 * réserve placée ; le président voit la banque la semaine suivante.
 */
export const JOUR_DU_PLAN = { jour: 4, mois: 1, exercice: 1 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// 1. LES OPTIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Le plan ébauché, sans emprunt : celui du chapitre. */
export const ebaucheDuPlan = () => planDeFinancementDeLaGamme(PLAN_SANS_EMPRUNT);

/** Le pas auquel le président arrondit le manque de l'ébauche : le millier d'euros. */
export const ARRONDI_DU_MANQUE = 1_000;

/** Le manque de N+1 au plan ébauché, arrondi au millier d'euros au-dessus : l'emprunt qui paraît suffire. */
export const empruntDuManque = () => Math.ceil(-ebaucheDuPlan().annees[0]!.solde / ARRONDI_DU_MANQUE) * ARRONDI_DU_MANQUE;

/** Le pas de l'emprunt qui équilibre : celui du laboratoire du chapitre, 10 000 €. */
export const PAS_DE_L_EMPRUNT = 10_000;

/** Le plus petit emprunt, au pas du chapitre, qui équilibre chaque année sur la durée habituelle : celui du chapitre. */
export const empruntQuiEquilibre = () => plusPetitEmpruntQuiEquilibre({ dureeDeLEmprunt: EMPRUNT_DE_LA_LIGNE.dureeAns }, PAS_DE_L_EMPRUNT)!;

export const CHOIX_DU_MONTANT = ["manque", "equilibre", "ligne", "credit-bail"] as const;
export type ChoixDuMontant = (typeof CHOIX_DU_MONTANT)[number];

/**
 * LA LIGNE EN CRÉDIT-BAIL, l'option chiffrée de la première décision : l'offre du crédit-bailleur du
 * chapitre (financement-de-la-gamme.ts, CREDIT_BAIL_DE_LA_LIGNE : cinq redevances de 33 000 € HT, payées
 * fin N+1 à fin N+5, une option de 15 000 € levée fin N+5, aucun dépôt). Le crédit-bail ne finance que
 * la ligne : les moules, achetés comptant, s'empruntent à la banque, et la durée de cet emprunt est la
 * seconde décision.
 */
export const enCreditBail = (s: SuiteDuPlan) => s.montant === "credit-bail";

/** L'emprunt de chaque option : le manque de l'ébauche, l'emprunt qui équilibre, le prix de la ligne, les moules (la ligne en crédit-bail). */
export function montantDuChoix(c: ChoixDuMontant): number {
  if (c === "manque") return empruntDuManque();
  if (c === "equilibre") return empruntQuiEquilibre();
  if (c === "credit-bail") return MOULES.montant;
  return LIGNE_A_FINANCER.montant;
}

/**
 * LES DURÉES QUE LA BANQUE PROPOSE : 3, 5 ou 7 ans, les bornes du laboratoire du chapitre et la durée
 * habituelle de la banque de NOVA (EMPRUNT_DE_LA_LIGNE). Le capital se rembourse en parts égales.
 */
export const DUREES_DE_LA_BANQUE = { courte: 3, habituelle: EMPRUNT_DE_LA_LIGNE.dureeAns, longue: 7 } as const;

export const CHOIX_DE_LA_DUREE = ["courte", "habituelle", "longue"] as const;
export type ChoixDeLaDuree = (typeof CHOIX_DE_LA_DUREE)[number];

/** Les choix possibles de chaque décision, dans l'ordre du scénario : le montant, puis la durée. */
export const CHOIX_DU_PLAN: readonly (readonly string[])[] = [CHOIX_DU_MONTANT, CHOIX_DE_LA_DUREE];

/** Une suite de choix, complète ou non. */
export interface SuiteDuPlan {
  montant?: ChoixDuMontant;
  duree?: ChoixDeLaDuree;
}
export type SuiteCompleteDuPlan = Required<SuiteDuPlan>;

/** Une suite lue d'une liste de codes, dans l'ordre des décisions : null si un code n'existe pas. */
export function suiteDuPlan(codes: readonly string[]): SuiteDuPlan | null {
  if (codes.length > CHOIX_DU_PLAN.length) return null;
  if (codes.some((c, i) => !CHOIX_DU_PLAN[i]!.includes(c))) return null;
  const [montant, duree] = codes as [ChoixDuMontant?, ChoixDeLaDuree?];
  return { ...(montant ? { montant } : {}), ...(duree ? { duree } : {}) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CE QU'UNE SUITE DONNE
// ─────────────────────────────────────────────────────────────────────────────

/** Le plan d'une suite : sans emprunt avant la première décision ; à la durée habituelle tant que la durée n'est pas choisie. */
export function planDeLaSuite(s: SuiteDuPlan): PlanDeLaGamme {
  if (!s.montant) return ebaucheDuPlan();
  return planDeFinancementDeLaGamme({ emprunt: montantDuChoix(s.montant), dureeDeLEmprunt: DUREES_DE_LA_BANQUE[s.duree ?? "habituelle"], creditBail: enCreditBail(s) });
}

/** Les trois fins : un plan qui manque d'argent une année, un plan qui tient mais coûte trop, le plan bouclé. */
export type FinDuPlan = "deficit" | "lourd" | "tenu";

/**
 * Le résultat d'une suite complète : le plan, l'emprunt sur toute sa durée, ce qui reste dû après le
 * plan, et ce que le plan laisse à NOVA fin N+5, le capital encore dû à la banque déduit (le cumul du
 * plan moins le restant dû). Le crédit-bail ne laisse rien à devoir : son option est levée en N+5.
 */
export function resultatDuPlan(s: SuiteCompleteDuPlan) {
  const plan = planDeLaSuite(s);
  const emprunt = montantDuChoix(s.montant);
  const duree = DUREES_DE_LA_BANQUE[s.duree];
  const tableau = plan.tableauDeLEmprunt;
  const annuitesDuPlan = tableau.slice(0, ANNEES_DU_PLAN.length);
  /** Les intérêts de tout l'emprunt, y compris ceux des années qui tombent après le plan. */
  const interetsDeLEmprunt = auCentime(tableau.reduce((t, x) => t + x.interets, 0));
  const interetsApresLePlan = auCentime(tableau.slice(ANNEES_DU_PLAN.length).reduce((t, x) => t + x.interets, 0));
  const restantDu = auCentime(emprunt - annuitesDuPlan.reduce((t, x) => t + x.capital, 0));
  const deficits = plan.annees.filter((a) => a.solde < 0);
  const creditBail = enCreditBail(s);
  return {
    suite: s,
    creditBail,
    emprunt,
    duree,
    plan,
    equilibre: plan.equilibre,
    deficits,
    interetsDeLEmprunt,
    interetsApresLePlan,
    restantDu,
    laisse: auCentime(plan.cumulFinal - restantDu),
    /** Ce que le crédit-bail fait payer pendant le plan : ses redevances et son option. */
    loyers: creditBail ? auCentime(plan.annees.reduce((t, a) => t + a.redevance + a.option, 0)) : 0,
    premiereAnnuite: tableau[0] ? auCentime(tableau[0].capital + tableau[0].interets) : 0,
  };
}
export type ResultatDuPlan = ReturnType<typeof resultatDuPlan>;

/** Les douze suites, dans l'ordre des choix. */
export function toutesLesSuitesDuPlan(): SuiteCompleteDuPlan[] {
  return CHOIX_DU_MONTANT.flatMap((montant) => CHOIX_DE_LA_DUREE.map((duree) => ({ montant, duree })));
}

/**
 * LA MEILLEURE SUITE, et la règle qui la désigne : d'abord un plan qui tient chaque année (la banque ne
 * prête pas sur un plan qui manque d'argent) ; puis le plan qui laisse le plus à NOVA fin N+5, le
 * capital encore dû déduit : la comparaison du chapitre, celle du cumul de fin N+5. Un emprunt plus gros
 * ou plus long que le besoin se paie pour de l'argent qui dort ; le crédit-bail se paie en redevances.
 */
export function meilleureSuiteDuPlan(): ResultatDuPlan {
  const admises = toutesLesSuitesDuPlan()
    .map(resultatDuPlan)
    .filter((r) => r.equilibre);
  return admises.reduce((a, b) => (b.laisse > a.laisse + 1e-9 ? b : a));
}

/** La fin d'une suite : le déficit d'abord, puis le plan bouclé au moindre coût, sinon le plan trop lourd. */
export function finDuPlan(r: ResultatDuPlan): FinDuPlan {
  if (!r.equilibre) return "deficit";
  return Math.abs(r.laisse - meilleureSuiteDuPlan().laisse) < 1e-9 ? "tenu" : "lourd";
}

/** Le plan de la ligne en crédit-bail, sans emprunt : celui du chapitre, que le bilan rappelle (il tient sans emprunter les moules). */
export const planEnCreditBail = () => planDeFinancementDeLaGamme({ ...PLAN_SANS_EMPRUNT, creditBail: true });
