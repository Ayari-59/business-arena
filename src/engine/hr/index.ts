import type { EngineScenarioConfig, RoundDecisions } from "../types";

/**
 * Ressources humaines (doc 02 §4.1) : embauches, licenciements, formation et
 * politique salariale. Règles :
 * - les mouvements d'effectif (embauche, licenciement, démission) prennent
 *   effet au tour SUIVANT — le recrutement prend du temps ; les coûts tombent
 *   ce tour (asymétrie pédagogique voulue) ;
 * - seul l'ÉCART de masse salariale est facturé : les salaires de
 *   `includedHeadcount` employés à l'indice 1 sont déjà dans les coûts fixes
 *   du scénario (réduire l'effectif ou l'indice ÉCONOMISE donc des charges) ;
 * - sous-payer dégrade la productivité du tour (morale) et, sous le seuil
 *   d'attrition, provoque une démission par tour ;
 * - la formation élève la productivité du tour suivant, à rendements
 *   décroissants, plafonnée.
 */

type HrConfig = NonNullable<EngineScenarioConfig["hr"]>;
type HrDecisions = NonNullable<RoundDecisions["hr"]>;

export interface HrOutcome {
  /** Multiplicateur de productivité du tour (morale salariale). */
  morale: number;
  /** Charge de structure RH du tour (négatif = économie). */
  cost: number;
  hired: number;
  fired: number;
  departed: number;
  trainingBudget: number;
  salaryIndex: number;
  nextHeadcount: number;
  nextProductivity: number;
  /**
   * Les démissions du tour remplacées par un recrutement (équilibre 0.2.0) : elles ne
   * baissent pas l'effectif, coûtent un recrutement, et leurs remplaçants travaillent
   * le tour suivant à `PRODUCTIVITE_DU_REMPLACANT`. Zéro sans remplacement.
   */
  remplaces: number;
}

/**
 * LE REMPLAÇANT D'UNE DÉMISSION, DANS SON PREMIER TOUR : la moitié d'un poste. Il
 * apprend le métier pendant que l'équipe le forme (équilibre 0.2.0).
 */
export const PRODUCTIVITE_DU_REMPLACANT = 0.5;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function computeHr(args: {
  config: HrConfig | undefined;
  decisions: HrDecisions | undefined;
  headcount: number;
  productivity: number;
  /**
   * Équilibre 0.2.0 : une démission est remplacée. Sous-payer ne dégraisse plus
   * l'équipe sans rien coûter : relevé de novembre 2026, sous-payer de 10 %
   * rapportait jusqu'à 225 000 € sur deux ans à l'hôtel, l'équipe fondant d'un
   * salarié par tour.
   */
  remplacerLesDemissions?: boolean;
}): HrOutcome {
  const neutral: HrOutcome = {
    morale: 1,
    cost: 0,
    hired: 0,
    fired: 0,
    departed: 0,
    trainingBudget: 0,
    salaryIndex: 1,
    nextHeadcount: args.headcount,
    nextProductivity: args.productivity,
    remplaces: 0,
  };
  const c = args.config;
  if (!c) return neutral;

  const d = args.decisions ?? {};
  const [siMin, siMax] = c.salaryIndexBounds ?? [0.8, 1.3];
  const salaryIndex = clamp(d.salaryIndex ?? 1, siMin, siMax);
  const fired = clamp(Math.floor(d.fire ?? 0), 0, Math.max(0, args.headcount - 1));
  const hired = clamp(
    Math.floor(d.hire ?? 0),
    0,
    Math.min(c.maxHiresPerRound, Math.max(0, c.maxHeadcount - args.headcount + fired)),
  );
  const trainingBudget = Math.max(0, d.trainingBudget ?? 0);

  // Démission : sous le seuil d'attrition, un salarié part chaque tour
  // (jamais en dessous d'un salarié restant, licenciements compris).
  const departed =
    salaryIndex < c.attritionThreshold && args.headcount - fired - 1 >= 1 ? 1 : 0;
  const remplaces = args.remplacerLesDemissions ? departed : 0;

  // Masse salariale du tour : écart vs ce que les coûts fixes couvrent déjà.
  const payrollExtra =
    args.headcount * c.salaryPerEmployeePerRound * salaryIndex -
    c.includedHeadcount * c.salaryPerEmployeePerRound;

  const cost =
    payrollExtra + (hired + remplaces) * c.hiringCost + fired * c.firingCost + trainingBudget;

  const [mMin, mMax] = c.moraleBounds ?? [0.85, 1.12];
  const morale = clamp(1 + c.moraleSensitivity * (salaryIndex - 1), mMin, mMax);

  const nextProductivity = Math.min(
    c.maxProductivity,
    args.productivity + c.trainingSensitivity * Math.log(1 + trainingBudget / c.trainingScale),
  );

  return {
    morale,
    cost,
    hired,
    fired,
    departed,
    trainingBudget,
    salaryIndex,
    nextHeadcount: Math.max(1, args.headcount + hired - fired - departed + remplaces),
    nextProductivity,
    remplaces,
  };
}
